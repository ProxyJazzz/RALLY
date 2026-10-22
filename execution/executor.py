"""Controlled MCP write client and executor for RALLY.

Executes consequential write tools (specifically `rollback_deployment`) exclusively over
the official MCP Protocol (Streamable HTTP), maintaining idempotency, duration tracking,
and immutable execution audit records.
"""

import json
import time
import uuid
from typing import Any
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamable_http_client

from execution.exceptions import ExecutionToolError, IdempotencyViolationError
from execution.models import ExecutionRecord, ExecutionStatus
from governance.models import ActionPlan


class ControlledExecutor:
    """Safely executes approved actions over the MCP protocol with idempotency protection."""

    def __init__(
        self,
        server_url: str = "http://127.0.0.1:8001/mcp",
        time_provider: str = "2026-10-19T14:46:00Z",
    ):
        self.server_url = server_url
        self.fixed_time = time_provider
        self._executed_idempotency_keys: set[str] = set()
        self._execution_history: list[ExecutionRecord] = []

    def get_execution_history(self) -> list[ExecutionRecord]:
        """Returns all recorded execution events."""
        return list(self._execution_history)

    async def execute_action(
        self,
        plan: ActionPlan,
        executor_actor: str = "rally-execution-engine",
    ) -> ExecutionRecord:
        """Executes the action approved in the ActionPlan over MCP protocol."""
        # 1. Idempotency Check
        idempotency_key = f"exec-{plan.plan_id}-{plan.action.action_type}"
        if idempotency_key in self._executed_idempotency_keys:
            raise IdempotencyViolationError(
                f"Action for plan '{plan.plan_id}' with idempotency key '{idempotency_key}' "
                f"has already been executed or is currently active."
            )

        execution_id = f"exec-{uuid.uuid4().hex[:8]}"
        tool_name = plan.action.action_type
        tool_arguments: dict[str, Any] = {}

        if tool_name == "rollback_deployment":
            target_dep = plan.action.parameters.get("deployment_id", plan.action.target_identifier)
            tool_arguments = {"deployment_id": target_dep}
        else:
            raise ExecutionToolError(f"Unsupported write tool for execution: '{tool_name}'")

        start_time = time.time()

        # 2. Protocol Call to MCP Server
        try:
            async with streamable_http_client(self.server_url) as (read_stream, write_stream):
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, tool_arguments)

                    if not result.content:
                        raise ExecutionToolError(f"Empty content returned by MCP tool '{tool_name}'")

                    raw_text = result.content[0].text
                    try:
                        tool_result = json.loads(raw_text)
                    except json.JSONDecodeError as json_err:
                        raise ExecutionToolError(
                            f"Invalid JSON returned by tool '{tool_name}': {raw_text}"
                        ) from json_err

                    duration_ms = (time.time() - start_time) * 1000.0

                    # Check for tool-level error response
                    if "error" in tool_result and not tool_result.get("success", False):
                        err_msg = tool_result.get("error", {}).get("message", "Tool returned failure")
                        record = ExecutionRecord(
                            execution_id=execution_id,
                            plan_id=plan.plan_id,
                            action_type=tool_name,
                            target_resource=plan.action.target_resource,
                            target_identifier=plan.action.target_identifier,
                            idempotency_key=idempotency_key,
                            executed_at=self.fixed_time,
                            executed_by=executor_actor,
                            tool_name=tool_name,
                            tool_arguments=tool_arguments,
                            tool_result=tool_result,
                            status=ExecutionStatus.FAILED,
                            duration_ms=duration_ms,
                            error_message=err_msg,
                        )
                        self._execution_history.append(record)
                        raise ExecutionToolError(f"MCP tool execution failed: {err_msg}")

                    # Mark idempotency key as consumed
                    self._executed_idempotency_keys.add(idempotency_key)

                    record = ExecutionRecord(
                        execution_id=execution_id,
                        plan_id=plan.plan_id,
                        action_type=tool_name,
                        target_resource=plan.action.target_resource,
                        target_identifier=plan.action.target_identifier,
                        idempotency_key=idempotency_key,
                        executed_at=self.fixed_time,
                        executed_by=executor_actor,
                        tool_name=tool_name,
                        tool_arguments=tool_arguments,
                        tool_result=tool_result,
                        status=ExecutionStatus.EXECUTED,
                        duration_ms=duration_ms,
                    )
                    self._execution_history.append(record)
                    return record

        except IdempotencyViolationError:
            raise
        except ExecutionToolError:
            raise
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000.0
            record = ExecutionRecord(
                execution_id=execution_id,
                plan_id=plan.plan_id,
                action_type=tool_name,
                target_resource=plan.action.target_resource,
                target_identifier=plan.action.target_identifier,
                idempotency_key=idempotency_key,
                executed_at=self.fixed_time,
                executed_by=executor_actor,
                tool_name=tool_name,
                tool_arguments=tool_arguments,
                tool_result={},
                status=ExecutionStatus.FAILED,
                duration_ms=duration_ms,
                error_message=str(e),
            )
            self._execution_history.append(record)
            raise ExecutionToolError(f"Execution failed over MCP protocol: {e}") from e
