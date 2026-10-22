"""Exceptions for RALLY Execution + Verification subsystem."""


class ExecutionVerificationError(Exception):
    """Base exception for execution and verification failures."""
    pass


class UnapprovedPlanExecutionError(ExecutionVerificationError):
    """Raised when an attempt is made to execute a plan that is not APPROVED."""
    pass


class PreconditionRevalidationError(ExecutionVerificationError):
    """Raised when preconditions fail revalidation immediately prior to execution (TOCTOU protection)."""
    pass


class InvalidationTriggeredError(ExecutionVerificationError):
    """Raised when an invalidation condition is triggered prior to execution."""
    pass


class ExecutionToolError(ExecutionVerificationError):
    """Raised when an MCP write tool fails during execution."""
    pass


class IdempotencyViolationError(ExecutionVerificationError):
    """Raised when attempting to execute an already executed or concurrently running action."""
    pass


class VerificationFailureError(ExecutionVerificationError):
    """Raised when independent verification fails to confirm recovery."""
    pass
