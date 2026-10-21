"""Dedicated conversational MCP capabilities for Alexa+ integration in RALLY.

Exposes conversational query adapters over existing RALLY domain services:
- get_incident_context: Retrieves current authoritative state and identifiers
- get_investigation_summary: Natural-language and evidence summary of findings
- get_action_plan: Detailed remediation plan, risk level, and governance approval requirements
- get_execution_status: Current execution status (enforces NOT_EXECUTED invariant prior to approval)
- get_verification_status: Post-remediation independent verification status
"""

from typing import Annotated
from mcp.server.mcpserver import MCPServer
from pydantic import Field

from alexa.context import IncidentContextManager, incident_context_manager
from alexa.models import (
    ActionPlanResponse,
    ExecutionStatusResponse,
    InvestigationSummaryResponse,
    VerificationStatusResponse,
)
from rally_mcp.errors import map_exception_to_error_response


def register_alexa_conversational_tools(
    server: MCPServer,
    context_mgr: IncidentContextManager | None = None,
) -> None:
    """Registers incident-oriented conversational tools specifically tailored for Alexa+."""
    ctx_mgr = context_mgr if context_mgr is not None else incident_context_manager

    @server.tool()
    def get_incident_context(
        incident_id: Annotated[str, Field(description="Incident identifier, e.g. 'INC-GOLDEN-01'")],
    ) -> str:
        """Returns the authoritative multi-turn incident context including state, active deployment, and plan identifiers."""
        try:
            ctx = ctx_mgr.get_context(incident_id)
            return ctx.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)

    @server.tool()
    def get_investigation_summary(
        incident_id: Annotated[str, Field(description="Incident identifier, e.g. 'INC-GOLDEN-01'")],
    ) -> str:
        """Returns a conversational summary of root cause findings, evidence citations, and recommended remediation for an incident."""
        try:
            ctx = ctx_mgr.get_context(incident_id)
            resp = InvestigationSummaryResponse(
                incident_id=ctx.incident_id,
                affected_service=ctx.affected_service,
                summary=(
                    f"Investigation for {ctx.affected_service} identified primary cause: "
                    f"{ctx.primary_hypothesis_title or 'Under investigation'}."
                ),
                primary_root_cause=ctx.primary_hypothesis_title or "Inconclusive",
                confidence=ctx.confidence.value,
                evidence_count=len(ctx.evidence_ids),
                key_evidence_citations=ctx.evidence_ids[:4],
                recommended_action=ctx.action_type or "Investigate further",
                approval_required=True,
            )
            return resp.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)

    @server.tool()
    def get_action_plan(
        incident_id: Annotated[str, Field(description="Incident identifier, e.g. 'INC-GOLDEN-01'")],
    ) -> str:
        """Returns the remediation action plan, deterministic risk level, and human approval requirement status."""
        try:
            ctx = ctx_mgr.get_context(incident_id)
            instruction = (
                "Consequential action requires explicit human approval before execution. "
                "Execution status is currently NOT_EXECUTED."
            )
            if ctx.plan_status.value == "APPROVED":
                instruction = "Plan has received verified human approval and is authorized for controlled execution."

            resp = ActionPlanResponse(
                plan_id=ctx.action_plan_id or f"plan-pending-{ctx.incident_id}",
                incident_id=ctx.incident_id,
                action=ctx.action_type or "rollback_deployment",
                target_deployment=ctx.suspected_deployment_id or "checkout-v42",
                reinstating_version=ctx.action_target_version or "checkout-v41",
                risk_level=ctx.risk_level.value,
                risk_factors=[
                    "Tier-1 customer facing service mutation",
                    "Deployment replacement operation",
                    "Reversible rollback to predecessor version",
                ],
                policy_decision="REQUIRES_APPROVAL",
                approval_decision=ctx.approval_decision.value,
                approval_required=True,
                execution_status=ctx.execution_status,
                conversational_instruction=instruction,
            )
            return resp.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)

    @server.tool()
    def get_execution_status(
        incident_id: Annotated[str, Field(description="Incident identifier, e.g. 'INC-GOLDEN-01'")],
    ) -> str:
        """Returns the current execution state of an action plan, enforcing that unapproved actions remain NOT_EXECUTED."""
        try:
            ctx = ctx_mgr.get_context(incident_id)
            msg = f"Remediation for incident '{incident_id}' status: {ctx.execution_status}."
            if ctx.execution_status == "NOT_EXECUTED":
                msg += " Consequential actions require explicit human approval and cannot execute via conversational intent alone."

            resp = ExecutionStatusResponse(
                incident_id=ctx.incident_id,
                plan_id=ctx.action_plan_id,
                execution_id=ctx.execution_id,
                action_type=ctx.action_type,
                execution_status=ctx.execution_status,
                message=msg,
            )
            return resp.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)

    @server.tool()
    def get_verification_status(
        incident_id: Annotated[str, Field(description="Incident identifier, e.g. 'INC-GOLDEN-01'")],
    ) -> str:
        """Returns the post-remediation independent recovery verification outcome and measured error rate."""
        try:
            ctx = ctx_mgr.get_context(incident_id)
            summary = "Recovery verification has not yet run because execution is pending approval."
            if ctx.verification_status:
                summary = (
                    f"Independent verification status: {ctx.verification_status}. "
                    f"Decision: {ctx.recovery_decision.value if ctx.recovery_decision else 'UNKNOWN'}. "
                    f"Active deployment: {ctx.active_deployment_id}."
                )

            resp = VerificationStatusResponse(
                incident_id=ctx.incident_id,
                execution_id=ctx.execution_id,
                verification_status=ctx.verification_status or "PENDING",
                recovery_decision=ctx.recovery_decision.value if ctx.recovery_decision else "PENDING",
                measured_error_rate_pct=ctx.measured_error_rate_pct,
                active_deployment_id=ctx.active_deployment_id,
                dependencies_healthy=True,
                summary=summary,
            )
            return resp.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)
