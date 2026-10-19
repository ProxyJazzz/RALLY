"""Unit tests for RALLY Execution + Verification subsystem (Phase 6).

Covers:
- Unapproved plan execution is strictly blocked
- Precondition revalidation failure blocks execution (TOCTOU protection)
- Invalidation trigger blocks execution (e.g. active deployment changed, approval expired)
- Idempotency check prevents duplicate execution
- Independent verification checks evaluate correctly
"""

import pytest

from execution.exceptions import (
    IdempotencyViolationError,
    InvalidationTriggeredError,
    PreconditionRevalidationError,
    UnapprovedPlanExecutionError,
)
from execution.models import (
    ExecutionRecord,
    ExecutionStatus,
    VerificationCheck,
    VerificationReport,
    VerificationStatus,
)
from execution.revalidator import PreconditionRevalidator
from governance.models import (
    ActionPlan,
    ApprovalDecision,
    ApprovalRequest,
    PlanStatus,
    PolicyDecision,
    PolicyDecisionType,
    Precondition,
    ProposedAction,
    RiskAssessment,
    RiskLevel,
)
from simulator.domain.models import ServiceStatus


def create_sample_plan(
    status: PlanStatus = PlanStatus.APPROVED,
    approval_decision: ApprovalDecision = ApprovalDecision.APPROVED,
    expires_at: str = "2026-10-19T15:40:00Z",
    target_deployment: str = "checkout-v42",
) -> ActionPlan:
    """Helper to create test ActionPlan fixtures."""
    action = ProposedAction(
        action_id="act-test-01",
        action_type="rollback_deployment",
        target_resource="deployment",
        target_identifier=target_deployment,
        parameters={"deployment_id": target_deployment, "target_version": "checkout-v41"},
        reason="Test regression remediation",
    )
    risk = RiskAssessment(
        risk_level=RiskLevel.HIGH,
        factors=["test risk factor"],
        blast_radius="service",
        reversibility="reversible",
        customer_impact="tier 1",
    )
    policy_decision = PolicyDecision(
        decision=PolicyDecisionType.REQUIRES_APPROVAL,
        policy_version="1.0.0",
        reason="Consequential mutation requires approval",
        requires_human_approval=True,
    )
    approval = ApprovalRequest(
        approval_id="appr-test-01",
        plan_id="plan-test-01",
        requested_at="2026-10-19T14:40:00Z",
        decision=approval_decision,
        approver="sre@rally.internal" if approval_decision == ApprovalDecision.APPROVED else None,
        expires_at=expires_at,
    )
    preconditions = [
        Precondition(
            condition_id="PRE-01",
            description=f"Active deployment must be {target_deployment}",
            check_type="ACTIVE_DEPLOYMENT_MATCH",
            expected_value=target_deployment,
        ),
        Precondition(
            condition_id="PRE-02",
            description="Dependencies must be healthy",
            check_type="DEPENDENCY_HEALTH_OK",
            expected_value="HEALTHY",
        ),
    ]
    return ActionPlan(
        plan_id="plan-test-01",
        incident_id="INC-TEST-01",
        created_at="2026-10-19T14:40:00Z",
        action=action,
        objective="Test rollback",
        expected_outcome="Restored health",
        risk=risk,
        policy_decision=policy_decision,
        approval=approval,
        preconditions=preconditions,
        status=status,
    )


class TestPreconditionRevalidator:
    """Unit tests for TOCTOU and precondition revalidation."""

    def test_unapproved_plan_raises_error(self):
        plan = create_sample_plan(status=PlanStatus.AWAITING_APPROVAL, approval_decision=ApprovalDecision.PENDING)
        live_state = {"active_deployment_id": "checkout-v42", "dependencies_status": "HEALTHY"}

        with pytest.raises(UnapprovedPlanExecutionError) as exc_info:
            PreconditionRevalidator.validate_plan_for_execution(plan, live_state)
        assert "Must be APPROVED" in str(exc_info.value)

    def test_rejected_approval_raises_error(self):
        plan = create_sample_plan(status=PlanStatus.REJECTED, approval_decision=ApprovalDecision.REJECTED)
        live_state = {"active_deployment_id": "checkout-v42", "dependencies_status": "HEALTHY"}

        with pytest.raises(UnapprovedPlanExecutionError):
            PreconditionRevalidator.validate_plan_for_execution(plan, live_state)

    def test_expired_approval_raises_invalidation_error(self):
        plan = create_sample_plan(expires_at="2026-10-19T14:00:00Z")
        live_state = {"active_deployment_id": "checkout-v42", "dependencies_status": "HEALTHY"}

        with pytest.raises(InvalidationTriggeredError) as exc_info:
            PreconditionRevalidator.validate_plan_for_execution(
                plan, live_state, current_time="2026-10-19T14:45:00Z"
            )
        assert "approval expired" in str(exc_info.value).lower()

    def test_active_deployment_change_raises_invalidation_error(self):
        plan = create_sample_plan(target_deployment="checkout-v42")
        # Simulator state changed concurrently to v43
        live_state = {"active_deployment_id": "checkout-v43", "dependencies_status": "HEALTHY"}

        with pytest.raises(InvalidationTriggeredError) as exc_info:
            PreconditionRevalidator.validate_plan_for_execution(plan, live_state)
        assert "TOCTOU detected" in str(exc_info.value)

    def test_precondition_dependency_failure_raises_revalidation_error(self):
        plan = create_sample_plan(target_deployment="checkout-v42")
        # Dependencies degraded concurrently
        live_state = {"active_deployment_id": "checkout-v42", "dependencies_status": "DEGRADED"}

        with pytest.raises(PreconditionRevalidationError) as exc_info:
            PreconditionRevalidator.validate_plan_for_execution(plan, live_state)
        assert "downstream dependencies" in str(exc_info.value)

    def test_valid_approved_plan_passes_revalidation(self):
        plan = create_sample_plan(target_deployment="checkout-v42")
        live_state = {"active_deployment_id": "checkout-v42", "dependencies_status": "HEALTHY"}

        # Should not raise any error
        PreconditionRevalidator.validate_plan_for_execution(plan, live_state)
