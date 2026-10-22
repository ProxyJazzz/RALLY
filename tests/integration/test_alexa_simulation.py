"""Tests for Phase 8B: Alexa+ Simulation API Endpoints and Golden Workflow.

Validates:
1. GET /api/alexa/state: Retrieves authoritative workspace snapshot.
2. POST /api/alexa/reset: Injects fault and sets incident to RECEIVED.
3. Conversational Investigation: User asks "Investigate the checkout incident" -> initiates agentic flow over MCP.
4. Epistemic Evidence Classification: Distinguishes OBSERVED, INFERRED, and PROPOSED.
5. Strict Approval Boundary:
   - "Should we roll it back?" -> Explains risk and approval requirement without executing.
   - Conversational approval utterance -> Directs operator to human approval gate.
   - Approval gate action required for rollback.
6. Execution and Independent Verification:
   - Approval granted -> Controlled execution runs -> Independent verification passes -> RESOLVED.
   - Rejection path -> REJECTED -> execution status remains NOT_EXECUTED.
7. Error states & Malformed queries.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.alexa_simulation import AlexaSimulationService


@pytest.fixture
def client():
    # Ensure fresh simulation service state before each test
    service = AlexaSimulationService.get_instance()
    service.reset_simulation()
    return TestClient(app)


def test_get_simulation_state(client):
    """Verifies that GET /api/alexa/state returns valid initial workspace state."""
    res = client.get("/api/alexa/state")
    assert res.status_code == 200
    data = res.json()
    assert data["incident_id"] == "INC-ALEXA-GOLDEN"
    assert data["service_id"] == "checkout-service"
    assert data["active_deployment"] == "checkout-v42"
    assert data["state"] == "RECEIVED"
    assert len(data["evidence"]) >= 2
    # Verify initial evidence items are strictly OBSERVED
    for ev in data["evidence"]:
        assert ev["label"] == "OBSERVED"


def test_reset_simulation_endpoint(client):
    """Verifies that POST /api/alexa/reset resets the simulator to fault condition."""
    res = client.post("/api/alexa/reset")
    assert res.status_code == 200
    data = res.json()
    assert data["active_deployment"] == "checkout-v42"
    assert data["state"] == "RECEIVED"


def test_conversational_investigation_and_approval_gate(client):
    """Golden path conversation leading up to human approval gate."""
    # 1. User says: "Investigate the checkout incident"
    chat_res = client.post(
        "/api/alexa/chat",
        json={"message": "Investigate the checkout incident and recover it if evidence supports rollback"},
    )
    assert chat_res.status_code == 200
    data = chat_res.json()

    assert data["state"] == "AWAITING_APPROVAL"
    assert data["approval_required"] is True
    assert "checkout-v41" in data["reply"]
    assert "explicit human approval" in data["reply"]

    # Verify action plan details
    plan = data["action_plan"]
    assert plan is not None
    assert plan["action_type"] == "rollback_deployment"
    assert plan["target_deployment_id"] == "checkout-v41"
    assert plan["risk_level"] == "HIGH"
    assert plan["execution_status"] == "NOT_EXECUTED"

    # Verify snapshot contains proper epistemic labels
    snapshot = data["snapshot"]
    labels = {e["label"] for e in snapshot["evidence"]}
    assert "OBSERVED" in labels
    assert "INFERRED" in labels
    assert "PROPOSED" in labels
    assert "EXECUTED" not in labels
    assert "VERIFIED" not in labels

    # Verify timeline progression
    assert len(snapshot["timeline"]) >= 6

    # 2. User asks: "What did you find?"
    chat_res2 = client.post("/api/alexa/chat", json={"message": "What did you find?"})
    assert chat_res2.status_code == 200
    assert "18.4%" in chat_res2.json()["reply"]
    assert "order_validator.py" in chat_res2.json()["reply"]

    # 3. User asks: "Should we roll it back?"
    chat_res3 = client.post("/api/alexa/chat", json={"message": "Should we roll it back?"})
    assert chat_res3.status_code == 200
    assert "HIGH risk" in chat_res3.json()["reply"]
    assert "strictly requires human SRE approval" in chat_res3.json()["reply"]

    # 4. User conversational approval attempt: "Yes, approve the rollback"
    chat_res4 = client.post("/api/alexa/chat", json={"message": "Yes, approve the rollback."})
    assert chat_res4.status_code == 200
    # Must NOT directly execute! Directs operator to human approval gate
    assert "Approval Gate" in chat_res4.json()["reply"]
    assert chat_res4.json()["snapshot"]["execution_verification"]["execution_status"] == "NOT_EXECUTED"


def test_rejection_path_blocks_execution(client):
    """Verifies that rejecting an approval blocks execution and preserves NOT_EXECUTED status."""
    # Trigger investigation
    client.post("/api/alexa/chat", json={"message": "Investigate checkout"})

    # Reject via governance portal
    appr_res = client.post(
        "/api/alexa/approve",
        json={
            "incident_id": "INC-ALEXA-GOLDEN",
            "decision": "REJECT",
            "approver": "sre-lead@rally.internal",
            "reason": "Wait for database team before modifying deployment",
        },
    )
    assert appr_res.status_code == 200
    data = appr_res.json()

    assert data["state"] == "REJECTED"
    assert data["action_plan"]["status"] == "REJECTED"
    assert data["action_plan"]["execution_status"] == "NOT_EXECUTED"
    assert data["execution_verification"]["execution_status"] == "NOT_EXECUTED"

    # Simulator remains untouched at checkout-v42
    assert data["active_deployment"] == "checkout-v42"


def test_golden_execution_and_independent_verification(client):
    """Complete golden flow through human approval, controlled execution, and independent verification."""
    # 1. Investigate
    client.post("/api/alexa/chat", json={"message": "Investigate checkout"})

    # 2. Operator grants explicit human approval
    appr_res = client.post(
        "/api/alexa/approve",
        json={
            "incident_id": "INC-ALEXA-GOLDEN",
            "decision": "APPROVE",
            "approver": "sre-lead@rally.internal",
            "reason": "Authorized after reviewing diff and runbook.",
        },
    )
    assert appr_res.status_code == 200
    data = appr_res.json()

    # 3. Controlled execution & independent verification result
    assert data["state"] == "RESOLVED"
    assert data["active_deployment"] == "checkout-v41"

    exec_verif = data["execution_verification"]
    assert exec_verif["execution_status"] == "EXECUTED"
    assert exec_verif["verification_status"] == "PASSED"
    assert exec_verif["recovery_decision"] == "RESOLVED"
    assert exec_verif["verified_error_rate"] == 0.70
    assert exec_verif["verified_active_deployment"] == "checkout-v41"

    # Evidence ledger now includes EXECUTED and VERIFIED
    labels = {e["label"] for e in data["evidence"]}
    assert "APPROVED" in labels
    assert "EXECUTED" in labels
    assert "VERIFIED" in labels

    # 4. User asks: "Is the service healthy now?"
    chat_verif = client.post("/api/alexa/chat", json={"message": "Is the service healthy now?"})
    assert chat_verif.status_code == 200
    assert "independently verified" in chat_verif.json()["reply"]
    assert "0.7%" in chat_verif.json()["reply"]
    assert "checkout-v41" in chat_verif.json()["reply"]
    assert "RESOLVED" in chat_verif.json()["reply"]


def test_reset_clears_all_execution_and_verification_state(client):
    """Verifies that Reset Fault clears all post-execution values and resets to NOT_EXECUTED / PENDING."""
    # 1. Complete execution & verification
    client.post("/api/alexa/chat", json={"message": "Investigate checkout"})
    client.post(
        "/api/alexa/approve",
        json={
            "incident_id": "INC-ALEXA-GOLDEN",
            "decision": "APPROVE",
            "approver": "sre-lead@rally.internal",
            "reason": "Authorized rollback.",
        },
    )

    # 2. Reset
    reset_res = client.post("/api/alexa/reset")
    assert reset_res.status_code == 200
    data = reset_res.json()

    assert data["state"] == "RECEIVED"
    assert data["action_plan"] is None
    ev = data["execution_verification"]
    assert ev["execution_id"] is None
    assert ev["execution_status"] == "NOT_EXECUTED"
    assert ev["verification_status"] == "PENDING"
    assert ev["recovery_decision"] is None
    assert ev["verified_error_rate"] is None
    assert ev["verified_active_deployment"] is None


def test_second_investigation_after_completed_run_has_no_stale_execution_data(client):
    """Verifies that running investigation after a reset or completed run yields AWAITING_APPROVAL with no stale execution data."""
    # Run 1: investigate and approve
    client.post("/api/alexa/chat", json={"message": "Investigate checkout"})
    client.post(
        "/api/alexa/approve",
        json={
            "incident_id": "INC-ALEXA-GOLDEN",
            "decision": "APPROVE",
            "approver": "sre-lead@rally.internal",
            "reason": "Authorized rollback.",
        },
    )

    # Reset fault
    client.post("/api/alexa/reset")

    # Run 2: Fresh investigation
    chat_res = client.post("/api/alexa/chat", json={"message": "Investigate the checkout incident"})
    assert chat_res.status_code == 200
    data = chat_res.json()

    assert data["state"] == "AWAITING_APPROVAL"
    snapshot = data["snapshot"]
    assert snapshot["state"] == "AWAITING_APPROVAL"

    ev = snapshot["execution_verification"]
    assert ev["execution_status"] == "NOT_EXECUTED"
    assert ev["verification_status"] == "PENDING"
    assert ev["recovery_decision"] is None
    assert ev["verified_error_rate"] is None
    assert ev["verified_active_deployment"] is None
    assert ev["execution_id"] is None
