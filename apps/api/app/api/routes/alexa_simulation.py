"""FastAPI routes for Alexa+ Simulation Experience (Phase 8B).

Provides endpoints for:
- POST /api/alexa/chat: Submits a conversational message/voice intent
- GET /api/alexa/state: Retrieves the authoritative simulation workspace snapshot
- POST /api/alexa/reset: Resets simulator world to regression state
- POST /api/alexa/approve: Submits an explicit human approval or rejection to the governance gate
"""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status
from app.core.config import settings
from app.schemas.alexa_simulation import (
    AlexaSimulationStateResponse,
    ApprovalActionRequest,
    ChatMessageRequest,
    ChatMessageResponse,
)
from app.services.alexa_simulation import AlexaSimulationService

router = APIRouter(prefix="/api/alexa", tags=["Alexa+ Simulation"])


@router.get("/state", response_model=AlexaSimulationStateResponse)
async def get_simulation_state() -> AlexaSimulationStateResponse:
    """Returns current state snapshot of the Alexa+ incident workspace."""
    service = AlexaSimulationService.get_instance()
    return service.get_snapshot()


@router.post("/reset", response_model=AlexaSimulationStateResponse)
async def reset_simulation() -> AlexaSimulationStateResponse:
    """Resets simulator to baseline regression condition (checkout-v42 active, 18.4% error rate)."""
    service = AlexaSimulationService.get_instance()
    return service.reset_simulation()


@router.post("/chat", response_model=ChatMessageResponse)
async def send_chat_message(request: ChatMessageRequest) -> ChatMessageResponse:
    """Processes a conversational user message through RALLY's MCP investigation and context flow."""
    service = AlexaSimulationService.get_instance()
    try:
        return await service.handle_message(request.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing conversational request: {e}",
        ) from e


@router.post("/approve", response_model=AlexaSimulationStateResponse)
async def submit_approval_action(
    request: ApprovalActionRequest,
    authorization: str | None = Header(default=None),
    x_idempotency_key: str | None = Header(default=None),
) -> AlexaSimulationStateResponse:
    """Processes an explicit human operator approval or rejection through RALLY Governance."""
    # ── 1. Production Authorization Boundary ─────────────────────────────────
    if settings.auth_enabled:
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required: Missing Authorization header for governed approval.",
            )
        expected_token = settings.approval_auth_token
        if expected_token:
            token = authorization.removeprefix("Bearer ").strip()
            if token != expected_token:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: Invalid governance authorization token.",
                )

    # ── 2. Request Idempotency Key ───────────────────────────────────────────
    request_id = request.approval_request_id or x_idempotency_key

    service = AlexaSimulationService.get_instance()
    try:
        return await service.execute_approval_decision(
            decision=request.decision,
            approver=request.approver,
            reason=request.reason,
            request_id=request_id,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        ) from ve
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing governance approval: {e}",
        ) from e
