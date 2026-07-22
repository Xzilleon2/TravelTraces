from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from app.services.ai.ai_service import ask_groq_chat


class ChatMessage(BaseModel):
    id: str
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: str

class ChatPin(BaseModel):
    id: str
    title: str | None = None
    description: str | None = None
    latitude: float
    longitude: float
    address: str | None = None
    category: str | None = None


class ChatContext(BaseModel):
    display_name: str | None = None
    location: str | None = None
    interests: list[str] = Field(default_factory=list)
    pins: list[ChatPin] = Field(default_factory=list)


class ChatRequest(BaseModel):
    route: Literal["/chat"] = "/chat"
    owner_id: str
    conversation_id: str | None = None
    message: ChatMessage
    history: list[ChatMessage] = Field(default_factory=list)
    context: ChatContext = Field(default_factory=ChatContext)


class ChatResponseMessage(BaseModel):
    id: str
    role: Literal["assistant"]
    content: str
    created_at: str


class ChatResponse(BaseModel):
    conversation_id: str
    message: ChatResponseMessage
    model: str | None = None

router = APIRouter(prefix="/api", tags=["AI Chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    try:
        answer, model_name = await run_in_threadpool(
            ask_groq_chat,
            req.message.content,
            [turn.model_dump(exclude={"id", "created_at"}) for turn in req.history],
            req.context.display_name,
            req.context.location,
            req.context.interests,
            [pin.model_dump() for pin in req.context.pins],
        )
        conversation_id = req.conversation_id or f"chat-{uuid4().hex}"
        return ChatResponse(
            conversation_id=conversation_id,
            message=ChatResponseMessage(
                id=f"assistant-{uuid4().hex}",
                role="assistant",
                content=answer,
                created_at=datetime.now(timezone.utc).isoformat(),
            ),
            model=model_name,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
