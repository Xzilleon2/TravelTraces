from __future__ import annotations

import os
from dataclasses import dataclass


def _csv_env(name: str, default: str) -> list[str]:
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


def _bool_env(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


def _default_auth_cookie_secure() -> str:
    return "false" if os.getenv("APP_ENV", "local").strip().lower() == "local" else "true"


def _default_auth_cookie_name() -> str:
    secure = _bool_env("AUTH_COOKIE_SECURE", _default_auth_cookie_secure())
    return "__Host-travelplaces_session" if secure else "travelplaces_session"


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "TravelPlaces Mapping API")
    app_env: str = os.getenv("APP_ENV", "local")
    cors_origins: list[str] = None  # type: ignore[assignment]
    osrm_url: str = os.getenv("OSRM_URL", "https://router.project-osrm.org")
    nominatim_url: str = os.getenv("NOMINATIM_URL", "https://nominatim.openstreetmap.org")
    photon_url: str = os.getenv("PHOTON_URL", "https://photon.komoot.io")
    region_hint: str = os.getenv("REGION_HINT", "Southeast Asia")
    ws_session_secret: str = os.getenv("WS_SESSION_SECRET", "change-me-in-production")
    ws_token_ttl_s: int = int(os.getenv("WS_TOKEN_TTL_S", "3600"))
    max_request_bytes: int = int(os.getenv("MAX_REQUEST_BYTES", str(16 * 1024 * 1024)))
    max_ws_message_bytes: int = int(os.getenv("MAX_WS_MESSAGE_BYTES", "4096"))
    redis_url: str | None = os.getenv("REDIS_URL")
    require_auth: bool = _bool_env("REQUIRE_AUTH", "false")
    auth_secret: str = os.getenv("AUTH_SECRET", os.getenv("WS_SESSION_SECRET", "change-me-in-production"))
    auth_issuer: str = os.getenv("AUTH_ISSUER", "travelplaces-api")
    auth_audience: str = os.getenv("AUTH_AUDIENCE", "travelplaces-web")
    auth_cookie_name: str = os.getenv("AUTH_COOKIE_NAME", _default_auth_cookie_name())
    auth_cookie_secure: bool = _bool_env("AUTH_COOKIE_SECURE", _default_auth_cookie_secure())
    auth_token_ttl_s: int = int(os.getenv("AUTH_TOKEN_TTL_S", "3600"))
    login_rate_limit_count: int = int(os.getenv("LOGIN_RATE_LIMIT_COUNT", "5"))
    login_rate_limit_window_s: int = int(os.getenv("LOGIN_RATE_LIMIT_WINDOW_S", "300"))
    bootstrap_user_email: str | None = os.getenv("BOOTSTRAP_USER_EMAIL")
    bootstrap_user_id: str | None = os.getenv("BOOTSTRAP_USER_ID")
    bootstrap_user_password_hash: str | None = os.getenv("BOOTSTRAP_USER_PASSWORD_HASH")
    bootstrap_user_group_ids: list[str] = None  # type: ignore[assignment]
    database_path: str = os.getenv("TRAVELPLACES_DB_PATH", "data/TravelPlaces.db")
    chat_model_url: str | None = os.getenv("CHAT_MODEL_URL")
    chat_model_api_key: str | None = os.getenv("CHAT_MODEL_API_KEY")
    chat_model_timeout_s: float = float(os.getenv("CHAT_MODEL_TIMEOUT_S", "60"))

    def __post_init__(self) -> None:
        if self.cors_origins is None:
            object.__setattr__(
                self,
                "cors_origins",
                _csv_env("API_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"),
            )
        if self.bootstrap_user_group_ids is None:
            object.__setattr__(self, "bootstrap_user_group_ids", _csv_env("BOOTSTRAP_USER_GROUP_IDS", ""))


settings = Settings()
