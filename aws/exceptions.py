"""Exceptions for RALLY AWS Integration subsystem (Phase 7)."""


class AWSIntegrationError(Exception):
    """Base exception for AWS integration errors."""
    pass


class AWSCredentialsUnavailableError(AWSIntegrationError):
    """Raised when AWS credentials or session tokens cannot be resolved."""
    pass


class BedrockModelAccessError(AWSIntegrationError):
    """Raised when the specified Amazon Bedrock model cannot be accessed or is unavailable in the region."""
    pass


class BedrockInvocationError(AWSIntegrationError):
    """Raised when an API call to Bedrock fails (e.g. throttling, network, server error)."""
    pass


class ModelResponseValidationError(AWSIntegrationError):
    """Raised when structured JSON returned by Bedrock fails Pydantic schema validation."""
    pass


class EvidenceProvenanceValidationError(AWSIntegrationError):
    """Raised when an LLM references evidence IDs that do not exist in the EvidenceLedger."""
    pass


class PromptInjectionDetectedError(AWSIntegrationError):
    """Raised when an untrusted operational payload contains adversarial instructions."""
    pass
