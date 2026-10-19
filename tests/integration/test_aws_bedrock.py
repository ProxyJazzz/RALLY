"""Integration tests for RALLY Phase 7: AWS Bedrock & Strands Integration.

Validates:
1. Strands Agent coordinating investigation with mock Bedrock client over real MCP protocol
2. Governance Boundary Preservation: Bedrock recommendations strictly transition through
   Phase 5 PolicyEngine (REQUIRES_APPROVAL) and human approval without bypass
3. Provider Provenance Tracking: reasoning_provider is recorded as 'bedrock' or 'strands-bedrock'
4. Opt-in Live Bedrock Test (gated by RUN_AWS_INTEGRATION_TESTS=true)
"""

import json
import os
from unittest.mock import MagicMock
import pytest

from agent import (
    AgentMCPClient,
    IncidentRequest,
    InvestigationOrchestrator,
)
from aws import (
    BedrockInvestigationProvider,
    StrandsInvestigationAgent,
)
from governance import (
    ActionPlanner,
    ApprovalService,
    GovernanceContext,
    PlanStatus,
    PolicyDecisionType,
    RiskLevel,
)
from rally_mcp.runtime import MCPServerRunner
from simulator.domain.models import ServiceStatus
from simulator.services.simulator import IncidentSimulator


def create_mock_bedrock_response(text_payload: str) -> dict:
    return {
        "output": {
            "message": {
                "role": "assistant",
                "content": [{"text": text_payload}],
            }
        },
        "stopReason": "end_turn",
        "usage": {"inputTokens": 150, "outputTokens": 100, "totalTokens": 250},
    }


@pytest.fixture(scope="module")
def live_mcp_server():
    """Starts a live background MCP server over Streamable HTTP."""
    sim = IncidentSimulator()
    runner = MCPServerRunner(simulator=sim)
    url = runner.start()
    yield runner, url
    runner.stop()


@pytest.mark.asyncio
async def test_strands_bedrock_investigation_and_governance_flow(live_mcp_server):
    """End-to-end integration: Strands Agent coordinates investigation through MCP and Bedrock, then halts at governance."""
    runner, url = live_mcp_server
    sim = runner.simulator
    sim.reset()
    sim.inject_fault("CHECKOUT_REGRESSION")

    client = AgentMCPClient(server_url=url)

    # Mock Bedrock Runtime client to simulate valid Claude 3.5 Sonnet response
    mock_bedrock = MagicMock()

    def mock_converse(*args, **kwargs):
        # Return structured reasoning with valid evidence references
        valid_response = {
            "summary": "Correlated validation error logs with recent release checkout-v42",
            "hypotheses": [
                {
                    "hypothesis_id": "HYP-01",
                    "title": "Release checkout-v42 Order Validation Regression",
                    "description": "Validation schema refactor in v42 triggered high checkout error rates",
                    "supporting_evidence_ids": ["EV-001", "EV-002"],
                    "contradicting_evidence_ids": [],
                    "confidence": "HIGH",
                    "status": "SUPPORTED",
                    "rationale": "High error rate and error logs correlate with deployment diff",
                }
            ],
            "primary_hypothesis_id": "HYP-01",
            "recommendation": {
                "action_name": "rollback_deployment",
                "target_service": "checkout-service",
                "parameters": {"deployment_id": "checkout-v42", "target_version": "checkout-v41"},
                "justification": "Runbook dictates rolling back to checkout-v41 to restore health",
            },
            "confidence": "HIGH",
        }
        return create_mock_bedrock_response(json.dumps(valid_response))

    mock_bedrock.converse.side_effect = mock_converse

    # Initialize Strands Agent backed by Bedrock Provider
    bedrock_provider = BedrockInvestigationProvider(
        model_id="anthropic.claude-3-5-sonnet-20241022-v2:0",
        region_name="us-east-1",
        bedrock_client=mock_bedrock,
    )
    strands_agent = StrandsInvestigationAgent(mcp_client=client, bedrock_provider=bedrock_provider)

    orchestrator = InvestigationOrchestrator(mcp_client=client, provider=strands_agent)

    incident = IncidentRequest(
        incident_id="INC-STRANDS-GOLDEN-01",
        description="Checkout error rate spike following deployment checkout-v42.",
        affected_service="checkout-service",
        severity="HIGH",
    )

    # 1. Execute investigation via Strands agent over real MCP protocol
    report = await orchestrator.investigate(incident)

    assert report.reasoning_provider == "strands-bedrock"
    assert report.primary_hypothesis is not None
    assert report.primary_hypothesis.title == "Release checkout-v42 Order Validation Regression"
    assert report.recommended_action is not None
    assert report.recommended_action.action_name == "rollback_deployment"
    assert report.execution_status == "NOT_EXECUTED"

    # 2. Transition Bedrock recommendation to Phase 5 Governance
    planner = ActionPlanner()
    context = GovernanceContext(
        incident_id=report.incident_id,
        affected_service=report.affected_service,
        severity=report.severity,
        evidence=report.evidence,
        hypotheses=report.hypotheses,
        current_operational_state={"active_deployment_id": "checkout-v42"},
    )
    plan = planner.plan_remediation(report, context)

    # 3. Verify Deterministic Governance Boundary
    assert plan.risk.risk_level == RiskLevel.HIGH
    assert plan.policy_decision.decision == PolicyDecisionType.REQUIRES_APPROVAL
    assert plan.policy_decision.requires_human_approval is True
    assert plan.status == PlanStatus.AWAITING_APPROVAL

    # 4. Human Approval
    approved_plan = ApprovalService.approve(
        plan=plan,
        approver="sre-lead@rally.internal",
        reason="Approved after reviewing Bedrock-correlated evidence diff and runbook.",
    )
    assert approved_plan.status == PlanStatus.APPROVED
    assert approved_plan.execution_status == "NOT_EXECUTED"

    # 5. Verify NO autonomous execution occurred in simulator
    checkout_svc = sim.get_service("checkout-service")
    assert checkout_svc.active_deployment_id == "checkout-v42"
    assert checkout_svc.status == ServiceStatus.DEGRADED
    assert sim.get_error_rate("checkout-service") == 18.4


@pytest.mark.skipif(
    os.environ.get("RUN_AWS_INTEGRATION_TESTS", "").lower() not in {"1", "true", "yes"},
    reason="Live AWS tests are opt-in via RUN_AWS_INTEGRATION_TESTS=true",
)
@pytest.mark.asyncio
async def test_live_bedrock_integration(live_mcp_server):
    """Opt-in live Amazon Bedrock API integration test.

    Requires valid AWS credentials and Bedrock model access in the target region.
    """
    runner, url = live_mcp_server
    client = AgentMCPClient(server_url=url)
    model_id = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")
    region = os.environ.get("AWS_REGION", "us-east-1")

    bedrock_provider = BedrockInvestigationProvider(
        model_id=model_id,
        region_name=region,
    )
    strands_agent = StrandsInvestigationAgent(mcp_client=client, bedrock_provider=bedrock_provider)
    orchestrator = InvestigationOrchestrator(mcp_client=client, provider=strands_agent)

    incident = IncidentRequest(
        incident_id="INC-LIVE-BEDROCK",
        description="Checkout service failing with 5xx errors after release checkout-v42.",
        affected_service="checkout-service",
        severity="HIGH",
    )

    report = await orchestrator.investigate(incident)
    assert report.reasoning_provider == "strands-bedrock"
    assert report.primary_hypothesis is not None
    assert report.recommended_action is not None
    assert report.execution_status == "NOT_EXECUTED"
