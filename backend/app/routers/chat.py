from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import RequestActor, get_request_actor
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat import (
    ChatModelResponseError,
    ChatModelTimeoutError,
    ChatModelUnavailableError,
    request_chat_completion,
)


router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, actor: RequestActor = Depends(get_request_actor)) -> ChatResponse:
    try:
        return await request_chat_completion(payload, actor)
    except ChatModelUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Trace is temporarily unavailable while its AI model connection is being configured.",
        ) from exc
    except ChatModelTimeoutError as exc:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc)) from exc
    except ChatModelResponseError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
