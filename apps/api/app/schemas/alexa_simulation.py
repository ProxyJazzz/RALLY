"""Schemas for Alexa+ Simulation API endpoints (Phase 8B).

Provides typed contracts for:
- Conversational chat turns (utterances, intent parsing, assistant replies)
- Authoritative incident timeline steps and states
- Evidence items with strict epistemic labels
- Governance action plans & approval requests/decisions
- Execution & independent verification outcomes
"""

from __future__ import annotations

from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class SimulationConversationState(str, Enum):
    """Lifecycle state of an incident in the Alexa+ simulation."""
    IDLE = "IDLE"
    RECEIVED = "RECEIVED"
    TRIAGING = "TRIAGING"
    INVESTIGATING = "INVESTIGATING"
    PLANNING = "PLANNING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTING = "EXECUTING"
    VERIFYING = "VERIFYING"
    RESOLVED = "RESOLVED"
    NEEDS_HUMAN = "NEEDS_HUMAN"
    EXECUTION_BLOCKED = "EXECUTION_BLOCKED"
    RECOVERY_FAILED = "RECOVERY_FAILED"


class EpistemicLabel(str, Enum):
    """Strict evidence classification to distinguish facts from inferences."""
    OBSERVED = "OBSERVED"
    INFERRED = "INFERRED"
    PROPOSED = "PROPOSED"
    APPROVED = "APPROVED"
    EXECUTED = "EXECUTED"
    VERIFIED = "VERIFIED"


class EvidenceItemSchema(BaseModel):
    """Item in the structured evidence ledger."""
    evidence_id: str
    label: EpistemicLabel
    description: str
    source_tool: str
    timestamp: str
    details: dict[str, Any] = Field(default_factory=dict)


class TimelineStepSchema(BaseModel):
    """Timestamped operational step in the investigation/recovery timeline."""
    step_id: str
    title: str
    status: str  # "completed" | "in_progress" | "pending" | "failed"
    timestamp: str
    tool_called: str | None = None
    detail: str | None = None


class ActionPlanSchema(BaseModel):
    """Remediation plan requiring governance/approval."""
    plan_id: str
    incident_id: str
    action_type: str
    service_id: str
    target_deployment_id: str
    risk_level: str
    risk_score: int
    reason: str
    impact: str
    approval_required: bool
    status: str
    execution_status: str


class ExecutionVerificationSchema(BaseModel):
    """Structured record of execution and independent verification."""
    execution_id: str | None = None
    execution_status: str = "NOT_EXECUTED"
    executed_at: str | None = None
    mutation_details: dict[str, Any] = Field(default_factory=dict)
    verification_status: str = "PENDING"
    recovery_decision: str | None = None
    verified_at: str | None = None
    verified_health: str | None = None
    verified_error_rate: float | None = None
    verified_active_deployment: str | None = None


class AlexaSimulationStateResponse(BaseModel):
    """Complete simulation workspace snapshot for the UI."""
    incident_id: str
    state: SimulationConversationState
    service_id: str
    active_deployment: str
    suspected_deployment: str | None = None
    primary_hypothesis: str | None = None
    confidence: float = 0.0
    timeline: list[TimelineStepSchema] = Field(default_factory=list)
    evidence: list[EvidenceItemSchema] = Field(default_factory=list)
    action_plan: ActionPlanSchema | None = None
    execution_verification: ExecutionVerificationSchema = Field(
        default_factory=ExecutionVerificationSchema
    )
    last_assistant_speech: str | None = None


class ChatMessageRequest(BaseModel):
    """Incoming user voice/text utterance."""
    message: str = Field(..., min_length=1, max_length=1000)
    incident_id: str = "INC-ALEXA-GOLDEN"


class ChatMessageResponse(BaseModel):
    """Alexa+ simulation assistant reply."""
    reply: str
    state: SimulationConversationState
    is_explicit_approval: bool = False
    approval_required: bool = False
    action_plan: ActionPlanSchema | None = None
    snapshot: AlexaSimulationStateResponse


class ApprovalActionRequest(BaseModel):
    """Human SRE decision in the governance portal / UI approval gate."""
    incident_id: str
    decision: str  # "APPROVE" | "REJECT"
    approver: str = "sre-lead@rally.internal"
    reason: str = "Authorized by Lead SRE after reviewing diff and runbook."
