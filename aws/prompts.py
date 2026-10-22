"""Prompt templates and untrusted operational data sanitization for Amazon Bedrock.

Enforces clear separation:
- SYSTEM INSTRUCTIONS (Immutable guidance, JSON schema contract, tool allowlist)
- TRUSTED STRUCTURED CONTEXT (Incident ID, affected service, severity)
- UNTRUSTED OPERATIONAL DATA (Logs, runbooks, tool output, user text)
"""

import re
from typing import Any
from agent.evidence import EvidenceLedger
from agent.models import IncidentRequest
from agent.policies import AgentPolicyEngine


SYSTEM_PROMPT_TEMPLATE = """You are the RALLY Reliability Reasoning Engine running on Amazon Bedrock.
Your role is to analyze collected investigation evidence and synthesize evidence-backed candidate hypotheses and a safe remediation recommendation.

CRITICAL RULES:
1. You may ONLY reference evidence IDs that exist in the provided Evidence Ledger. Never invent evidence IDs (e.g. EV-999).
2. The recommended action must be chosen strictly from authorized investigation remediation capabilities: 'rollback_deployment'.
3. Do NOT claim the action has been executed or verified. Execution is strictly deferred to downstream governance and verification.
4. Your output MUST be a single valid JSON object strictly conforming to the requested schema. No markdown backticks, no explanatory preamble.

JSON SCHEMA:
{
  "summary": "Concise summary of findings",
  "hypotheses": [
    {
      "hypothesis_id": "HYP-01",
      "title": "Short title",
      "description": "Detailed explanation",
      "supporting_evidence_ids": ["EV-001", "EV-002"],
      "contradicting_evidence_ids": [],
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "status": "SUPPORTED" | "REJECTED" | "UNRESOLVED",
      "rationale": "Evidence-grounded justification"
    }
  ],
  "primary_hypothesis_id": "HYP-01",
  "recommendation": {
    "action_name": "rollback_deployment",
    "target_service": "service_name",
    "parameters": {"deployment_id": "dep_id", "target_version": "predecessor_id"},
    "justification": "Why this action resolves the primary hypothesis"
  },
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
"""


def build_bedrock_reasoning_prompt(incident: IncidentRequest, ledger: EvidenceLedger) -> tuple[str, str]:
    """Constructs prompt with strict structural isolation of untrusted operational data.

    Returns:
        (system_prompt, user_prompt)
    """
    # 1. Format Evidence Ledger (sanitizing all untrusted operational observation strings)
    evidence_lines: list[str] = []
    for item in ledger.get_all():
        sanitized_obs = AgentPolicyEngine.sanitize_untrusted_content(item.observation)
        evidence_lines.append(
            f"- [{item.evidence_id}] Source Tool: {item.source_tool} | Label: {item.label.value} | Observation: {sanitized_obs}"
        )

    evidence_block = "\n".join(evidence_lines) if evidence_lines else "No evidence recorded yet."

    # 2. Format user prompt with isolated sections
    sanitized_desc = AgentPolicyEngine.sanitize_untrusted_content(incident.description)
    user_prompt = f"""=== TRUSTED INCIDENT METADATA ===
Incident ID: {incident.incident_id}
Affected Service: {incident.affected_service}
Severity: {incident.severity}

=== UNTRUSTED USER INCIDENT DESCRIPTION ===
{sanitized_desc}

=== EVIDENCE LEDGER (GROUND TRUTH OBSERVATIONS) ===
{evidence_block}

Synthesize candidate hypotheses (ranking primary vs. downstream dependency failure alternatives) and propose a recommended remediation action in exact JSON format.
"""
    return SYSTEM_PROMPT_TEMPLATE, user_prompt
