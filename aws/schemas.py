"""Structured schemas for Amazon Bedrock and Strands Agentic Reasoning in RALLY.

Enforces that LLM output is parsed into strict Pydantic models with validated
evidence provenance, rather than arbitrary free-form strings.
"""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from agent.models import ConfidenceLevel, HypothesisStatus


class BedrockHypothesisSchema(BaseModel):
    """Structured hypothesis schema expected from Bedrock model reasoning."""
    model_config = ConfigDict(frozen=True)

    hypothesis_id: str
    title: str
    description: str
    supporting_evidence_ids: list[str] = Field(default_factory=list)
    contradicting_evidence_ids: list[str] = Field(default_factory=list)
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    status: HypothesisStatus = HypothesisStatus.UNRESOLVED
    rationale: str = ""


class BedrockRecommendationSchema(BaseModel):
    """Structured recommendation schema expected from Bedrock model reasoning."""
    model_config = ConfigDict(frozen=True)

    action_name: str
    target_service: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    justification: str


class BedrockReasoningOutput(BaseModel):
    """Full structured output returned by Amazon Bedrock reasoning prompts."""
    model_config = ConfigDict(frozen=True)

    summary: str
    hypotheses: list[BedrockHypothesisSchema] = Field(default_factory=list)
    primary_hypothesis_id: str
    recommendation: BedrockRecommendationSchema
    confidence: ConfidenceLevel = ConfidenceLevel.HIGH


class AWSObservabilityEvent(BaseModel):
    """Structured observability audit event for AWS Bedrock / Strands interactions."""
    model_config = ConfigDict(frozen=True)

    timestamp: str
    incident_id: str
    event_type: str  # e.g. AWS_REASONING_STARTED, AWS_REASONING_COMPLETED, AWS_REASONING_FAILED
    provider: str
    model_id: str
    duration_ms: float
    success: bool
    details: dict[str, Any] = Field(default_factory=dict)
