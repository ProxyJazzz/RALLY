"""RALLY Incident Simulator root package."""

from simulator.domain.exceptions import (
    DeploymentNotFoundError,
    FaultNotSupportedError,
    InvalidIdentifierError,
    InvalidStateTransitionError,
    RollbackUnavailableError,
    ServiceNotFoundError,
    SimulatorError,
)
from simulator.domain.models import (
    DependencyHealth,
    Deployment,
    DeploymentDiff,
    DeploymentStatus,
    FaultType,
    LogEntry,
    LogLevel,
    Runbook,
    Service,
    ServiceStatus,
    SimulationEvent,
    SimulationEventType,
    Telemetry,
)
from simulator.services.simulator import IncidentSimulator

__all__ = [
    "IncidentSimulator",
    "DependencyHealth",
    "Deployment",
    "DeploymentDiff",
    "DeploymentStatus",
    "FaultType",
    "LogEntry",
    "LogLevel",
    "Runbook",
    "Service",
    "ServiceStatus",
    "SimulationEvent",
    "SimulationEventType",
    "Telemetry",
    "DeploymentNotFoundError",
    "FaultNotSupportedError",
    "InvalidIdentifierError",
    "InvalidStateTransitionError",
    "RollbackUnavailableError",
    "ServiceNotFoundError",
    "SimulatorError",
]
