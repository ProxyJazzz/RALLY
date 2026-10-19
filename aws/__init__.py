"""Package exports for RALLY AWS Integration subsystem (Phase 7)."""

from aws.bedrock import BedrockInvestigationProvider
from aws.exceptions import (
    AWSCredentialsUnavailableError,
    AWSIntegrationError,
    BedrockInvocationError,
    BedrockModelAccessError,
    EvidenceProvenanceValidationError,
    ModelResponseValidationError,
    PromptInjectionDetectedError,
)
from aws.prompts import build_bedrock_reasoning_prompt
from aws.schemas import (
    AWSObservabilityEvent,
    BedrockHypothesisSchema,
    BedrockReasoningOutput,
    BedrockRecommendationSchema,
)
from aws.strands import StrandsInvestigationAgent

__all__ = [
    "AWSCredentialsUnavailableError",
    "AWSIntegrationError",
    "AWSObservabilityEvent",
    "BedrockHypothesisSchema",
    "BedrockInvestigationProvider",
    "BedrockInvocationError",
    "BedrockModelAccessError",
    "BedrockReasoningOutput",
    "BedrockRecommendationSchema",
    "EvidenceProvenanceValidationError",
    "ModelResponseValidationError",
    "PromptInjectionDetectedError",
    "StrandsInvestigationAgent",
    "build_bedrock_reasoning_prompt",
]
