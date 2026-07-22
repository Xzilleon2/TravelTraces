from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.core.validation import CONTROL_CHARS_RE, STRICT_MODEL_CONFIG, TAG_RE, validate_safe_id


class ChatMessage(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    id: str = Field(..., min_length=1, max_length=160)
    role: Literal["user", "assistant", "system"]
    content: str = Field(..., min_length=1, max_length=20_000)
    created_at: datetime

    @field_validator("id")
    @classmethod
    def validate_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="message id")

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        cleaned = TAG_RE.sub("", CONTROL_CHARS_RE.sub("", value)).strip()
        if not cleaned:
            raise ValueError("message is required.")
        if len(cleaned) > 20_000:
            raise ValueError("message must be 20000 characters or fewer.")
        return cleaned


class ChatContext(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    display_name: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=240)
    interests: list[str] = Field(default_factory=list, max_length=30)


class ChatRequest(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    route: Literal["/chat"] = "/chat"
    owner_id: str = Field(..., min_length=1, max_length=120)
    conversation_id: str | None = Field(default=None, max_length=160)
    message: ChatMessage
    history: list[ChatMessage] = Field(default_factory=list, max_length=50)
    context: ChatContext = Field(default_factory=ChatContext)

    @field_validator("owner_id")
    @classmethod
    def validate_owner_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="owner_id")

    @field_validator("conversation_id")
    @classmethod
    def validate_conversation_id(cls, value: str | None) -> str | None:
        return validate_safe_id(value, field_name="conversation_id") if value else None


class ChatResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    conversation_id: str
    message: ChatMessage
    model: str | None = None
