from __future__ import annotations

import hashlib
import time

from fastapi import HTTPException, Request, status

from app.core.config import settings

try:
    import redis.asyncio as redis
except Exception:  # pragma: no cover - optional production dependency
    redis = None  # type: ignore[assignment]


_memory_buckets: dict[str, tuple[int, float]] = {}
_redis_client = None


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()
    return request.client.host if request.client else "unknown"


def _hash_key(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


async def _redis_count(key: str, window_s: int) -> int | None:
    global _redis_client
    if not settings.redis_url or redis is None:
        return None
    try:
        if _redis_client is None:
            _redis_client = redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
        count = await _redis_client.incr(key)
        if count == 1:
            await _redis_client.expire(key, window_s)
        return int(count)
    except Exception:
        return None


async def enforce_login_rate_limit(request: Request, identifier: str) -> None:
    window_s = settings.login_rate_limit_window_s
    limit = settings.login_rate_limit_count
    bucket_id = _hash_key(f"{_client_ip(request)}:{identifier.lower()}")
    key = f"rl:login:{bucket_id}"

    count = await _redis_count(key, window_s)
    if count is None:
        now = time.time()
        current_count, reset_at = _memory_buckets.get(key, (0, now + window_s))
        if now > reset_at:
            current_count, reset_at = 0, now + window_s
        count = current_count + 1
        _memory_buckets[key] = (count, reset_at)

    if count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Try again later.",
            headers={"Retry-After": str(window_s)},
        )
