"""Unit tests for the RALLY Incident Simulator."""

import pytest

from simulator import (
    DeploymentNotFoundError,
    DeploymentStatus,
    FaultNotSupportedError,
    IncidentSimulator,
    InvalidIdentifierError,
    InvalidStateTransitionError,
    LogLevel,
    RollbackUnavailableError,
    ServiceNotFoundError,
    ServiceStatus,
    SimulationEventType,
)


@pytest.fixture
def sim() -> IncidentSimulator:
    return IncidentSimulator()


class TestSimulatorInitialState:
    """Verifies that simulator initializes deterministically into a healthy baseline state."""

    def test_all_services_begin_healthy(self, sim: IncidentSimulator):
        services = sim.list_services()
        assert len(services) == 4
        service_ids = {s.service_id for s in services}
        assert service_ids == {
            "checkout-service",
            "payment-service",
            "inventory-service",
            "auth-service",
        }
        for s in services:
            assert s.status == ServiceStatus.HEALTHY

    def test_checkout_v41_is_initially_active(self, sim: IncidentSimulator):
        checkout = sim.get_service("checkout-service")
        assert checkout.active_deployment_id == "checkout-v41"
        assert checkout.version == "4.1.0"
        assert checkout.status == ServiceStatus.HEALTHY

    def test_no_active_fault_initially(self, sim: IncidentSimulator):
        assert sim.get_active_faults() == []

    def test_baseline_error_rate_is_healthy(self, sim: IncidentSimulator):
        err_rate = sim.get_error_rate("checkout-service")
        assert err_rate < 1.0  # <1% healthy baseline
        assert err_rate == 0.67

    def test_baseline_telemetry_fields(self, sim: IncidentSimulator):
        telem = sim.get_telemetry("checkout-service")
        assert telem.service_id == "checkout-service"
        assert telem.deployment_id == "checkout-v41"
        assert telem.request_count == 1200
        assert telem.error_count == 8
        assert telem.availability_pct > 99.0
        assert telem.latency_ms == 85.0

    def test_baseline_logs_are_normal(self, sim: IncidentSimulator):
        logs = sim.query_logs("checkout-service")
        assert len(logs) > 0
        for entry in logs:
            assert entry.level != LogLevel.ERROR

    def test_dependency_health_all_healthy(self, sim: IncidentSimulator):
        deps = sim.get_dependency_health("checkout-service")
        assert len(deps) == 3
        dep_names = {d.dependency_service_id for d in deps}
        assert dep_names == {"payment-service", "inventory-service", "auth-service"}
        for d in deps:
            assert d.status == ServiceStatus.HEALTHY
            assert d.error_rate < 1.0

    def test_deployment_history_initially(self, sim: IncidentSimulator):
        deploys = sim.get_recent_deployments("checkout-service")
        assert len(deploys) == 2
        assert deploys[0].deployment_id == "checkout-v41"
        assert deploys[1].deployment_id == "checkout-v40"

    def test_runbook_available(self, sim: IncidentSimulator):
        runbook = sim.get_runbook("checkout-service")
        assert runbook.service_id == "checkout-service"
        assert "Rollback" in runbook.rollback_procedure
        assert runbook.recovery_error_threshold_pct == 1.0


class TestSimulatorFaultInjection:
    """Verifies deterministic fault injection and degradation behavior."""

    def test_inject_checkout_regression_activates_v42(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        checkout = sim.get_service("checkout-service")
        assert checkout.active_deployment_id == "checkout-v42"
        assert checkout.status == ServiceStatus.DEGRADED
        assert "CHECKOUT_REGRESSION" in sim.get_active_faults()

    def test_checkout_error_rate_increases(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        err_rate = sim.get_error_rate("checkout-service")
        assert err_rate == 18.4  # deterministic 18.4%
        assert err_rate >= 15.0

    def test_telemetry_reflects_failure(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        telem = sim.get_telemetry("checkout-service")
        assert telem.request_count == 1000
        assert telem.error_count == 184
        assert telem.latency_ms == 420.0
        assert telem.availability_pct == 81.6

    def test_logs_contain_regression_evidence(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        logs = sim.query_logs("checkout-service")
        error_logs = [l for l in logs if l.level == LogLevel.ERROR]
        assert len(error_logs) >= 3
        for el in error_logs:
            assert el.deployment_id == "checkout-v42"
            assert el.error_code == "CHECKOUT_VALIDATION_REGRESSION"
            assert "validation" in el.message.lower()

    def test_dependencies_remain_healthy_during_fault(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        deps = sim.get_dependency_health("checkout-service")
        for d in deps:
            assert d.status == ServiceStatus.HEALTHY
            assert d.error_rate < 1.0
        # Specifically confirm payment-service, inventory-service, auth-service
        assert sim.get_service_health("payment-service") == ServiceStatus.HEALTHY
        assert sim.get_service_health("inventory-service") == ServiceStatus.HEALTHY
        assert sim.get_service_health("auth-service") == ServiceStatus.HEALTHY

    def test_deployment_history_contains_checkout_v42(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        deploys = sim.get_recent_deployments("checkout-service")
        assert deploys[0].deployment_id == "checkout-v42"
        assert deploys[0].status == DeploymentStatus.SUCCESSFUL

    def test_deployment_diff_accessible(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        diff = sim.get_deployment_diff("checkout-v42")
        assert diff.deployment_id == "checkout-v42"
        assert diff.previous_deployment_id == "checkout-v41"
        assert diff.risk_level == "HIGH"
        assert any("order_validator.py" in f for f in diff.changed_files)


class TestSimulatorRollbackAndRecovery:
    """Verifies rollback execution and deterministic recovery."""

    def test_rollback_checkout_v42(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        rolled_back = sim.rollback_deployment("checkout-v42")
        assert rolled_back.deployment_id == "checkout-v42"
        assert rolled_back.status == DeploymentStatus.ROLLED_BACK

        checkout = sim.get_service("checkout-service")
        assert checkout.active_deployment_id == "checkout-v41"
        assert checkout.status == ServiceStatus.HEALTHY

    def test_recovery_telemetry_is_deterministic(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        sim.rollback_deployment("checkout-v42")

        telem = sim.get_telemetry("checkout-service")
        assert telem.deployment_id == "checkout-v41"
        assert telem.error_rate == 0.70
        assert telem.latency_ms == 88.0
        assert telem.availability_pct == 99.30
        assert telem.error_rate < 1.0  # Back under runbook threshold

    def test_recovery_logs_show_successful_transition(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        sim.rollback_deployment("checkout-v42")

        logs = sim.query_logs("checkout-service")
        messages = " ".join(l.message for l in logs)
        assert "Rollback completed" in messages
        assert "checkout-v41 reinstated" in messages


class TestSimulatorReset:
    """Verifies that reset() completely restores baseline state."""

    def test_reset_restores_original_healthy_state(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        sim.rollback_deployment("checkout-v42")
        sim.reset()

        assert sim.get_active_faults() == []
        checkout = sim.get_service("checkout-service")
        assert checkout.active_deployment_id == "checkout-v41"
        assert checkout.status == ServiceStatus.HEALTHY
        assert sim.get_error_rate("checkout-service") == 0.67

        deploys = sim.get_recent_deployments("checkout-service")
        assert len(deploys) == 2
        assert deploys[0].deployment_id == "checkout-v41"


class TestSimulatorSecurityAndErrorHandling:
    """Verifies input validation, boundary checking, and typed exceptions."""

    def test_service_not_found_raises_typed_error(self, sim: IncidentSimulator):
        with pytest.raises(ServiceNotFoundError) as exc_info:
            sim.get_service("non-existent-service")
        assert exc_info.value.service_id == "non-existent-service"

    def test_deployment_not_found_raises_typed_error(self, sim: IncidentSimulator):
        with pytest.raises(DeploymentNotFoundError) as exc_info:
            sim.get_deployment("checkout-v999")
        assert exc_info.value.deployment_id == "checkout-v999"

    def test_unsupported_fault_raises_typed_error(self, sim: IncidentSimulator):
        with pytest.raises(FaultNotSupportedError) as exc_info:
            sim.inject_fault("RANDOM_CHAOS_ATTACK")
        assert "RANDOM_CHAOS_ATTACK" in str(exc_info.value)

    def test_rollback_inactive_deployment_raises_error(self, sim: IncidentSimulator):
        # Cannot rollback checkout-v42 if it is not active
        with pytest.raises((RollbackUnavailableError, InvalidStateTransitionError)):
            sim.rollback_deployment("checkout-v41")

    def test_malformed_identifier_rejected(self, sim: IncidentSimulator):
        malicious_inputs = [
            "checkout; rm -rf /",
            "service && whoami",
            "../../../etc/passwd",
            "<script>alert(1)</script>",
            "",
            "   ",
        ]
        for bad_id in malicious_inputs:
            with pytest.raises(InvalidIdentifierError):
                sim.get_service(bad_id)

    def test_audit_events_recorded(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        sim.rollback_deployment("checkout-v42")
        events = sim.get_events()
        event_types = [e.event_type for e in events]

        assert SimulationEventType.SIMULATION_INITIALIZED in event_types
        assert SimulationEventType.FAULT_INJECTED in event_types
        assert SimulationEventType.DEPLOYMENT_ACTIVATED in event_types
        assert SimulationEventType.ROLLBACK_STARTED in event_types
        assert SimulationEventType.ROLLBACK_COMPLETED in event_types
        assert SimulationEventType.SERVICE_HEALTH_CHANGED in event_types
