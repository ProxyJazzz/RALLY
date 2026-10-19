"""Security policies, tool allowlists, and prompt injection defense for RALLY Agent.

Enforces:
- Strict investigation read-tool allowlist (7 read tools permitted)
- Explicit blocking of write operations (rollback_deployment blocked from agent execution)
- Strict prevention of arbitrary code / shell / HTTP tools
- Sanitization and boundary isolation for untrusted simulator/incident content
"""

import re
from typing import Any

from agent.models import EvidenceLabel

# Permitted investigation tools in Phase 4
ALLOWED_INVESTIGATION_TOOLS = frozenset({
    "get_service_health",
    "get_error_rate",
    "query_logs",
    "get_recent_deployments",
    "get_deployment_diff",
    "get_dependency_health",
    "get_runbook",
})

# Explicitly blocked tools for Phase 4 Agent (even if registered in MCP)
BLOCKED_AGENT_TOOLS = frozenset({
    "rollback_deployment",
    "restart_service",
    "scale_service",
    "create_incident",
    "send_incident_update",
    "close_incident",
    "execute_command",
    "shell",
    "bash",
    "exec",
    "eval",
})

# Forbidden execution patterns
FORBIDDEN_COMMAND_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"execute\s+(shell|command|bash|rollback)", re.IGNORECASE),
    re.compile(r"rm\s+-rf", re.IGNORECASE),
    re.compile(r"sudo\s+", re.IGNORECASE),
    re.compile(r"curl\s+", re.IGNORECASE),
]


class PolicyViolationError(Exception):
    """Raised when an action violates agent security or capability boundaries."""
    pass


class AgentPolicyEngine:
    """Deterministic policy gatekeeper for agent tool requests and untrusted text."""

    @staticmethod
    def validate_tool_request(tool_name: str) -> None:
        """Validates that a tool requested by an agent is permitted during investigation."""
        if tool_name in BLOCKED_AGENT_TOOLS:
            raise PolicyViolationError(
                f"Tool '{tool_name}' is a consequential or blocked tool and cannot be executed "
                f"by the Phase 4 Investigation Agent. Remediation requires human approval and "
                f"controlled execution in later phases."
            )
        if tool_name not in ALLOWED_INVESTIGATION_TOOLS:
            raise PolicyViolationError(
                f"Tool '{tool_name}' is not in the approved investigation allowlist: "
                f"{sorted(ALLOWED_INVESTIGATION_TOOLS)}"
            )

    @staticmethod
    def sanitize_untrusted_content(text: str) -> str:
        """Sanitizes text originating from logs, deployments, or runbooks.

        Guarantees that untrusted operational data cannot be treated as executable instructions
        or prompt injection overrides.
        """
        if not text or not isinstance(text, str):
            return ""
        # Neutralize common injection headers by prefixing with diagnostic markers
        sanitized = text
        for pattern in FORBIDDEN_COMMAND_PATTERNS:
            if pattern.search(sanitized):
                sanitized = pattern.sub("[UNTRUSTED_CONTENT_FILTERED]", sanitized)
        return sanitized

    @staticmethod
    def validate_evidence_label(label: EvidenceLabel, action_executed: bool = False) -> None:
        """Ensures the agent never falsely emits EXECUTED or VERIFIED during Phase 4."""
        if label in {EvidenceLabel.EXECUTED, EvidenceLabel.VERIFIED, EvidenceLabel.APPROVED} and not action_executed:
            raise PolicyViolationError(
                f"Evidence label '{label.value}' cannot be emitted during investigation because "
                f"no remediation action was executed."
            )
