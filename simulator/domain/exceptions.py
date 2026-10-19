"""Typed exceptions for RALLY Incident Simulator."""


class SimulatorError(Exception):
    """Base exception for all simulator errors."""
    pass


class ServiceNotFoundError(SimulatorError):
    """Raised when a requested service ID does not exist."""
    def __init__(self, service_id: str):
        super().__init__(f"Service '{service_id}' not found in simulator.")
        self.service_id = service_id


class DeploymentNotFoundError(SimulatorError):
    """Raised when a requested deployment ID does not exist."""
    def __init__(self, deployment_id: str):
        super().__init__(f"Deployment '{deployment_id}' not found in simulator.")
        self.deployment_id = deployment_id


class FaultNotSupportedError(SimulatorError):
    """Raised when an unrecognized or unsupported fault type is requested."""
    def __init__(self, fault_type: str):
        super().__init__(f"Fault '{fault_type}' is not supported by the simulator.")
        self.fault_type = fault_type


class InvalidStateTransitionError(SimulatorError):
    """Raised when an operation is invalid for current simulator state."""
    def __init__(self, message: str):
        super().__init__(message)


class RollbackUnavailableError(SimulatorError):
    """Raised when rollback cannot be performed for a deployment."""
    def __init__(self, deployment_id: str, reason: str):
        super().__init__(f"Rollback unavailable for deployment '{deployment_id}': {reason}")
        self.deployment_id = deployment_id
        self.reason = reason


class InvalidIdentifierError(SimulatorError):
    """Raised when an identifier fails validation (e.g., contains disallowed characters)."""
    def __init__(self, identifier: str, reason: str = "Invalid identifier format"):
        super().__init__(f"{reason}: '{identifier}'")
        self.identifier = identifier
