"""Deterministic Policy Engine for RALLY Planning + Governance.

Evaluates consequential actions against explicit, deterministic code rules:
  Rule 1: Consequential actions (rollback, restart, scale) require explicit human approval.
  Rule 2: Actions without operational simulator/domain support are DENIED.
  Rule 3: Actions without sufficient evidence provenance are DENIED.
  Rule 4: Low-confidence actions on Tier-1 services are DENIED.
  Rule 5: Untrusted model claims (e.g. self-approval in prompts/text) are strictly ignored.
"""

from agent.models import ConfidenceLevel
from governance.models import (
    GovernanceContext,
    PolicyDecision,
    PolicyDecisionType,
    ProposedAction,
    RiskAssessment,
)

# Consequential actions supported by current simulator capabilities
SUPPORTED_OPERATIONAL_ACTIONS = frozenset({
    "rollback_deployment",
})

# Actions that are deferred (no simulator execution backend yet)
DEFERRED_ACTIONS = frozenset({
    "restart_service",
    "scale_service",
    "create_incident",
    "send_incident_update",
    "close_incident",
})


class PolicyEngine:
    """Deterministic governance gatekeeper evaluating proposed actions against strict policy rules."""

    POLICY_VERSION = "1.0.0"

    @classmethod
    def evaluate(
        cls,
        action: ProposedAction,
        context: GovernanceContext,
        risk: RiskAssessment,
    ) -> PolicyDecision:
        """Evaluates a proposed action against deterministic governance rules."""
        rule_ids: list[str] = []

        # ---------------------------------------------------------------------
        # Rule 1: Action Support Verification
        # ---------------------------------------------------------------------
        if action.action_type not in SUPPORTED_OPERATIONAL_ACTIONS:
            rule_ids.append("RULE-01-UNSUPPORTED-ACTION")
            if action.action_type in DEFERRED_ACTIONS:
                reason = f"Action '{action.action_type}' is deferred; no deterministic execution backend exists."
            else:
                reason = f"Action '{action.action_type}' is unrecognized and forbidden by governance policy."
            return PolicyDecision(
                decision=PolicyDecisionType.DENIED,
                policy_version=cls.POLICY_VERSION,
                reason=reason,
                rule_ids=rule_ids,
                requires_human_approval=False,
            )

        # ---------------------------------------------------------------------
        # Rule 2: Evidence Provenance Verification
        # ---------------------------------------------------------------------
        if not action.evidence_ids:
            rule_ids.append("RULE-02-NO-EVIDENCE")
            return PolicyDecision(
                decision=PolicyDecisionType.DENIED,
                policy_version=cls.POLICY_VERSION,
                reason="Consequential actions cannot pass governance without supporting evidence IDs.",
                rule_ids=rule_ids,
                requires_human_approval=False,
            )

        # Verify all referenced evidence IDs actually exist in context
        available_ev_ids = {e.evidence_id for e in context.evidence}
        missing_ids = [eid for eid in action.evidence_ids if eid not in available_ev_ids]
        if missing_ids:
            rule_ids.append("RULE-02-INVALID-PROVENANCE")
            return PolicyDecision(
                decision=PolicyDecisionType.DENIED,
                policy_version=cls.POLICY_VERSION,
                reason=f"Action references invalid or invented evidence IDs: {missing_ids}.",
                rule_ids=rule_ids,
                requires_human_approval=False,
            )

        # ---------------------------------------------------------------------
        # Rule 3: Confidence & Evidence Quality Gate
        # ---------------------------------------------------------------------
        if action.confidence == ConfidenceLevel.LOW:
            rule_ids.append("RULE-03-LOW-CONFIDENCE")
            return PolicyDecision(
                decision=PolicyDecisionType.DENIED,
                policy_version=cls.POLICY_VERSION,
                reason=(
                    f"Consequential action '{action.action_type}' supported only by LOW confidence "
                    f"evidence is denied under zero-trust governance."
                ),
                rule_ids=rule_ids,
                requires_human_approval=False,
            )

        # ---------------------------------------------------------------------
        # Rule 4: Consequential Action Requires Human Approval
        # ---------------------------------------------------------------------
        rule_ids.append("RULE-04-HUMAN-APPROVAL-MANDATE")
        return PolicyDecision(
            decision=PolicyDecisionType.REQUIRES_APPROVAL,
            policy_version=cls.POLICY_VERSION,
            reason=(
                f"Action '{action.action_type}' on service '{context.affected_service}' is classified as "
                f"{risk.risk_level.value} risk. Consequential production mutations mandate explicit human approval."
            ),
            rule_ids=rule_ids,
            requires_human_approval=True,
        )
