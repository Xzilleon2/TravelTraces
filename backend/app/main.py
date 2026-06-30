from __future__ import annotations

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.core.security_headers import security_middleware
from app.routers.auth import router as auth_router
from app.routers.circles import router as circles_router
from app.routers.mapping import router as mapping_router
from app.routers.telemetry import router as telemetry_router


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    app.middleware("http")(security_middleware)
    upload_root = Path(__file__).resolve().parents[1] / "data" / "uploads"
    upload_root.mkdir(parents=True, exist_ok=True)
    app.mount("/media/uploads", StaticFiles(directory=upload_root), name="uploads")

    @app.get("/", tags=["system"])
    async def root() -> dict[str, str]:
        return {
            "service": settings.app_name,
            "status": "ok",
            "health": "/health",
            "docs": "/docs",
            "api": "/api",
        }

    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon() -> Response:
        return Response(status_code=204)

    @app.get("/health", tags=["system"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": settings.app_name, "environment": settings.app_env}

    app.include_router(auth_router)
    app.include_router(circles_router)
    app.include_router(mapping_router)
    app.include_router(telemetry_router)
    return app


app = create_app()
