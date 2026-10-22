"""Exceptions for RALLY Alexa+ MCP Integration subsystem (Phase 8)."""


class AlexaIntegrationError(Exception):
    """Base exception for Alexa+ MCP integration errors."""
    pass


class IncidentNotFoundError(AlexaIntegrationError):
    """Raised when an incident ID cannot be located in the active incident context store."""
    pass


class ActionPlanNotFoundError(AlexaIntegrationError):
    """Raised when an action plan ID is not found."""
    pass


class UnauthorizedConversationalApprovalError(AlexaIntegrationError):
    """Raised when an untrusted conversational request attempts to bypass human approval."""
    pass


class StaleIncidentContextError(AlexaIntegrationError):
    """Raised when operational state has materially drifted from the cached incident context."""
    pass
