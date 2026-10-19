"""Investigation Orchestrator and Agent Runtime for RALLY.

Coordinates the core investigation loop:
  1. Incident ingestion & state initialization (RECEIVED -> UNDERSTANDING)
  2. Bounded iterative tool calls over real MCP protocol (INVESTIGATING)
  3. Evidence recording with provenance tracking in EvidenceLedger
  4. Hypothesis formulation and comparative evaluation (FORMING_HYPOTHESES)
  5. Remediation recommendation synthesis without execution (RECOMMENDING)
  6. Final structured and human-readable reporting (COMPLETE)
"""

import time
import uuid
from typing import Any

from agent.evidence import EvidenceLedger
from agent.hypotheses import HypothesisEvaluator
from agent.mcp_client import AgentMCPClient, MCPClientError
from agent.models import (
    AgentEvent,
    AgentEventType,
    AgentState,
    ConfidenceLevel,
    EvidenceItem,
    EvidenceLabel,
    Hypothesis,
    IncidentRequest,
    InvestigationConfig,
    InvestigationReport,
    RecommendedAction,
)
from agent.policies import AgentPolicyEngine, PolicyViolationError
from agent.providers import DeterministicInvestigationProvider, LLMProvider
from agent.reports import format_human_readable_report


class InvestigationOrchestrator:
    """Bounded, auditable orchestrator running the RALLY Investigation Agent."""

    def __init__(
        self,
        mcp_client: AgentMCPClient,
        provider: LLMProvider | None = None,
        config: InvestigationConfig | None = None,
    ):
        self.mcp_client = mcp_client
        self.provider = provider if provider is not None else DeterministicInvestigationProvider()
        self.config = config if config is not None else InvestigationConfig()

    def _record_event(
        self,
        events: list[AgentEvent],
        run_id: str,
        incident_id: str,
        state: AgentState,
        event_type: AgentEventType,
        details: dict[str, Any],
    ) -> None:
        """Appends an immutable audit event."""
        event = AgentEvent(
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            agent_run_id=run_id,
            incident_id=incident_id,
            agent_state=state,
            event_type=event_type,
            details=details,
        )
        events.append(event)

    async def investigate(self, incident: IncidentRequest) -> InvestigationReport:
        """Executes the full, bounded investigation lifecycle for an incident."""
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        events: list[AgentEvent] = []
        state = AgentState.RECEIVED
        ledger = EvidenceLedger(max_items=self.config.max_evidence_items)
        tool_call_count = 0
        iteration = 0
        limitations: list[str] = []
        start_time = time.time()

        self._record_event(
            events, run_id, incident.incident_id, state,
            AgentEventType.INCIDENT_RECEIVED,
            {"description": incident.description, "affected_service": incident.affected_service},
        )

        state = AgentState.UNDERSTANDING
        self._record_event(
            events, run_id, incident.incident_id, state,
            AgentEventType.INVESTIGATION_STARTED,
            {"config": self.config.model_dump()},
        )

        # 1. Discover available tools from MCP
        try:
            available_tools = await self.mcp_client.list_available_tools()
        except MCPClientError as mcp_err:
            state = AgentState.FAILED
            self._record_event(
                events, run_id, incident.incident_id, state,
                AgentEventType.INVESTIGATION_FAILED,
                {"error": str(mcp_err)},
            )
            return InvestigationReport(
                incident_id=incident.incident_id,
                agent_run_id=run_id,
                affected_service=incident.affected_service or "unknown",
                severity=incident.severity,
                status=AgentState.FAILED,
                summary=f"Investigation failed: unable to connect to MCP server ({mcp_err})",
                execution_status="NOT_EXECUTED",
                limitations=["MCP server unreachable"],
            )

        state = AgentState.INVESTIGATING

        limit_reached = False

        # 2. Bounded investigation loop
        while iteration < self.config.max_iterations:
            iteration += 1

            # Check timeout bound
            if time.time() - start_time > self.config.timeout_seconds:
                limitations.append("Investigation timeout bound reached")
                limit_reached = True
                break

            # Check tool call bound
            if tool_call_count >= self.config.max_tool_calls:
                limitations.append("Maximum tool call bound reached")
                limit_reached = True
                break

            # Consult model for next action
            selection = await self.provider.select_next_action(
                incident=incident,
                ledger=ledger,
                available_tools=available_tools,
                iteration=iteration,
            )

            if selection.is_terminal or not selection.tool_name:
                # Model declared sufficient evidence gathered
                break

            tool_name = selection.tool_name
            tool_args = selection.arguments

            # Validate tool against allowlist policy before calling
            try:
                AgentPolicyEngine.validate_tool_request(tool_name)
            except PolicyViolationError as pol_err:
                limitations.append(f"Blocked tool request: {pol_err}")
                self._record_event(
                    events, run_id, incident.incident_id, state,
                    AgentEventType.TOOL_FAILED,
                    {"tool_name": tool_name, "error": str(pol_err)},
                )
                continue

            tool_call_count += 1
            self._record_event(
                events, run_id, incident.incident_id, state,
                AgentEventType.TOOL_REQUESTED,
                {"tool_name": tool_name, "arguments": tool_args, "reasoning": selection.reasoning},
            )

            # Call tool through MCP protocol
            try:
                tool_data = await self.mcp_client.call_tool(tool_name, tool_args)
                self._record_event(
                    events, run_id, incident.incident_id, state,
                    AgentEventType.TOOL_RESULT_RECEIVED,
                    {"tool_name": tool_name, "status": "SUCCESS"},
                )

                # Record evidence into ledger
                obs = self._extract_observation(tool_name, tool_data)
                ev_item = ledger.add_evidence(
                    source_tool=tool_name,
                    source_reference=str(tool_args),
                    observation=obs,
                    data=tool_data,
                    label=EvidenceLabel.OBSERVED,
                    confidence=ConfidenceLevel.HIGH,
                )
                self._record_event(
                    events, run_id, incident.incident_id, state,
                    AgentEventType.EVIDENCE_RECORDED,
                    {"evidence_id": ev_item.evidence_id, "observation": ev_item.observation},
                )

            except Exception as call_err:
                self._record_event(
                    events, run_id, incident.incident_id, state,
                    AgentEventType.TOOL_FAILED,
                    {"tool_name": tool_name, "error": str(call_err)},
                )
                limitations.append(f"Tool call failed for {tool_name}: {call_err}")
                # Continue safely with available evidence rather than terminating or inventing data

        # 3. Analyze evidence and form hypotheses
        state = AgentState.FORMING_HYPOTHESES
        self._record_event(
            events, run_id, incident.incident_id, state,
            AgentEventType.HYPOTHESIS_CREATED,
            {"evidence_count": ledger.count()},
        )

        hypotheses, primary_hyp, recommendation = await self.provider.synthesize_hypotheses_and_recommendation(
            incident=incident,
            ledger=ledger,
        )

        # Evaluate and rank hypotheses deterministically
        ranked_hypotheses = HypothesisEvaluator.evaluate_hypotheses(hypotheses, ledger)
        final_primary = ranked_hypotheses[0] if ranked_hypotheses else primary_hyp

        # 4. Generate recommendation (Phase 4: Recommended, NEVER executed)
        state = AgentState.RECOMMENDING
        self._record_event(
            events, run_id, incident.incident_id, state,
            AgentEventType.RECOMMENDATION_GENERATED,
            {"action": recommendation.model_dump()},
        )

        # 5. Complete investigation
        final_status = AgentState.LIMIT_REACHED if limit_reached else AgentState.COMPLETE
        event_completed_type = AgentEventType.LIMIT_REACHED if limit_reached else AgentEventType.INVESTIGATION_COMPLETED
        self._record_event(
            events, run_id, incident.incident_id, final_status,
            event_completed_type,
            {"primary_hypothesis": final_primary.title if final_primary else "None"},
        )

        report = InvestigationReport(
            incident_id=incident.incident_id,
            agent_run_id=run_id,
            affected_service=incident.affected_service or "checkout-service",
            severity=incident.severity,
            status=final_status,
            summary=(
                f"Investigation complete for {incident.incident_id}. Primary root cause: "
                f"{final_primary.title if final_primary else 'Inconclusive'}."
            ),
            evidence=ledger.get_all(),
            hypotheses=ranked_hypotheses,
            primary_hypothesis=final_primary,
            confidence=final_primary.confidence if final_primary else ConfidenceLevel.LOW,
            recommended_action=recommendation,
            execution_status="NOT_EXECUTED",  # Strict invariant
            limitations=limitations,
        )

        human_text = format_human_readable_report(report)
        return report.model_copy(update={"human_readable": human_text})

    def _extract_observation(self, tool_name: str, data: dict[str, Any]) -> str:
        """Derives a concise, evidence-grounded observation string from raw tool data."""
        if tool_name == "get_service_health":
            return f"{data.get('service_id')} operational status is {data.get('status')} on active deployment {data.get('active_deployment_id')}."
        elif tool_name == "get_error_rate":
            return f"{data.get('service_id')} error rate is {data.get('error_rate_pct')}% across {data.get('request_count')} requests."
        elif tool_name == "get_recent_deployments":
            depls = data.get("deployments", [])
            dep_names = [d.get("deployment_id") for d in depls[:2]]
            return f"Recent deployments for {data.get('service_id')}: {', '.join(filter(None, dep_names))}."
        elif tool_name == "get_deployment_diff":
            diff = data.get("diff", {})
            return f"Deployment diff for {diff.get('deployment_id')}: risk {diff.get('risk_level')}, modified files: {', '.join(diff.get('changed_files', []))}."
        elif tool_name == "query_logs":
            logs = data.get("logs", [])
            err_codes = {l.get("error_code") for l in logs if l.get("error_code")}
            return f"Queried {len(logs)} logs: detected error codes {', '.join(filter(None, err_codes))}."
        elif tool_name == "get_dependency_health":
            deps = data.get("dependencies", [])
            dep_summary = [f"{d.get('dependency_service_id')}={d.get('status')}" for d in deps]
            return f"Downstream dependency health: {', '.join(dep_summary)}."
        elif tool_name == "get_runbook":
            rb = data.get("runbook", {})
            return f"Runbook retrieved: rollback threshold is {rb.get('recovery_error_threshold_pct')}%; procedure: {rb.get('rollback_procedure')[:80]}..."
        return f"Tool {tool_name} returned observation data."
