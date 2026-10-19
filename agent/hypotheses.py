"""Hypothesis evaluation and ranking engine for RALLY Agent.

Forms, tracks, evaluates, and ranks candidate hypotheses based on evidence
recorded in the EvidenceLedger. Ensures alternative hypotheses (e.g. dependency failures)
are evaluated and explicitly compared before a primary hypothesis is selected.
"""

from agent.evidence import EvidenceLedger
from agent.models import (
    ConfidenceLevel,
    EvidenceItem,
    Hypothesis,
    HypothesisStatus,
)


class HypothesisEvaluator:
    """Evaluates candidate hypotheses against evidence and ranks them deterministically."""

    @staticmethod
    def evaluate_hypotheses(
        hypotheses: list[Hypothesis],
        ledger: EvidenceLedger,
    ) -> list[Hypothesis]:
        """Evaluates supporting and contradicting evidence for each hypothesis."""
        all_evidence = ledger.get_all()
        evaluated: list[Hypothesis] = []

        for h in hypotheses:
            supporting_ids = list(h.supporting_evidence_ids)
            contradicting_ids = list(h.contradicting_evidence_ids)

            # Re-evaluate evidence validity: check if any contradicting evidence exists
            if contradicting_ids and not supporting_ids:
                status = HypothesisStatus.REJECTED
                conf = ConfidenceLevel.LOW
            elif supporting_ids and not contradicting_ids:
                status = HypothesisStatus.SUPPORTED
                conf = ConfidenceLevel.HIGH if len(supporting_ids) >= 3 else ConfidenceLevel.MEDIUM
            elif supporting_ids and contradicting_ids:
                status = HypothesisStatus.WEAK
                conf = ConfidenceLevel.LOW
            else:
                status = HypothesisStatus.UNRESOLVED
                conf = ConfidenceLevel.LOW

            evaluated.append(
                Hypothesis(
                    hypothesis_id=h.hypothesis_id,
                    title=h.title,
                    description=h.description,
                    supporting_evidence_ids=supporting_ids,
                    contradicting_evidence_ids=contradicting_ids,
                    confidence=conf,
                    status=status,
                    rationale=h.rationale,
                )
            )

        # Rank: SUPPORTED first (sorted by number of supporting evidence items desc), then WEAK, UNRESOLVED, REJECTED
        def sort_key(item: Hypothesis) -> tuple[int, int]:
            status_priority = {
                HypothesisStatus.SUPPORTED: 4,
                HypothesisStatus.WEAK: 3,
                HypothesisStatus.UNRESOLVED: 2,
                HypothesisStatus.REJECTED: 1,
            }
            return (status_priority.get(item.status, 0), len(item.supporting_evidence_ids))

        return sorted(evaluated, key=sort_key, reverse=True)
