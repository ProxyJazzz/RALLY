"""Golden scenario end-to-end integration test for RALLY Incident Simulator.

Validates the full deterministic operational lifecycle:
  1. Initialize simulator & verify healthy baseline across all services.
  2. Inject CHECKOUT_REGRESSION fault.
  3. Assert checkout-service degrades and checkout-v42 is active.
  4. Inspect telemetry (error rate rises to 18.4%, latency increases).
  5. Inspect structured logs (CHECKOUT_VALIDATION_REGRESSION in checkout-v42).
  6. Inspect deployment history & diff (v42 deployed with order_validator changes).
  7. Inspect dependencies (payment, inventory, auth remain healthy).
  8. Execute controlled rollback of checkout-v42.
  9. Assert checkout-v41 becomes active again.
 10. Assert complete recovery (error rate drops to 0.70%, health HEALTHY).
 11. Assert audit trail records full chain of events.
 12. Test clean simulator reset.
"""

from simulator import (
    DeploymentStatus,
    FaultType,
    IncidentSimulator,
    LogLevel,
    ServiceStatus,
    SimulationEventType,
)


def test_golden_incident_scenario():
    """End-to-end golden incident scenario: healthy -> fault -> correlate -> rollback -> verify -> reset."""

    # -------------------------------------------------------------------------
    # STEP 1: INITIALIZE & ASSERT HEALTHY BASELINE
    # -------------------------------------------------------------------------
    sim = IncidentSimulator()

    # All 4 services healthy
    for svc_id in ["checkout-service", "payment-service", "inventory-service", "auth-service"]:
        assert sim.get_service_health(svc_id) == ServiceStatus.HEALTHY

    checkout_init = sim.get_service("checkout-service")
    assert checkout_init.active_deployment_id == "checkout-v41"
    assert checkout_init.version == "4.1.0"
    assert checkout_init.status == ServiceStatus.HEALTHY

    # Telemetry healthy (<1% error rate, low latency)
    telem_init = sim.get_telemetry("checkout-service")
    assert telem_init.error_rate == 0.67
    assert telem_init.latency_ms == 85.0
    assert telem_init.availability_pct == 99.33

    # No active faults
    assert sim.get_active_faults() == []

    # -------------------------------------------------------------------------
    # STEP 2: INJECT CHECKOUT REGRESSION FAULT
    # -------------------------------------------------------------------------
    sim.inject_fault("CHECKOUT_REGRESSION")
    assert "CHECKOUT_REGRESSION" in sim.get_active_faults()

    # -------------------------------------------------------------------------
    # STEP 3: ASSERT DEGRADED CHECKOUT & V42 ACTIVE
    # -------------------------------------------------------------------------
    checkout_fault = sim.get_service("checkout-service")
    assert checkout_fault.active_deployment_id == "checkout-v42"
    assert checkout_fault.version == "4.2.0"
    assert checkout_fault.status == ServiceStatus.DEGRADED

    # -------------------------------------------------------------------------
    # STEP 4: INSPECT TELEMETRY
    # -------------------------------------------------------------------------
    telem_fault = sim.get_telemetry("checkout-service")
    assert telem_fault.deployment_id == "checkout-v42"
    assert telem_fault.request_count == 1000
    assert telem_fault.error_count == 184
    assert telem_fault.error_rate == 18.4  # Jumped from 0.67% to 18.4%
    assert telem_fault.latency_ms == 420.0  # Latency spiked to 420ms
    assert telem_fault.availability_pct == 81.6

    # -------------------------------------------------------------------------
    # STEP 5: INSPECT STRUCTURED LOGS
    # -------------------------------------------------------------------------
    logs = sim.query_logs("checkout-service", level="ERROR")
    assert len(logs) >= 3
    for entry in logs:
        assert entry.service_id == "checkout-service"
        assert entry.deployment_id == "checkout-v42"
        assert entry.level == LogLevel.ERROR
        assert entry.error_code == "CHECKOUT_VALIDATION_REGRESSION"
        assert "OrderValidationException" in entry.extra.get("exception", "")

    # -------------------------------------------------------------------------
    # STEP 6: INSPECT RECENT DEPLOYMENTS & CODE DIFF
    # -------------------------------------------------------------------------
    deploys = sim.get_recent_deployments("checkout-service")
    assert deploys[0].deployment_id == "checkout-v42"
    assert deploys[0].version == "4.2.0"
    assert deploys[1].deployment_id == "checkout-v41"

    diff = sim.get_deployment_diff("checkout-v42")
    assert diff.deployment_id == "checkout-v42"
    assert diff.previous_deployment_id == "checkout-v41"
    assert diff.risk_level == "HIGH"
    assert "apps/checkout/validation/order_validator.py" in diff.changed_files

    # -------------------------------------------------------------------------
    # STEP 7: INSPECT DEPENDENCIES (ELIMINATE SUSPECTS)
    # -------------------------------------------------------------------------
    deps = sim.get_dependency_health("checkout-service")
    assert len(deps) == 3
    for dep in deps:
        # Crucial for agent: downstream dependencies did NOT cause this incident
        assert dep.status == ServiceStatus.HEALTHY
        assert dep.error_rate < 0.5

    # -------------------------------------------------------------------------
    # STEP 8: CONSULT RUNBOOK
    # -------------------------------------------------------------------------
    runbook = sim.get_runbook("checkout-service")
    assert runbook.recovery_error_threshold_pct == 1.0
    assert "checkout-v41" in runbook.rollback_procedure

    # -------------------------------------------------------------------------
    # STEP 9: EXECUTE CONTROLLED ROLLBACK OF CHECKOUT-V42
    # -------------------------------------------------------------------------
    rolled_back = sim.rollback_deployment("checkout-v42")
    assert rolled_back.deployment_id == "checkout-v42"
    assert rolled_back.status == DeploymentStatus.ROLLED_BACK

    # -------------------------------------------------------------------------
    # STEP 10: ASSERT RECOVERY TO CHECKOUT-V41 AND HEALTHY METRICS
    # -------------------------------------------------------------------------
    checkout_recovered = sim.get_service("checkout-service")
    assert checkout_recovered.active_deployment_id == "checkout-v41"
    assert checkout_recovered.version == "4.1.0"
    assert checkout_recovered.status == ServiceStatus.HEALTHY

    telem_rec = sim.get_telemetry("checkout-service")
    assert telem_rec.deployment_id == "checkout-v41"
    assert telem_rec.error_rate == 0.70  # Dropped back below runbook threshold 1.0%
    assert telem_rec.latency_ms == 88.0
    assert telem_rec.availability_pct == 99.30

    rec_logs = sim.query_logs("checkout-service")
    assert any("Rollback completed" in l.message for l in rec_logs)
    assert any("0.70%" in l.message for l in rec_logs)

    # -------------------------------------------------------------------------
    # STEP 11: VERIFY AUDIT TRAIL
    # -------------------------------------------------------------------------
    events = sim.get_events()
    event_names = [e.event_type.value for e in events]
    assert "simulation_initialized" in event_names
    assert "deployment_activated" in event_names
    assert "fault_injected" in event_names
    assert "rollback_started" in event_names
    assert "rollback_completed" in event_names
    assert "service_health_changed" in event_names

    # -------------------------------------------------------------------------
    # STEP 12: RESET SIMULATOR
    # -------------------------------------------------------------------------
    sim.reset()
    assert sim.get_service_health("checkout-service") == ServiceStatus.HEALTHY
    assert sim.get_error_rate("checkout-service") == 0.67
    assert sim.get_active_faults() == []
