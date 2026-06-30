from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect

from app.core.auth import RequestActor, effective_group_ids, effective_user_id, ensure_group_membership, get_request_actor
from app.core.config import settings
from app.core.map_store import ScopedMapStore
from app.core.mapping import WebSocketHub, utc_now
from app.core.safe_parsing import parse_json_object
from app.core.security import create_signed_token, verify_signed_token
from app.models.telemetry import (
    TelemetryEvent,
    TrackingSessionCreate,
    TrackingSessionResponse,
    TrackingTokenRequest,
    TrackingTokenResponse,
)


router = APIRouter(tags=["telemetry"])
store = ScopedMapStore()
hub = WebSocketHub()


def _claims_for(session: dict, user_id: str, group_ids: list[str]) -> dict:
    return {
        "session_id": session["session_id"],
        "scope": session["scope"],
        "user_id": user_id,
        "group_ids": group_ids,
    }


def _issue_token(session: dict, user_id: str, group_ids: list[str]) -> tuple[str, int]:
    return create_signed_token(
        claims=_claims_for(session=session, user_id=user_id, group_ids=group_ids),
        secret=settings.ws_session_secret,
        ttl_s=settings.ws_token_ttl_s,
    )


def _validate_session_access(session: dict | None, user_id: str, group_ids: list[str]) -> None:
    if not session:
        raise HTTPException(status_code=404, detail="Unknown tracking session.")
    if not store.can_view(session, user_id, group_ids):
        raise HTTPException(status_code=403, detail="Tracking session is not visible to this user or group.")


def _validate_socket_claims(session_id: str, token: str | None) -> tuple[dict, dict]:
    if not token:
        raise ValueError("Missing WebSocket token.")
    claims = verify_signed_token(token, settings.ws_session_secret)
    if claims.get("session_id") != session_id:
        raise ValueError("Token session mismatch.")
    session = store.get_tracking_session(session_id)
    if not session:
        raise ValueError("Unknown tracking session.")
    user_id = str(claims.get("user_id") or "")
    group_ids = [str(item) for item in claims.get("group_ids") or []]
    if not store.can_view(session, user_id, group_ids):
        raise ValueError("Token is not authorized for this tracking session.")
    return claims, session


@router.post("/api/tracking/sessions", response_model=TrackingSessionResponse)
async def create_tracking_session(
    request: TrackingSessionCreate,
    actor: RequestActor = Depends(get_request_actor),
) -> TrackingSessionResponse:
    session_id = request.session_id or str(uuid.uuid4())
    creator_id = effective_user_id(actor, request.creator_id)
    group_ids = request.group_ids
    ensure_group_membership(actor, group_ids)
    if request.scope == "group" and not group_ids:
        raise HTTPException(status_code=422, detail="Group tracking sessions require at least one group id.")
    record = store.create_tracking_session(
        {
            "session_id": session_id,
            "route_id": request.route_id,
            "scope": request.scope,
            "creator_id": creator_id,
            "group_ids": group_ids,
        }
    )
    token, expires_at = _issue_token(record, creator_id, group_ids)
    return TrackingSessionResponse(
        session_id=session_id,
        route_id=request.route_id,
        scope=request.scope,
        creator_id=creator_id,
        group_ids=group_ids,
        token=token,
        token_expires_at=expires_at,
        ws_path=f"/ws/{session_id}",
    )


@router.post("/api/tracking/token", response_model=TrackingTokenResponse)
async def create_tracking_token(
    request: TrackingTokenRequest,
    actor: RequestActor = Depends(get_request_actor),
) -> TrackingTokenResponse:
    session = store.get_tracking_session(request.session_id)
    user_id = effective_user_id(actor, request.user_id)
    group_ids = effective_group_ids(actor, request.group_ids)
    ensure_group_membership(actor, group_ids)
    _validate_session_access(session, user_id, group_ids)
    token, expires_at = _issue_token(session, user_id, group_ids)  # type: ignore[arg-type]
    return TrackingTokenResponse(
        session_id=request.session_id,
        token=token,
        token_expires_at=expires_at,
        ws_path=f"/ws/{request.session_id}",
    )


@router.websocket("/ws/{session_id}")
async def telemetry_socket(websocket: WebSocket, session_id: str) -> None:
    token = websocket.query_params.get("token")
    try:
        claims, session = _validate_socket_claims(session_id, token)
    except ValueError:
        await websocket.close(code=1008)
        return

    await hub.connect(session_id, websocket)
    user_id = str(claims.get("user_id"))
    try:
        await websocket.send_json(
            {
                "type": "session.accepted",
                "data": {
                    "session_id": session_id,
                    "scope": session["scope"],
                    "user_id": user_id,
                    "group_ids": claims.get("group_ids") or [],
                },
                "sent_at": utc_now(),
            }
        )
        while True:
            raw_event = await websocket.receive_text()
            try:
                payload = parse_json_object(raw_event, max_bytes=settings.max_ws_message_bytes)
                event = TelemetryEvent(**payload)
            except Exception:
                await websocket.send_json({"type": "error", "data": {"message": "Invalid telemetry event."}, "sent_at": utc_now()})
                continue

            if event.type == "ping":
                await websocket.send_json({"type": "pong", "data": {"session_id": session_id}, "sent_at": utc_now()})
                continue

            if event.lat is None or event.lon is None:
                await websocket.send_json({"type": "error", "data": {"message": "Location update requires lat and lon."}, "sent_at": utc_now()})
                continue

            payload = {
                "session_id": session_id,
                "user_id": user_id,
                "current": [event.lat, event.lon],
                "accuracy_m": event.accuracy_m,
                "scope": session["scope"],
                "group_ids": session.get("group_ids") or [],
                "updated_at": utc_now(),
            }
            store.update_tracking_location(session_id, payload)
            await hub.broadcast(session_id, {"type": "location.updated", "data": payload, "sent_at": utc_now()})
    except WebSocketDisconnect:
        await hub.disconnect(session_id, websocket)
    except Exception:
        await hub.disconnect(session_id, websocket)
        await websocket.close(code=1011)
