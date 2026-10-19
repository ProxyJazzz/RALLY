"""Precondition and Invalidation Condition evaluation for RALLY Action Plans.

Defines conditions that must hold before an action plan can be executed,
and invalidation triggers that deterministically mark an issued plan as INVALIDATED.
"""

from typing import Any
from governance.models import (
    ActionPlan,
    InvalidationCondition,
    Precondition,
    ProposedAction,
)


class ConditionBuilder:
    """Constructs explicit preconditions and invalidation conditions for proposed actions."""

    @staticmethod
    def build_rollback_preconditions(action: ProposedAction) -> list[Precondition]:
        """Generates preconditions required before a rollback can be performed."""
        target_dep = action.parameters.get("deployment_id", action.target_identifier)
        target_version = action.parameters.get("target_version", "checkout-v41")
        return [
            Precondition(
                condition_id="PRE-01",
                description=f"Active deployment must currently be '{target_dep}'",
                check_type="ACTIVE_DEPLOYMENT_MATCH",
                expected_value=target_dep,
            ),
            Precondition(
                condition_id="PRE-02",
                description=f"Predecessor deployment '{target_version}' must be available for reactivation",
                check_type="PREDECESSOR_AVAILABLE",
                expected_value=target_version,
            ),
            Precondition(
                condition_id="PRE-03",
                description="Downstream service dependencies must remain healthy",
                check_type="DEPENDENCY_HEALTH_OK",
                expected_value="HEALTHY",
            ),
        ]

    @staticmethod
    def build_rollback_invalidation_conditions(action: ProposedAction) -> list[InvalidationCondition]:
        """Generates conditions that invalidate an issued rollback plan."""
        target_dep = action.parameters.get("deployment_id", action.target_identifier)
        return [
            InvalidationCondition(
                condition_id="INV-01",
                description=f"Active deployment is no longer '{target_dep}'",
                trigger_type="ACTIVE_DEPLOYMENT_CHANGED",
            ),
            InvalidationCondition(
                condition_id="INV-02",
                description="Incident resolved independently through alternative mitigation",
                trigger_type="INCIDENT_RESOLVED_EXTERNALLY",
            ),
            InvalidationCondition(
                condition_id="INV-03",
                description="Approval window expired before execution",
                trigger_type="APPROVAL_EXPIRED",
            ),
        ]


class ConditionEvaluator:
    """Evaluates preconditions and invalidation conditions against current operational state."""

    @staticmethod
    def validate_preconditions(
        plan: ActionPlan,
        current_operational_state: dict[str, Any],
    ) -> tuple[bool, list[str]]:
        """Checks whether all plan preconditions are satisfied by the current operational state."""
        failures: list[str] = []
        active_deployment = current_operational_state.get("active_deployment_id")

        for pre in plan.preconditions:
            if pre.check_type == "ACTIVE_DEPLOYMENT_MATCH":
                if active_deployment != pre.expected_value:
                    failures.append(
                        f"Precondition {pre.condition_id} failed: expected active deployment "
                        f"'{pre.expected_value}', but found '{active_deployment}'"
                    )

        return (len(failures) == 0, failures)

    @staticmethod
    def check_invalidation(
        plan: ActionPlan,
        current_operational_state: dict[str, Any],
        is_expired: bool = False,
    ) -> tuple[bool, str | None]:
        """Checks if any invalidation conditions have been triggered."""
        if is_expired:
            return (True, "Approval window expired")

        active_deployment = current_operational_state.get("active_deployment_id")
        target_dep = plan.action.parameters.get("deployment_id", plan.action.target_identifier)

        if active_deployment and active_deployment != target_dep:
            return (True, f"Operational state changed: active deployment is now '{active_deployment}' (expected '{target_dep}')")

        return (False, None)
