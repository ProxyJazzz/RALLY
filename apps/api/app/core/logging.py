"""
RALLY — Structured logging configuration.

Uses structlog for JSON-structured application logs.
Sensitive fields (passwords, tokens, keys) must never appear in log output.
"""
from __future__ import annotations

import logging
import sys
from typing import Any

import structlog



SENSITIVE_KEYS = {
    "password",
    "token",
    "secret",
    "api_key",
    "apikey",
    "access_key",
    "secret_key",
    "authorization",
    "aws_secret_access_key",
    "aws_access_key_id",
    "private_key",
}


def sanitize_sensitive_data(
    logger: logging.Logger,  # noqa: ARG001
    method_name: str,  # noqa: ARG001
    event_dict: dict[str, Any],
) -> dict[str, Any]:
    """Filter out known sensitive fields from log events."""
    for key in list(event_dict.keys()):
        if any(sensitive in key.lower() for sensitive in SENSITIVE_KEYS):
            event_dict[key] = "[REDACTED]"
    return event_dict


def configure_logging(log_level: str = "INFO", service_name: str = "rally-api", environment: str = "development") -> None:
    """Configure structlog for structured JSON output with OpenTelemetry-compatible fields."""
    level = getattr(logging, log_level.upper(), logging.INFO)

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        sanitize_sensitive_data,
        structlog.processors.StackInfoRenderer(),
    ]

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            structlog.processors.JSONRenderer(),
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    # Remove existing handlers to avoid duplicates on re-configure
    for existing in list(root_logger.handlers):
        root_logger.removeHandler(existing)
    root_logger.addHandler(handler)
    root_logger.setLevel(level)

    # Bind base service and environment context
    structlog.contextvars.bind_contextvars(
        service=service_name,
        environment=environment,
    )

    # Quieten noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)
