from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
import uuid
from typing import Any

from app.core.safe_parsing import parse_json_object


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("ascii"))


def create_signed_token(claims: dict[str, Any], secret: str, ttl_s: int) -> tuple[str, int]:
    expires_at = int(time.time()) + ttl_s
    payload = {
        **claims,
        "exp": expires_at,
        "iat": int(time.time()),
        "nonce": str(uuid.uuid4()),
    }
    payload_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).digest()
    return f"{_b64url(payload_bytes)}.{_b64url(signature)}", expires_at


def verify_signed_token(token: str, secret: str) -> dict[str, Any]:
    try:
        payload_part, signature_part = token.split(".", 1)
        payload_bytes = _b64url_decode(payload_part)
        expected = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).digest()
        supplied = _b64url_decode(signature_part)
    except Exception as exc:
        raise ValueError("Malformed token.") from exc

    if not hmac.compare_digest(expected, supplied):
        raise ValueError("Invalid token signature.")

    payload = parse_json_object(payload_bytes, max_bytes=8192)
    if int(payload.get("exp", 0)) < int(time.time()):
        raise ValueError("Expired token.")
    return payload
