"""Golden scenario fixtures and definitions for the RALLY Incident Simulator."""

from simulator.domain.models import (
    DependencyHealth,
    Deployment,
    DeploymentDiff,
    DeploymentStatus,
    FaultType,
    LogEntry,
    LogLevel,
    Runbook,
    Service,
    ServiceStatus,
    Telemetry,
)

# Canonical Services
SERVICE_CHECKOUT = "checkout-service"
SERVICE_PAYMENT = "payment-service"
SERVICE_INVENTORY = "inventory-service"
SERVICE_AUTH = "auth-service"

# Canonical Deployments
DEPLOYMENT_CHECKOUT_V41 = "checkout-v41"
DEPLOYMENT_CHECKOUT_V42 = "checkout-v42"
DEPLOYMENT_PAYMENT_V18 = "payment-v18"
DEPLOYMENT_INVENTORY_V30 = "inventory-v30"
DEPLOYMENT_AUTH_V12 = "auth-v12"

# Simulation Timestamps (Fixed, reproducible simulation epoch)
T_INIT = "2026-10-19T14:00:00Z"
T_DEPLOY = "2026-10-19T14:15:00Z"
T_FAULT = "2026-10-19T14:20:00Z"
T_INVESTIGATION = "2026-10-19T14:25:00Z"
T_ROLLBACK = "2026-10-19T14:30:00Z"
T_RECOVERED = "2026-10-19T14:35:00Z"


def get_initial_services() -> dict[str, Service]:
    """Returns baseline healthy services before any fault injection."""
    return {
        SERVICE_CHECKOUT: Service(
            service_id=SERVICE_CHECKOUT,
            name="Checkout Service",
            version="4.1.0",
            status=ServiceStatus.HEALTHY,
            active_deployment_id=DEPLOYMENT_CHECKOUT_V41,
        ),
        SERVICE_PAYMENT: Service(
            service_id=SERVICE_PAYMENT,
            name="Payment Service",
            version="1.8.4",
            status=ServiceStatus.HEALTHY,
            active_deployment_id=DEPLOYMENT_PAYMENT_V18,
        ),
        SERVICE_INVENTORY: Service(
            service_id=SERVICE_INVENTORY,
            name="Inventory Service",
            version="3.0.2",
            status=ServiceStatus.HEALTHY,
            active_deployment_id=DEPLOYMENT_INVENTORY_V30,
        ),
        SERVICE_AUTH: Service(
            service_id=SERVICE_AUTH,
            name="Auth Service",
            version="1.2.9",
            status=ServiceStatus.HEALTHY,
            active_deployment_id=DEPLOYMENT_AUTH_V12,
        ),
    }


def get_initial_deployments() -> dict[str, list[Deployment]]:
    """Returns initial deployment history per service."""
    return {
        SERVICE_CHECKOUT: [
            Deployment(
                deployment_id=DEPLOYMENT_CHECKOUT_V41,
                service_id=SERVICE_CHECKOUT,
                version="4.1.0",
                timestamp="2026-10-18T10:00:00Z",
                status=DeploymentStatus.SUCCESSFUL,
                git_commit="a4b91c2",
                description="Stable checkout release with multi-currency support",
            ),
            Deployment(
                deployment_id="checkout-v40",
                service_id=SERVICE_CHECKOUT,
                version="4.0.8",
                timestamp="2026-10-10T11:30:00Z",
                status=DeploymentStatus.SUCCESSFUL,
                git_commit="f1c88d4",
                description="Maintenance update and security patches",
            ),
        ],
        SERVICE_PAYMENT: [
            Deployment(
                deployment_id=DEPLOYMENT_PAYMENT_V18,
                service_id=SERVICE_PAYMENT,
                version="1.8.4",
                timestamp="2026-10-15T09:00:00Z",
                status=DeploymentStatus.SUCCESSFUL,
                git_commit="c3d2e1f",
                description="Payment gateway retry logic improvements",
            ),
        ],
        SERVICE_INVENTORY: [
            Deployment(
                deployment_id=DEPLOYMENT_INVENTORY_V30,
                service_id=SERVICE_INVENTORY,
                version="3.0.2",
                timestamp="2026-10-12T14:00:00Z",
                status=DeploymentStatus.SUCCESSFUL,
                git_commit="b7e4a90",
                description="Inventory reservation optimization",
            ),
        ],
        SERVICE_AUTH: [
            Deployment(
                deployment_id=DEPLOYMENT_AUTH_V12,
                service_id=SERVICE_AUTH,
                version="1.2.9",
                timestamp="2026-10-08T08:00:00Z",
                status=DeploymentStatus.SUCCESSFUL,
                git_commit="9a8b7c6",
                description="Token cache TTL adjustment",
            ),
        ],
    }


def get_deployment_diffs() -> dict[str, DeploymentDiff]:
    """Returns deployment diff records."""
    return {
        DEPLOYMENT_CHECKOUT_V42: DeploymentDiff(
            deployment_id=DEPLOYMENT_CHECKOUT_V42,
            service_id=SERVICE_CHECKOUT,
            previous_deployment_id=DEPLOYMENT_CHECKOUT_V41,
            summary="Refactor cart order validation rules and synchronous promo-code check",
            changed_files=[
                "apps/checkout/validation/order_validator.py",
                "apps/checkout/services/cart_rules.py",
                "apps/checkout/config/validation_schema.json",
            ],
            risk_level="HIGH",
        ),
        DEPLOYMENT_CHECKOUT_V41: DeploymentDiff(
            deployment_id=DEPLOYMENT_CHECKOUT_V41,
            service_id=SERVICE_CHECKOUT,
            previous_deployment_id="checkout-v40",
            summary="Multi-currency display handling and locale formatting",
            changed_files=[
                "apps/checkout/currency/formatter.py",
            ],
            risk_level="LOW",
        ),
    }


def get_dependencies() -> dict[str, list[str]]:
    """Returns dependency mapping: service_id -> list of downstream service_ids."""
    return {
        SERVICE_CHECKOUT: [SERVICE_PAYMENT, SERVICE_INVENTORY, SERVICE_AUTH],
        SERVICE_PAYMENT: [],
        SERVICE_INVENTORY: [],
        SERVICE_AUTH: [],
    }


def get_runbooks() -> dict[str, Runbook]:
    """Returns operational runbooks for services."""
    return {
        SERVICE_CHECKOUT: Runbook(
            service_id=SERVICE_CHECKOUT,
            title="Checkout Service Incident Runbook",
            summary="Operational procedures for checkout-service degradations and release regressions.",
            rollback_procedure=(
                "Rollback active deployment to the previous known-healthy deployment "
                "(e.g. checkout-v41). Verify that downstream dependencies (payment-service, "
                "inventory-service, auth-service) remain healthy throughout the operation."
            ),
            verification_steps=[
                "Verify checkout error rate drops below 1.0% within 5 minutes.",
                "Verify checkout-service status returns to HEALTHY.",
                "Confirm payment-service, inventory-service, and auth-service maintain 0% error rates.",
                "Verify availability returns to >= 99.0%.",
            ],
            recovery_error_threshold_pct=1.0,
            escalation_contacts=["oncall-reliability@rally.internal", "checkout-lead@rally.internal"],
        ),
    }


def get_baseline_telemetry(service_id: str, deployment_id: str) -> Telemetry:
    """Returns baseline healthy telemetry for a service."""
    if service_id == SERVICE_CHECKOUT:
        return Telemetry(
            service_id=SERVICE_CHECKOUT,
            deployment_id=deployment_id,
            request_count=1200,
            error_count=8,
            error_rate=0.67,  # ~0.67% healthy baseline
            latency_ms=85.0,
            availability_pct=99.33,
            timestamp=T_INIT,
        )
    elif service_id == SERVICE_PAYMENT:
        return Telemetry(
            service_id=SERVICE_PAYMENT,
            deployment_id=deployment_id,
            request_count=950,
            error_count=1,
            error_rate=0.10,
            latency_ms=120.0,
            availability_pct=99.90,
            timestamp=T_INIT,
        )
    elif service_id == SERVICE_INVENTORY:
        return Telemetry(
            service_id=SERVICE_INVENTORY,
            deployment_id=deployment_id,
            request_count=1100,
            error_count=2,
            error_rate=0.18,
            latency_ms=45.0,
            availability_pct=99.82,
            timestamp=T_INIT,
        )
    elif service_id == SERVICE_AUTH:
        return Telemetry(
            service_id=SERVICE_AUTH,
            deployment_id=deployment_id,
            request_count=1500,
            error_count=0,
            error_rate=0.0,
            latency_ms=18.0,
            availability_pct=100.0,
            timestamp=T_INIT,
        )
    return Telemetry(
        service_id=service_id,
        deployment_id=deployment_id,
        request_count=500,
        error_count=0,
        error_rate=0.0,
        latency_ms=50.0,
        availability_pct=100.0,
        timestamp=T_INIT,
    )


def get_fault_telemetry(service_id: str, deployment_id: str) -> Telemetry:
    """Returns telemetry under CHECKOUT_REGRESSION fault."""
    if service_id == SERVICE_CHECKOUT:
        return Telemetry(
            service_id=SERVICE_CHECKOUT,
            deployment_id=deployment_id,
            request_count=1000,
            error_count=184,
            error_rate=18.4,  # 18.4% degraded error rate
            latency_ms=420.0,
            availability_pct=81.6,
            timestamp=T_FAULT,
        )
    # Downstream dependencies remain completely healthy!
    return get_baseline_telemetry(service_id, deployment_id)


def get_recovered_telemetry(service_id: str, deployment_id: str) -> Telemetry:
    """Returns telemetry after successful rollback."""
    if service_id == SERVICE_CHECKOUT:
        return Telemetry(
            service_id=SERVICE_CHECKOUT,
            deployment_id=deployment_id,
            request_count=1000,
            error_count=7,
            error_rate=0.70,  # 0.7% fully recovered below threshold
            latency_ms=88.0,
            availability_pct=99.30,
            timestamp=T_RECOVERED,
        )
    return get_baseline_telemetry(service_id, deployment_id)


def get_baseline_logs(service_id: str, deployment_id: str) -> list[LogEntry]:
    """Returns normal operational logs for a healthy service."""
    if service_id == SERVICE_CHECKOUT:
        return [
            LogEntry(
                timestamp="2026-10-19T14:10:01Z",
                service_id=SERVICE_CHECKOUT,
                deployment_id=deployment_id,
                level=LogLevel.INFO,
                message="Checkout order completed successfully.",
                request_id="req-chk-1001",
            ),
            LogEntry(
                timestamp="2026-10-19T14:11:15Z",
                service_id=SERVICE_CHECKOUT,
                deployment_id=deployment_id,
                level=LogLevel.INFO,
                message="Cart validation passed for user session.",
                request_id="req-chk-1002",
            ),
            LogEntry(
                timestamp="2026-10-19T14:12:44Z",
                service_id=SERVICE_CHECKOUT,
                deployment_id=deployment_id,
                level=LogLevel.INFO,
                message="Checkout order completed successfully.",
                request_id="req-chk-1003",
            ),
        ]
    return [
        LogEntry(
            timestamp="2026-10-19T14:10:00Z",
            service_id=service_id,
            deployment_id=deployment_id,
            level=LogLevel.INFO,
            message=f"{service_id} operational health heartbeat ok.",
            request_id="req-sys-001",
        )
    ]


def get_fault_logs(service_id: str, deployment_id: str) -> list[LogEntry]:
    """Returns structured regression logs proving correlation with checkout-v42."""
    if service_id == SERVICE_CHECKOUT:
        return [
            LogEntry(
                timestamp="2026-10-19T14:15:02Z",
                service_id=SERVICE_CHECKOUT,
                deployment_id=deployment_id,
                level=LogLevel.INFO,
                message="Deployment checkout-v42 activated on production instances.",
                request_id="sys-deploy-42",
            ),
            LogEntry(
                timestamp="2026-10-19T14:16:10Z",
                service_id=SERVICE_CHECKOUT,
                deployment_id=deployment_id,
                level=LogLevel.ERROR,
                message="Checkout request failed during order validation.",
                request_id="req-chk-2041",
                error_code="CHECKOUT_VALIDATION_REGRESSION",
                extra={
                    "component": "order_validator.py",
                    "exception": "OrderValidationException: Unexpected null cart tax descriptor",
                    "cart_id": "cart_883192",
                },
            ),
            LogEntry(
                timestamp="2026-10-19T14:17:22Z",
                service_id=SERVICE_CHECKOUT,
                deployment_id=deployment_id,
                level=LogLevel.ERROR,
                message="Checkout request failed during order validation.",
                request_id="req-chk-2048",
                error_code="CHECKOUT_VALIDATION_REGRESSION",
                extra={
                    "component": "order_validator.py",
                    "exception": "OrderValidationException: Unexpected null cart tax descriptor",
                    "cart_id": "cart_883199",
                },
            ),
            LogEntry(
                timestamp="2026-10-19T14:18:05Z",
                service_id=SERVICE_CHECKOUT,
                deployment_id=deployment_id,
                level=LogLevel.WARN,
                message="Checkout error threshold exceeded: 18.4% error rate on active instances.",
                request_id="sys-mon-004",
            ),
            LogEntry(
                timestamp="2026-10-19T14:19:30Z",
                service_id=SERVICE_CHECKOUT,
                deployment_id=deployment_id,
                level=LogLevel.ERROR,
                message="Checkout request failed during order validation.",
                request_id="req-chk-2065",
                error_code="CHECKOUT_VALIDATION_REGRESSION",
                extra={
                    "component": "order_validator.py",
                    "exception": "OrderValidationException: Unexpected null cart tax descriptor",
                    "cart_id": "cart_883210",
                },
            ),
        ]
    return get_baseline_logs(service_id, deployment_id)


def get_recovery_logs(service_id: str, deployment_id: str) -> list[LogEntry]:
    """Returns recovery logs following rollback."""
    if service_id == SERVICE_CHECKOUT:
        return [
            LogEntry(
                timestamp="2026-10-19T14:30:15Z",
                service_id=SERVICE_CHECKOUT,
                deployment_id=deployment_id,
                level=LogLevel.INFO,
                message="Rollback completed: checkout-v41 reinstated as active deployment.",
                request_id="sys-rollback-01",
            ),
            LogEntry(
                timestamp="2026-10-19T14:31:00Z",
                service_id=SERVICE_CHECKOUT,
                deployment_id=deployment_id,
                level=LogLevel.INFO,
                message="Order validation succeeding across all checkout traffic.",
                request_id="req-chk-3001",
            ),
            LogEntry(
                timestamp="2026-10-19T14:33:00Z",
                service_id=SERVICE_CHECKOUT,
                deployment_id=deployment_id,
                level=LogLevel.INFO,
                message="Checkout service metrics normalized: error rate 0.70% (healthy).",
                request_id="sys-mon-005",
            ),
        ]
    return get_baseline_logs(service_id, deployment_id)
