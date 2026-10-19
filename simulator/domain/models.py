"""Domain models for RALLY Incident Simulator."""

from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class ServiceStatus(str, Enum):
    """Deterministic operational status of a service."""
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    FAILED = "FAILED"


class DeploymentStatus(str, Enum):
    """Deterministic status of a service deployment."""
    SUCCESSFUL = "SUCCESSFUL"
    ROLLED_BACK = "ROLLED_BACK"
    FAILED = "FAILED"


class LogLevel(str, Enum):
    """Log level for simulated structured logs."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"


class FaultType(str, Enum):
    """Supported deterministic fault types."""
    CHECKOUT_REGRESSION = "CHECKOUT_REGRESSION"


class SimulationEventType(str, Enum):
    """Structured audit/telemetry events produced by the simulator."""
    SIMULATION_INITIALIZED = "simulation_initialized"
    FAULT_INJECTED = "fault_injected"
    FAULT_CLEARED = "fault_cleared"
    DEPLOYMENT_ACTIVATED = "deployment_activated"
    ROLLBACK_STARTED = "rollback_started"
    ROLLBACK_COMPLETED = "rollback_completed"
    SERVICE_HEALTH_CHANGED = "service_health_changed"


class Service(BaseModel):
    """A simulated microservice with deterministic state."""
    model_config = ConfigDict(frozen=True)

    service_id: str
    name: str
    version: str
    status: ServiceStatus
    active_deployment_id: str


class Deployment(BaseModel):
    """Deterministic record of a deployment."""
    model_config = ConfigDict(frozen=True)

    deployment_id: str
    service_id: str
    version: str
    timestamp: str
    status: DeploymentStatus
    git_commit: str = ""
    description: str = ""


class DeploymentDiff(BaseModel):
    """Diff information for a deployment relative to its previous version."""
    model_config = ConfigDict(frozen=True)

    deployment_id: str
    service_id: str
    previous_deployment_id: str
    summary: str
    changed_files: list[str] = Field(default_factory=list)
    risk_level: str = "LOW"


class Telemetry(BaseModel):
    """Service operational metrics snapshot."""
    model_config = ConfigDict(frozen=True)

    service_id: str
    deployment_id: str
    request_count: int
    error_count: int
    error_rate: float
    latency_ms: float
    availability_pct: float
    timestamp: str


class LogEntry(BaseModel):
    """Simulated structured log entry with rich diagnostic context."""
    model_config = ConfigDict(frozen=True)

    timestamp: str
    service_id: str
    deployment_id: str
    level: LogLevel
    message: str
    request_id: str
    error_code: str | None = None
    extra: dict[str, Any] = Field(default_factory=dict)


class DependencyHealth(BaseModel):
    """Health status of a downstream service dependency."""
    model_config = ConfigDict(frozen=True)

    parent_service_id: str
    dependency_service_id: str
    dependency_name: str
    status: ServiceStatus
    latency_ms: float
    error_rate: float


class Runbook(BaseModel):
    """Operational runbook for a service."""
    model_config = ConfigDict(frozen=True)

    service_id: str
    title: str
    summary: str
    rollback_procedure: str
    verification_steps: list[str]
    recovery_error_threshold_pct: float
    escalation_contacts: list[str]


class SimulationEvent(BaseModel):
    """Audit event recorded by the simulator."""
    model_config = ConfigDict(frozen=True)

    timestamp: str
    event_type: SimulationEventType
    details: dict[str, Any] = Field(default_factory=dict)
