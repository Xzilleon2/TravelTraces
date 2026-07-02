from __future__ import annotations

from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse

from app.core.config import settings


CSP = (
    "default-src 'self'; "
    "connect-src 'self' https://api.maptiler.com https://*.maptiler.com https://router.project-osrm.org https://nominatim.openstreetmap.org "
    "https://photon.komoot.io https://*.tile.openstreetmap.org https://server.arcgisonline.com wss: ws:; "
    "img-src 'self' data: blob: https://api.maptiler.com https://*.maptiler.com https://*.tile.openstreetmap.org https://server.arcgisonline.com https://images.unsplash.com; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' data: https://api.maptiler.com https://*.maptiler.com https://fonts.gstatic.com; "
    "script-src 'self'; "
    "worker-src 'self' blob:; "
    "media-src 'self' blob: data:; "
    "manifest-src 'self'; "
    "object-src 'none'; "
    "base-uri 'self'; "
    "form-action 'self'; "
    "frame-ancestors 'none'"
)

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(self), geolocation=(self), microphone=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Content-Security-Policy": CSP,
}


async def security_middleware(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > settings.max_request_bytes:
                return JSONResponse({"detail": "Request body too large."}, status_code=413)
        except ValueError:
            return JSONResponse({"detail": "Invalid Content-Length header."}, status_code=400)

    response = await call_next(request)
    for key, value in SECURITY_HEADERS.items():
        response.headers.setdefault(key, value)
    if request.url.path.startswith("/api/"):
        response.headers.setdefault("Cache-Control", "no-store")
    return response
