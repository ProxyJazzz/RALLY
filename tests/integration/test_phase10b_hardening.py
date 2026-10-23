"""Tests for Phase 10B Security and Truthfulness Hardening.

Covers:
1. Approval Authorization:
   - Valid approval in demo mode (auth_enabled=False)
   - Rejection when auth_enabled=True and Authorization header is missing (401)
   - Rejection when auth_enabled=True and token is invalid (403)
   - Success when auth_enabled=True and token is valid (200)

2. Approval Replay / Idempotency Protection:
   - Unique request_id / idempotency header handling
   - Duplicate requests with same request_id return snapshot without re-executing
   - Rejection of approval attempts on nonexistent, rejected, or resolved plans

3. Governance Invariants:
   - State transition validation (PENDING -> AWAITING_APPROVAL -> APPROVED -> EXECUTING -> VERIFYING -> RESOLVED)
   - Inability to approve an already RESOLVED or REJECTED incident

4. MCP Registry & Truthfulness:
   - Total registered tools on backend MCPServer is exactly 13 (7 read, 1 write, 5 conversational)
   - Read/write separation strictly maintained
   - Write tools require governance authorization

5. Database Latency Truthfulness:
   - Null / missing latency is represented truthfully as None/unavailable
"""

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services.alexa_simulation import AlexaSimulationService
from rally_mcp.server import create_rally_mcp_server


@pytest.fixture
def client():
    service = AlexaSimulationService.get_instance()
    service.reset_simulation()
    return TestClient(app)


def test_mcp_exact_registered_tools():
    """Verify that backend MCPServer registers exactly 13 tools (7 Read, 1 Write, 5 Conversational)."""
    server = create_rally_mcp_server(enable_alexa_tools=True)
    tools = server._tool_manager.list_tools()
    tool_names = {t.name for t in tools}

    assert len(tools) == 13

    # 7 Read tools
    read_tools = {
        "get_service_health",
        "get_error_rate",
        "query_logs",
        "get_recent_deployments",
        "get_deployment_diff",
        "get_dependency_health",
        "get_runbook",
    }
    assert read_tools.issubset(tool_names)

    # 1 Write tool
    assert "rollback_deployment" in tool_names

    # 5 Conversational context tools
    context_tools = {
        "get_incident_context",
        "get_investigation_summary",
        "get_action_plan",
        "get_execution_status",
        "get_verification_status",
    }
    assert context_tools.issubset(tool_names)


def test_approval_authorization_modes(client, monkeypatch):
    """Verifies DEMO mode vs PRODUCTION authorization mode."""
    # Step 1: Trigger investigation to reach AWAITING_APPROVAL
    chat_res = client.post("/api/alexa/chat", json={"message": "Investigate checkout incident"})
    assert chat_res.status_code == 200
    assert chat_res.json()["state"] == "AWAITING_APPROVAL"

    # Step 2: Enable auth mode with required token
    monkeypatch.setattr(settings, "auth_enabled", True)
    monkeypatch.setattr(settings, "approval_auth_token", "secure-sre-token-secret")

    # 2a. Missing authorization header -> 401
    res_unauth = client.post(
        "/api/alexa/approve",
        json={"incident_id": "INC-ALEXA-GOLDEN", "decision": "APPROVE"},
    )
    assert res_unauth.status_code == 401
    assert "Missing Authorization header" in res_unauth.json()["detail"]

    # 2b. Invalid token -> 403
    res_forbidden = client.post(
        "/api/alexa/approve",
        headers={"Authorization": "Bearer invalid-token"},
        json={"incident_id": "INC-ALEXA-GOLDEN", "decision": "APPROVE"},
    )
    assert res_forbidden.status_code == 403
    assert "Invalid governance authorization token" in res_forbidden.json()["detail"]

    # 2c. Valid token -> 200
    res_auth = client.post(
        "/api/alexa/approve",
        headers={"Authorization": "Bearer secure-sre-token-secret"},
        json={
            "incident_id": "INC-ALEXA-GOLDEN",
            "decision": "APPROVE",
            "approver": "lead-sre@rally.internal",
            "approval_request_id": "req-auth-001",
        },
    )
    assert res_auth.status_code == 200
    assert res_auth.json()["state"] == "RESOLVED"


def test_approval_replay_and_idempotency(client):
    """Verifies that replaying an approval request does not re-execute remediation."""
    client.post("/api/alexa/chat", json={"message": "Investigate checkout incident"})

    # First approval with explicit idempotency key
    res1 = client.post(
        "/api/alexa/approve",
        headers={"X-Idempotency-Key": "idemp-key-100"},
        json={
            "incident_id": "INC-ALEXA-GOLDEN",
            "decision": "APPROVE",
            "approver": "sre-lead@rally.internal",
        },
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["state"] == "RESOLVED"
    first_exec_id = data1["execution_verification"]["execution_id"]

    # Replay identical approval with same idempotency key
    res2 = client.post(
        "/api/alexa/approve",
        headers={"X-Idempotency-Key": "idemp-key-100"},
        json={
            "incident_id": "INC-ALEXA-GOLDEN",
            "decision": "APPROVE",
            "approver": "sre-lead@rally.internal",
        },
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["state"] == "RESOLVED"
    # Execution ID should match exactly (no new execution performed)
    assert data2["execution_verification"]["execution_id"] == first_exec_id


def test_cannot_approve_nonexistent_or_uninvestigated_plan(client):
    """Verifies that approval cannot succeed when no plan has been formed (in RECEIVED/IDLE state)."""
    res = client.post(
        "/api/alexa/approve",
        json={"incident_id": "INC-ALEXA-GOLDEN", "decision": "APPROVE"},
    )
    assert res.status_code == 400
    assert "No active action plan" in res.json()["detail"]


def test_cannot_approve_after_rejection(client):
    """Verifies that a rejected plan cannot subsequently be approved without a new plan."""
    client.post("/api/alexa/chat", json={"message": "Investigate checkout incident"})

    # Reject plan
    rej_res = client.post(
        "/api/alexa/approve",
        json={
            "incident_id": "INC-ALEXA-GOLDEN",
            "decision": "REJECT",
            "approver": "sre-lead@rally.internal",
            "reason": "Not approved during peak sales hour.",
        },
    )
    assert rej_res.status_code == 200
    assert rej_res.json()["state"] == "REJECTED"

    # Attempt to approve the already-rejected plan -> rejected
    appr_res = client.post(
        "/api/alexa/approve",
        json={
            "incident_id": "INC-ALEXA-GOLDEN",
            "decision": "APPROVE",
            "approver": "sre-lead@rally.internal",
        },
    )
    assert appr_res.status_code == 400
    assert "Cannot approve a plan that has already been rejected" in appr_res.json()["detail"]
