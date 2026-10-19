"""Input and output schemas for RALLY MCP Tool Layer.

All tools define explicit, bounded schemas ensuring strict validation and
zero arbitrary command or argument exposure.
"""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field
from simulator.domain.models import (
    DependencyHealth,
    Deployment,
    DeploymentDiff,
    LogEntry,
    Runbook,
    ServiceStatus,
    Telemetry,
)


class ServiceHealthResponse(BaseModel):
    """Output schema for get_service_health MCP tool."""
    model_config = ConfigDict(frozen=True)

    service_id: str
    name: str
    version: str
    status: ServiceStatus
    active_deployment_id: str


class ErrorRateResponse(BaseModel):
    """Output schema for get_error_rate MCP tool."""
    model_config = ConfigDict(frozen=True)

    service_id: str
    deployment_id: str
    error_rate_pct: float
    request_count: int
    error_count: int


class LogsResponse(BaseModel):
    """Output schema for query_logs MCP tool."""
    model_config = ConfigDict(frozen=True)

    service_id: str
    total_returned: int
    logs: list[LogEntry] = Field(default_factory=list)


class RecentDeploymentsResponse(BaseModel):
    """Output schema for get_recent_deployments MCP tool."""
    model_config = ConfigDict(frozen=True)

    service_id: str
    total_returned: int
    deployments: list[Deployment] = Field(default_factory=list)


class DeploymentDiffResponse(BaseModel):
    """Output schema for get_deployment_diff MCP tool."""
    model_config = ConfigDict(frozen=True)

    diff: DeploymentDiff


class DependencyHealthResponse(BaseModel):
    """Output schema for get_dependency_health MCP tool."""
    model_config = ConfigDict(frozen=True)

    service_id: str
    dependencies: list[DependencyHealth] = Field(default_factory=list)


class RunbookResponse(BaseModel):
    """Output schema for get_runbook MCP tool."""
    model_config = ConfigDict(frozen=True)

    runbook: Runbook


class RollbackDeploymentResponse(BaseModel):
    """Output schema for rollback_deployment MCP write tool."""
    model_config = ConfigDict(frozen=True)

    success: bool
    rolled_back_deployment: Deployment
    active_deployment_id: str
    service_status: ServiceStatus
