"""Error mapping and sanitization for RALLY MCP Tool Layer.

Maps simulator domain exceptions and validation failures into structured,
safe, non-leaking error responses complying with the Model Context Protocol.
"""

from typing import Any
from pydantic import BaseModel, ConfigDict
from simulator.domain.exceptions import (
    DeploymentNotFoundError,
    FaultNotSupportedError,
    InvalidIdentifierError,
    InvalidStateTransitionError,
    RollbackUnavailableError,
    ServiceNotFoundError,
    SimulatorError,
)


class MCPToolErrorResponse(BaseModel):
    """Safe, structured error payload returned by RALLY MCP tools."""
    model_config = ConfigDict(frozen=True)

    success: bool = False
    error_code: str
    message: str
    details: dict[str, Any] = {}


def map_exception_to_error_response(exc: Exception) -> MCPToolErrorResponse:
    """Safely maps exceptions to structured error responses without leaking internals or stack traces."""
    if isinstance(exc, ServiceNotFoundError):
        return MCPToolErrorResponse(
            error_code="SERVICE_NOT_FOUND",
            message=str(exc),
            details={"service_id": exc.service_id},
        )
    elif isinstance(exc, DeploymentNotFoundError):
        return MCPToolErrorResponse(
            error_code="DEPLOYMENT_NOT_FOUND",
            message=str(exc),
            details={"deployment_id": exc.deployment_id},
        )
    elif isinstance(exc, RollbackUnavailableError):
        return MCPToolErrorResponse(
            error_code="ROLLBACK_UNAVAILABLE",
            message=str(exc),
            details={"deployment_id": exc.deployment_id, "reason": exc.reason},
        )
    elif isinstance(exc, InvalidStateTransitionError):
        return MCPToolErrorResponse(
            error_code="INVALID_STATE_TRANSITION",
            message=str(exc),
        )
    elif isinstance(exc, InvalidIdentifierError):
        return MCPToolErrorResponse(
            error_code="INVALID_IDENTIFIER",
            message=str(exc),
            details={"identifier": exc.identifier},
        )
    elif isinstance(exc, FaultNotSupportedError):
        return MCPToolErrorResponse(
            error_code="FAULT_NOT_SUPPORTED",
            message=str(exc),
            details={"fault_type": exc.fault_type},
        )
    elif isinstance(exc, SimulatorError):
        return MCPToolErrorResponse(
            error_code="SIMULATOR_ERROR",
            message=str(exc),
        )
    else:
        # Generic safeguard: never leak unexpected exception details, paths, or secrets
        return MCPToolErrorResponse(
            error_code="INTERNAL_TOOL_ERROR",
            message="An internal error occurred while executing the operational tool.",
        )
