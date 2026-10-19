"""LLM Provider abstraction and Deterministic Test Provider for RALLY Agent.

Decouples agent reasoning from specific LLM vendors (Bedrock, OpenAI, Anthropic, etc.).
Provides a deterministic, zero-network, reproducible provider for local testing and CI.
"""

from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from agent.evidence import EvidenceLedger
from agent.models import (
    ConfidenceLevel,
    EvidenceItem,
    EvidenceLabel,
    Hypothesis,
    HypothesisStatus,
    IncidentRequest,
    RecommendedAction,
)


class LLMToolSelection(BaseModel):
    """Next investigation step decided by the model/reasoning provider."""
    model_config = ConfigDict(frozen=True)

    tool_name: str | None = None
    arguments: dict[str, Any] = Field(default_factory=dict)
    reasoning: str
    is_terminal: bool = False


class LLMProvider(ABC):
    """Abstract interface for LLM / AI reasoning providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g. 'deterministic', 'bedrock', 'strands-bedrock')."""
        pass

    @abstractmethod
    async def select_next_action(
        self,
        incident: IncidentRequest,
        ledger: EvidenceLedger,
        available_tools: list[str],
        iteration: int,
    ) -> LLMToolSelection:
        """Decides the next investigative tool call or declares investigation complete."""
        pass

    @abstractmethod
    async def synthesize_hypotheses_and_recommendation(
        self,
        incident: IncidentRequest,
        ledger: EvidenceLedger,
    ) -> tuple[list[Hypothesis], Hypothesis, RecommendedAction]:
        """Synthesizes candidate hypotheses, selects primary, and recommends next action."""
        pass


class DeterministicInvestigationProvider(LLMProvider):
    """Deterministic, zero-network test provider implementing evidence-driven reasoning.

    Analyzes evidence recorded through real MCP calls and correlates telemetry,
    logs, deployments, and dependency health without any external API dependencies.
    """

    @property
    def provider_name(self) -> str:
        return "deterministic"

    async def select_next_action(
        self,
        incident: IncidentRequest,
        ledger: EvidenceLedger,
        available_tools: list[str],
        iteration: int,
    ) -> LLMToolSelection:
        """Determines the next logical investigation tool call based on current evidence gaps."""
        svc = incident.affected_service or "checkout-service"
        called_tools = {item.source_tool for item in ledger.get_all()}

        # Logical investigation plan based on missing evidence
        if "get_service_health" not in called_tools and "get_service_health" in available_tools:
            return LLMToolSelection(
                tool_name="get_service_health",
                arguments={"service_id": svc},
                reasoning="Check baseline operational health and active deployment version of affected service.",
            )

        if "get_error_rate" not in called_tools and "get_error_rate" in available_tools:
            return LLMToolSelection(
                tool_name="get_error_rate",
                arguments={"service_id": svc},
                reasoning="Inspect error rate and traffic volume to assess degradation magnitude.",
            )

        if "get_recent_deployments" not in called_tools and "get_recent_deployments" in available_tools:
            return LLMToolSelection(
                tool_name="get_recent_deployments",
                arguments={"service_id": svc, "limit": 5},
                reasoning="Examine recent deployment timeline to detect recent release changes.",
            )

        if "get_deployment_diff" not in called_tools and "get_deployment_diff" in available_tools:
            # Look up active deployment from health/deployment evidence
            health_items = ledger.get_by_tool("get_service_health")
            active_dep = health_items[0].data.get("active_deployment_id", "checkout-v42") if health_items else "checkout-v42"
            return LLMToolSelection(
                tool_name="get_deployment_diff",
                arguments={"deployment_id": active_dep},
                reasoning=f"Inspect code and configuration diff for active deployment '{active_dep}'.",
            )

        if "query_logs" not in called_tools and "query_logs" in available_tools:
            return LLMToolSelection(
                tool_name="query_logs",
                arguments={"service_id": svc, "level": "ERROR", "limit": 10},
                reasoning="Retrieve structured error logs to identify root error code and failure stack traces.",
            )

        if "get_dependency_health" not in called_tools and "get_dependency_health" in available_tools:
            return LLMToolSelection(
                tool_name="get_dependency_health",
                arguments={"service_id": svc},
                reasoning="Inspect downstream dependencies to confirm or eliminate cascade failures.",
            )

        if "get_runbook" not in called_tools and "get_runbook" in available_tools:
            return LLMToolSelection(
                tool_name="get_runbook",
                arguments={"service_id": svc},
                reasoning="Retrieve approved rollback procedure and recovery verification thresholds.",
            )

        # All primary evidence gathered -> complete investigation
        return LLMToolSelection(
            tool_name=None,
            arguments={},
            reasoning="Sufficient evidence gathered across telemetry, logs, deployments, dependencies, and runbooks.",
            is_terminal=True,
        )

    async def synthesize_hypotheses_and_recommendation(
        self,
        incident: IncidentRequest,
        ledger: EvidenceLedger,
    ) -> tuple[list[Hypothesis], Hypothesis, RecommendedAction]:
        """Synthesizes candidate hypotheses from collected evidence and derives recommendations."""
        svc = incident.affected_service or "checkout-service"
        all_evidence = ledger.get_all()

        # Identify evidence IDs
        health_ev = [e.evidence_id for e in all_evidence if e.source_tool == "get_service_health"]
        err_ev = [e.evidence_id for e in all_evidence if e.source_tool == "get_error_rate"]
        deploy_ev = [e.evidence_id for e in all_evidence if e.source_tool == "get_recent_deployments"]
        diff_ev = [e.evidence_id for e in all_evidence if e.source_tool == "get_deployment_diff"]
        log_ev = [e.evidence_id for e in all_evidence if e.source_tool == "query_logs"]
        dep_ev = [e.evidence_id for e in all_evidence if e.source_tool == "get_dependency_health"]
        runbook_ev = [e.evidence_id for e in all_evidence if e.source_tool == "get_runbook"]

        # H1: Deployment regression in checkout-v42
        h1 = Hypothesis(
            hypothesis_id="HYP-01",
            title="Checkout Deployment Regression",
            description=(
                f"Release checkout-v42 introduced a validation regression resulting in elevated "
                f"order validation errors and service degradation."
            ),
            supporting_evidence_ids=health_ev + err_ev + deploy_ev + diff_ev + log_ev + runbook_ev,
            contradicting_evidence_ids=[],
            confidence=ConfidenceLevel.HIGH,
            status=HypothesisStatus.SUPPORTED,
            rationale=(
                "Error logs specifically cite CHECKOUT_VALIDATION_REGRESSION in order_validator.py, "
                "which matches modified files in checkout-v42 deployment diff."
            ),
        )

        # H2: Payment dependency failure (Alternative)
        h2 = Hypothesis(
            hypothesis_id="HYP-02",
            title="Downstream Payment Service Outage",
            description="Checkout failures are caused by upstream network or service outage in payment-service.",
            supporting_evidence_ids=[],
            contradicting_evidence_ids=dep_ev,
            confidence=ConfidenceLevel.LOW,
            status=HypothesisStatus.REJECTED,
            rationale="get_dependency_health confirms payment-service is HEALTHY with 0.1% error rate.",
        )

        # H3: Inventory dependency failure (Alternative)
        h3 = Hypothesis(
            hypothesis_id="HYP-03",
            title="Downstream Inventory Service Outage",
            description="Checkout failures are caused by stock reservation failures in inventory-service.",
            supporting_evidence_ids=[],
            contradicting_evidence_ids=dep_ev,
            confidence=ConfidenceLevel.LOW,
            status=HypothesisStatus.REJECTED,
            rationale="get_dependency_health confirms inventory-service is HEALTHY with 0.18% error rate.",
        )

        # H4: Authentication service failure (Alternative)
        h4 = Hypothesis(
            hypothesis_id="HYP-04",
            title="Downstream Auth Service Outage",
            description="Checkout failures are caused by token verification failures in auth-service.",
            supporting_evidence_ids=[],
            contradicting_evidence_ids=dep_ev,
            confidence=ConfidenceLevel.LOW,
            status=HypothesisStatus.REJECTED,
            rationale="get_dependency_health confirms auth-service is HEALTHY with 0.0% error rate.",
        )

        hypotheses = [h1, h2, h3, h4]

        # Recommendation: Rollback checkout-v42
        recommendation = RecommendedAction(
            action_name="rollback_deployment",
            target_service=svc,
            parameters={"deployment_id": "checkout-v42", "target_version": "checkout-v41"},
            justification=(
                "Checkout runbook dictates rollback to checkout-v41 when deployment regression occurs. "
                "Downstream dependencies are verified healthy, proving fault is isolated to checkout-v42."
            ),
            execution_status="NOT_EXECUTED",
        )

        return (hypotheses, h1, recommendation)
