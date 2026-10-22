"""Runtime management utilities for RALLY MCP Server.

Provides in-process background runner for tests and client connection helpers.
"""

import asyncio
import socket
import threading
import time
from typing import AsyncGenerator
import uvicorn
from starlette.applications import Starlette

from mcp.server.mcpserver import MCPServer
from rally_mcp.server import create_rally_mcp_app, create_rally_mcp_server
from simulator.services.simulator import IncidentSimulator


def find_available_port() -> int:
    """Finds a free ephemeral TCP port for local test/dev servers."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class MCPServerRunner:
    """Runs a Streamable HTTP MCP server in a background thread for integration testing."""

    def __init__(self, simulator: IncidentSimulator | None = None, port: int | None = None):
        self.simulator = simulator if simulator is not None else IncidentSimulator()
        self.port = port or find_available_port()
        self.host = "127.0.0.1"
        self.url = f"http://{self.host}:{self.port}/mcp"
        self.app: Starlette = create_rally_mcp_app(simulator=self.simulator)
        self._server: uvicorn.Server | None = None
        self._thread: threading.Thread | None = None

    def start(self) -> str:
        """Starts the server in a background thread and waits for readiness."""
        config = uvicorn.Config(
            self.app,
            host=self.host,
            port=self.port,
            log_level="error",
            access_log=False,
        )
        self._server = uvicorn.Server(config)
        self._thread = threading.Thread(target=self._server.run, daemon=True)
        self._thread.start()

        # Poll port until server is accepting connections
        start_time = time.time()
        while time.time() - start_time < 5.0:
            try:
                with socket.create_connection((self.host, self.port), timeout=0.1):
                    time.sleep(0.05)
                    return self.url
            except OSError:
                time.sleep(0.05)

        raise RuntimeError(f"MCP server failed to bind to {self.host}:{self.port} within 5s")

    def stop(self) -> None:
        """Stops the background server gracefully."""
        if self._server:
            self._server.should_exit = True
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
