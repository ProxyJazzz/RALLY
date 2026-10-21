"""FastAPI routes for Alexa+ Simulation Experience (Phase 8B).

Provides endpoints for:
- POST /api/alexa/chat: Submits a conversational message/voice intent
- GET /api/alexa/state: Retrieves the authoritative simulation workspace snapshot
- POST /api/alexa/reset: Resets simulator world to regression state
- POST /api/alexa/approve: Submits an explicit human approval or rejection to the governance gate
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from apps.api.app.schemas.alexa_simulation import (
    AlexaSimulationStateResponse,
    ApprovalActionRequest,
    ChatMessageRequest,
    ChatMessageResponse,
)
from apps.api.app.services.alexa_simulation import AlexaSimulationService

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
async def submit_approval_action(request: ApprovalActionRequest) -> AlexaSimulationStateResponse:
    """Processes an explicit human operator approval or rejection through RALLY Governance."""
    service = AlexaSimulationService.get_instance()
    try:
        return await service.execute_approval_decision(
            decision=request.decision,
            approver=request.approver,
            reason=request.reason,
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
