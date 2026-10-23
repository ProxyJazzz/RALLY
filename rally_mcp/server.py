"""RALLY MCP Server initialization and factory.

Creates and configures an official MCP server instance bound to an IncidentSimulator.
Exposes tools over Streamable HTTP and provides factory methods for testing and production.
"""

from mcp.server.mcpserver import MCPServer
from starlette.applications import Starlette

from rally_mcp.tools.read_tools import register_read_tools
from rally_mcp.tools.write_tools import register_write_tools
from simulator.services.simulator import IncidentSimulator


def create_rally_mcp_server(
    simulator: IncidentSimulator | None = None,
    server_name: str = "rally-mcp-server",
    instructions: str = (
        "RALLY Model Context Protocol Server. Provides deterministic operational "
        "investigation tools, conversational incident context, and controlled remediation capabilities."
    ),
    enable_alexa_tools: bool = True,
) -> MCPServer:
    """Factory creating an official MCPServer configured with RALLY tools."""
    sim = simulator if simulator is not None else IncidentSimulator()
    server = MCPServer(
        name=server_name,
        instructions=instructions,
    )
    # Register 7 read investigation tools
    register_read_tools(server, sim)
    # Register 1 controlled write remediation tool
    register_write_tools(server, sim)
    # Register conversational incident tools for Alexa+ if enabled
    if enable_alexa_tools:
        from alexa.tools import register_alexa_conversational_tools
        register_alexa_conversational_tools(server)
    return server


def create_rally_mcp_app(
    simulator: IncidentSimulator | None = None,
    server_name: str = "rally-mcp-server",
    enable_alexa_tools: bool = True,
) -> Starlette:
    """Creates a Starlette ASGI application exposing the MCP server over Streamable HTTP."""
    server = create_rally_mcp_server(
        simulator=simulator,
        server_name=server_name,
        enable_alexa_tools=enable_alexa_tools,
    )
    return server.streamable_http_app()


if __name__ == "__main__":
    import os
    import uvicorn
    # Environment-driven host/port configuration with safe local development defaults
    host = os.getenv("MCP_HOST", "127.0.0.1")
    port = int(os.getenv("MCP_PORT", "8001"))
    log_level = os.getenv("LOG_LEVEL", "info").lower()
    app = create_rally_mcp_app()
    uvicorn.run(app, host=host, port=port, log_level=log_level)
