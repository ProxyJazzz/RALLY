"""Golden Incident Scenario executed entirely across the MCP Protocol Boundary.

Proves that an external MCP client (or future RALLY Agent) can:
  1. Detect baseline healthy state over MCP.
  2. Detect regression after fault injection over MCP (checkout-v42 active, error rate 18.4%).
  3. Correlate logs over MCP (CHECKOUT_VALIDATION_REGRESSION in checkout-v42).
  4. Inspect deployment diff over MCP (validation rule changes).
  5. Check dependencies over MCP (payment, inventory, auth remain healthy).
  6. Retrieve runbook over MCP (rollback procedure & verification threshold).
  7. Execute controlled rollback over MCP (rollback_deployment -> checkout-v41 reinstated).
  8. Verify recovery over MCP (error rate drops to 0.70%, status returns to HEALTHY).
"""

import json
import pytest
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamable_http_client

from rally_mcp.runtime import MCPServerRunner
from simulator.services.simulator import IncidentSimulator


@pytest.fixture(scope="module")
def golden_mcp_server():
    """Starts a dedicated MCP server runner for the golden scenario test."""
    sim = IncidentSimulator()
    runner = MCPServerRunner(simulator=sim)
    url = runner.start()
    yield runner, url
    runner.stop()


@pytest.mark.asyncio
async def test_golden_incident_scenario_over_mcp(golden_mcp_server):
    """End-to-end golden incident scenario executed across the real MCP protocol."""
    runner, url = golden_mcp_server
    sim = runner.simulator
    sim.reset()

    async with streamable_http_client(url) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            # -----------------------------------------------------------------
            # 1. INITIALIZE MCP CLIENT SESSION
            # -----------------------------------------------------------------
            init = await session.initialize()
            assert init.server_info.name == "rally-mcp-server"

            # -----------------------------------------------------------------
            # 2. VERIFY INITIAL HEALTHY BASELINE VIA MCP
            # -----------------------------------------------------------------
            res = await session.call_tool("get_service_health", {"service_id": "checkout-service"})
            checkout_health = json.loads(res.content[0].text)
            assert checkout_health["status"] == "HEALTHY"
            assert checkout_health["active_deployment_id"] == "checkout-v41"

            res = await session.call_tool("get_error_rate", {"service_id": "checkout-service"})
            err_data = json.loads(res.content[0].text)
            assert err_data["error_rate_pct"] == 0.67

            # -----------------------------------------------------------------
            # 3. FAULT INJECTION (SIMULATOR INJECTS CHECKOUT_REGRESSION)
            # -----------------------------------------------------------------
            sim.inject_fault("CHECKOUT_REGRESSION")

            # -----------------------------------------------------------------
            # 4. MCP INVESTIGATION: DETECT DEGRADATION VIA MCP
            # -----------------------------------------------------------------
            res = await session.call_tool("get_service_health", {"service_id": "checkout-service"})
            checkout_fault = json.loads(res.content[0].text)
            assert checkout_fault["status"] == "DEGRADED"
            assert checkout_fault["active_deployment_id"] == "checkout-v42"

            res = await session.call_tool("get_error_rate", {"service_id": "checkout-service"})
            fault_err = json.loads(res.content[0].text)
            assert fault_err["error_rate_pct"] == 18.4  # deterministic spike to 18.4%
            assert fault_err["error_count"] == 184

            # -----------------------------------------------------------------
            # 5. MCP INVESTIGATION: QUERY STRUCTURED ERROR LOGS
            # -----------------------------------------------------------------
            res = await session.call_tool("query_logs", {"service_id": "checkout-service", "level": "ERROR"})
            logs_data = json.loads(res.content[0].text)
            assert logs_data["total_returned"] >= 3
            for entry in logs_data["logs"]:
                assert entry["deployment_id"] == "checkout-v42"
                assert entry["error_code"] == "CHECKOUT_VALIDATION_REGRESSION"
                assert "OrderValidationException" in entry["extra"].get("exception", "")

            # -----------------------------------------------------------------
            # 6. MCP INVESTIGATION: INSPECT DEPLOYMENT HISTORY & CODE DIFF
            # -----------------------------------------------------------------
            res = await session.call_tool("get_recent_deployments", {"service_id": "checkout-service", "limit": 5})
            deploys_data = json.loads(res.content[0].text)
            assert deploys_data["deployments"][0]["deployment_id"] == "checkout-v42"
            assert deploys_data["deployments"][1]["deployment_id"] == "checkout-v41"

            res = await session.call_tool("get_deployment_diff", {"deployment_id": "checkout-v42"})
            diff_data = json.loads(res.content[0].text)
            assert diff_data["diff"]["risk_level"] == "HIGH"
            assert any("order_validator.py" in f for f in diff_data["diff"]["changed_files"])

            # -----------------------------------------------------------------
            # 7. MCP INVESTIGATION: VERIFY DEPENDENCIES REMAIN HEALTHY
            # -----------------------------------------------------------------
            res = await session.call_tool("get_dependency_health", {"service_id": "checkout-service"})
            deps_data = json.loads(res.content[0].text)
            assert len(deps_data["dependencies"]) == 3
            for dep in deps_data["dependencies"]:
                # Downstream dependencies are confirmed healthy
                assert dep["status"] == "HEALTHY"
                assert dep["error_rate"] < 0.5

            # -----------------------------------------------------------------
            # 8. MCP INVESTIGATION: RETRIEVE OPERATIONAL RUNBOOK
            # -----------------------------------------------------------------
            res = await session.call_tool("get_runbook", {"service_id": "checkout-service"})
            runbook_data = json.loads(res.content[0].text)
            assert runbook_data["runbook"]["recovery_error_threshold_pct"] == 1.0
            assert "checkout-v41" in runbook_data["runbook"]["rollback_procedure"]

            # -----------------------------------------------------------------
            # 9. MCP REMEDIATION: EXECUTE ROLLBACK VIA WRITE TOOL
            # -----------------------------------------------------------------
            res = await session.call_tool("rollback_deployment", {"deployment_id": "checkout-v42"})
            rollback_data = json.loads(res.content[0].text)
            assert rollback_data["success"] is True
            assert rollback_data["rolled_back_deployment"]["deployment_id"] == "checkout-v42"
            assert rollback_data["rolled_back_deployment"]["status"] == "ROLLED_BACK"
            assert rollback_data["active_deployment_id"] == "checkout-v41"
            assert rollback_data["service_status"] == "HEALTHY"

            # -----------------------------------------------------------------
            # 10. MCP VERIFICATION: INDEPENDENT TELEMETRY RECOVERY CHECK
            # -----------------------------------------------------------------
            res = await session.call_tool("get_service_health", {"service_id": "checkout-service"})
            rec_health = json.loads(res.content[0].text)
            assert rec_health["status"] == "HEALTHY"
            assert rec_health["active_deployment_id"] == "checkout-v41"

            res = await session.call_tool("get_error_rate", {"service_id": "checkout-service"})
            rec_err = json.loads(res.content[0].text)
            assert rec_err["error_rate_pct"] == 0.70  # Normalized to 0.70% (<1.0% threshold)
            assert rec_err["deployment_id"] == "checkout-v41"
