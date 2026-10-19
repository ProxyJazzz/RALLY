"""Remediation Action Planner for RALLY.

Translates an agent's InvestigationReport recommendation into a formal,
approval-ready ActionPlan. Coordinates PolicyEngine, RiskEngine, ConditionBuilder,
and ApprovalService to produce a deterministic governance artifact.
"""

import uuid
from typing import Any

from agent.models import InvestigationReport
from governance.approval import ApprovalService
from governance.conditions import ConditionBuilder
from governance.exceptions import PolicyRejectionError
from governance.models import (
    ActionPlan,
    ActorRole,
    GovernanceContext,
    GovernanceEvent,
    GovernanceEventType,
    PlanStatus,
    PolicyDecisionType,
    ProposedAction,
)
from governance.policies import PolicyEngine
from governance.risk import RiskEngine


class ActionPlanner:
    """Creates immutable, policy-evaluated ActionPlans from investigation reports."""

    def __init__(self, time_provider: str = "2026-10-19T14:40:00Z"):
        self.fixed_time = time_provider
        self._events: list[GovernanceEvent] = []

    def _record_event(
        self,
        incident_id: str,
        event_type: GovernanceEventType,
        actor: ActorRole,
        plan_id: str | None = None,
        approval_id: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        """Appends an immutable audit event."""
        event = GovernanceEvent(
            timestamp=self.fixed_time,
            incident_id=incident_id,
            plan_id=plan_id,
            approval_id=approval_id,
            event_type=event_type,
            actor=actor,
            details=details or {},
        )
        self._events.append(event)

    def get_events(self) -> list[GovernanceEvent]:
        """Returns recorded governance audit events."""
        return list(self._events)

    def plan_remediation(
        self,
        report: InvestigationReport,
        context: GovernanceContext,
    ) -> ActionPlan:
        """Constructs an approval-ready ActionPlan from an InvestigationReport."""
        if not report.recommended_action:
            raise PolicyRejectionError("InvestigationReport contains no recommended action to plan.")

        rec = report.recommended_action
        plan_id = f"plan-{uuid.uuid4().hex[:8]}"

        # 1. Map recommended action into ProposedAction
        evidence_ids = [e.evidence_id for e in report.evidence]
        proposed = ProposedAction(
            action_id=f"act-{plan_id}",
            action_type=rec.action_name,
            target_resource="deployment",
            target_identifier=rec.parameters.get("deployment_id", report.affected_service),
            parameters=rec.parameters,
            reason=rec.justification,
            evidence_ids=evidence_ids,
            confidence=report.confidence,
            source="agent_recommendation",
        )

        self._record_event(
            incident_id=report.incident_id,
            plan_id=plan_id,
            event_type=GovernanceEventType.PLAN_CREATED,
            actor=ActorRole.SYSTEM,
            details={"action": proposed.model_dump()},
        )

        # 2. Assess operational risk deterministically
        risk = RiskEngine.assess_risk(proposed, report.affected_service)
        self._record_event(
            incident_id=report.incident_id,
            plan_id=plan_id,
            event_type=GovernanceEventType.RISK_ASSESSED,
            actor=ActorRole.POLICY_ENGINE,
            details=risk.model_dump(),
        )

        # 3. Evaluate deterministic policy
        policy_decision = PolicyEngine.evaluate(proposed, context, risk)
        self._record_event(
            incident_id=report.incident_id,
            plan_id=plan_id,
            event_type=GovernanceEventType.POLICY_EVALUATED,
            actor=ActorRole.POLICY_ENGINE,
            details=policy_decision.model_dump(),
        )

        # 4. Handle Policy Denial
        if policy_decision.decision == PolicyDecisionType.DENIED:
            self._record_event(
                incident_id=report.incident_id,
                plan_id=plan_id,
                event_type=GovernanceEventType.PLAN_DENIED,
                actor=ActorRole.POLICY_ENGINE,
                details={"reason": policy_decision.reason},
            )
            return ActionPlan(
                plan_id=plan_id,
                incident_id=report.incident_id,
                created_at=self.fixed_time,
                action=proposed,
                objective=f"Denied remediation for {report.incident_id}",
                expected_outcome="No operational changes permitted.",
                risk=risk,
                policy_decision=policy_decision,
                approval=None,
                status=PlanStatus.REJECTED,
                execution_status="NOT_EXECUTED",
            )

        # 5. Build preconditions & invalidation conditions
        preconditions = ConditionBuilder.build_rollback_preconditions(proposed)
        invalidation_conditions = ConditionBuilder.build_rollback_invalidation_conditions(proposed)

        # 6. Create approval request if required
        approval_req = None
        plan_status = PlanStatus.DRAFT

        if policy_decision.requires_human_approval:
            approval_req = ApprovalService.create_approval_request(
                plan_id=plan_id,
                evidence_ids=evidence_ids,
                requested_at=self.fixed_time,
            )
            plan_status = PlanStatus.AWAITING_APPROVAL
            self._record_event(
                incident_id=report.incident_id,
                plan_id=plan_id,
                approval_id=approval_req.approval_id,
                event_type=GovernanceEventType.APPROVAL_REQUESTED,
                actor=ActorRole.SYSTEM,
                details={"approval_id": approval_req.approval_id, "expires_at": approval_req.expires_at},
            )
        else:
            plan_status = PlanStatus.APPROVED

        return ActionPlan(
            plan_id=plan_id,
            incident_id=report.incident_id,
            created_at=self.fixed_time,
            action=proposed,
            objective=f"Remediate incident {report.incident_id} by rolling back {proposed.target_identifier}",
            expected_outcome="Checkout error rate returns below 1.0% threshold and service health restores to HEALTHY.",
            risk=risk,
            policy_decision=policy_decision,
            approval=approval_req,
            preconditions=preconditions,
            invalidation_conditions=invalidation_conditions,
            rollback_strategy="Reinstate previous known-healthy deployment checkout-v41.",
            evidence_ids=evidence_ids,
            status=plan_status,
            execution_status="NOT_EXECUTED",  # Strict invariant
        )
