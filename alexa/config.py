"""Alexa+ MCP Client and Endpoint Configuration.

Manages configuration for connecting external conversational clients (like Alexa+)
to the RALLY MCP Server via local or public remote HTTPS endpoints.
Never hardcodes ephemeral tunnel URLs in source code.
"""

from __future__ import annotations

import os
from pydantic import BaseModel, ConfigDict, Field


class AlexaMCPConfig(BaseModel):
    """Configuration for Alexa+ MCP endpoint connection and governance."""

    model_config = ConfigDict(frozen=True)

    # Public or local MCP endpoint URL
    mcp_endpoint_url: str = Field(
        default_factory=lambda: os.getenv(
            "RALLY_MCP_PUBLIC_URL", "http://127.0.0.1:8001/mcp"
        )
    )

    # Request timeout in seconds for conversational queries
    request_timeout_seconds: float = 30.0

    # Max retries for transient transport failures
    max_retries: int = 2

    # Whether OAuth 2.1 authentication is enabled on the MCP gateway
    auth_enabled: bool = Field(
        default_factory=lambda: os.getenv("RALLY_MCP_AUTH_ENABLED", "false").lower()
        in {"true", "1", "yes"}
    )

    # Canonical OAuth Protected Resource URI (RFC 8707 / RFC 9207)
    oauth_resource_uri: str | None = Field(
        default_factory=lambda: os.getenv("RALLY_MCP_OAUTH_RESOURCE", None)
    )

    # Allowed tools for Alexa+ interaction
    allowed_tools: frozenset[str] = frozenset(
        {
            "get_service_health",
            "get_error_rate",
            "query_logs",
            "get_recent_deployments",
            "get_deployment_diff",
            "get_dependency_health",
            "get_runbook",
            "rollback_deployment",
            "get_incident_context",
            "get_investigation_summary",
            "get_action_plan",
            "get_execution_status",
            "get_verification_status",
        }
    )

    # Strictly forbidden tools for Alexa+ conversational interface
    forbidden_tools: frozenset[str] = frozenset(
        {
            "shell",
            "bash",
            "terminal",
            "execute_command",
            "arbitrary_python",
            "arbitrary_http_request",
            "eval",
            "exec",
            "dynamic_tool_creator",
            "chat",
            "do_anything",
        }
    )
