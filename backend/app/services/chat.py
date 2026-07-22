from __future__ import annotations

import uuid
from typing import Any

import httpx

from app.core.auth import RequestActor
from app.core.config import settings
from app.core.mapping import utc_now
from app.models.chat import ChatMessage, ChatRequest, ChatResponse


class ChatModelUnavailableError(RuntimeError):
    pass


class ChatModelTimeoutError(RuntimeError):
    pass


class ChatModelResponseError(RuntimeError):
    pass


def _response_from_payload(payload: dict[str, Any], conversation_id: str) -> ChatResponse:
    try:
        return ChatResponse.model_validate(payload)
    except ValueError:
        message_payload = payload.get("message")
        nested_content = message_payload.get("content") if isinstance(message_payload, dict) else None
        content = nested_content or payload.get("response") or payload.get("reply") or payload.get("content")
        if not isinstance(content, str) or not content.strip():
            raise ChatModelResponseError("The AI model returned an invalid response.")
        return ChatResponse(
            conversation_id=str(payload.get("conversation_id") or conversation_id),
            message=ChatMessage(
                id=f"chat-trace-{uuid.uuid4()}",
                role="assistant",
                content=content,
                created_at=utc_now(),
            ),
            model=str(payload.get("model")) if payload.get("model") else None,
        )


async def request_chat_completion(payload: ChatRequest, actor: RequestActor) -> ChatResponse:
    if not settings.chat_model_url:
        raise ChatModelUnavailableError("The Trace AI model connection is not configured.")

    conversation_id = payload.conversation_id or f"conversation-{uuid.uuid4()}"
    model_payload = payload.model_dump(mode="json")
    model_payload["conversation_id"] = conversation_id
    model_payload["owner_id"] = actor.user_id if actor.authenticated and actor.user_id else payload.owner_id

    headers = {"Content-Type": "application/json"}
    if settings.chat_model_api_key:
        headers["Authorization"] = f"Bearer {settings.chat_model_api_key}"

    try:
        async with httpx.AsyncClient(timeout=settings.chat_model_timeout_s) as client:
            response = await client.post(settings.chat_model_url, json=model_payload, headers=headers)
            response.raise_for_status()
    except httpx.TimeoutException as exc:
        raise ChatModelTimeoutError("The AI model took too long to respond.") from exc
    except httpx.HTTPError as exc:
        raise ChatModelResponseError("The AI model request failed.") from exc

    try:
        body = response.json()
    except ValueError as exc:
        raise ChatModelResponseError("The AI model did not return JSON.") from exc
    if not isinstance(body, dict):
        raise ChatModelResponseError("The AI model returned an invalid response.")
    return _response_from_payload(body, conversation_id)
