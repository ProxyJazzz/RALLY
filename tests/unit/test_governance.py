"""Unit tests for RALLY Planning + Governance Layer.

Verifies:
- Deterministic policy decisions (ALLOWED, DENIED, REQUIRES_APPROVAL)
- Deterministic risk assessment and factor explanation
- Approval request lifecycle (PENDING, APPROVED, REJECTED, EXPIRED)
- Prevention of agent self-approval
- Denial of unsupported actions
- Denial of actions with missing or invented evidence provenance
- Denial of low-confidence actions
- Evaluation of preconditions and invalidation triggers
- Plan immutability and versioning
"""

import pytest

from agent.models import (
    ConfidenceLevel,
    EvidenceItem,
    EvidenceLabel,
    IncidentRequest,
    InvestigationReport,
    RecommendedAction,
)
from governance import (
    ActionPlan,
    ActionPlanner,
    ApprovalDecision,
    ApprovalError,
    ApprovalService,
    ConditionBuilder,
    ConditionEvaluator,
    GovernanceContext,
    PlanStatus,
    PolicyDecisionType,
    PolicyEngine,
    ProposedAction,
    RiskEngine,
    RiskLevel,
)


@pytest.fixture
def sample_evidence() -> list[EvidenceItem]:
    return [
        EvidenceItem(
            evidence_id="EV-001",
            source_tool="get_service_health",
            source_reference="{'service_id': 'checkout-service'}",
            observation="checkout-service is DEGRADED",
            label=EvidenceLabel.OBSERVED,
        ),
        EvidenceItem(
            evidence_id="EV-002",
            source_tool="get_error_rate",
            source_reference="{'service_id': 'checkout-service'}",
            observation="error rate is 18.4%",
            label=EvidenceLabel.OBSERVED,
        ),
    ]


@pytest.fixture
def governance_context(sample_evidence: list[EvidenceItem]) -> GovernanceContext:
    return GovernanceContext(
        incident_id="INC-001",
        affected_service="checkout-service",
        severity="HIGH",
        evidence=sample_evidence,
        current_operational_state={"active_deployment_id": "checkout-v42"},
    )


class TestPolicyAndRiskEngine:
    """Verifies deterministic policy and risk evaluation."""

    def test_consequential_rollback_requires_approval(self, governance_context: GovernanceContext):
        proposed = ProposedAction(
            action_id="act-01",
            action_type="rollback_deployment",
            target_resource="deployment",
            target_identifier="checkout-v42",
            parameters={"deployment_id": "checkout-v42"},
            reason="Validation regression",
            evidence_ids=["EV-001", "EV-002"],
            confidence=ConfidenceLevel.HIGH,
        )
        risk = RiskEngine.assess_risk(proposed, "checkout-service")
        assert risk.risk_level == RiskLevel.HIGH
        assert len(risk.factors) >= 3

        decision = PolicyEngine.evaluate(proposed, governance_context, risk)
        assert decision.decision == PolicyDecisionType.REQUIRES_APPROVAL
        assert decision.requires_human_approval is True

    def test_unsupported_action_is_denied(self, governance_context: GovernanceContext):
        proposed = ProposedAction(
            action_id="act-02",
            action_type="restart_service",  # deferred, no simulator execution support yet
            target_resource="service",
            target_identifier="checkout-service",
            evidence_ids=["EV-001"],
            confidence=ConfidenceLevel.HIGH,
            reason="Try restarting",
        )
        risk = RiskEngine.assess_risk(proposed, "checkout-service")
        decision = PolicyEngine.evaluate(proposed, governance_context, risk)
        assert decision.decision == PolicyDecisionType.DENIED
        assert "deferred" in decision.reason.lower() or "unsupported" in decision.reason.lower()

    def test_missing_evidence_is_denied(self, governance_context: GovernanceContext):
        proposed = ProposedAction(
            action_id="act-03",
            action_type="rollback_deployment",
            target_resource="deployment",
            target_identifier="checkout-v42",
            evidence_ids=[],  # No evidence
            confidence=ConfidenceLevel.HIGH,
            reason="No evidence provided",
        )
        risk = RiskEngine.assess_risk(proposed, "checkout-service")
        decision = PolicyEngine.evaluate(proposed, governance_context, risk)
        assert decision.decision == PolicyDecisionType.DENIED
        assert "without supporting evidence" in decision.reason

    def test_invented_evidence_id_is_denied(self, governance_context: GovernanceContext):
        proposed = ProposedAction(
            action_id="act-04",
            action_type="rollback_deployment",
            target_resource="deployment",
            target_identifier="checkout-v42",
            evidence_ids=["EV-999"],  # Invented ID
            confidence=ConfidenceLevel.HIGH,
            reason="Invalid provenance",
        )
        risk = RiskEngine.assess_risk(proposed, "checkout-service")
        decision = PolicyEngine.evaluate(proposed, governance_context, risk)
        assert decision.decision == PolicyDecisionType.DENIED
        assert "EV-999" in decision.reason

    def test_low_confidence_action_is_denied(self, governance_context: GovernanceContext):
        proposed = ProposedAction(
            action_id="act-05",
            action_type="rollback_deployment",
            target_resource="deployment",
            target_identifier="checkout-v42",
            evidence_ids=["EV-001"],
            confidence=ConfidenceLevel.LOW,  # Low confidence
            reason="Weak suspicion",
        )
        risk = RiskEngine.assess_risk(proposed, "checkout-service")
        decision = PolicyEngine.evaluate(proposed, governance_context, risk)
        assert decision.decision == PolicyDecisionType.DENIED
        assert "low confidence" in decision.reason.lower()


class TestApprovalLifecycle:
    """Verifies human approval state transitions and invariants."""

    def test_approval_lifecycle_approve(self, governance_context: GovernanceContext, sample_evidence: list[EvidenceItem]):
        planner = ActionPlanner()
        report = InvestigationReport(
            incident_id="INC-001",
            agent_run_id="run-01",
            affected_service="checkout-service",
            severity="HIGH",
            status="COMPLETE",
            summary="Checkout regression",
            evidence=sample_evidence,
            recommended_action=RecommendedAction(
                action_name="rollback_deployment",
                target_service="checkout-service",
                parameters={"deployment_id": "checkout-v42"},
                justification="Rollback needed",
            ),
        )
        plan = planner.plan_remediation(report, governance_context)
        assert plan.status == PlanStatus.AWAITING_APPROVAL
        assert plan.approval is not None
        assert plan.approval.decision == ApprovalDecision.PENDING

        # Human approves
        approved_plan = ApprovalService.approve(plan, approver="alice@rally.internal")
        assert approved_plan.status == PlanStatus.APPROVED
        assert approved_plan.approval.decision == ApprovalDecision.APPROVED
        assert approved_plan.approval.approver == "alice@rally.internal"
        # Strict Invariant: Execution status MUST remain NOT_EXECUTED
        assert approved_plan.execution_status == "NOT_EXECUTED"

    def test_agent_cannot_grant_approval(self, governance_context: GovernanceContext, sample_evidence: list[EvidenceItem]):
        planner = ActionPlanner()
        report = InvestigationReport(
            incident_id="INC-001",
            agent_run_id="run-01",
            affected_service="checkout-service",
            severity="HIGH",
            status="COMPLETE",
            summary="Checkout regression",
            evidence=sample_evidence,
            recommended_action=RecommendedAction(
                action_name="rollback_deployment",
                target_service="checkout-service",
                parameters={"deployment_id": "checkout-v42"},
                justification="Rollback needed",
            ),
        )
        plan = planner.plan_remediation(report, governance_context)

        # Agent attempts to approve itself
        with pytest.raises(ApprovalError) as exc_info:
            ApprovalService.approve(plan, approver="agent")
        assert "cannot grant human approval" in str(exc_info.value)

    def test_approval_rejection(self, governance_context: GovernanceContext, sample_evidence: list[EvidenceItem]):
        planner = ActionPlanner()
        report = InvestigationReport(
            incident_id="INC-001",
            agent_run_id="run-01",
            affected_service="checkout-service",
            severity="HIGH",
            status="COMPLETE",
            summary="Checkout regression",
            evidence=sample_evidence,
            recommended_action=RecommendedAction(
                action_name="rollback_deployment",
                target_service="checkout-service",
                parameters={"deployment_id": "checkout-v42"},
                justification="Rollback needed",
            ),
        )
        plan = planner.plan_remediation(report, governance_context)
        rejected_plan = ApprovalService.reject(plan, approver="bob@rally.internal", reason="Feature flag toggled instead.")
        assert rejected_plan.status == PlanStatus.REJECTED
        assert rejected_plan.approval.decision == ApprovalDecision.REJECTED
        assert rejected_plan.execution_status == "NOT_EXECUTED"

    def test_approval_expiration(self, governance_context: GovernanceContext, sample_evidence: list[EvidenceItem]):
        planner = ActionPlanner()
        report = InvestigationReport(
            incident_id="INC-001",
            agent_run_id="run-01",
            affected_service="checkout-service",
            severity="HIGH",
            status="COMPLETE",
            summary="Checkout regression",
            evidence=sample_evidence,
            recommended_action=RecommendedAction(
                action_name="rollback_deployment",
                target_service="checkout-service",
                parameters={"deployment_id": "checkout-v42"},
                justification="Rollback needed",
            ),
        )
        plan = planner.plan_remediation(report, governance_context)

        # Attempt to approve past expiration time
        expired_plan = ApprovalService.approve(
            plan,
            approver="alice@rally.internal",
            current_time="2026-10-19T16:00:00Z",  # Past expires_at
        )
        assert expired_plan.status == PlanStatus.EXPIRED
        assert expired_plan.approval.decision == ApprovalDecision.EXPIRED
        assert expired_plan.execution_status == "NOT_EXECUTED"


class TestConditionEvaluation:
    """Verifies preconditions and invalidation conditions."""

    def test_stale_plan_detected_when_active_deployment_changes(self):
        action = ProposedAction(
            action_id="act-01",
            action_type="rollback_deployment",
            target_resource="deployment",
            target_identifier="checkout-v42",
            parameters={"deployment_id": "checkout-v42"},
            reason="Regression",
        )
        preconditions = ConditionBuilder.build_rollback_preconditions(action)
        plan = ActionPlan(
            plan_id="plan-01",
            incident_id="INC-001",
            created_at="2026-10-19T14:40:00Z",
            action=action,
            objective="obj",
            expected_outcome="outcome",
            risk=RiskEngine.assess_risk(action, "checkout-service"),
            policy_decision=PolicyEngine.evaluate(
                action,
                GovernanceContext(
                    incident_id="INC-001",
                    affected_service="checkout-service",
                    severity="HIGH",
                    evidence=[EvidenceItem(evidence_id="EV-1", source_tool="t", source_reference="r", observation="o", label=EvidenceLabel.OBSERVED)],
                ),
                RiskEngine.assess_risk(action, "checkout-service"),
            ),
            preconditions=preconditions,
        )

        # Operational state changed: checkout-v43 was deployed in the meantime!
        changed_state = {"active_deployment_id": "checkout-v43"}
        is_valid, failures = ConditionEvaluator.validate_preconditions(plan, changed_state)
        assert is_valid is False
        assert len(failures) > 0
        assert "expected active deployment 'checkout-v42', but found 'checkout-v43'" in failures[0]

        is_invalidated, reason = ConditionEvaluator.check_invalidation(plan, changed_state)
        assert is_invalidated is True
        assert "Operational state changed" in reason
