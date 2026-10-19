"""Domain models for RALLY Agentic Investigation Layer.

Defines schemas for:
- Incident requests
- Investigation state machine
- Evidence items and provenance
- Hypotheses and ranking
- Investigation configuration/bounds
- Structured and human-readable investigation reports
- Structured audit events
"""

from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class AgentState(str, Enum):
    """Reasoning and investigation lifecycle state of the RALLY Agent."""
    RECEIVED = "RECEIVED"
    UNDERSTANDING = "UNDERSTANDING"
    INVESTIGATING = "INVESTIGATING"
    ANALYZING = "ANALYZING"
    FORMING_HYPOTHESES = "FORMING_HYPOTHESES"
    RECOMMENDING = "RECOMMENDING"
    COMPLETE = "COMPLETE"
    INCONCLUSIVE = "INCONCLUSIVE"
    LIMIT_REACHED = "LIMIT_REACHED"
    FAILED = "FAILED"


class EvidenceLabel(str, Enum):
    """Evidence status / category adhering strictly to RALLY terminology."""
    OBSERVED = "OBSERVED"
    INFERRED = "INFERRED"
    PROPOSED = "PROPOSED"
    APPROVED = "APPROVED"
    EXECUTED = "EXECUTED"
    VERIFIED = "VERIFIED"


class HypothesisStatus(str, Enum):
    """Evaluation status of an operational hypothesis."""
    SUPPORTED = "SUPPORTED"
    WEAK = "WEAK"
    REJECTED = "REJECTED"
    UNRESOLVED = "UNRESOLVED"


class ConfidenceLevel(str, Enum):
    """Confidence rating for an agent conclusion."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class AgentEventType(str, Enum):
    """Structured audit events recorded during agent reasoning and investigation."""
    INCIDENT_RECEIVED = "INCIDENT_RECEIVED"
    INVESTIGATION_STARTED = "INVESTIGATION_STARTED"
    TOOL_REQUESTED = "TOOL_REQUESTED"
    TOOL_RESULT_RECEIVED = "TOOL_RESULT_RECEIVED"
    TOOL_FAILED = "TOOL_FAILED"
    EVIDENCE_RECORDED = "EVIDENCE_RECORDED"
    HYPOTHESIS_CREATED = "HYPOTHESIS_CREATED"
    HYPOTHESIS_UPDATED = "HYPOTHESIS_UPDATED"
    RECOMMENDATION_GENERATED = "RECOMMENDATION_GENERATED"
    INVESTIGATION_COMPLETED = "INVESTIGATION_COMPLETED"
    INVESTIGATION_FAILED = "INVESTIGATION_FAILED"
    LIMIT_REACHED = "LIMIT_REACHED"


class IncidentRequest(BaseModel):
    """Input request describing an operational incident requiring investigation."""
    model_config = ConfigDict(frozen=True)

    incident_id: str
    description: str
    affected_service: str | None = None
    severity: str = "HIGH"
    metadata: dict[str, Any] = Field(default_factory=dict)


class EvidenceItem(BaseModel):
    """Atomic piece of evidence collected through an approved tool or inference."""
    model_config = ConfigDict(frozen=True)

    evidence_id: str
    source_tool: str
    source_reference: str
    observation: str
    data: dict[str, Any] = Field(default_factory=dict)
    label: EvidenceLabel
    confidence: ConfidenceLevel = ConfidenceLevel.HIGH
    timestamp: str = ""


class Hypothesis(BaseModel):
    """Candidate explanation for an incident backed by traceable evidence."""
    model_config = ConfigDict(frozen=True)

    hypothesis_id: str
    title: str
    description: str
    supporting_evidence_ids: list[str] = Field(default_factory=list)
    contradicting_evidence_ids: list[str] = Field(default_factory=list)
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    status: HypothesisStatus = HypothesisStatus.UNRESOLVED
    rationale: str = ""


class RecommendedAction(BaseModel):
    """Proposed remediation recommendation resulting from an investigation."""
    model_config = ConfigDict(frozen=True)

    action_name: str
    target_service: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    justification: str
    execution_status: str = "NOT_EXECUTED"  # Invariant: Phase 4 never executes remediation


class AgentEvent(BaseModel):
    """Immutable audit record emitted during agent execution."""
    model_config = ConfigDict(frozen=True)

    timestamp: str
    agent_run_id: str
    incident_id: str
    agent_state: AgentState
    event_type: AgentEventType
    details: dict[str, Any] = Field(default_factory=dict)


class InvestigationConfig(BaseModel):
    """Runtime limits and bounds governing an agent investigation loop."""
    model_config = ConfigDict(frozen=True)

    max_tool_calls: int = 15
    max_iterations: int = 10
    max_evidence_items: int = 50
    max_hypotheses: int = 10
    max_retries_per_tool: int = 2
    timeout_seconds: float = 30.0


class InvestigationReport(BaseModel):
    """Structured, auditable report summarizing the entire investigation."""
    model_config = ConfigDict(frozen=True)

    incident_id: str
    agent_run_id: str
    affected_service: str
    severity: str
    status: AgentState
    summary: str
    evidence: list[EvidenceItem] = Field(default_factory=list)
    hypotheses: list[Hypothesis] = Field(default_factory=list)
    primary_hypothesis: Hypothesis | None = None
    confidence: ConfidenceLevel = ConfidenceLevel.HIGH
    recommended_action: RecommendedAction | None = None
    execution_status: str = "NOT_EXECUTED"
    limitations: list[str] = Field(default_factory=list)
    human_readable: str = ""
