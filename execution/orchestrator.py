"""Orchestrator for RALLY Execution + Verification subsystem (Phase 6).

Coordinates:
  1. Live operational state query over MCP
  2. Immediate precondition & invalidation revalidation (TOCTOU protection)
  3. Controlled MCP write execution (`rollback_deployment`) with idempotency
  4. Execution record creation
  5. Independent recovery verification via read MCP tools
  6. Final recovery classification (RESOLVED / RECOVERY_FAILED / NEEDS_HUMAN / EXECUTION_BLOCKED)
"""

import json
from typing import Any
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamable_http_client

from execution.exceptions import (
    ExecutionToolError,
    IdempotencyViolationError,
    InvalidationTriggeredError,
    PreconditionRevalidationError,
    UnapprovedPlanExecutionError,
)
from execution.executor import ControlledExecutor
from execution.models import (
    ControlledExecutionResult,
    ExecutionRecord,
    ExecutionStatus,
    RecoveryDecision,
    VerificationReport,
    VerificationStatus,
)
from execution.revalidator import PreconditionRevalidator
from execution.verifier import IndependentVerifier
from governance.models import ActionPlan, PlanStatus


class ExecutionOrchestrator:
    """Manages the full Phase 6 workflow: revalidate -> execute -> record -> verify -> decide."""

    def __init__(
        self,
        server_url: str = "http://127.0.0.1:8001/mcp",
        time_provider: str = "2026-10-19T14:46:00Z",
    ):
        self.server_url = server_url
        self.fixed_time = time_provider
        self.executor = ControlledExecutor(server_url=server_url, time_provider=time_provider)
        self.verifier = IndependentVerifier(server_url=server_url, time_provider=time_provider)

    async def _fetch_live_operational_state(self, service_id: str) -> dict[str, Any]:
        """Queries live operational health and dependencies over MCP."""
        async with streamable_http_client(self.server_url) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                # 1. Health & active deployment
                health_res = await session.call_tool("get_service_health", {"service_id": service_id})
                health = json.loads(health_res.content[0].text) if health_res.content else {}

                # 2. Error rate
                err_res = await session.call_tool("get_error_rate", {"service_id": service_id})
                err = json.loads(err_res.content[0].text) if err_res.content else {}

                # 3. Dependencies
                dep_res = await session.call_tool("get_dependency_health", {"service_id": service_id})
                dep = json.loads(dep_res.content[0].text) if dep_res.content else {}

                all_deps_healthy = all(d.get("status") == "HEALTHY" for d in dep.get("dependencies", []))

                return {
                    "service_id": service_id,
                    "service_status": health.get("status"),
                    "active_deployment_id": health.get("active_deployment_id"),
                    "error_rate_pct": err.get("error_rate_pct"),
                    "dependencies_status": "HEALTHY" if all_deps_healthy else "DEGRADED",
                }

    async def execute_and_verify(
        self,
        plan: ActionPlan,
        executor_actor: str = "sre-engineer@rally.internal",
        error_rate_threshold_pct: float = 1.0,
    ) -> ControlledExecutionResult:
        """Executes an approved plan after revalidation and independently verifies recovery."""
        service_id = plan.action.target_resource
        if service_id == "deployment":
            service_id = plan.action.parameters.get("service_id", "checkout-service")

        # ---------------------------------------------------------------------
        # Step 1: Pre-Execution Revalidation (TOCTOU Defense)
        # ---------------------------------------------------------------------
        try:
            live_state = await self._fetch_live_operational_state(service_id)
            PreconditionRevalidator.validate_plan_for_execution(
                plan=plan,
                live_operational_state=live_state,
                current_time=self.fixed_time,
            )
        except (UnapprovedPlanExecutionError, InvalidationTriggeredError, PreconditionRevalidationError) as err:
            # Block execution immediately
            blocked_record = ExecutionRecord(
                execution_id="exec-blocked",
                plan_id=plan.plan_id,
                action_type=plan.action.action_type,
                target_resource=plan.action.target_resource,
                target_identifier=plan.action.target_identifier,
                idempotency_key=f"exec-{plan.plan_id}-{plan.action.action_type}",
                executed_at=self.fixed_time,
                executed_by=executor_actor,
                tool_name=plan.action.action_type,
                tool_arguments={},
                tool_result={},
                status=ExecutionStatus.BLOCKED,
                duration_ms=0.0,
                error_message=str(err),
            )
            return ControlledExecutionResult(
                plan_id=plan.plan_id,
                incident_id=plan.incident_id,
                execution_record=blocked_record,
                verification_report=None,
                recovery_decision=RecoveryDecision.EXECUTION_BLOCKED,
                incident_status="EXECUTION_BLOCKED",
                explanation=f"Execution blocked prior to tool invocation: {err}",
            )

        # ---------------------------------------------------------------------
        # Step 2: Controlled MCP Write Tool Execution
        # ---------------------------------------------------------------------
        try:
            exec_record = await self.executor.execute_action(
                plan=plan,
                executor_actor=executor_actor,
            )
        except (ExecutionToolError, IdempotencyViolationError) as err:
            failed_record = ExecutionRecord(
                execution_id="exec-failed",
                plan_id=plan.plan_id,
                action_type=plan.action.action_type,
                target_resource=plan.action.target_resource,
                target_identifier=plan.action.target_identifier,
                idempotency_key=f"exec-{plan.plan_id}-{plan.action.action_type}",
                executed_at=self.fixed_time,
                executed_by=executor_actor,
                tool_name=plan.action.action_type,
                tool_arguments={},
                tool_result={},
                status=ExecutionStatus.FAILED,
                duration_ms=0.0,
                error_message=str(err),
            )
            return ControlledExecutionResult(
                plan_id=plan.plan_id,
                incident_id=plan.incident_id,
                execution_record=failed_record,
                verification_report=None,
                recovery_decision=RecoveryDecision.NEEDS_HUMAN,
                incident_status="NEEDS_HUMAN",
                explanation=f"Controlled execution failed: {err}",
            )

        # ---------------------------------------------------------------------
        # Step 3: Independent Recovery Verification (Separate Read Operations)
        # ---------------------------------------------------------------------
        verification_report = await self.verifier.verify_recovery(
            plan=plan,
            execution_record=exec_record,
            error_rate_threshold_pct=error_rate_threshold_pct,
        )

        # ---------------------------------------------------------------------
        # Step 4: Decision & Lifecycle Classification
        # ---------------------------------------------------------------------
        if verification_report.status == VerificationStatus.PASSED:
            return ControlledExecutionResult(
                plan_id=plan.plan_id,
                incident_id=plan.incident_id,
                execution_record=exec_record,
                verification_report=verification_report,
                recovery_decision=RecoveryDecision.RESOLVED,
                incident_status="RESOLVED",
                explanation=(
                    f"Action '{plan.action.action_type}' executed successfully. "
                    f"Independent verification PASSED: error rate at {verification_report.measured_error_rate_pct}% "
                    f"(< {error_rate_threshold_pct}%), active deployment '{verification_report.active_deployment_id}', "
                    f"service status HEALTHY. Incident marked RESOLVED."
                ),
            )
        else:
            return ControlledExecutionResult(
                plan_id=plan.plan_id,
                incident_id=plan.incident_id,
                execution_record=exec_record,
                verification_report=verification_report,
                recovery_decision=RecoveryDecision.RECOVERY_FAILED,
                incident_status="RECOVERY_FAILED",
                explanation=(
                    f"Action '{plan.action.action_type}' executed, but independent verification FAILED. "
                    f"{verification_report.summary}. Escalating incident to NEEDS_HUMAN."
                ),
            )
