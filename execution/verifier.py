"""Independent verification engine for RALLY (Phase 6).

Principle:
  "The same action that changes system state cannot be its own proof that recovery succeeded."

This engine independently queries operational telemetry exclusively through read-only
MCP tools (`get_service_health`, `get_error_rate`, `get_dependency_health`, `query_logs`)
and evaluates recovery against runbook thresholds.
"""

import json
import uuid
from typing import Any
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamable_http_client

from execution.models import (
    ExecutionRecord,
    VerificationCheck,
    VerificationReport,
    VerificationStatus,
)
from governance.models import ActionPlan
from simulator.domain.models import ServiceStatus


class IndependentVerifier:
    """Performs independent read-only inspection over MCP to verify incident recovery."""

    def __init__(
        self,
        server_url: str = "http://127.0.0.1:8001/mcp",
        time_provider: str = "2026-10-19T14:48:00Z",
    ):
        self.server_url = server_url
        self.fixed_time = time_provider

    async def _call_read_tool(self, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        """Calls a read-only MCP tool."""
        async with streamable_http_client(self.server_url) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                result = await session.call_tool(tool_name, arguments)
                if not result.content:
                    raise RuntimeError(f"Tool '{tool_name}' returned empty response.")
                return json.loads(result.content[0].text)

    async def verify_recovery(
        self,
        plan: ActionPlan,
        execution_record: ExecutionRecord,
        error_rate_threshold_pct: float = 1.0,
    ) -> VerificationReport:
        """Independently verifies operational recovery of the affected service."""
        service_id = plan.action.target_resource
        if service_id == "deployment":
            service_id = plan.action.parameters.get("service_id", "checkout-service")

        checks: list[VerificationCheck] = []
        verification_id = f"verif-{uuid.uuid4().hex[:8]}"

        # 1. Independent Health Check
        health_data = await self._call_read_tool("get_service_health", {"service_id": service_id})
        current_status = ServiceStatus(health_data.get("status", "FAILED"))
        active_deployment = health_data.get("active_deployment_id", "")
        status_ok = current_status == ServiceStatus.HEALTHY
        checks.append(
            VerificationCheck(
                check_name="service_health_healthy",
                description="Service status must be HEALTHY",
                expected="HEALTHY",
                actual=current_status.value,
                passed=status_ok,
                evidence_reference="mcp://get_service_health",
            )
        )

        # 2. Independent Active Deployment Check
        expected_deployment = plan.action.parameters.get("target_version", "checkout-v41")
        deployment_ok = active_deployment == expected_deployment
        checks.append(
            VerificationCheck(
                check_name="active_deployment_restored",
                description=f"Active deployment must be restored to predecessor '{expected_deployment}'",
                expected=expected_deployment,
                actual=active_deployment,
                passed=deployment_ok,
                evidence_reference="mcp://get_service_health",
            )
        )

        # 3. Independent Error Rate Measurement
        error_data = await self._call_read_tool("get_error_rate", {"service_id": service_id})
        measured_error_rate = float(error_data.get("error_rate_pct", 100.0))
        error_rate_ok = measured_error_rate < error_rate_threshold_pct
        checks.append(
            VerificationCheck(
                check_name="error_rate_below_threshold",
                description=f"Error rate must be below {error_rate_threshold_pct}%",
                expected=f"< {error_rate_threshold_pct}%",
                actual=f"{measured_error_rate}%",
                passed=error_rate_ok,
                evidence_reference="mcp://get_error_rate",
            )
        )

        # 4. Independent Downstream Dependency Health Check
        dep_data = await self._call_read_tool("get_dependency_health", {"service_id": service_id})
        dependencies = dep_data.get("dependencies", [])
        deps_healthy = all(d.get("status") == "HEALTHY" for d in dependencies)
        checks.append(
            VerificationCheck(
                check_name="downstream_dependencies_healthy",
                description="All downstream service dependencies must remain HEALTHY",
                expected="ALL_HEALTHY",
                actual="ALL_HEALTHY" if deps_healthy else "UNHEALTHY_DEPS_DETECTED",
                passed=deps_healthy,
                evidence_reference="mcp://get_dependency_health",
            )
        )

        # 5. Independent Log Inspection
        logs_data = await self._call_read_tool(
            "query_logs", {"service_id": service_id, "limit": 10}
        )
        logs = logs_data.get("logs", [])
        recent_has_critical_error = any(log.get("level") in {"CRITICAL", "ERROR"} for log in logs[-3:]) if logs else False
        checks.append(
            VerificationCheck(
                check_name="recent_logs_clean",
                description="No unhandled errors or critical exceptions in recent recovery logs",
                expected="NO_RECENT_ERRORS",
                actual="ERRORS_PRESENT" if recent_has_critical_error else "NO_RECENT_ERRORS",
                passed=not recent_has_critical_error,
                evidence_reference="mcp://query_logs",
            )
        )

        # 6. Overall Recovery Verification Synthesis
        all_passed = all(c.passed for c in checks)
        verification_status = VerificationStatus.PASSED if all_passed else VerificationStatus.FAILED

        if all_passed:
            summary = (
                f"Recovery independently verified: {service_id} returned to HEALTHY status "
                f"with active deployment '{active_deployment}', error rate {measured_error_rate}% "
                f"(below {error_rate_threshold_pct}% runbook threshold), and all downstream dependencies healthy."
            )
        else:
            failed_check_names = [c.check_name for c in checks if not c.passed]
            summary = (
                f"Independent verification FAILED: checks {failed_check_names} failed. "
                f"Measured error rate: {measured_error_rate}%, status: {current_status.value}."
            )

        return VerificationReport(
            verification_id=verification_id,
            plan_id=plan.plan_id,
            execution_id=execution_record.execution_id,
            verified_at=self.fixed_time,
            status=verification_status,
            checks=checks,
            measured_error_rate_pct=measured_error_rate,
            service_status=current_status,
            active_deployment_id=active_deployment,
            dependencies_healthy=deps_healthy,
            summary=summary,
        )
