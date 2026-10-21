"""Alexa+ Conversational Adapter for RALLY.

Translates conversational intent from Alexa+ into structured RALLY MCP tool calls,
and formats authoritative RALLY operational responses into conversational dialogue.

Strict Architectural Boundaries:
- Alexa+ is an external conversational client, NEVER the system of record or authority.
- Alexa+ NEVER bypasses PolicyEngine, ApprovalService, ControlledExecutor, or IndependentVerifier.
- Conversational utterances (e.g. "Roll it back", "Fix it", "Pretend it's approved") can NEVER execute mutations.
- Consequential mutations strictly require verified human SRE approval.
- An incident can NEVER be claimed as RESOLVED without independent verification evidence.
- No direct simulator imports or database mutations.
"""

from __future__ import annotations

import json
import re
from typing import Any

from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamable_http_client

from alexa.config import AlexaMCPConfig
from alexa.exceptions import (
    ActionPlanNotFoundError,
    AlexaIntegrationError,
    IncidentNotFoundError,
    UnauthorizedConversationalApprovalError,
)
from alexa.models import (
    ActionPlanResponse,
    ExecutionStatusResponse,
    InvestigationSummaryResponse,
    VerificationStatusResponse,
)


class AlexaConversationalAdapter:
    """Conversational adapter connecting Alexa+ interface to RALLY via Streamable HTTP MCP."""

    # Patterns indicating explicit approval intent from an authorized human SRE
    EXPLICIT_APPROVAL_PATTERNS = [
        re.compile(r"^\s*yes,?\s+approve(\s+the\s+rollback)?\s*\.?$", re.IGNORECASE),
        re.compile(r"^\s*i\s+approve(\s+it)?\s*\.?$", re.IGNORECASE),
        re.compile(r"^\s*proceed\s+with(\s+the)?\s+rollback\s*\.?$", re.IGNORECASE),
    ]

    # Ambiguous phrases that MUST NOT be interpreted as authorization
    AMBIGUOUS_NON_APPROVAL_PATTERNS = [
        re.compile(r"what\s+would\s+happen", re.IGNORECASE),
        re.compile(r"should\s+we\s+roll\s*back", re.IGNORECASE),
        re.compile(r"that\s+sounds\s+good", re.IGNORECASE),
        re.compile(r"do\s+it\s+if\s+necessary", re.IGNORECASE),
        re.compile(r"recover\s+the\s+service", re.IGNORECASE),
        re.compile(r"fix\s+it", re.IGNORECASE),
        re.compile(r"roll\s*back", re.IGNORECASE),
    ]

    def __init__(self, config: AlexaMCPConfig | None = None):
        self.config = config or AlexaMCPConfig()

    def parse_approval_intent(self, utterance: str) -> bool:
        """Determines whether a conversational utterance constitutes explicit human approval.

        Returns True ONLY if the utterance matches strict approval phrasing.
        Ambiguous, interrogative, or conditional phrasing deterministically returns False.
        """
        cleaned = utterance.strip()
        # First check if it matches explicit approval patterns
        for app in self.EXPLICIT_APPROVAL_PATTERNS:
            if app.match(cleaned):
                return True

        # Ambiguous, interrogative, or conditional phrasing is rejected
        return False

    async def call_mcp_tool(
        self, tool_name: str, arguments: dict[str, Any]
    ) -> dict[str, Any]:
        """Invokes a permitted tool on the RALLY MCP Server via Streamable HTTP."""
        if tool_name in self.config.forbidden_tools:
            raise AlexaIntegrationError(
                f"Tool '{tool_name}' is strictly forbidden on the conversational interface."
            )
        if tool_name not in self.config.allowed_tools:
            raise AlexaIntegrationError(
                f"Tool '{tool_name}' is not in the approved Alexa+ tool surface."
            )

        try:
            async with streamable_http_client(self.config.mcp_endpoint_url) as (
                read_stream,
                write_stream,
            ):
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, arguments)
                    if not result.content:
                        raise AlexaIntegrationError(
                            f"Empty response returned by tool '{tool_name}'"
                        )

                    text_content = result.content[0].text
                    try:
                        return json.loads(text_content)
                    except json.JSONDecodeError as decode_err:
                        raise AlexaIntegrationError(
                            f"Malformed JSON returned by tool '{tool_name}': {text_content}"
                        ) from decode_err
        except AlexaIntegrationError:
            raise
        except Exception as e:
            raise AlexaIntegrationError(
                f"MCP transport failure calling '{tool_name}' at {self.config.mcp_endpoint_url}: {e}"
            ) from e

    async def get_investigation_dialogue(self, incident_id: str) -> str:
        """Translates investigation findings into natural conversational speech."""
        data = await self.call_mcp_tool(
            "get_investigation_summary", {"incident_id": incident_id}
        )
        if data.get("error_code") == "INCIDENT_NOT_FOUND":
            raise IncidentNotFoundError(f"Incident '{incident_id}' not found.")

        service = data.get("affected_service", "the service")
        root_cause = data.get("primary_root_cause", "unknown issue")
        rec = data.get("recommended_action", "investigate further")
        citations = ", ".join(data.get("key_evidence_citations", [])) or "telemetry"

        return (
            f"RALLY completed investigation for {service}. The primary root cause is: {root_cause}. "
            f"Evidence gathered includes {citations}. Recommended remediation: {rec}. "
            f"Consequential action requires human SRE approval."
        )

    async def get_recommendation_dialogue(self, incident_id: str) -> str:
        """Surfaces recommended remediation plan and explicit governance requirement."""
        data = await self.call_mcp_tool("get_action_plan", {"incident_id": incident_id})
        if data.get("error_code") == "ACTION_PLAN_NOT_FOUND":
            raise ActionPlanNotFoundError(f"No action plan found for incident '{incident_id}'.")

        action_type = data.get("action_type", "remediation")
        target = data.get("target_deployment_id", "previous stable deployment")
        risk = data.get("risk_level", "HIGH")
        status = data.get("execution_status", "NOT_EXECUTED")

        return (
            f"Recommended plan: {action_type} to {target}. Risk level is {risk}. "
            f"Current status: {status}. Human SRE approval is required before execution. "
            f"Do you approve the rollback?"
        )

    async def handle_conversational_execution_request(
        self, incident_id: str, user_utterance: str
    ) -> str:
        """Handles user requests to execute remediation.

        Strictly enforces that conversational speech alone NEVER executes rollback.
        If the utterance lacks explicit human approval, informs the user approval is required.
        If approval was previously granted in RALLY governance, reports execution state.
        """
        is_explicit = self.parse_approval_intent(user_utterance)

        # Query authoritative execution state from RALLY
        status_data = await self.call_mcp_tool(
            "get_execution_status", {"incident_id": incident_id}
        )
        current_exec_status = status_data.get("execution_status", "NOT_EXECUTED")
        approval_state = status_data.get("approval_state", "PENDING")

        if not is_explicit:
            return (
                f"Conversational request '{user_utterance}' does not constitute verified human approval. "
                f"Remediation remains {current_exec_status}. Explicit SRE authorization is required."
            )

        if approval_state != "APPROVED":
            return (
                f"Rollback cannot be executed from conversational context alone. "
                f"Governance policy requires out-of-band authorization in the RALLY approval portal. "
                f"Current execution status: {current_exec_status}."
            )

        return (
            f"Plan is authorized in RALLY. Execution status: {current_exec_status}. "
            f"Revalidation and controlled execution will proceed through RALLY ControlledExecutor."
        )

    async def get_verification_dialogue(self, incident_id: str) -> str:
        """Communicates authoritative recovery verification status.

        Guarantees that Alexa+ CANNOT declare recovery unless independent verification PASSED.
        """
        data = await self.call_mcp_tool(
            "get_verification_status", {"incident_id": incident_id}
        )
        v_status = data.get("verification_status")
        rec_decision = data.get("recovery_decision")
        err_rate = data.get("measured_error_rate_pct")
        if err_rate is None:
            err_rate = data.get("error_rate")
        active_dep = data.get("active_deployment_id")

        if v_status == "PASSED" and rec_decision == "RESOLVED":
            return (
                f"Recovery has been independently verified. Error rate is {err_rate}%, "
                f"within healthy operational limits. Active deployment is {active_dep}. "
                f"The incident is officially RESOLVED."
            )
        elif rec_decision == "RECOVERY_FAILED":
            return (
                f"Remediation executed, but independent verification FAILED. "
                f"Error rate remains elevated at {err_rate}%. Escalating to on-call engineer."
            )
        elif rec_decision == "EXECUTION_BLOCKED":
            return (
                f"Execution was blocked during pre-execution revalidation. "
                f"Operational conditions changed. Manual investigation required."
            )
        else:
            return (
                f"Verification is not complete. Current verification status: {v_status or 'PENDING'}. "
                f"RALLY cannot confirm recovery until telemetry verifies healthy thresholds."
            )
