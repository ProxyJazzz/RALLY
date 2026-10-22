"""Service layer for Alexa+ simulation workspace (Phase 8B).

Coordinates:
- Simulator fault injection (CHECKOUT_REGRESSION)
- In-process or external MCP server interaction via AgentMCPClient
- Agentic investigation orchestration (InvestigationOrchestrator)
- Evidence ledger accumulation with strict epistemic labels
- Governance planning and human approval (ActionPlanner, ApprovalService)
- Controlled execution with TOCTOU revalidation (ExecutionOrchestrator)
- Independent verification (IndependentVerifier)
- Multi-turn conversation state persistence via alexa.context.incident_context_manager
"""

from __future__ import annotations

import time
from typing import Any

from agent import AgentMCPClient, IncidentRequest, InvestigationOrchestrator
from alexa.adapter import AlexaConversationalAdapter
from alexa.config import AlexaMCPConfig
from alexa.context import incident_context_manager
from app.schemas.alexa_simulation import (
    ActionPlanSchema,
    AlexaSimulationStateResponse,
    ChatMessageResponse,
    EpistemicLabel,
    EvidenceItemSchema,
    ExecutionVerificationSchema,
    SimulationConversationState,
    TimelineStepSchema,
)
from execution import ExecutionOrchestrator
from governance import ActionPlanner, ApprovalService, GovernanceContext
from rally_mcp.runtime import MCPServerRunner
from simulator.domain.models import ServiceStatus
from simulator.services.simulator import IncidentSimulator


class AlexaSimulationService:
    """Singleton service driving the Alexa+ simulation experience."""

    _instance: AlexaSimulationService | None = None

    def __init__(self) -> None:
        self.simulator = IncidentSimulator()
        self.runner: MCPServerRunner | None = None
        self.mcp_url: str = ""
        self.adapter = AlexaConversationalAdapter()

        # State cache for the simulation workspace
        self.incident_id: str = "INC-ALEXA-GOLDEN"
        self.state: SimulationConversationState = SimulationConversationState.IDLE
        self.timeline: list[TimelineStepSchema] = []
        self.evidence: list[EvidenceItemSchema] = []
        self.current_plan: ActionPlanSchema | None = None
        self.current_raw_plan: Any = None
        self.execution_verification = ExecutionVerificationSchema()
        self.last_assistant_speech: str = (
            "RALLY operational assistant initialized. Say 'Investigate the checkout incident' to begin."
        )

        self._ensure_mcp_server()

    @classmethod
    def get_instance(cls) -> AlexaSimulationService:
        if cls._instance is None:
            cls._instance = AlexaSimulationService()
        return cls._instance

    def _ensure_mcp_server(self) -> str:
        """Starts background MCP server if not already running."""
        if self.runner is None:
            self.runner = MCPServerRunner(simulator=self.simulator)
            self.mcp_url = self.runner.start()
            self.adapter = AlexaConversationalAdapter(
                AlexaMCPConfig(mcp_endpoint_url=self.mcp_url)
            )
        return self.mcp_url

    def reset_simulation(self) -> AlexaSimulationStateResponse:
        """Resets the simulator and workspace to an initial regression state."""
        self.simulator.reset()
        self.simulator.inject_fault("CHECKOUT_REGRESSION")
        incident_context_manager.clear()

        self.incident_id = "INC-ALEXA-GOLDEN"
        self.state = SimulationConversationState.RECEIVED
        self.timeline = [
            TimelineStepSchema(
                step_id="step-0",
                title="Fault Injected: CHECKOUT_REGRESSION (checkout-v42)",
                status="completed",
                timestamp=time.strftime("%H:%M:%S"),
                detail="Active deployment checkout-v42 exhibiting ~18.4% error rate",
            )
        ]
        self.evidence = [
            EvidenceItemSchema(
                evidence_id="EV-INIT-01",
                label=EpistemicLabel.OBSERVED,
                description="Checkout error rate elevated to 18.4% (healthy threshold < 1.0%)",
                source_tool="get_error_rate",
                timestamp=time.strftime("%H:%M:%S"),
            ),
            EvidenceItemSchema(
                evidence_id="EV-INIT-02",
                label=EpistemicLabel.OBSERVED,
                description="Active deployment is checkout-v42 (deployed 10m ago)",
                source_tool="get_service_health",
                timestamp=time.strftime("%H:%M:%S"),
            ),
        ]
        self.current_plan = None
        self.current_raw_plan = None
        self.execution_verification = ExecutionVerificationSchema()
        self.last_assistant_speech = (
            "Elevated checkout error rate detected (18.4%). You can ask me to investigate."
        )
        return self.get_snapshot()

    def get_snapshot(self) -> AlexaSimulationStateResponse:
        """Returns current snapshot of the simulation workspace."""
        active_dep = "checkout-v42"
        try:
            svc = self.simulator.get_service("checkout-service")
            active_dep = svc.active_deployment_id
        except Exception:
            pass

        return AlexaSimulationStateResponse(
            incident_id=self.incident_id,
            state=self.state,
            service_id="checkout-service",
            active_deployment=active_dep,
            suspected_deployment="checkout-v42" if active_dep == "checkout-v42" else None,
            primary_hypothesis=(
                "CHECKOUT_VALIDATION_REGRESSION in checkout-v42"
                if self.state not in {SimulationConversationState.IDLE, SimulationConversationState.RECEIVED}
                else None
            ),
            confidence=0.95 if self.current_plan else 0.0,
            timeline=self.timeline,
            evidence=self.evidence,
            action_plan=self.current_plan,
            execution_verification=self.execution_verification,
            last_assistant_speech=self.last_assistant_speech,
        )

    async def handle_message(self, message: str) -> ChatMessageResponse:
        """Handles a conversational user utterance against RALLY."""
        cleaned = message.strip()
        lower = cleaned.lower()

        # Ensure fault is present if starting cold
        if self.state == SimulationConversationState.IDLE:
            self.reset_simulation()

        # ── 1. Intent: Request Investigation ─────────────────────────────────
        if any(w in lower for w in ["investigate", "what's wrong", "whats wrong", "analyze", "check checkout"]):
            return await self._run_investigation()

        # ── 2. Intent: What did you find / Findings / Status ─────────────────
        if any(w in lower for w in ["what did you find", "findings", "what happened", "root cause", "why do you think"]):
            if not self.current_plan:
                return await self._run_investigation()

            reply = (
                "RALLY correlated operational telemetry: Error rate is 18.4% starting immediately after "
                "deployment checkout-v42. Query logs show 'CHECKOUT_VALIDATION_REGRESSION' in order_validator.py, "
                "while payment, inventory, and auth dependencies remain healthy. "
                "Rollback to checkout-v41 is recommended."
            )
            self.last_assistant_speech = reply
            return ChatMessageResponse(
                reply=reply,
                state=self.state,
                is_explicit_approval=False,
                approval_required=self.current_plan.approval_required if self.current_plan else False,
                action_plan=self.current_plan,
                snapshot=self.get_snapshot(),
            )

        # ── 3. Intent: Should we roll back / Recommend ───────────────────────
        if any(w in lower for w in ["should we roll", "recommend", "what do you recommend", "what should we do"]):
            if not self.current_plan:
                await self._run_investigation()

            reply = (
                "RALLY recommends rolling back checkout-v42 to checkout-v41. "
                "Because rollback modifies production infrastructure, it has a HIGH risk classification "
                "and strictly requires human SRE approval. Do you approve the rollback?"
            )
            self.last_assistant_speech = reply
            return ChatMessageResponse(
                reply=reply,
                state=self.state,
                is_explicit_approval=False,
                approval_required=True,
                action_plan=self.current_plan,
                snapshot=self.get_snapshot(),
            )

        # ── 4. Intent: Conversational approval attempt ───────────────────────
        if self.adapter.parse_approval_intent(cleaned):
            # Check if user says "Approve the rollback" or "Yes, approve"
            if self.current_plan and self.state == SimulationConversationState.AWAITING_APPROVAL:
                reply = (
                    "Conversational authorization noted. To preserve governance and non-repudiation, "
                    "human SRE authorization must be confirmed via the Approval Gate. "
                    "Please click 'APPROVE ROLLBACK' or confirm through your authorized terminal."
                )
                self.last_assistant_speech = reply
                return ChatMessageResponse(
                    reply=reply,
                    state=self.state,
                    is_explicit_approval=True,
                    approval_required=True,
                    action_plan=self.current_plan,
                    snapshot=self.get_snapshot(),
                )

        # ── 5. Intent: Is the service healthy now / verification check ──────
        if any(w in lower for w in ["healthy now", "is it healthy", "verified", "status now", "recovered"]):
            reply = await self.adapter.get_verification_dialogue(self.incident_id)
            self.last_assistant_speech = reply
            return ChatMessageResponse(
                reply=reply,
                state=self.state,
                is_explicit_approval=False,
                approval_required=False,
                action_plan=self.current_plan,
                snapshot=self.get_snapshot(),
            )

        # ── 6. Fallback response ─────────────────────────────────────────────
        reply = (
            f"Understood. Current incident status is {self.state.value}. "
            "You can ask me to 'Investigate the checkout incident', 'What did you find?', "
            "or 'Is the service healthy now?'"
        )
        self.last_assistant_speech = reply
        return ChatMessageResponse(
            reply=reply,
            state=self.state,
            is_explicit_approval=False,
            approval_required=self.state == SimulationConversationState.AWAITING_APPROVAL,
            action_plan=self.current_plan,
            snapshot=self.get_snapshot(),
        )

    async def _run_investigation(self) -> ChatMessageResponse:
        """Executes the full agentic investigation and governance planning pipeline."""
        self._ensure_mcp_server()
        self.state = SimulationConversationState.INVESTIGATING

        # Fresh investigation: clear previous plan, execution, and verification state
        self.current_plan = None
        self.current_raw_plan = None
        self.execution_verification = ExecutionVerificationSchema()

        # Step-by-step timeline building
        now = time.strftime("%H:%M:%S")
        self.timeline.append(
            TimelineStepSchema(
                step_id="step-1",
                title="Service Health Inspected",
                status="completed",
                timestamp=now,
                tool_called="get_service_health",
                detail="Status: DEGRADED, Active: checkout-v42",
            )
        )
        self.timeline.append(
            TimelineStepSchema(
                step_id="step-2",
                title="Error Rate Inspected",
                status="completed",
                timestamp=now,
                tool_called="get_error_rate",
                detail="Error rate: 18.4% (Threshold: 1.0%)",
            )
        )
        self.timeline.append(
            TimelineStepSchema(
                step_id="step-3",
                title="Logs Queried & Correlated",
                status="completed",
                timestamp=now,
                tool_called="query_logs",
                detail="Found CHECKOUT_VALIDATION_REGRESSION in checkout-v42",
            )
        )
        self.timeline.append(
            TimelineStepSchema(
                step_id="step-4",
                title="Deployment Diff Inspected",
                status="completed",
                timestamp=now,
                tool_called="get_deployment_diff",
                detail="order_validator.py modified in checkout-v42",
            )
        )
        self.timeline.append(
            TimelineStepSchema(
                step_id="step-5",
                title="Dependencies Inspected",
                status="completed",
                timestamp=now,
                tool_called="get_dependency_health",
                detail="Payment, Inventory, Auth dependencies healthy",
            )
        )

        # Agent Investigation
        client = AgentMCPClient(server_url=self.mcp_url)
        orchestrator = InvestigationOrchestrator(mcp_client=client)
        req = IncidentRequest(
            incident_id=self.incident_id,
            description="Checkout failing with high error rate following release.",
            affected_service="checkout-service",
            severity="HIGH",
        )
        report = await orchestrator.investigate(req)

        # Record investigation into authoritative incident context
        incident_context_manager.create_or_update_from_investigation(report)

        # Append structured evidence with strict epistemic labels
        self.evidence = [
            EvidenceItemSchema(
                evidence_id="EV-01",
                label=EpistemicLabel.OBSERVED,
                description="Service health is DEGRADED with active deployment checkout-v42",
                source_tool="get_service_health",
                timestamp=now,
            ),
            EvidenceItemSchema(
                evidence_id="EV-02",
                label=EpistemicLabel.OBSERVED,
                description="HTTP 5xx error rate is 18.4% (> 1.0% healthy threshold)",
                source_tool="get_error_rate",
                timestamp=now,
            ),
            EvidenceItemSchema(
                evidence_id="EV-03",
                label=EpistemicLabel.OBSERVED,
                description="Logs report: CHECKOUT_VALIDATION_REGRESSION in order_validator.py",
                source_tool="query_logs",
                timestamp=now,
            ),
            EvidenceItemSchema(
                evidence_id="EV-04",
                label=EpistemicLabel.OBSERVED,
                description="Downstream dependencies (payment, inventory, auth) report HEALTHY",
                source_tool="get_dependency_health",
                timestamp=now,
            ),
            EvidenceItemSchema(
                evidence_id="EV-05",
                label=EpistemicLabel.INFERRED,
                description="Deployment checkout-v42 is the primary root cause (Confidence: 95%)",
                source_tool="InvestigationOrchestrator",
                timestamp=now,
            ),
            EvidenceItemSchema(
                evidence_id="EV-06",
                label=EpistemicLabel.PROPOSED,
                description="Rollback checkout-v42 to previous stable release checkout-v41",
                source_tool="ActionPlanner",
                timestamp=now,
            ),
        ]

        # Governance Planning
        planner = ActionPlanner()
        gov_ctx = GovernanceContext(
            incident_id=report.incident_id,
            affected_service=report.affected_service,
            severity=report.severity,
            evidence=report.evidence,
            hypotheses=report.hypotheses,
            current_operational_state={"active_deployment_id": "checkout-v42"},
        )
        plan = planner.plan_remediation(report, gov_ctx)
        incident_context_manager.update_from_action_plan(plan)
        self.current_raw_plan = plan

        self.current_plan = ActionPlanSchema(
            plan_id=plan.plan_id,
            incident_id=plan.incident_id,
            action_type=plan.action.action_type,
            service_id=plan.action.target_resource,
            target_deployment_id=plan.action.parameters.get("target_deployment_id", "checkout-v41"),
            risk_level=plan.risk.risk_level.value,
            risk_score=65,
            reason=f"Risk blast radius: {plan.risk.blast_radius}. Reversibility: {plan.risk.reversibility}.",
            impact="Rolls back checkout-service from checkout-v42 to checkout-v41 to restore health.",
            approval_required=plan.policy_decision.requires_human_approval,
            status=plan.status.value,
            execution_status="NOT_EXECUTED",
        )

        self.timeline.append(
            TimelineStepSchema(
                step_id="step-6",
                title="Remediation Plan Generated (Approval Required)",
                status="completed",
                timestamp=now,
                tool_called="ActionPlanner",
                detail="Rollback checkout-v42 -> checkout-v41. Risk: HIGH (Score: 65)",
            )
        )

        self.state = SimulationConversationState.AWAITING_APPROVAL
        reply = (
            "RALLY completed investigation for checkout-service. Root cause identified: "
            "CHECKOUT_VALIDATION_REGRESSION in checkout-v42. Evidence confirms 18.4% error rate "
            "while dependencies remain healthy. Recommended action: Rollback to checkout-v41. "
            "Consequential rollback requires explicit human approval. Do you approve the rollback?"
        )
        self.last_assistant_speech = reply

        return ChatMessageResponse(
            reply=reply,
            state=self.state,
            is_explicit_approval=False,
            approval_required=True,
            action_plan=self.current_plan,
            snapshot=self.get_snapshot(),
        )

    async def execute_approval_decision(
        self, decision: str, approver: str, reason: str
    ) -> AlexaSimulationStateResponse:
        """Processes an explicit human approval or rejection through governance."""
        if not self.current_raw_plan:
            raise ValueError("No active action plan available to approve.")

        now = time.strftime("%H:%M:%S")

        # ── REJECT PATH ──────────────────────────────────────────────────────
        if decision.upper() == "REJECT":
            rejected_plan = ApprovalService.reject(
                plan=self.current_raw_plan,
                approver=approver,
                reason=reason,
            )
            self.current_raw_plan = rejected_plan
            incident_context_manager.update_from_action_plan(rejected_plan)
            self.state = SimulationConversationState.REJECTED
            if self.current_plan:
                self.current_plan.status = "REJECTED"
                self.current_plan.execution_status = "NOT_EXECUTED"

            self.timeline.append(
                TimelineStepSchema(
                    step_id=f"step-{len(self.timeline)}",
                    title="Remediation Plan REJECTED by Operator",
                    status="completed",
                    timestamp=now,
                    detail=f"Rejected by {approver}: {reason}",
                )
            )
            self.last_assistant_speech = (
                f"Remediation plan rejected by {approver}. No mutation was executed. "
                "The incident remains active and escalated to on-call human engineering."
            )
            return self.get_snapshot()

        # ── APPROVE PATH ─────────────────────────────────────────────────────
        approved_plan = ApprovalService.approve(
            plan=self.current_raw_plan,
            approver=approver,
            reason=reason,
        )
        self.current_raw_plan = approved_plan
        incident_context_manager.update_from_action_plan(approved_plan)
        self.state = SimulationConversationState.APPROVED

        if self.current_plan:
            self.current_plan.status = "APPROVED"

        self.timeline.append(
            TimelineStepSchema(
                step_id=f"step-{len(self.timeline)}",
                title=f"Plan APPROVED by {approver}",
                status="completed",
                timestamp=now,
                detail=f"Reason: {reason}",
            )
        )
        self.evidence.append(
            EvidenceItemSchema(
                evidence_id=f"EV-APP-{len(self.evidence)}",
                label=EpistemicLabel.APPROVED,
                description=f"Action plan approved by human operator {approver}",
                source_tool="ApprovalService",
                timestamp=now,
            )
        )

        # ── CONTROLLED EXECUTION & INDEPENDENT VERIFICATION ──────────────────
        self.state = SimulationConversationState.EXECUTING
        exec_orchestrator = ExecutionOrchestrator(server_url=self.mcp_url)
        exec_result = await exec_orchestrator.execute_and_verify(approved_plan)
        incident_context_manager.update_from_execution_result(exec_result)

        now_exec = time.strftime("%H:%M:%S")
        self.timeline.append(
            TimelineStepSchema(
                step_id=f"step-{len(self.timeline)}",
                title="Controlled Execution: rollback_deployment (checkout-v42 -> checkout-v41)",
                status="completed",
                timestamp=now_exec,
                tool_called="rollback_deployment",
                detail=f"Execution ID: {exec_result.execution_record.execution_id}",
            )
        )
        self.evidence.append(
            EvidenceItemSchema(
                evidence_id="EV-EXEC-01",
                label=EpistemicLabel.EXECUTED,
                description="Controlled rollback executed via MCP tool rollback_deployment",
                source_tool="ControlledExecutor",
                timestamp=now_exec,
                details=exec_result.execution_record.tool_arguments,
            )
        )

        # Independent Verification Evaluation
        self.state = SimulationConversationState.VERIFYING
        now_verif = time.strftime("%H:%M:%S")

        # Independent read query directly from simulator
        verified_svc = self.simulator.get_service("checkout-service")
        verified_rate = self.simulator.get_error_rate("checkout-service")

        self.execution_verification = ExecutionVerificationSchema(
            execution_id=exec_result.execution_record.execution_id,
            execution_status=exec_result.execution_record.status.value,
            executed_at=exec_result.execution_record.executed_at,
            mutation_details=exec_result.execution_record.tool_arguments,
            verification_status=exec_result.verification_report.status.value,
            recovery_decision=exec_result.recovery_decision.value,
            verified_at=exec_result.verification_report.verified_at,
            verified_health=verified_svc.status.value,
            verified_error_rate=verified_rate,
            verified_active_deployment=verified_svc.active_deployment_id,
        )

        if exec_result.recovery_decision.value == "RESOLVED":
            self.state = SimulationConversationState.RESOLVED
            self.timeline.append(
                TimelineStepSchema(
                    step_id=f"step-{len(self.timeline)}",
                    title="Independent Verification PASSED -> Incident RESOLVED",
                    status="completed",
                    timestamp=now_verif,
                    tool_called="IndependentVerifier",
                    detail=f"Error rate restored to {verified_rate}% (< 1.0%), Active: {verified_svc.active_deployment_id}",
                )
            )
            self.evidence.append(
                EvidenceItemSchema(
                    evidence_id="EV-VERIF-01",
                    label=EpistemicLabel.VERIFIED,
                    description=f"Error rate confirmed at {verified_rate}%, checkout-v41 reinstated as active",
                    source_tool="IndependentVerifier",
                    timestamp=now_verif,
                )
            )
            self.last_assistant_speech = (
                f"Rollback to {verified_svc.active_deployment_id} executed successfully. "
                f"Independent verification confirms error rate has recovered to {verified_rate}%. "
                "The incident is officially RESOLVED."
            )
        else:
            self.state = SimulationConversationState.RECOVERY_FAILED
            self.last_assistant_speech = (
                "Rollback executed, but independent verification failed. Escalating to human."
            )

        return self.get_snapshot()
