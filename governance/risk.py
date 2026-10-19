"""Deterministic Risk Assessment Engine for RALLY Remediation.

Evaluates blast radius, service criticality, reversibility, customer impact,
and evidence quality to deterministically classify operational risk.
"""

from agent.models import ConfidenceLevel
from governance.models import ProposedAction, RiskAssessment, RiskLevel

# Customer-facing tier-1 services with elevated blast radius
TIER_1_SERVICES = frozenset({
    "checkout-service",
    "payment-service",
    "auth-service",
})


class RiskEngine:
    """Deterministic, explainable risk assessment engine."""

    @staticmethod
    def assess_risk(action: ProposedAction, affected_service: str) -> RiskAssessment:
        """Calculates a deterministic risk level and structured explanatory factors."""
        factors: list[str] = []
        is_tier_1 = affected_service in TIER_1_SERVICES

        if is_tier_1:
            factors.append(f"Target service '{affected_service}' is a tier-1 customer-facing service.")
            customer_impact = "HIGH"
        else:
            factors.append(f"Target service '{affected_service}' is an internal tier-2 service.")
            customer_impact = "MEDIUM"

        if action.action_type == "rollback_deployment":
            factors.append("Action modifies active production deployment and traffic routing.")
            factors.append("Rollback is reversible via forward deployment or re-activation.")
            reversibility = "HIGH"
            blast_radius = "MODERATE_CLUSTER"

            # Check confidence of supporting evidence
            if action.confidence == ConfidenceLevel.HIGH:
                factors.append("Strong evidence provenance reduces uncertainty.")
                # Tier-1 rollback with high confidence is classified as HIGH risk (mandates human approval)
                risk_level = RiskLevel.HIGH
            elif action.confidence == ConfidenceLevel.MEDIUM:
                factors.append("Moderate evidence confidence elevates operational risk.")
                risk_level = RiskLevel.HIGH
            else:
                factors.append("Low evidence confidence elevates operational risk to CRITICAL.")
                risk_level = RiskLevel.CRITICAL

        elif action.action_type in {"restart_service", "scale_service"}:
            factors.append("Service lifecycle mutation.")
            reversibility = "HIGH"
            blast_radius = "SINGLE_SERVICE"
            risk_level = RiskLevel.MEDIUM if is_tier_1 else RiskLevel.LOW

        else:
            factors.append(f"Unrecognized or unsupported operational action '{action.action_type}'.")
            reversibility = "UNKNOWN"
            blast_radius = "UNKNOWN"
            customer_impact = "UNKNOWN"
            risk_level = RiskLevel.CRITICAL

        return RiskAssessment(
            risk_level=risk_level,
            factors=factors,
            blast_radius=blast_radius,
            reversibility=reversibility,
            customer_impact=customer_impact,
        )
