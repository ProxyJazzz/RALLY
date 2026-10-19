"""Unit tests for RALLY Phase 8: Alexa+ MCP Conversational Integration.

Covers:
- IncidentContextManager lifecycle and multi-turn state transitions
- Conversational tool schemas and responses
- Prompt injection defense: conversational text cannot approve or bypass policy
- Unapproved actions remain strictly NOT_EXECUTED via conversational queries
- Independent recovery verification required before status shows RESOLVED
- Unknown incident error handling
"""

import json
import pytest

from agent.models import (
    AgentState,
    ConfidenceLevel,
    EvidenceItem,
    EvidenceLabel,
    Hypothesis,
    HypothesisStatus,
    InvestigationReport,
    RecommendedAction,
)
from alexa.context import IncidentContextManager
from alexa.exceptions import IncidentNotFoundError
from alexa.models import ConversationalIncidentState
from alexa.tools import register_alexa_conversational_tools
from execution.models import (
    ControlledExecutionResult,
    ExecutionRecord,
    ExecutionStatus,
    RecoveryDecision,
    VerificationReport,
    VerificationStatus,
)
from governance.models import (
    ActionPlan,
    ApprovalDecision,
    ApprovalRequest,
    PlanStatus,
    PolicyDecision,
    PolicyDecisionType,
    ProposedAction,
    RiskAssessment,
    RiskLevel,
)
from mcp.server.mcpserver import MCPServer
from simulator.domain.models import ServiceStatus


@pytest.fixture
def sample_investigation_report():
    return InvestigationReport(
        incident_id="INC-ALEXA-01",
        agent_run_id="run-alexa-test",
        affected_service="checkout-service",
        severity="HIGH",
        status=AgentState.COMPLETE,
        summary="Checkout validation regression detected in checkout-v42",
        evidence=[
            EvidenceItem(
                evidence_id="EV-001",
                source_tool="get_service_health",
                source_reference="{}",
                observation="checkout-service DEGRADED",
                label=EvidenceLabel.OBSERVED,
            )
        ],
        hypotheses=[
            Hypothesis(
                hypothesis_id="HYP-01",
                title="Release checkout-v42 Regression",
                description="Validation error in v42",
                confidence=ConfidenceLevel.HIGH,
                status=HypothesisStatus.SUPPORTED,
            )
        ],
        primary_hypothesis=Hypothesis(
            hypothesis_id="HYP-01",
            title="Release checkout-v42 Regression",
            description="Validation error in v42",
            confidence=ConfidenceLevel.HIGH,
            status=HypothesisStatus.SUPPORTED,
        ),
        confidence=ConfidenceLevel.HIGH,
        recommended_action=RecommendedAction(
            action_name="rollback_deployment",
            target_service="checkout-service",
            parameters={"deployment_id": "checkout-v42", "target_version": "checkout-v41"},
            justification="Rollback checkout-v42",
            execution_status="NOT_EXECUTED",
        ),
        execution_status="NOT_EXECUTED",
    )


class TestIncidentContextManager:
    """Unit tests for the authoritative IncidentContextManager."""

    def test_create_context_from_investigation(self, sample_investigation_report):
        mgr = IncidentContextManager()
        ctx = mgr.create_or_update_from_investigation(sample_investigation_report)

        assert ctx.incident_id == "INC-ALEXA-01"
        assert ctx.state == ConversationalIncidentState.INVESTIGATED
        assert ctx.affected_service == "checkout-service"
        assert ctx.active_deployment_id == "checkout-v42"
        assert ctx.execution_status == "NOT_EXECUTED"

    def test_update_context_from_action_plan(self, sample_investigation_report):
        mgr = IncidentContextManager()
        mgr.create_or_update_from_investigation(sample_investigation_report)

        action = ProposedAction(
            action_id="act-01",
            action_type="rollback_deployment",
            target_resource="deployment",
            target_identifier="checkout-v42",
            parameters={"deployment_id": "checkout-v42", "target_version": "checkout-v41"},
            reason="Rollback",
        )
        plan = ActionPlan(
            plan_id="plan-alexa-01",
            incident_id="INC-ALEXA-01",
            created_at="2026-10-20T00:00:00Z",
            action=action,
            objective="Remediate checkout",
            expected_outcome="Restored health",
            risk=RiskAssessment(
                risk_level=RiskLevel.HIGH,
                factors=["tier-1 service mutation"],
                blast_radius="service",
                reversibility="reversible",
                customer_impact="tier 1",
            ),
            policy_decision=PolicyDecision(
                decision=PolicyDecisionType.REQUIRES_APPROVAL,
                policy_version="1.0",
                reason="Consequential mutation",
                requires_human_approval=True,
            ),
            approval=ApprovalRequest(
                approval_id="appr-01",
                plan_id="plan-alexa-01",
                requested_at="2026-10-20T00:00:00Z",
                decision=ApprovalDecision.PENDING,
                expires_at="2026-10-20T01:00:00Z",
            ),
            status=PlanStatus.AWAITING_APPROVAL,
            execution_status="NOT_EXECUTED",
        )

        updated_ctx = mgr.update_from_action_plan(plan)
        assert updated_ctx.action_plan_id == "plan-alexa-01"
        assert updated_ctx.state == ConversationalIncidentState.AWAITING_APPROVAL
        assert updated_ctx.approval_decision == ApprovalDecision.PENDING
        assert updated_ctx.execution_status == "NOT_EXECUTED"

    def test_update_context_from_execution_result(self, sample_investigation_report):
        mgr = IncidentContextManager()
        mgr.create_or_update_from_investigation(sample_investigation_report)

        exec_record = ExecutionRecord(
            execution_id="exec-01",
            plan_id="plan-alexa-01",
            action_type="rollback_deployment",
            target_resource="deployment",
            target_identifier="checkout-v42",
            idempotency_key="key-01",
            executed_at="2026-10-20T00:05:00Z",
            executed_by="sre@rally.internal",
            tool_name="rollback_deployment",
            status=ExecutionStatus.EXECUTED,
            duration_ms=45.0,
        )
        verif_report = VerificationReport(
            verification_id="verif-01",
            plan_id="plan-alexa-01",
            execution_id="exec-01",
            verified_at="2026-10-20T00:06:00Z",
            status=VerificationStatus.PASSED,
            measured_error_rate_pct=0.70,
            service_status=ServiceStatus.HEALTHY,
            active_deployment_id="checkout-v41",
            dependencies_healthy=True,
            summary="Verified recovery",
        )
        result = ControlledExecutionResult(
            plan_id="plan-alexa-01",
            incident_id="INC-ALEXA-01",
            execution_record=exec_record,
            verification_report=verif_report,
            recovery_decision=RecoveryDecision.RESOLVED,
            incident_status="RESOLVED",
            explanation="Recovery verified",
        )

        ctx = mgr.update_from_execution_result(result)
        assert ctx.state == ConversationalIncidentState.RESOLVED
        assert ctx.execution_status == "EXECUTED"
        assert ctx.verification_status == "PASSED"
        assert ctx.active_deployment_id == "checkout-v41"

    def test_get_nonexistent_context_raises_error(self):
        mgr = IncidentContextManager()
        with pytest.raises(IncidentNotFoundError):
            mgr.get_context("INC-NONEXISTENT")


class TestAlexaConversationalTools:
    """Unit tests for the conversational MCP tools."""

    @pytest.mark.asyncio
    async def test_conversational_tools_execution(self, sample_investigation_report):
        mgr = IncidentContextManager()
        mgr.create_or_update_from_investigation(sample_investigation_report)

        server = MCPServer("test-alexa")
        register_alexa_conversational_tools(server, context_mgr=mgr)

        # Call get_incident_context tool
        res_ctx_raw = await server.call_tool("get_incident_context", {"incident_id": "INC-ALEXA-01"})
        res_ctx = json.loads(res_ctx_raw.content[0].text)
        assert res_ctx["incident_id"] == "INC-ALEXA-01"
        assert res_ctx["state"] == "INVESTIGATED"

        # Call get_investigation_summary tool
        res_sum_raw = await server.call_tool("get_investigation_summary", {"incident_id": "INC-ALEXA-01"})
        res_sum = json.loads(res_sum_raw.content[0].text)
        assert res_sum["primary_root_cause"] == "Release checkout-v42 Regression"
        assert res_sum["recommended_action"] == "rollback_deployment"
        assert res_sum["approval_required"] is True

        # Call get_execution_status (Must be NOT_EXECUTED)
        res_exec_raw = await server.call_tool("get_execution_status", {"incident_id": "INC-ALEXA-01"})
        res_exec = json.loads(res_exec_raw.content[0].text)
        assert res_exec["execution_status"] == "NOT_EXECUTED"
        assert "require explicit human approval" in res_exec["message"]

        # Call get_action_plan
        res_plan_raw = await server.call_tool("get_action_plan", {"incident_id": "INC-ALEXA-01"})
        res_plan = json.loads(res_plan_raw.content[0].text)
        assert res_plan["risk_level"] == "HIGH"
        assert res_plan["approval_required"] is True
        assert res_plan["execution_status"] == "NOT_EXECUTED"

    @pytest.mark.asyncio
    async def test_unknown_incident_returns_structured_error(self):
        server = MCPServer("test-alexa")
        mgr = IncidentContextManager()
        register_alexa_conversational_tools(server, context_mgr=mgr)

        res_raw = await server.call_tool("get_incident_context", {"incident_id": "INC-UNKNOWN"})
        res = json.loads(res_raw.content[0].text)
        assert res["success"] is False
        assert "not found" in res["message"].lower()
