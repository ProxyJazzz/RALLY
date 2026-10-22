"""MCP client adapter for RALLY Agent Runtime.

Connects to the official RALLY MCP Server over Streamable HTTP and provides
a high-level, policy-enforced interface for discovering and calling approved tools.
Ensures the agent cannot directly import or mutate simulator domain objects.
"""

import json
from typing import Any
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamable_http_client

from agent.policies import AgentPolicyEngine, PolicyViolationError


class MCPClientError(Exception):
    """Raised when an MCP protocol, connection, or tool invocation fails."""
    pass


class AgentMCPClient:
    """Internal MCP client adapter providing tool discovery and invocation for agents."""

    def __init__(self, server_url: str = "http://127.0.0.1:8001/mcp"):
        self.server_url = server_url

    async def list_available_tools(self) -> list[str]:
        """Queries the MCP server for available tool names."""
        try:
            async with streamable_http_client(self.server_url) as (read_stream, write_stream):
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    tools_result = await session.list_tools()
                    return [t.name for t in tools_result.tools]
        except Exception as e:
            raise MCPClientError(f"Failed to discover tools from MCP server at {self.server_url}: {e}") from e

    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        """Calls an MCP tool after validating against security policy."""
        # 1. Enforce strict tool allowlist before any protocol call
        AgentPolicyEngine.validate_tool_request(tool_name)

        # 2. Execute call over official MCP protocol
        try:
            async with streamable_http_client(self.server_url) as (read_stream, write_stream):
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, arguments)
                    if not result.content:
                        raise MCPClientError(f"Empty content returned by MCP tool '{tool_name}'")

                    # Parse JSON tool response
                    raw_text = result.content[0].text
                    try:
                        return json.loads(raw_text)
                    except json.JSONDecodeError as json_err:
                        raise MCPClientError(f"Invalid JSON returned by tool '{tool_name}': {raw_text}") from json_err

        except PolicyViolationError:
            raise
        except Exception as e:
            raise MCPClientError(f"Error calling MCP tool '{tool_name}' over protocol: {e}") from e
