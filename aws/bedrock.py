"""Amazon Bedrock client adapter and reasoning provider for RALLY Agent.

Implements real integration with the Amazon Bedrock Runtime API (`converse` or `invoke_model`)
via `boto3.client('bedrock-runtime')`.

Features:
- Bounded token limits and request timeouts
- Bounded retry behavior with exponential backoff
- Safe error envelope handling without secret leakage
- Strict structural parsing and validation of JSON model responses
- Evidence provenance validation: ensures every referenced evidence ID exists in the EvidenceLedger
- Emits structured AWSObservabilityEvent audit records
"""

import json
import os
import time
from typing import Any

from agent.evidence import EvidenceLedger
from agent.models import (
    ConfidenceLevel,
    Hypothesis,
    HypothesisStatus,
    IncidentRequest,
    RecommendedAction,
)
from agent.providers import DeterministicInvestigationProvider, LLMProvider, LLMToolSelection
from aws.exceptions import (
    AWSCredentialsUnavailableError,
    BedrockInvocationError,
    BedrockModelAccessError,
    EvidenceProvenanceValidationError,
    ModelResponseValidationError,
)
from aws.prompts import build_bedrock_reasoning_prompt
from aws.schemas import AWSObservabilityEvent, BedrockReasoningOutput


class BedrockInvestigationProvider(LLMProvider):
    """Amazon Bedrock backed reasoning provider for investigation and hypothesis synthesis."""

    def __init__(
        self,
        model_id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0",
        region_name: str | None = None,
        max_tokens: int = 4096,
        timeout_seconds: float = 30.0,
        max_retries: int = 2,
        bedrock_client: Any | None = None,
    ):
        self.model_id = model_id
        self.region_name = region_name or os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION")
        self.max_tokens = max_tokens
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        self._custom_client = bedrock_client
        self._events: list[AWSObservabilityEvent] = []

    @property
    def provider_name(self) -> str:
        return "bedrock"

    def get_events(self) -> list[AWSObservabilityEvent]:
        """Returns recorded AWS observability audit events."""
        return list(self._events)

    def _get_client(self) -> Any:
        """Initializes or returns the boto3 Bedrock Runtime client."""
        if self._custom_client is not None:
            return self._custom_client

        if not self.region_name:
            raise AWSCredentialsUnavailableError(
                "AWS region is not configured. Set AWS_REGION or AWS_DEFAULT_REGION."
            )

        try:
            import boto3
            from botocore.config import Config

            boto_config = Config(
                region_name=self.region_name,
                connect_timeout=self.timeout_seconds,
                read_timeout=self.timeout_seconds,
                retries={"max_attempts": self.max_retries, "mode": "standard"},
            )
            return boto3.client("bedrock-runtime", config=boto_config)
        except Exception as e:
            raise AWSCredentialsUnavailableError(f"Failed to initialize AWS Bedrock client: {e}") from e

    async def select_next_action(
        self,
        incident: IncidentRequest,
        ledger: EvidenceLedger,
        available_tools: list[str],
        iteration: int,
    ) -> LLMToolSelection:
        """Directs investigation step based on evidence gaps.

        Note: Bedrock is utilized for deep evidence correlation and synthesis.
        Tool selection follows bounded gap analysis to ensure complete coverage.
        """
        deterministic_fallback = DeterministicInvestigationProvider()
        return await deterministic_fallback.select_next_action(
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
        """Invokes Amazon Bedrock to synthesize evidence-backed candidate hypotheses and a recommendation."""
        system_prompt, user_prompt = build_bedrock_reasoning_prompt(incident, ledger)
        start_time = time.time()

        try:
            client = self._get_client()

            # Format payload for Bedrock Converse API or Claude Messages API
            # Converse API is the modern, unified Amazon Bedrock API for all models
            response = client.converse(
                modelId=self.model_id,
                system=[{"text": system_prompt}],
                messages=[
                    {
                        "role": "user",
                        "content": [{"text": user_prompt}],
                    }
                ],
                inferenceConfig={
                    "maxTokens": self.max_tokens,
                    "temperature": 0.0,
                },
            )

            duration_ms = (time.time() - start_time) * 1000.0

            # Extract output text
            output_msg = response.get("output", {}).get("message", {})
            content_blocks = output_msg.get("content", [])
            raw_text = content_blocks[0].get("text", "") if content_blocks else ""

            # Parse and validate JSON structure
            validated_output = self._validate_and_parse_response(raw_text, ledger)

            # Record success event
            self._events.append(
                AWSObservabilityEvent(
                    timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    incident_id=incident.incident_id,
                    event_type="AWS_REASONING_COMPLETED",
                    provider=self.provider_name,
                    model_id=self.model_id,
                    duration_ms=duration_ms,
                    success=True,
                    details={"hypotheses_count": len(validated_output.hypotheses)},
                )
            )

            # Map to domain Hypothesis and RecommendedAction models
            hypotheses: list[Hypothesis] = []
            for h in validated_output.hypotheses:
                hypotheses.append(
                    Hypothesis(
                        hypothesis_id=h.hypothesis_id,
                        title=h.title,
                        description=h.description,
                        supporting_evidence_ids=h.supporting_evidence_ids,
                        contradicting_evidence_ids=h.contradicting_evidence_ids,
                        confidence=h.confidence,
                        status=h.status,
                        rationale=h.rationale,
                    )
                )

            primary_hyp = next(
                (h for h in hypotheses if h.hypothesis_id == validated_output.primary_hypothesis_id),
                hypotheses[0] if hypotheses else None,
            )

            rec = validated_output.recommendation
            recommendation = RecommendedAction(
                action_name=rec.action_name,
                target_service=rec.target_service,
                parameters=rec.parameters,
                justification=rec.justification,
                execution_status="NOT_EXECUTED",
            )

            return hypotheses, primary_hyp, recommendation

        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000.0
            self._events.append(
                AWSObservabilityEvent(
                    timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    incident_id=incident.incident_id,
                    event_type="AWS_REASONING_FAILED",
                    provider=self.provider_name,
                    model_id=self.model_id,
                    duration_ms=duration_ms,
                    success=False,
                    details={"error": str(e)},
                )
            )
            if isinstance(e, (AWSCredentialsUnavailableError, ModelResponseValidationError, EvidenceProvenanceValidationError)):
                raise
            raise BedrockInvocationError(f"Bedrock invocation failed for model '{self.model_id}': {e}") from e

    def _validate_and_parse_response(
        self,
        raw_text: str,
        ledger: EvidenceLedger,
    ) -> BedrockReasoningOutput:
        """Parses model response JSON and strictly validates schema and evidence provenance."""
        # Clean potential markdown wrapping (e.g. ```json ... ```)
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()

        try:
            parsed_json = json.loads(cleaned)
        except json.JSONDecodeError as err:
            raise ModelResponseValidationError(
                f"Model response was not valid JSON: {err}. Raw output snippet: '{cleaned[:200]}'"
            ) from err

        try:
            output = BedrockReasoningOutput.model_validate(parsed_json)
        except Exception as err:
            raise ModelResponseValidationError(
                f"Model response failed Pydantic schema validation: {err}"
            ) from err

        # CRITICAL PROVENANCE CHECK: Every referenced evidence ID must exist in ledger
        existing_evidence_ids = {e.evidence_id for e in ledger.get_all()}
        for h in output.hypotheses:
            for eid in h.supporting_evidence_ids + h.contradicting_evidence_ids:
                if eid not in existing_evidence_ids:
                    raise EvidenceProvenanceValidationError(
                        f"Model cited non-existent evidence ID '{eid}' in hypothesis '{h.hypothesis_id}'. "
                        f"Allowed IDs from ledger: {sorted(existing_evidence_ids)}"
                    )

        # Enforce that action_name is supported investigation capability
        if output.recommendation.action_name != "rollback_deployment":
            raise ModelResponseValidationError(
                f"Model proposed unauthorized action '{output.recommendation.action_name}'. "
                f"Only 'rollback_deployment' is permitted."
            )

        return output
