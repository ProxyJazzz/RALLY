"""Domain models for RALLY Planning + Governance Layer.

Defines schemas for:
- ProposedAction and ActionPlan
- PlanStatus and PolicyDecisionType
- RiskLevel and RiskAssessment
- ApprovalRequest and ApprovalDecision
- Preconditions and InvalidationConditions
- GovernanceContext and GovernanceAuditEvents
"""

from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from agent.models import ConfidenceLevel, EvidenceItem, Hypothesis


class PlanStatus(str, Enum):
    """Lifecycle state of a remediation action plan."""
    DRAFT = "DRAFT"
    VALIDATING = "VALIDATING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    INVALIDATED = "INVALIDATED"


class PolicyDecisionType(str, Enum):
    """Deterministic policy evaluation outcome."""
    ALLOWED = "ALLOWED"
    DENIED = "DENIED"
    REQUIRES_APPROVAL = "REQUIRES_APPROVAL"


class RiskLevel(str, Enum):
    """Deterministic risk classification for consequential operations."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ApprovalDecision(str, Enum):
    """Status of an approval request."""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class ActorRole(str, Enum):
    """Entity initiating or deciding an action."""
    AGENT = "agent"
    SYSTEM = "system"
    POLICY_ENGINE = "policy_engine"
    HUMAN = "human"


class GovernanceEventType(str, Enum):
    """Audit events recorded during planning, policy evaluation, and approval."""
    PLAN_CREATED = "PLAN_CREATED"
    POLICY_EVALUATED = "POLICY_EVALUATED"
    RISK_ASSESSED = "RISK_ASSESSED"
    APPROVAL_REQUESTED = "APPROVAL_REQUESTED"
    APPROVAL_APPROVED = "APPROVAL_APPROVED"
    APPROVAL_REJECTED = "APPROVAL_REJECTED"
    APPROVAL_EXPIRED = "APPROVAL_EXPIRED"
    PLAN_INVALIDATED = "PLAN_INVALIDATED"
    PLAN_DENIED = "PLAN_DENIED"


class ProposedAction(BaseModel):
    """A consequential action proposed by the agent or system."""
    model_config = ConfigDict(frozen=True)

    action_id: str
    action_type: str
    target_resource: str
    target_identifier: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    reason: str
    evidence_ids: list[str] = Field(default_factory=list)
    confidence: ConfidenceLevel = ConfidenceLevel.HIGH
    source: str = "agent_recommendation"


class RiskAssessment(BaseModel):
    """Explainable risk assessment for a proposed action."""
    model_config = ConfigDict(frozen=True)

    risk_level: RiskLevel
    factors: list[str] = Field(default_factory=list)
    blast_radius: str
    reversibility: str
    customer_impact: str


class PolicyDecision(BaseModel):
    """Deterministic decision emitted by the PolicyEngine."""
    model_config = ConfigDict(frozen=True)

    decision: PolicyDecisionType
    policy_version: str
    reason: str
    rule_ids: list[str] = Field(default_factory=list)
    requires_human_approval: bool = False


class Precondition(BaseModel):
    """Condition that must hold true before an action can be executed."""
    model_config = ConfigDict(frozen=True)

    condition_id: str
    description: str
    check_type: str
    expected_value: Any


class InvalidationCondition(BaseModel):
    """Condition that invalidates an issued plan if triggered."""
    model_config = ConfigDict(frozen=True)

    condition_id: str
    description: str
    trigger_type: str


class ApprovalRequest(BaseModel):
    """Formal request for human approval of a consequential plan."""
    model_config = ConfigDict(frozen=True)

    approval_id: str
    plan_id: str
    requested_by: ActorRole = ActorRole.SYSTEM
    requested_at: str
    approver: str | None = None
    decision: ApprovalDecision = ApprovalDecision.PENDING
    reason: str = ""
    expires_at: str
    evidence_snapshot: list[str] = Field(default_factory=list)


class GovernanceContext(BaseModel):
    """Full operational and investigative context required for governance."""
    model_config = ConfigDict(frozen=True)

    incident_id: str
    affected_service: str
    severity: str
    environment: str = "production-simulated"
    evidence: list[EvidenceItem] = Field(default_factory=list)
    hypotheses: list[Hypothesis] = Field(default_factory=list)
    current_operational_state: dict[str, Any] = Field(default_factory=dict)
    policy_version: str = "1.0.0"


class ActionPlan(BaseModel):
    """Immutable, approval-ready plan defining a consequential operational action."""
    model_config = ConfigDict(frozen=True)

    plan_id: str
    plan_version: str = "1.0"
    incident_id: str
    created_at: str
    action: ProposedAction
    objective: str
    expected_outcome: str
    risk: RiskAssessment
    policy_decision: PolicyDecision
    approval: ApprovalRequest | None = None
    preconditions: list[Precondition] = Field(default_factory=list)
    invalidation_conditions: list[InvalidationCondition] = Field(default_factory=list)
    rollback_strategy: str = ""
    evidence_ids: list[str] = Field(default_factory=list)
    status: PlanStatus = PlanStatus.DRAFT
    execution_status: str = "NOT_EXECUTED"  # Invariant: Phase 5 is planning and governance only


class GovernanceEvent(BaseModel):
    """Immutable audit record emitted during planning and governance evaluation."""
    model_config = ConfigDict(frozen=True)

    timestamp: str
    incident_id: str
    plan_id: str | None = None
    approval_id: str | None = None
    event_type: GovernanceEventType
    actor: ActorRole
    details: dict[str, Any] = Field(default_factory=dict)
