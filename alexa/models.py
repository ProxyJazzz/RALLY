"""Domain models for RALLY Alexa+ MCP Conversational Integration (Phase 8).

Defines schemas for:
- ConversationalIncidentContext: Authoritative incident context across multiple interactions
- InvestigationSummaryResponse: Conversational synthesis of root cause and evidence
- ActionPlanResponse: Conversational plan and governance state
- ExecutionStatusResponse: Status of remediation execution
- VerificationStatusResponse: Status of post-remediation independent verification
- AlexaObservabilityEvent: Structured telemetry for conversational MCP tool usage
"""

from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from agent.models import ConfidenceLevel
from execution.models import RecoveryDecision
from governance.models import ApprovalDecision, PlanStatus, RiskLevel


class ConversationalIncidentState(str, Enum):
    """Lifecycle state of an incident in conversational context."""
    RECEIVED = "RECEIVED"
    INVESTIGATING = "INVESTIGATING"
    INVESTIGATED = "INVESTIGATED"
    PLANNING = "PLANNING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    EXECUTING = "EXECUTING"
    VERIFYING = "VERIFYING"
    RESOLVED = "RESOLVED"
    RECOVERY_FAILED = "RECOVERY_FAILED"
    NEEDS_HUMAN = "NEEDS_HUMAN"
    EXECUTION_BLOCKED = "EXECUTION_BLOCKED"


class ConversationalIncidentContext(BaseModel):
    """Authoritative incident state maintained across conversational turns."""
    model_config = ConfigDict(frozen=True)

    incident_id: str
    state: ConversationalIncidentState = ConversationalIncidentState.RECEIVED
    affected_service: str
    severity: str
    active_deployment_id: str = ""
    suspected_deployment_id: str = ""
    primary_hypothesis_id: str | None = None
    primary_hypothesis_title: str | None = None
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    evidence_ids: list[str] = Field(default_factory=list)
    action_plan_id: str | None = None
    action_type: str | None = None
    action_target_version: str | None = None
    approval_decision: ApprovalDecision = ApprovalDecision.PENDING
    plan_status: PlanStatus = PlanStatus.DRAFT
    risk_level: RiskLevel = RiskLevel.HIGH
    execution_status: str = "NOT_EXECUTED"
    execution_id: str | None = None
    verification_status: str | None = None
    recovery_decision: RecoveryDecision | None = None
    measured_error_rate_pct: float | None = None
    created_at: str = ""
    updated_at: str = ""


class InvestigationSummaryResponse(BaseModel):
    """Conversational response summarizing investigation findings for Alexa+."""
    model_config = ConfigDict(frozen=True)

    incident_id: str
    affected_service: str
    summary: str
    primary_root_cause: str
    confidence: str
    evidence_count: int
    key_evidence_citations: list[str] = Field(default_factory=list)
    recommended_action: str
    approval_required: bool = True


class ActionPlanResponse(BaseModel):
    """Conversational response detailing the remediation plan and governance status."""
    model_config = ConfigDict(frozen=True)

    plan_id: str
    incident_id: str
    action: str
    target_deployment: str
    reinstating_version: str
    risk_level: str
    risk_factors: list[str] = Field(default_factory=list)
    policy_decision: str
    approval_decision: str
    approval_required: bool
    execution_status: str
    conversational_instruction: str


class ExecutionStatusResponse(BaseModel):
    """Conversational response for remediation execution state."""
    model_config = ConfigDict(frozen=True)

    incident_id: str
    plan_id: str | None = None
    execution_id: str | None = None
    action_type: str | None = None
    execution_status: str
    duration_ms: float = 0.0
    message: str


class VerificationStatusResponse(BaseModel):
    """Conversational response for post-action independent recovery verification."""
    model_config = ConfigDict(frozen=True)

    incident_id: str
    execution_id: str | None = None
    verification_status: str
    recovery_decision: str
    measured_error_rate_pct: float | None = None
    service_status: str | None = None
    active_deployment_id: str | None = None
    dependencies_healthy: bool = True
    summary: str


class AlexaObservabilityEvent(BaseModel):
    """Audit event for Alexa+ conversational MCP interactions."""
    model_config = ConfigDict(frozen=True)

    timestamp: str
    correlation_id: str
    event_type: str
    tool_name: str
    incident_id: str | None = None
    duration_ms: float
    success: bool
    details: dict[str, Any] = Field(default_factory=dict)
