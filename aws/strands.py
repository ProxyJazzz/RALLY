"""Strands Agent orchestration pattern adapter for RALLY.

Implements an agentic orchestration layer modeling multi-phase reasoning:
  1. Evidence Analysis & Gap Detection
  2. Competing Hypothesis Formulation & Downstream Outage Elimination
  3. Safe Remediation Recommendation

The Strands adapter coordinates reasoning cycles through Amazon Bedrock while
strictly preserving:
  - Real MCP protocol tool boundary (zero direct simulator imports)
  - Strict read-only tool allowlist during investigation
  - Evidence provenance verification
  - Mandatory downstream deterministic governance gate
"""

import time
from typing import Any

from agent.evidence import EvidenceLedger
from agent.mcp_client import AgentMCPClient
from agent.models import (
    ConfidenceLevel,
    Hypothesis,
    IncidentRequest,
    RecommendedAction,
)
from agent.providers import LLMProvider, LLMToolSelection
from aws.bedrock import BedrockInvestigationProvider
from aws.schemas import AWSObservabilityEvent


class StrandsInvestigationAgent(LLMProvider):
    """Strands-pattern Agent coordinating multi-step reasoning cycles with Amazon Bedrock."""

    def __init__(
        self,
        mcp_client: AgentMCPClient,
        bedrock_provider: BedrockInvestigationProvider | None = None,
        model_id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0",
    ):
        self.mcp_client = mcp_client
        self.bedrock_provider = (
            bedrock_provider if bedrock_provider is not None else BedrockInvestigationProvider(model_id=model_id)
        )
        self._events: list[AWSObservabilityEvent] = []

    @property
    def provider_name(self) -> str:
        return "strands-bedrock"

    def get_events(self) -> list[AWSObservabilityEvent]:
        """Returns all recorded AWS Strands observability events."""
        return list(self._events) + self.bedrock_provider.get_events()

    async def select_next_action(
        self,
        incident: IncidentRequest,
        ledger: EvidenceLedger,
        available_tools: list[str],
        iteration: int,
    ) -> LLMToolSelection:
        """Strands Agent orchestrates tool selection based on investigation evidence gaps."""
        return await self.bedrock_provider.select_next_action(
            incident=incident,
            ledger=ledger,
            available_tools=available_tools,
            iteration=iteration,
        )

    async def synthesize_hypotheses_and_recommendation(
        self,
        incident: IncidentRequest,
        ledger: EvidenceLedger,
    ) -> tuple[list[Hypothesis], Hypothesis, RecommendedAction]:
        """Orchestrates evidence correlation and hypothesis evaluation through Bedrock."""
        start_time = time.time()
        self._events.append(
            AWSObservabilityEvent(
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                incident_id=incident.incident_id,
                event_type="STRANDS_REASONING_CYCLE_STARTED",
                provider=self.provider_name,
                model_id=self.bedrock_provider.model_id,
                duration_ms=0.0,
                success=True,
                details={"evidence_items_count": ledger.count()},
            )
        )

        hypotheses, primary_hyp, rec = await self.bedrock_provider.synthesize_hypotheses_and_recommendation(
            incident=incident,
            ledger=ledger,
        )

        duration_ms = (time.time() - start_time) * 1000.0
        self._events.append(
            AWSObservabilityEvent(
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                incident_id=incident.incident_id,
                event_type="STRANDS_REASONING_CYCLE_COMPLETED",
                provider=self.provider_name,
                model_id=self.bedrock_provider.model_id,
                duration_ms=duration_ms,
                success=True,
                details={
                    "primary_hypothesis": primary_hyp.title if primary_hyp else None,
                    "recommended_action": rec.action_name,
                },
            )
        )

        return hypotheses, primary_hyp, rec
