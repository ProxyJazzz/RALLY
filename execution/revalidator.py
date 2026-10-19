"""Precondition and Invalidation revalidator for Phase 6.

Guarantees Time-Of-Check to Time-Of-Use (TOCTOU) defense by re-evaluating
approved action plans immediately before MCP write tool invocation against
live operational telemetry queried via MCP.
"""

from typing import Any
from governance.models import ActionPlan, PlanStatus
from execution.exceptions import (
    InvalidationTriggeredError,
    PreconditionRevalidationError,
    UnapprovedPlanExecutionError,
)


class PreconditionRevalidator:
    """Enforces that an ActionPlan is approved and revalidates operational state before execution."""

    @staticmethod
    def validate_plan_for_execution(
        plan: ActionPlan,
        live_operational_state: dict[str, Any],
        current_time: str = "2026-10-19T14:46:00Z",
    ) -> None:
        """Validates that plan is approved, not expired, and preconditions still hold.

        Raises:
            UnapprovedPlanExecutionError: if plan is not APPROVED or approval decision is not APPROVED.
            InvalidationTriggeredError: if plan approval is expired or operational state invalidated the plan.
            PreconditionRevalidationError: if any precondition fails against live state.
        """
        # 1. Enforce PlanStatus == APPROVED
        if plan.status != PlanStatus.APPROVED:
            raise UnapprovedPlanExecutionError(
                f"Plan '{plan.plan_id}' cannot be executed with status '{plan.status.value}'. Must be APPROVED."
            )

        # 2. Enforce ApprovalRequest is explicitly APPROVED
        if not plan.approval or plan.approval.decision.value != "APPROVED":
            approval_state = plan.approval.decision.value if plan.approval else "NONE"
            raise UnapprovedPlanExecutionError(
                f"Plan '{plan.plan_id}' lacks valid human approval (current approval decision: '{approval_state}')."
            )

        # 3. Check for approval window expiration
        if current_time > plan.approval.expires_at:
            raise InvalidationTriggeredError(
                f"Plan '{plan.plan_id}' approval expired at '{plan.approval.expires_at}' (current: '{current_time}')."
            )

        # 4. Check invalidation triggers against live state
        active_deployment = live_operational_state.get("active_deployment_id")
        target_dep = plan.action.parameters.get("deployment_id", plan.action.target_identifier)

        # If active deployment changed from the target deployment, plan is invalidated
        if active_deployment and active_deployment != target_dep:
            raise InvalidationTriggeredError(
                f"Operational state changed prior to execution: active deployment is '{active_deployment}', "
                f"expected '{target_dep}'. Plan '{plan.plan_id}' is invalidated (TOCTOU detected)."
            )

        # If service already recovered independently
        service_status = live_operational_state.get("service_status")
        if service_status == "HEALTHY":
            error_rate = live_operational_state.get("error_rate_pct", 0.0)
            if error_rate < 1.0:
                raise InvalidationTriggeredError(
                    f"Service '{plan.action.target_resource}' already healthy (error rate: {error_rate}%). "
                    f"Incident resolved independently; execution aborted."
                )

        # 5. Revalidate preconditions against live state
        failures: list[str] = []
        for pre in plan.preconditions:
            if pre.check_type == "ACTIVE_DEPLOYMENT_MATCH":
                if active_deployment != pre.expected_value:
                    failures.append(
                        f"Precondition {pre.condition_id} failed: expected active deployment "
                        f"'{pre.expected_value}', but found '{active_deployment}'"
                    )
            elif pre.check_type == "DEPENDENCY_HEALTH_OK":
                dep_status = live_operational_state.get("dependencies_status", "HEALTHY")
                if dep_status != pre.expected_value:
                    failures.append(
                        f"Precondition {pre.condition_id} failed: downstream dependencies are "
                        f"'{dep_status}', expected '{pre.expected_value}'"
                    )

        if failures:
            raise PreconditionRevalidationError(
                f"Precondition revalidation failed for plan '{plan.plan_id}': {'; '.join(failures)}"
            )
