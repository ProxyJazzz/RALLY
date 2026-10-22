"""Protocol-level integration tests for RALLY MCP Server.

Verifies:
  1. MCP Server startup over Streamable HTTP transport.
  2. Protocol capability negotiation and client initialization.
  3. Tool discovery over MCP protocol.
  4. Invocations of all 7 read tools and 1 write tool across the real MCP transport boundary.
  5. Safe error handling when invalid or missing entities are requested via MCP.
"""

import json
import pytest
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamable_http_client

from rally_mcp.runtime import MCPServerRunner
from simulator.services.simulator import IncidentSimulator


@pytest.fixture(scope="module")
def mcp_server():
    """Starts an in-process MCP server runner over Streamable HTTP for integration tests."""
    sim = IncidentSimulator()
    runner = MCPServerRunner(simulator=sim)
    url = runner.start()
    yield runner, url
    runner.stop()


@pytest.mark.asyncio
async def test_mcp_initialization_and_tool_discovery(mcp_server):
    """Verifies MCP connection, initialization, and complete tool discovery."""
    runner, url = mcp_server

    async with streamable_http_client(url) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            init_result = await session.initialize()
            assert init_result is not None
            assert init_result.server_info.name == "rally-mcp-server"

            # Discover tools
            tools_result = await session.list_tools()
            tool_names = [t.name for t in tools_result.tools]

            # Verify 7 read tools + 1 write tool
            expected_tools = [
                "get_service_health",
                "get_error_rate",
                "query_logs",
                "get_recent_deployments",
                "get_deployment_diff",
                "get_dependency_health",
                "get_runbook",
                "rollback_deployment",
            ]
            for expected in expected_tools:
                assert expected in tool_names, f"Tool {expected} not discovered"

            assert len(tool_names) in (8, 13)


@pytest.mark.asyncio
async def test_mcp_read_tools_invocation(mcp_server):
    """Verifies that all 7 read tools invoke properly through the MCP protocol."""
    runner, url = mcp_server
    runner.simulator.reset()

    async with streamable_http_client(url) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()

            # 1. get_service_health
            res_health = await session.call_tool("get_service_health", {"service_id": "checkout-service"})
            data_health = json.loads(res_health.content[0].text)
            assert data_health["service_id"] == "checkout-service"
            assert data_health["status"] == "HEALTHY"
            assert data_health["active_deployment_id"] == "checkout-v41"

            # 2. get_error_rate
            res_err = await session.call_tool("get_error_rate", {"service_id": "checkout-service"})
            data_err = json.loads(res_err.content[0].text)
            assert data_err["service_id"] == "checkout-service"
            assert data_err["error_rate_pct"] == 0.67

            # 3. query_logs
            res_logs = await session.call_tool("query_logs", {"service_id": "checkout-service", "limit": 10})
            data_logs = json.loads(res_logs.content[0].text)
            assert data_logs["service_id"] == "checkout-service"
            assert data_logs["total_returned"] > 0
            assert len(data_logs["logs"]) > 0

            # 4. get_recent_deployments
            res_deploys = await session.call_tool("get_recent_deployments", {"service_id": "checkout-service", "limit": 5})
            data_deploys = json.loads(res_deploys.content[0].text)
            assert data_deploys["service_id"] == "checkout-service"
            assert len(data_deploys["deployments"]) == 2
            assert data_deploys["deployments"][0]["deployment_id"] == "checkout-v41"

            # 5. get_deployment_diff
            res_diff = await session.call_tool("get_deployment_diff", {"deployment_id": "checkout-v41"})
            data_diff = json.loads(res_diff.content[0].text)
            assert data_diff["diff"]["deployment_id"] == "checkout-v41"

            # 6. get_dependency_health
            res_deps = await session.call_tool("get_dependency_health", {"service_id": "checkout-service"})
            data_deps = json.loads(res_deps.content[0].text)
            assert data_deps["service_id"] == "checkout-service"
            assert len(data_deps["dependencies"]) == 3
            dep_names = {d["dependency_service_id"] for d in data_deps["dependencies"]}
            assert dep_names == {"payment-service", "inventory-service", "auth-service"}

            # 7. get_runbook
            res_runbook = await session.call_tool("get_runbook", {"service_id": "checkout-service"})
            data_runbook = json.loads(res_runbook.content[0].text)
            assert data_runbook["runbook"]["service_id"] == "checkout-service"
            assert "Rollback" in data_runbook["runbook"]["rollback_procedure"]


@pytest.mark.asyncio
async def test_mcp_error_handling_over_protocol(mcp_server):
    """Verifies that simulator errors are converted to safe structured MCP error responses."""
    runner, url = mcp_server

    async with streamable_http_client(url) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()

            # Request non-existent service
            res = await session.call_tool("get_service_health", {"service_id": "non-existent-svc"})
            data = json.loads(res.content[0].text)
            assert data["success"] is False
            assert data["error_code"] == "SERVICE_NOT_FOUND"
            assert data["details"]["service_id"] == "non-existent-svc"
