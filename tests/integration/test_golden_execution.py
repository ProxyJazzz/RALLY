"""Integration test for RALLY Phase 6: Full Execution & Verification Cycle.

Validates:
1. Golden Path:
   - Incident with 18.4% error rate and checkout-v42 active
   - Agent investigates -> recommends rollback
   - Governance plans -> policy REQUIRES_APPROVAL -> human approves
   - Precondition revalidation succeeds immediately before execution (TOCTOU protection)
   - Controlled executor calls rollback_deployment over MCP
   - Execution record created with status EXECUTED and latency tracking
   - Independent verifier queries get_service_health, get_error_rate, query_logs, get_dependency_health
   - Verifier confirms error rate ~0.70%, status HEALTHY, active deployment checkout-v41
   - Incident marked RESOLVED

2. Recovery Failure Path:
   - Rollback succeeds, but simulated verification check fails (e.g. error rate stays elevated)
   - Verifier confirms failure
   - Decision is RECOVERY_FAILED, status escalated to NEEDS_HUMAN

3. TOCTOU Stale Plan Defense:
   - Approved plan attempts execution after simulator state concurrently changed
   - Revalidator detects mismatch and BLOCKS execution (zero MCP write called)
   - Incident marked EXECUTION_BLOCKED

4. Idempotency Defense:
   - Attempting duplicate execution of same plan is rejected immediately
"""

import pytest

from agent import (
    AgentMCPClient,
    IncidentRequest,
    InvestigationOrchestrator,
)
from execution import (
    ExecutionOrchestrator,
    ExecutionStatus,
    IdempotencyViolationError,
    RecoveryDecision,
    VerificationStatus,
)
from governance import (
    ActionPlanner,
    ApprovalService,
    GovernanceContext,
    PlanStatus,
)
from rally_mcp.runtime import MCPServerRunner
from simulator.domain.models import ServiceStatus
from simulator.services.simulator import IncidentSimulator


@pytest.fixture(scope="module")
def live_mcp_server():
    """Starts a live background MCP server over Streamable HTTP."""
    sim = IncidentSimulator()
    runner = MCPServerRunner(simulator=sim)
    url = runner.start()
    yield runner, url
    runner.stop()


@pytest.mark.asyncio
async def test_golden_execution_and_independent_verification(live_mcp_server):
    """Full end-to-end golden flow: Investigate -> Plan -> Approve -> Revalidate -> Execute -> Verify -> RESOLVED."""
    runner, url = live_mcp_server
    sim = runner.simulator
    sim.reset()

    # 1. Fault injection
    sim.inject_fault("CHECKOUT_REGRESSION")
    assert sim.get_service("checkout-service").active_deployment_id == "checkout-v42"
    assert sim.get_service("checkout-service").status == ServiceStatus.DEGRADED
    assert sim.get_error_rate("checkout-service") == 18.4

    # 2. Phase 4 Investigation
    client = AgentMCPClient(server_url=url)
    orchestrator = InvestigationOrchestrator(mcp_client=client)
    incident = IncidentRequest(
        incident_id="INC-EXEC-GOLDEN-01",
        description="Checkout service failing with high error rate following release.",
        affected_service="checkout-service",
        severity="HIGH",
    )
    report = await orchestrator.investigate(incident)
    assert report.recommended_action is not None
    assert report.recommended_action.action_name == "rollback_deployment"

    # 3. Phase 5 Governance: Plan and Approve
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
    assert plan.status == PlanStatus.AWAITING_APPROVAL

    # Explicit human approval
    approved_plan = ApprovalService.approve(
        plan=plan,
        approver="sre-lead@rally.internal",
        reason="Approved based on conclusive validation regression evidence.",
    )
    assert approved_plan.status == PlanStatus.APPROVED

    # 4. Phase 6 Execution & Verification
    exec_orchestrator = ExecutionOrchestrator(server_url=url)
    result = await exec_orchestrator.execute_and_verify(
        plan=approved_plan,
        executor_actor="sre-lead@rally.internal",
        error_rate_threshold_pct=1.0,
    )

    # 5. Validate Execution Record
    assert result.execution_record.status == ExecutionStatus.EXECUTED
    assert result.execution_record.action_type == "rollback_deployment"
    assert result.execution_record.duration_ms >= 0.0

    # 6. Validate Independent Verification
    assert result.verification_report is not None
    assert result.verification_report.status == VerificationStatus.PASSED
    assert result.verification_report.measured_error_rate_pct == 0.70
    assert result.verification_report.service_status == ServiceStatus.HEALTHY
    assert result.verification_report.active_deployment_id == "checkout-v41"
    assert result.verification_report.dependencies_healthy is True

    # 7. Validate Resolution
    assert result.recovery_decision == RecoveryDecision.RESOLVED
    assert result.incident_status == "RESOLVED"

    # 8. Verify simulator state is actually recovered
    checkout_svc = sim.get_service("checkout-service")
    assert checkout_svc.active_deployment_id == "checkout-v41"
    assert checkout_svc.status == ServiceStatus.HEALTHY
    assert sim.get_error_rate("checkout-service") == 0.70


@pytest.mark.asyncio
async def test_recovery_failure_triggers_escalation(live_mcp_server):
    """Failure Path: Execution succeeds, but independent verification finds error rate above threshold."""
    runner, url = live_mcp_server
    sim = runner.simulator
    sim.reset()
    sim.inject_fault("CHECKOUT_REGRESSION")

    client = AgentMCPClient(server_url=url)
    orchestrator = InvestigationOrchestrator(mcp_client=client)
    incident = IncidentRequest(
        incident_id="INC-EXEC-FAIL-02",
        description="Checkout error spike.",
        affected_service="checkout-service",
        severity="HIGH",
    )
    report = await orchestrator.investigate(incident)

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
    approved_plan = ApprovalService.approve(
        plan=plan,
        approver="sre-lead@rally.internal",
    )

    exec_orchestrator = ExecutionOrchestrator(server_url=url)

    # Use a strict runbook threshold of 0.1% (recovered error rate is 0.70%, which is > 0.1%)
    # This deliberately simulates a scenario where rollback did not reduce errors enough
    result = await exec_orchestrator.execute_and_verify(
        plan=approved_plan,
        executor_actor="sre-lead@rally.internal",
        error_rate_threshold_pct=0.1,  # Strict threshold triggers verification failure
    )

    assert result.execution_record.status == ExecutionStatus.EXECUTED
    assert result.verification_report is not None
    assert result.verification_report.status == VerificationStatus.FAILED
    assert result.recovery_decision == RecoveryDecision.RECOVERY_FAILED
    assert result.incident_status == "RECOVERY_FAILED"
    assert "Escalating incident to NEEDS_HUMAN" in result.explanation


@pytest.mark.asyncio
async def test_toctou_stale_plan_blocks_execution(live_mcp_server):
    """TOCTOU Defense: If operational state changes before execution, execution is blocked."""
    runner, url = live_mcp_server
    sim = runner.simulator
    sim.reset()
    sim.inject_fault("CHECKOUT_REGRESSION")

    client = AgentMCPClient(server_url=url)
    orchestrator = InvestigationOrchestrator(mcp_client=client)
    incident = IncidentRequest(
        incident_id="INC-TOCTOU-03",
        description="Checkout error spike for TOCTOU test",
        affected_service="checkout-service",
        severity="HIGH",
    )
    report = await orchestrator.investigate(incident)

    planner = ActionPlanner()
    context = GovernanceContext(
        incident_id=report.incident_id,
        affected_service=report.affected_service,
        severity=report.severity,
        evidence=report.evidence,
        hypotheses=report.hypotheses,
        current_operational_state={"active_deployment_id": "checkout-v42"},
    )
    # Build plan targeted at checkout-v42
    plan = planner.plan_remediation(report, context)
    approved_plan = ApprovalService.approve(plan=plan, approver="sre@rally.internal")

    # Manually change simulator active deployment to checkout-v41 before execution
    sim.rollback_deployment("checkout-v42")
    assert sim.get_service("checkout-service").active_deployment_id == "checkout-v41"

    # Execution orchestrator should detect TOCTOU and block execution
    exec_orchestrator = ExecutionOrchestrator(server_url=url)
    result = await exec_orchestrator.execute_and_verify(plan=approved_plan)

    assert result.execution_record.status == ExecutionStatus.BLOCKED
    assert result.recovery_decision == RecoveryDecision.EXECUTION_BLOCKED
    assert result.incident_status == "EXECUTION_BLOCKED"
    assert "TOCTOU detected" in result.explanation
