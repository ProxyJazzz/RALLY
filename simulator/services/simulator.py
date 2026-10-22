"""Deterministic Incident Simulator Engine for RALLY.

This service is the core in-memory operational world model providing deterministic
state, telemetry, structured logs, deployment records, dependency trees, fault
injection, rollback capabilities, and structured event auditing.
"""

import re
from typing import Any

from simulator.domain.exceptions import (
    DeploymentNotFoundError,
    FaultNotSupportedError,
    InvalidIdentifierError,
    InvalidStateTransitionError,
    RollbackUnavailableError,
    ServiceNotFoundError,
)
from simulator.domain.models import (
    DependencyHealth,
    Deployment,
    DeploymentDiff,
    DeploymentStatus,
    FaultType,
    LogEntry,
    Runbook,
    Service,
    ServiceStatus,
    SimulationEvent,
    SimulationEventType,
    Telemetry,
)
from simulator.scenarios.golden import (
    DEPLOYMENT_CHECKOUT_V41,
    DEPLOYMENT_CHECKOUT_V42,
    SERVICE_AUTH,
    SERVICE_CHECKOUT,
    SERVICE_INVENTORY,
    SERVICE_PAYMENT,
    T_DEPLOY,
    T_FAULT,
    T_INIT,
    T_RECOVERED,
    T_ROLLBACK,
    get_baseline_logs,
    get_baseline_telemetry,
    get_dependencies,
    get_deployment_diffs,
    get_fault_logs,
    get_fault_telemetry,
    get_initial_deployments,
    get_initial_services,
    get_recovered_telemetry,
    get_recovery_logs,
    get_runbooks,
)

# Strict regex for service, deployment, and fault identifiers (safe security boundary)
IDENTIFIER_REGEX = re.compile(r"^[a-zA-Z0-9_\-]+$")


class IncidentSimulator:
    """Deterministic Incident Simulator for RALLY.

    Maintains in-memory services, deployment histories, telemetry, structured logs,
    and handles deterministic fault injection, rollback, and recovery.
    """

    def __init__(self) -> None:
        self.reset()

    def _validate_id(self, identifier: str, param_name: str = "identifier") -> str:
        """Validates that an identifier contains only alphanumeric characters, dashes, and underscores."""
        if not identifier or not isinstance(identifier, str):
            raise InvalidIdentifierError(str(identifier), f"{param_name} must be a non-empty string")
        if not IDENTIFIER_REGEX.match(identifier):
            raise InvalidIdentifierError(identifier, f"{param_name} contains disallowed characters")
        return identifier

    def _record_event(self, event_type: SimulationEventType, timestamp: str, details: dict[str, Any]) -> None:
        """Records an immutable audit event."""
        event = SimulationEvent(
            timestamp=timestamp,
            event_type=event_type,
            details=details,
        )
        self._events.append(event)

    def reset(self) -> None:
        """Resets the simulation to the initial, completely healthy baseline state."""
        self._services: dict[str, Service] = get_initial_services()
        self._deployments: dict[str, list[Deployment]] = get_initial_deployments()
        self._deployment_diffs: dict[str, DeploymentDiff] = get_deployment_diffs()
        self._dependencies: dict[str, list[str]] = get_dependencies()
        self._runbooks: dict[str, Runbook] = get_runbooks()
        self._active_faults: set[FaultType] = set()
        self._recovered: bool = False
        self._events: list[SimulationEvent] = []

        self._record_event(
            SimulationEventType.SIMULATION_INITIALIZED,
            T_INIT,
            {"status": "INITIALIZED", "active_services": list(self._services.keys())},
        )

    # --------------------------------------------------------------------------
    # Service and Dependency Queries
    # --------------------------------------------------------------------------

    def get_service(self, service_id: str) -> Service:
        """Returns the current state of a service."""
        clean_id = self._validate_id(service_id, "service_id")
        if clean_id not in self._services:
            raise ServiceNotFoundError(clean_id)
        return self._services[clean_id]

    def list_services(self) -> list[Service]:
        """Returns all services in the simulator."""
        return list(self._services.values())

    def get_service_health(self, service_id: str) -> ServiceStatus:
        """Returns the operational status of a service (HEALTHY, DEGRADED, FAILED)."""
        service = self.get_service(service_id)
        return service.status

    def get_dependencies(self, service_id: str) -> list[str]:
        """Returns the list of downstream service IDs that the given service depends on."""
        clean_id = self._validate_id(service_id, "service_id")
        if clean_id not in self._services:
            raise ServiceNotFoundError(clean_id)
        return list(self._dependencies.get(clean_id, []))

    def get_dependency_health(self, service_id: str) -> list[DependencyHealth]:
        """Returns the current health of all downstream dependencies for a service."""
        clean_id = self._validate_id(service_id, "service_id")
        if clean_id not in self._services:
            raise ServiceNotFoundError(clean_id)

        dep_ids = self._dependencies.get(clean_id, [])
        results: list[DependencyHealth] = []
        for dep_id in dep_ids:
            dep_svc = self._services[dep_id]
            dep_telem = self.get_telemetry(dep_id)
            results.append(
                DependencyHealth(
                    parent_service_id=clean_id,
                    dependency_service_id=dep_id,
                    dependency_name=dep_svc.name,
                    status=dep_svc.status,
                    latency_ms=dep_telem.latency_ms,
                    error_rate=dep_telem.error_rate,
                )
            )
        return results

    # --------------------------------------------------------------------------
    # Telemetry and Logs
    # --------------------------------------------------------------------------

    def get_telemetry(self, service_id: str) -> Telemetry:
        """Returns the current operational telemetry snapshot for a service."""
        clean_id = self._validate_id(service_id, "service_id")
        service = self.get_service(clean_id)

        if FaultType.CHECKOUT_REGRESSION in self._active_faults and clean_id == SERVICE_CHECKOUT:
            return get_fault_telemetry(clean_id, service.active_deployment_id)
        elif self._recovered and clean_id == SERVICE_CHECKOUT:
            return get_recovered_telemetry(clean_id, service.active_deployment_id)
        return get_baseline_telemetry(clean_id, service.active_deployment_id)

    def get_error_rate(self, service_id: str) -> float:
        """Returns the current error rate percentage (0.0 to 100.0) for a service."""
        return self.get_telemetry(service_id).error_rate

    def query_logs(
        self,
        service_id: str,
        level: str | None = None,
        limit: int = 50,
    ) -> list[LogEntry]:
        """Returns structured logs for a service, optionally filtered by minimum log level."""
        clean_id = self._validate_id(service_id, "service_id")
        service = self.get_service(clean_id)

        if FaultType.CHECKOUT_REGRESSION in self._active_faults and clean_id == SERVICE_CHECKOUT:
            logs = get_fault_logs(clean_id, service.active_deployment_id)
        elif self._recovered and clean_id == SERVICE_CHECKOUT:
            logs = get_recovery_logs(clean_id, service.active_deployment_id)
        else:
            logs = get_baseline_logs(clean_id, service.active_deployment_id)

        if level:
            level_clean = level.upper()
            logs = [entry for entry in logs if entry.level.value == level_clean]

        return logs[:limit]

    # --------------------------------------------------------------------------
    # Deployments and Runbooks
    # --------------------------------------------------------------------------

    def get_recent_deployments(self, service_id: str, limit: int = 10) -> list[Deployment]:
        """Returns deployment history for a service in reverse chronological order."""
        clean_id = self._validate_id(service_id, "service_id")
        if clean_id not in self._deployments:
            raise ServiceNotFoundError(clean_id)
        return self._deployments[clean_id][:limit]

    def get_deployment(self, deployment_id: str) -> Deployment:
        """Returns a deployment record across all services."""
        clean_id = self._validate_id(deployment_id, "deployment_id")
        for deploys in self._deployments.values():
            for d in deploys:
                if d.deployment_id == clean_id:
                    return d
        raise DeploymentNotFoundError(clean_id)

    def get_deployment_diff(self, deployment_id: str) -> DeploymentDiff:
        """Returns code and configuration diff details for a deployment."""
        clean_id = self._validate_id(deployment_id, "deployment_id")
        # Ensure deployment exists
        self.get_deployment(clean_id)
        if clean_id not in self._deployment_diffs:
            raise DeploymentNotFoundError(clean_id)
        return self._deployment_diffs[clean_id]

    def get_runbook(self, service_id: str) -> Runbook:
        """Returns operational runbook for a service."""
        clean_id = self._validate_id(service_id, "service_id")
        if clean_id not in self._runbooks:
            raise ServiceNotFoundError(f"Runbook for service '{clean_id}'")
        return self._runbooks[clean_id]

    # --------------------------------------------------------------------------
    # Fault Injection and Management
    # --------------------------------------------------------------------------

    def get_active_faults(self) -> list[str]:
        """Returns list of currently active fault names."""
        return [f.value for f in self._active_faults]

    def inject_fault(self, fault: str | FaultType) -> None:
        """Injects a deterministic fault into the simulator."""
        if isinstance(fault, str):
            clean_fault = self._validate_id(fault, "fault").upper()
            try:
                fault_type = FaultType(clean_fault)
            except ValueError:
                raise FaultNotSupportedError(clean_fault)
        else:
            fault_type = fault

        if fault_type == FaultType.CHECKOUT_REGRESSION:
            self._inject_checkout_regression()
        else:
            raise FaultNotSupportedError(fault_type.value)

    def _inject_checkout_regression(self) -> None:
        """Activates checkout-v42 regression: elevates error rate and degrades checkout-service."""
        self._active_faults.add(FaultType.CHECKOUT_REGRESSION)
        self._recovered = False

        # Add checkout-v42 to deployment history if not present
        checkout_history = self._deployments[SERVICE_CHECKOUT]
        v42_deployment = Deployment(
            deployment_id=DEPLOYMENT_CHECKOUT_V42,
            service_id=SERVICE_CHECKOUT,
            version="4.2.0",
            timestamp=T_DEPLOY,
            status=DeploymentStatus.SUCCESSFUL,
            git_commit="e7f8a91",
            description="Release checkout-v42: order validation refactor and promo discount calculation",
        )
        if not any(d.deployment_id == DEPLOYMENT_CHECKOUT_V42 for d in checkout_history):
            self._deployments[SERVICE_CHECKOUT] = [v42_deployment] + checkout_history

        # Update checkout service status to DEGRADED and active deployment to v42
        self._services[SERVICE_CHECKOUT] = Service(
            service_id=SERVICE_CHECKOUT,
            name="Checkout Service",
            version="4.2.0",
            status=ServiceStatus.DEGRADED,
            active_deployment_id=DEPLOYMENT_CHECKOUT_V42,
        )

        self._record_event(
            SimulationEventType.DEPLOYMENT_ACTIVATED,
            T_DEPLOY,
            {"service_id": SERVICE_CHECKOUT, "deployment_id": DEPLOYMENT_CHECKOUT_V42},
        )
        self._record_event(
            SimulationEventType.FAULT_INJECTED,
            T_FAULT,
            {"fault": FaultType.CHECKOUT_REGRESSION.value, "service_id": SERVICE_CHECKOUT},
        )
        self._record_event(
            SimulationEventType.SERVICE_HEALTH_CHANGED,
            T_FAULT,
            {
                "service_id": SERVICE_CHECKOUT,
                "previous_status": ServiceStatus.HEALTHY.value,
                "new_status": ServiceStatus.DEGRADED.value,
            },
        )

    def clear_fault(self, fault: str | FaultType) -> None:
        """Clears an active fault without rolling back deployments."""
        if isinstance(fault, str):
            clean_fault = self._validate_id(fault, "fault").upper()
            try:
                fault_type = FaultType(clean_fault)
            except ValueError:
                raise FaultNotSupportedError(clean_fault)
        else:
            fault_type = fault

        if fault_type in self._active_faults:
            self._active_faults.remove(fault_type)
            self._record_event(
                SimulationEventType.FAULT_CLEARED,
                T_ROLLBACK,
                {"fault": fault_type.value},
            )

    # --------------------------------------------------------------------------
    # Rollback and Recovery
    # --------------------------------------------------------------------------

    def rollback_deployment(self, deployment_id: str) -> Deployment:
        """Rolls back a deployment to its preceding stable release."""
        clean_id = self._validate_id(deployment_id, "deployment_id")
        target_deployment = self.get_deployment(clean_id)

        if clean_id != DEPLOYMENT_CHECKOUT_V42:
            raise RollbackUnavailableError(
                clean_id,
                f"Deployment '{clean_id}' is not currently marked for rollback.",
            )

        checkout_svc = self._services[SERVICE_CHECKOUT]
        if checkout_svc.active_deployment_id != DEPLOYMENT_CHECKOUT_V42:
            raise InvalidStateTransitionError(
                f"Cannot rollback deployment '{clean_id}' because it is not active "
                f"(current active: '{checkout_svc.active_deployment_id}')"
            )

        self._record_event(
            SimulationEventType.ROLLBACK_STARTED,
            T_ROLLBACK,
            {"deployment_id": clean_id, "service_id": SERVICE_CHECKOUT},
        )

        # Update deployment status to ROLLED_BACK
        updated_history: list[Deployment] = []
        for d in self._deployments[SERVICE_CHECKOUT]:
            if d.deployment_id == clean_id:
                updated_history.append(
                    Deployment(
                        deployment_id=d.deployment_id,
                        service_id=d.service_id,
                        version=d.version,
                        timestamp=d.timestamp,
                        status=DeploymentStatus.ROLLED_BACK,
                        git_commit=d.git_commit,
                        description=d.description,
                    )
                )
            else:
                updated_history.append(d)
        self._deployments[SERVICE_CHECKOUT] = updated_history

        # Re-activate checkout-v41 and restore health
        self._services[SERVICE_CHECKOUT] = Service(
            service_id=SERVICE_CHECKOUT,
            name="Checkout Service",
            version="4.1.0",
            status=ServiceStatus.HEALTHY,
            active_deployment_id=DEPLOYMENT_CHECKOUT_V41,
        )

        # Clear regression fault and mark as recovered
        if FaultType.CHECKOUT_REGRESSION in self._active_faults:
            self._active_faults.remove(FaultType.CHECKOUT_REGRESSION)
        self._recovered = True

        self._record_event(
            SimulationEventType.ROLLBACK_COMPLETED,
            T_RECOVERED,
            {
                "rolled_back_deployment_id": clean_id,
                "active_deployment_id": DEPLOYMENT_CHECKOUT_V41,
                "service_id": SERVICE_CHECKOUT,
            },
        )
        self._record_event(
            SimulationEventType.SERVICE_HEALTH_CHANGED,
            T_RECOVERED,
            {
                "service_id": SERVICE_CHECKOUT,
                "previous_status": ServiceStatus.DEGRADED.value,
                "new_status": ServiceStatus.HEALTHY.value,
            },
        )

        return self.get_deployment(clean_id)

    # --------------------------------------------------------------------------
    # Audit Events
    # --------------------------------------------------------------------------

    def get_events(self) -> list[SimulationEvent]:
        """Returns full audit trail of simulation events."""
        return list(self._events)
