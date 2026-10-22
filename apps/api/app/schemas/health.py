"""RALLY — Health check response schemas."""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class ServiceStatus(str, Enum):
    ok = "ok"
    degraded = "degraded"
    unavailable = "unavailable"


class DependencyStatus(str, Enum):
    healthy = "healthy"
    configured = "configured"
    available = "available"
    not_configured = "not_configured"
    unavailable = "unavailable"
    degraded = "degraded"


class HealthResponse(BaseModel):
    status: ServiceStatus
    service: str
    version: str
    environment: str


class LivenessResponse(BaseModel):
    status: str = "alive"
    service: str
    version: str
    environment: str


class ReadinessResponse(BaseModel):
    status: str  # "ready" | "not_ready"
    service: str
    version: str
    environment: str
    dependencies: dict[str, str]
    timestamp: str


class DatabaseHealthResponse(BaseModel):
    status: ServiceStatus
    service: str
    version: str
    environment: str
    database: str
    latency_ms: float | None = None
    error: str | None = None
