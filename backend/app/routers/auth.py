from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.core.auth import (
    RequestActor,
    bootstrap_credentials_match,
    clear_session_cookie,
    create_access_token,
    hash_password,
    require_authenticated_actor,
    set_session_cookie,
    verify_password,
)
from app.core.config import settings
from app.core.map_store import ScopedMapStore
from app.core.mapping import utc_now
from app.core.rate_limit import enforce_login_rate_limit
from app.models.circles import AccountDeletionRequest, AccountDeletionResponse
from app.models.auth import AuthUserResponse, LoginRequest, SignupRequest


router = APIRouter(prefix="/api/auth", tags=["auth"])
store = ScopedMapStore()


@router.post("/signup", response_model=AuthUserResponse)
async def signup(response: Response, payload: SignupRequest) -> AuthUserResponse:
    base_id = payload.user_id or payload.email.split("@", 1)[0].replace(".", "-").replace("_", "-")
    user_id = base_id[:120] or "user"
    try:
        user = store.db.create_user(
            user_id=user_id,
            email=payload.email,
            password_hash=hash_password(payload.password),
            group_ids=[],
            now=utc_now(),
        )
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or username is already registered.") from exc
    token, expires_at = create_access_token(user_id=user["user_id"], email=user["email"], group_ids=user["group_ids"])
    set_session_cookie(response, token)
    return AuthUserResponse(user_id=user["user_id"], email=user["email"], group_ids=user["group_ids"], token_expires_at=expires_at)


@router.post("/login", response_model=AuthUserResponse)
async def login(request: Request, response: Response, payload: LoginRequest) -> AuthUserResponse:
    await enforce_login_rate_limit(request, payload.email)
    db_user = store.db.get_user_by_email(payload.email)
    if db_user and verify_password(payload.password, db_user["password_hash"]):
        user_id = db_user["user_id"]
        group_ids = db_user["group_ids"]
    elif settings.bootstrap_user_email and settings.bootstrap_user_password_hash and bootstrap_credentials_match(payload.email, payload.password):
        user_id = settings.bootstrap_user_id or payload.email.split("@", 1)[0]
        group_ids = settings.bootstrap_user_group_ids
        store.db.ensure_user(
            user_id=user_id,
            email=payload.email,
            password_hash=settings.bootstrap_user_password_hash,
            group_ids=group_ids,
        )
    elif not settings.bootstrap_user_email or not settings.bootstrap_user_password_hash:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication provider is not configured.",
        )
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    token, expires_at = create_access_token(
        user_id=user_id,
        email=payload.email,
        group_ids=group_ids,
    )
    set_session_cookie(response, token)
    return AuthUserResponse(
        user_id=user_id,
        email=payload.email,
        group_ids=group_ids,
        token_expires_at=expires_at,
    )


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    clear_session_cookie(response)
    return {"status": "ok"}


@router.get("/me", response_model=AuthUserResponse)
async def me(actor: RequestActor = Depends(require_authenticated_actor)) -> AuthUserResponse:
    return AuthUserResponse(
        user_id=actor.user_id or "",
        email=actor.email or "",
        group_ids=list(actor.group_ids),
        token_expires_at=0,
    )


@router.delete("/account", response_model=AccountDeletionResponse)
async def delete_account(
    response: Response,
    request: AccountDeletionRequest,
    actor: RequestActor = Depends(require_authenticated_actor),
) -> AccountDeletionResponse:
    if not actor.user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    db_user = store.db.get_user(actor.user_id)
    if db_user:
        if not verify_password(request.password, db_user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password confirmation failed.")
    elif settings.bootstrap_user_email and settings.bootstrap_user_password_hash:
        if not bootstrap_credentials_match(actor.email or "", request.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password confirmation failed.")
    deleted_counts = store.delete_user_data(actor.user_id)
    store.db.delete_user(actor.user_id)
    clear_session_cookie(response)
    return AccountDeletionResponse(status="deleted", deleted_counts=deleted_counts)
