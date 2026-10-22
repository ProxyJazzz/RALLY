"""RALLY — Health check response schemas."""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class ServiceStatus(str, Enum):
    ok = "ok"
    degraded = "degraded"
    unavailable = "unavailable"


class HealthResponse(BaseModel):
    status: ServiceStatus
    service: str
    version: str
    environment: str


class DatabaseHealthResponse(BaseModel):
    status: ServiceStatus
    service: str
    version: str
    environment: str
    database: str
    latency_ms: float | None = None
    error: str | None = None
