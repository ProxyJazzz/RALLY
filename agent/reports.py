"""Report formatting utilities for RALLY Agentic Investigation.

Formats structured investigation reports into concise, clear, human-readable
markdown presentations following Section 21 specifications.
"""

from agent.models import InvestigationReport


def format_human_readable_report(report: InvestigationReport) -> str:
    """Formats an InvestigationReport into the canonical human-readable structure."""
    lines = [
        "INCIDENT",
        report.incident_id,
        "",
        "AFFECTED SERVICE",
        report.affected_service,
        "",
        "ASSESSMENT",
        report.primary_hypothesis.description if report.primary_hypothesis else report.summary,
        "",
        "EVIDENCE",
    ]

    for ev in report.evidence:
        lines.append(f"• [{ev.evidence_id}] ({ev.label.value}) {ev.observation}")

    lines.extend([
        "",
        "CONFIDENCE",
        report.confidence.value,
        "",
        "RECOMMENDATION",
    ])

    if report.recommended_action:
        act = report.recommended_action
        param_str = ", ".join(f"{k}={v}" for k, v in act.parameters.items())
        lines.append(f"{act.action_name}({param_str}): {act.justification}")
    else:
        lines.append("No automated remediation recommended.")

    lines.extend([
        "",
        "EXECUTION",
        report.execution_status,  # Invariant: Must remain NOT_EXECUTED in Phase 4
    ])

    return "\n".join(lines)
