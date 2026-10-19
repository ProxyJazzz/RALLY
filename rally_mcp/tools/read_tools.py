"""Read-only operational investigation tools for RALLY MCP Server.

Binds the 7 canonical read tools to the IncidentSimulator domain layer:
  - get_service_health
  - get_error_rate
  - query_logs
  - get_recent_deployments
  - get_deployment_diff
  - get_dependency_health
  - get_runbook
"""

from typing import Annotated
from mcp.server.mcpserver import MCPServer
from pydantic import Field

from rally_mcp.errors import map_exception_to_error_response
from rally_mcp.schemas import (
    DependencyHealthResponse,
    DeploymentDiffResponse,
    ErrorRateResponse,
    LogsResponse,
    RecentDeploymentsResponse,
    RunbookResponse,
    ServiceHealthResponse,
)
from simulator.services.simulator import IncidentSimulator


def register_read_tools(server: MCPServer, simulator: IncidentSimulator) -> None:
    """Registers all read-only investigation tools on the given MCP server."""

    @server.tool()
    def get_service_health(
        service_id: Annotated[str, Field(description="Service identifier, e.g. 'checkout-service'")],
    ) -> str:
        """Returns the current operational health and active deployment of a service."""
        try:
            service = simulator.get_service(service_id)
            resp = ServiceHealthResponse(
                service_id=service.service_id,
                name=service.name,
                version=service.version,
                status=service.status,
                active_deployment_id=service.active_deployment_id,
            )
            return resp.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)

    @server.tool()
    def get_error_rate(
        service_id: Annotated[str, Field(description="Service identifier, e.g. 'checkout-service'")],
    ) -> str:
        """Returns the current error rate percentage and request telemetry for a service."""
        try:
            telem = simulator.get_telemetry(service_id)
            resp = ErrorRateResponse(
                service_id=telem.service_id,
                deployment_id=telem.deployment_id,
                error_rate_pct=telem.error_rate,
                request_count=telem.request_count,
                error_count=telem.error_count,
            )
            return resp.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)

    @server.tool()
    def query_logs(
        service_id: Annotated[str, Field(description="Service identifier, e.g. 'checkout-service'")],
        level: Annotated[str | None, Field(description="Optional log level filter, e.g. 'ERROR', 'WARN', 'INFO'")] = None,
        limit: Annotated[int, Field(description="Maximum number of log entries to return (bounded between 1 and 100)", ge=1, le=100)] = 50,
    ) -> str:
        """Queries structured logs for a service, optionally filtered by level."""
        try:
            logs = simulator.query_logs(service_id, level=level, limit=limit)
            resp = LogsResponse(
                service_id=service_id,
                total_returned=len(logs),
                logs=logs,
            )
            return resp.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)

    @server.tool()
    def get_recent_deployments(
        service_id: Annotated[str, Field(description="Service identifier, e.g. 'checkout-service'")],
        limit: Annotated[int, Field(description="Maximum deployment records to return (bounded between 1 and 20)", ge=1, le=20)] = 10,
    ) -> str:
        """Returns recent deployment history for a service in reverse chronological order."""
        try:
            deployments = simulator.get_recent_deployments(service_id, limit=limit)
            resp = RecentDeploymentsResponse(
                service_id=service_id,
                total_returned=len(deployments),
                deployments=deployments,
            )
            return resp.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)

    @server.tool()
    def get_deployment_diff(
        deployment_id: Annotated[str, Field(description="Deployment identifier, e.g. 'checkout-v42'")],
    ) -> str:
        """Returns code and configuration changes introduced in a deployment."""
        try:
            diff = simulator.get_deployment_diff(deployment_id)
            resp = DeploymentDiffResponse(diff=diff)
            return resp.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)

    @server.tool()
    def get_dependency_health(
        service_id: Annotated[str, Field(description="Service identifier, e.g. 'checkout-service'")],
    ) -> str:
        """Returns the health status and latency of all downstream service dependencies."""
        try:
            deps = simulator.get_dependency_health(service_id)
            resp = DependencyHealthResponse(
                service_id=service_id,
                dependencies=deps,
            )
            return resp.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)

    @server.tool()
    def get_runbook(
        service_id: Annotated[str, Field(description="Service identifier, e.g. 'checkout-service'")],
    ) -> str:
        """Returns the operational runbook and verified recovery procedures for a service."""
        try:
            runbook = simulator.get_runbook(service_id)
            resp = RunbookResponse(runbook=runbook)
            return resp.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)
