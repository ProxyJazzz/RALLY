"""Human-in-the-Loop Approval Service for RALLY.

Manages the lifecycle of ApprovalRequests:
  PENDING -> APPROVED (via explicit human approval)
  PENDING -> REJECTED (via explicit human rejection)
  PENDING -> EXPIRED (via time expiration)

Security Invariants:
  - Agent cannot approve itself (approver cannot be an agent).
  - High confidence does not equal approval.
  - Approval state change never triggers execution in Phase 5.
"""

from typing import Any
from governance.exceptions import ApprovalError
from governance.models import (
    ActionPlan,
    ActorRole,
    ApprovalDecision,
    ApprovalRequest,
    PlanStatus,
)


class ApprovalService:
    """Manages explicit human approval requests and transitions."""

    @staticmethod
    def create_approval_request(
        plan_id: str,
        evidence_ids: list[str],
        requested_at: str = "2026-10-19T14:40:00Z",
        expires_at: str = "2026-10-19T15:40:00Z",  # 1 hour default validity
    ) -> ApprovalRequest:
        """Creates a new PENDING approval request."""
        return ApprovalRequest(
            approval_id=f"appr-{plan_id}",
            plan_id=plan_id,
            requested_by=ActorRole.SYSTEM,
            requested_at=requested_at,
            decision=ApprovalDecision.PENDING,
            expires_at=expires_at,
            evidence_snapshot=list(evidence_ids),
        )

    @staticmethod
    def approve(
        plan: ActionPlan,
        approver: str,
        reason: str = "Remediation verified and authorized by on-call engineer.",
        current_time: str = "2026-10-19T14:45:00Z",
    ) -> ActionPlan:
        """Applies an explicit human approval to an ActionPlan.

        INVARIANT: Execution is NOT performed. Status transitions to APPROVED.
        """
        if not plan.approval:
            raise ApprovalError(f"Plan '{plan.plan_id}' has no associated approval request.")

        if plan.approval.decision != ApprovalDecision.PENDING:
            raise ApprovalError(
                f"Cannot approve plan '{plan.plan_id}' with approval status '{plan.approval.decision.value}'"
            )

        # Invariant: Agent cannot be the approver
        if approver.lower() in {"agent", "ai", "rally-agent", "system", "llm"}:
            raise ApprovalError(
                f"Agent or system entity '{approver}' cannot grant human approval for consequential actions."
            )

        # Check expiration
        if current_time > plan.approval.expires_at:
            return ApprovalService.expire(plan, reason="Approval window expired prior to human decision.")

        updated_approval = plan.approval.model_copy(
            update={
                "decision": ApprovalDecision.APPROVED,
                "approver": approver,
                "reason": reason,
            }
        )

        return plan.model_copy(
            update={
                "status": PlanStatus.APPROVED,
                "approval": updated_approval,
                "execution_status": "NOT_EXECUTED",  # Strict invariant: Phase 5 never executes
            }
        )

    @staticmethod
    def reject(
        plan: ActionPlan,
        approver: str,
        reason: str,
    ) -> ActionPlan:
        """Applies an explicit human rejection to an ActionPlan."""
        if not plan.approval:
            raise ApprovalError(f"Plan '{plan.plan_id}' has no associated approval request.")

        if plan.approval.decision != ApprovalDecision.PENDING:
            raise ApprovalError(
                f"Cannot reject plan '{plan.plan_id}' with approval status '{plan.approval.decision.value}'"
            )

        updated_approval = plan.approval.model_copy(
            update={
                "decision": ApprovalDecision.REJECTED,
                "approver": approver,
                "reason": reason,
            }
        )

        return plan.model_copy(
            update={
                "status": PlanStatus.REJECTED,
                "approval": updated_approval,
                "execution_status": "NOT_EXECUTED",
            }
        )

    @staticmethod
    def expire(
        plan: ActionPlan,
        reason: str = "Approval request expired.",
    ) -> ActionPlan:
        """Transitions a PENDING approval request to EXPIRED."""
        if not plan.approval:
            raise ApprovalError(f"Plan '{plan.plan_id}' has no associated approval request.")

        updated_approval = plan.approval.model_copy(
            update={
                "decision": ApprovalDecision.EXPIRED,
                "reason": reason,
            }
        )

        return plan.model_copy(
            update={
                "status": PlanStatus.EXPIRED,
                "approval": updated_approval,
                "execution_status": "NOT_EXECUTED",
            }
        )
