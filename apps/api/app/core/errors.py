"""
RALLY — Structured error handling.

All API errors must map to predictable, typed error responses.
Internal stack traces must never be exposed to clients.
"""
from __future__ import annotations

from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: str | None = None


class ErrorResponse(BaseModel):
    error: str
    details: list[ErrorDetail] | None = None
    request_id: str | None = None


class RallyError(Exception):
    """Base application error."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "internal_error"
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.__class__.message
        super().__init__(self.message)


class NotFoundError(RallyError):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "not_found"
    message = "Resource not found."


class ValidationError(RallyError):
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    error_code = "validation_error"
    message = "Validation failed."


class DatabaseError(RallyError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    error_code = "database_error"
    message = "Database service unavailable."


async def rally_error_handler(request: Request, exc: RallyError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.error_code,
            details=[ErrorDetail(code=exc.error_code, message=exc.message)],
            request_id=request.headers.get("x-request-id"),
        ).model_dump(exclude_none=True),
    )


async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler that never leaks internals to clients."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="internal_error",
            details=[ErrorDetail(code="internal_error", message="An unexpected error occurred.")],
            request_id=request.headers.get("x-request-id"),
        ).model_dump(exclude_none=True),
    )
