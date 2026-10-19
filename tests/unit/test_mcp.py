"""Unit tests for the RALLY MCP Tool Layer.

Tests schemas, error mapping, tool registration, adapter serialization,
and verifies the strict absence of any forbidden arbitrary execution tools.
"""

import json
import pytest

from rally_mcp.errors import MCPToolErrorResponse, map_exception_to_error_response
from rally_mcp.schemas import (
    DependencyHealthResponse,
    DeploymentDiffResponse,
    ErrorRateResponse,
    LogsResponse,
    RecentDeploymentsResponse,
    RollbackDeploymentResponse,
    RunbookResponse,
    ServiceHealthResponse,
)
from rally_mcp.server import create_rally_mcp_server
from simulator.domain.exceptions import (
    DeploymentNotFoundError,
    FaultNotSupportedError,
    InvalidIdentifierError,
    InvalidStateTransitionError,
    RollbackUnavailableError,
    ServiceNotFoundError,
)
from simulator.domain.models import DeploymentStatus, ServiceStatus
from simulator.services.simulator import IncidentSimulator


@pytest.fixture
def sim() -> IncidentSimulator:
    return IncidentSimulator()


class TestErrorMapping:
    """Verifies safe exception mapping without leaking internal details or stack traces."""

    def test_service_not_found_mapped_cleanly(self):
        exc = ServiceNotFoundError("billing-service")
        err = map_exception_to_error_response(exc)
        assert isinstance(err, MCPToolErrorResponse)
        assert err.success is False
        assert err.error_code == "SERVICE_NOT_FOUND"
        assert err.details.get("service_id") == "billing-service"
        assert "billing-service" in err.message

    def test_deployment_not_found_mapped_cleanly(self):
        exc = DeploymentNotFoundError("checkout-v999")
        err = map_exception_to_error_response(exc)
        assert err.error_code == "DEPLOYMENT_NOT_FOUND"
        assert err.details.get("deployment_id") == "checkout-v999"

    def test_rollback_unavailable_mapped_cleanly(self):
        exc = RollbackUnavailableError("checkout-v40", "Deployment not eligible")
        err = map_exception_to_error_response(exc)
        assert err.error_code == "ROLLBACK_UNAVAILABLE"
        assert err.details.get("deployment_id") == "checkout-v40"

    def test_invalid_identifier_mapped_cleanly(self):
        exc = InvalidIdentifierError("bad; rm -rf /")
        err = map_exception_to_error_response(exc)
        assert err.error_code == "INVALID_IDENTIFIER"

    def test_generic_exception_does_not_leak_internals(self):
        exc = RuntimeError("Secret database password db_pass_123 failed at /etc/passwd")
        err = map_exception_to_error_response(exc)
        assert err.error_code == "INTERNAL_TOOL_ERROR"
        assert "db_pass_123" not in err.message
        assert "/etc/passwd" not in err.message
        assert "internal error occurred" in err.message


class TestToolRegistrationAndAbsenceOfForbiddenTools:
    """Verifies that only authorized tools are registered and forbidden tools are completely absent."""

    def test_registered_tools_exact_set(self, sim: IncidentSimulator):
        server = create_rally_mcp_server(simulator=sim)
        # Inspect registered tools from server
        registered_tool_names = set(server._tool_manager._tools.keys())

        expected_read_tools = {
            "get_service_health",
            "get_error_rate",
            "query_logs",
            "get_recent_deployments",
            "get_deployment_diff",
            "get_dependency_health",
            "get_runbook",
        }
        expected_write_tools = {
            "rollback_deployment",
        }
        expected_all = expected_read_tools | expected_write_tools

        assert registered_tool_names == expected_all
        assert len(registered_tool_names) == 8

    def test_forbidden_tools_strictly_absent(self, sim: IncidentSimulator):
        server = create_rally_mcp_server(simulator=sim)
        registered_names = set(server._tool_manager._tools.keys())

        forbidden = [
            "execute_command",
            "shell",
            "bash",
            "terminal",
            "exec",
            "eval",
            "arbitrary_python",
            "arbitrary_http_request",
            "generic_http",
            "dynamic_tool_creator",
            "database_query",
            "sql_query",
            "filesystem_browser",
            "create_incident",      # deferred
            "restart_service",      # deferred
            "scale_service",        # deferred
            "send_incident_update", # deferred
            "close_incident",       # deferred
        ]
        for bad_tool in forbidden:
            assert bad_tool not in registered_names


class TestToolOutputSerialization:
    """Verifies JSON output schemas for tool invocations."""

    def test_service_health_response_schema(self, sim: IncidentSimulator):
        svc = sim.get_service("checkout-service")
        resp = ServiceHealthResponse(
            service_id=svc.service_id,
            name=svc.name,
            version=svc.version,
            status=svc.status,
            active_deployment_id=svc.active_deployment_id,
        )
        data = json.loads(resp.model_dump_json())
        assert data["service_id"] == "checkout-service"
        assert data["status"] == "HEALTHY"
        assert data["active_deployment_id"] == "checkout-v41"

    def test_rollback_response_schema(self, sim: IncidentSimulator):
        sim.inject_fault("CHECKOUT_REGRESSION")
        rolled_back = sim.rollback_deployment("checkout-v42")
        svc = sim.get_service("checkout-service")
        resp = RollbackDeploymentResponse(
            success=True,
            rolled_back_deployment=rolled_back,
            active_deployment_id=svc.active_deployment_id,
            service_status=svc.status,
        )
        data = json.loads(resp.model_dump_json())
        assert data["success"] is True
        assert data["rolled_back_deployment"]["deployment_id"] == "checkout-v42"
        assert data["rolled_back_deployment"]["status"] == "ROLLED_BACK"
        assert data["active_deployment_id"] == "checkout-v41"
        assert data["service_status"] == "HEALTHY"
