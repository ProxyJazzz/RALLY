"""Write tools for RALLY MCP Server.

Per Phase 3 specifications, only explicit, safe, verified write operations are exposed.
The sole write operation in Phase 3 is:
  - rollback_deployment

All speculative or deferred write tools (create_incident, restart_service, scale_service,
send_incident_update, close_incident) are explicitly deferred until simulator supports them.
Arbitrary execution tools (shell, exec, eval, arbitrary_http, etc.) are strictly forbidden.
"""

from typing import Annotated
from mcp.server.mcpserver import MCPServer
from pydantic import Field

from rally_mcp.errors import map_exception_to_error_response
from rally_mcp.schemas import RollbackDeploymentResponse
from simulator.services.simulator import IncidentSimulator


def register_write_tools(server: MCPServer, simulator: IncidentSimulator) -> None:
    """Registers controlled write tools on the given MCP server."""

    @server.tool()
    def rollback_deployment(
        deployment_id: Annotated[str, Field(description="Deployment identifier to roll back, e.g. 'checkout-v42'")],
    ) -> str:
        """Executes a controlled rollback of a deployment to its preceding stable release."""
        try:
            rolled_back = simulator.rollback_deployment(deployment_id)
            service = simulator.get_service(rolled_back.service_id)
            resp = RollbackDeploymentResponse(
                success=True,
                rolled_back_deployment=rolled_back,
                active_deployment_id=service.active_deployment_id,
                service_status=service.status,
            )
            return resp.model_dump_json(indent=2)
        except Exception as e:
            return map_exception_to_error_response(e).model_dump_json(indent=2)
