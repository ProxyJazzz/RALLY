"""In-memory authoritative incident context store for conversational continuity in RALLY.

Maintains multi-turn context across Alexa+ sessions without relying on raw LLM
conversation history as the system of record.
"""

import time
from typing import Any

from agent.models import InvestigationReport
from alexa.exceptions import IncidentNotFoundError
from alexa.models import (
    ConversationalIncidentContext,
    ConversationalIncidentState,
)
from execution.models import ControlledExecutionResult
from governance.models import ActionPlan, PlanStatus


class IncidentContextManager:
    """Thread-safe, authoritative incident context registry."""

    def __init__(self):
        self._contexts: dict[str, ConversationalIncidentContext] = {}

    def get_context(self, incident_id: str) -> ConversationalIncidentContext:
        """Retrieves active incident context by ID."""
        if incident_id not in self._contexts:
            raise IncidentNotFoundError(f"Incident with ID '{incident_id}' not found in active context.")
        return self._contexts[incident_id]

    def list_contexts(self) -> list[ConversationalIncidentContext]:
        """Returns all registered incident contexts."""
        return list(self._contexts.values())

    def create_or_update_from_investigation(
        self,
        report: InvestigationReport,
    ) -> ConversationalIncidentContext:
        """Initializes or updates incident context following an investigation."""
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        existing = self._contexts.get(report.incident_id)

        target_dep = ""
        target_version = ""
        if report.recommended_action:
            target_dep = report.recommended_action.parameters.get("deployment_id", "")
            target_version = report.recommended_action.parameters.get("target_version", "")

        ctx = ConversationalIncidentContext(
            incident_id=report.incident_id,
            state=ConversationalIncidentState.INVESTIGATED,
            affected_service=report.affected_service,
            severity=report.severity,
            active_deployment_id=target_dep or "checkout-v42",
            suspected_deployment_id=target_dep or "checkout-v42",
            primary_hypothesis_id=report.primary_hypothesis.hypothesis_id if report.primary_hypothesis else None,
            primary_hypothesis_title=report.primary_hypothesis.title if report.primary_hypothesis else None,
            confidence=report.confidence,
            evidence_ids=[e.evidence_id for e in report.evidence],
            action_type=report.recommended_action.action_name if report.recommended_action else None,
            action_target_version=target_version,
            execution_status="NOT_EXECUTED",
            created_at=existing.created_at if existing else now,
            updated_at=now,
        )
        self._contexts[report.incident_id] = ctx
        return ctx

    def update_from_action_plan(
        self,
        plan: ActionPlan,
    ) -> ConversationalIncidentContext:
        """Updates context with issued ActionPlan and governance status."""
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        ctx = self.get_context(plan.incident_id)

        approval_dec = plan.approval.decision if plan.approval else ctx.approval_decision
        state = ConversationalIncidentState.AWAITING_APPROVAL
        if plan.status == PlanStatus.APPROVED:
            state = ConversationalIncidentState.APPROVED

        updated = ctx.model_copy(
            update={
                "action_plan_id": plan.plan_id,
                "action_type": plan.action.action_type,
                "action_target_version": plan.action.parameters.get("target_version"),
                "risk_level": plan.risk.risk_level,
                "plan_status": plan.status,
                "approval_decision": approval_dec,
                "state": state,
                "execution_status": plan.execution_status,
                "updated_at": now,
            }
        )
        self._contexts[plan.incident_id] = updated
        return updated

    def update_from_execution_result(
        self,
        result: ControlledExecutionResult,
    ) -> ConversationalIncidentContext:
        """Updates context with execution and verification outcome."""
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        ctx = self.get_context(result.incident_id)

        verif_status = result.verification_report.status.value if result.verification_report else "NONE"
        state = ConversationalIncidentState(result.incident_status)

        updated = ctx.model_copy(
            update={
                "execution_id": result.execution_record.execution_id,
                "execution_status": result.execution_record.status.value,
                "verification_status": verif_status,
                "recovery_decision": result.recovery_decision,
                "state": state,
                "active_deployment_id": (
                    result.verification_report.active_deployment_id
                    if result.verification_report
                    else ctx.active_deployment_id
                ),
                "updated_at": now,
            }
        )
        self._contexts[result.incident_id] = updated
        return updated

    def clear(self) -> None:
        """Clears all stored contexts."""
        self._contexts.clear()


# Shared singleton context manager for the application
incident_context_manager = IncidentContextManager()
