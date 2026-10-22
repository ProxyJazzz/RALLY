"""Governance and Planning Domain Exceptions for RALLY."""


class GovernanceError(Exception):
    """Base exception for all planning and governance errors."""
    pass


class PolicyRejectionError(GovernanceError):
    """Raised when an action or plan is denied by deterministic policy."""
    def __init__(self, reason: str):
        super().__init__(f"Action denied by governance policy: {reason}")
        self.reason = reason


class InvalidEvidenceProvenanceError(GovernanceError):
    """Raised when an action plan references non-existent or invalid evidence IDs."""
    def __init__(self, missing_ids: list[str]):
        super().__init__(f"Action references invalid evidence IDs: {missing_ids}")
        self.missing_ids = missing_ids


class UnsupportedActionError(GovernanceError):
    """Raised when an action type is not supported by the operational domain."""
    def __init__(self, action_type: str):
        super().__init__(f"Action '{action_type}' is not supported by the operational domain.")
        self.action_type = action_type


class StalePlanError(GovernanceError):
    """Raised when preconditions fail or operational state has changed since plan creation."""
    def __init__(self, message: str):
        super().__init__(f"Plan invalidation: {message}")
        self.message = message


class ApprovalError(GovernanceError):
    """Raised when an approval state transition is invalid or forbidden."""
    pass
