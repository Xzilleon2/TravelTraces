from __future__ import annotations

import hmac
import hashlib
import time
from dataclasses import dataclass
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import Argon2Error, VerifyMismatchError
from fastapi import HTTPException, Request, Response, status

from app.core.config import settings
from app.core.validation import normalize_group_ids, validate_safe_id


_password_hasher = PasswordHasher()


def _jwt_signing_key() -> bytes:
    return hashlib.sha256(settings.auth_secret.encode("utf-8")).digest()


@dataclass(frozen=True)
class RequestActor:
    user_id: str | None = None
    email: str | None = None
    group_ids: tuple[str, ...] = ()
    authenticated: bool = False


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except (Argon2Error, VerifyMismatchError):
        return False


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def create_access_token(*, user_id: str, email: str, group_ids: list[str]) -> tuple[str, int]:
    now = int(time.time())
    expires_at = now + settings.auth_token_ttl_s
    claims = {
        "sub": validate_safe_id(user_id, field_name="user_id"),
        "email": email.lower(),
        "groups": normalize_group_ids(group_ids),
        "iat": now,
        "exp": expires_at,
        "iss": settings.auth_issuer,
        "aud": settings.auth_audience,
    }
    return jwt.encode(claims, _jwt_signing_key(), algorithm="HS256"), expires_at


def verify_access_token(token: str) -> dict[str, Any]:
    try:
        claims = jwt.decode(
            token,
            _jwt_signing_key(),
            algorithms=["HS256"],
            issuer=settings.auth_issuer,
            audience=settings.auth_audience,
            options={"require": ["exp", "iat", "iss", "aud", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.") from exc
    claims["sub"] = validate_safe_id(str(claims.get("sub", "")), field_name="user_id")
    claims["groups"] = normalize_group_ids([str(item) for item in claims.get("groups") or []])
    return claims


async def get_request_actor(request: Request) -> RequestActor:
    token = request.cookies.get(settings.auth_cookie_name)
    if token:
        claims = verify_access_token(token)
        return RequestActor(
            user_id=str(claims["sub"]),
            email=str(claims.get("email") or ""),
            group_ids=tuple(claims["groups"]),
            authenticated=True,
        )
    if settings.require_auth:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return RequestActor()


async def require_authenticated_actor(request: Request) -> RequestActor:
    actor = await get_request_actor(request)
    if not actor.authenticated:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return actor


def effective_user_id(actor: RequestActor, fallback: str) -> str:
    return actor.user_id if actor.authenticated and actor.user_id else validate_safe_id(fallback, field_name="user_id")


def effective_group_ids(actor: RequestActor, fallback: list[str]) -> list[str]:
    if actor.authenticated:
        return list(actor.group_ids)
    return normalize_group_ids(fallback)


def ensure_group_membership(actor: RequestActor, requested_group_ids: list[str]) -> None:
    if not actor.authenticated:
        return
    unauthorized = set(requested_group_ids) - set(actor.group_ids)
    if unauthorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requested group is not visible to this user.")


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        max_age=settings.auth_token_ttl_s,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="strict",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_cookie_name,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="strict",
        path="/",
    )


def bootstrap_credentials_match(email: str, password: str) -> bool:
    configured_email = (settings.bootstrap_user_email or "").lower()
    configured_hash = settings.bootstrap_user_password_hash
    if not configured_email or not configured_hash:
        return False
    return hmac.compare_digest(email.lower(), configured_email) and verify_password(password, configured_hash)
