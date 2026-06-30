from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.core.validation import STRICT_MODEL_CONFIG, normalize_group_ids, validate_safe_id
from app.models.mapping import Scope


class TrackingSessionCreate(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    session_id: str | None = Field(default=None, min_length=8, max_length=120)
    route_id: str | None = Field(default=None, max_length=120)
    scope: Scope = "group"
    creator_id: str = Field(default="demo-user", min_length=1, max_length=120)
    group_ids: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, value: str | None) -> str | None:
        return validate_safe_id(value, field_name="session_id") if value else None

    @field_validator("route_id")
    @classmethod
    def validate_route_id(cls, value: str | None) -> str | None:
        return validate_safe_id(value, field_name="route_id") if value else None

    @field_validator("creator_id")
    @classmethod
    def validate_creator_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="creator_id")

    @field_validator("group_ids")
    @classmethod
    def validate_group_ids(cls, value: list[str]) -> list[str]:
        return normalize_group_ids(value)

    @model_validator(mode="after")
    def validate_group_scope(self) -> "TrackingSessionCreate":
        if self.scope == "group" and not self.group_ids:
            raise ValueError("Group tracking sessions require at least one group id.")
        return self


class TrackingTokenRequest(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    session_id: str = Field(..., min_length=8, max_length=120)
    user_id: str = Field(default="demo-user", min_length=1, max_length=120)
    group_ids: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="session_id")

    @field_validator("user_id")
    @classmethod
    def validate_user_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="user_id")

    @field_validator("group_ids")
    @classmethod
    def validate_group_ids(cls, value: list[str]) -> list[str]:
        return normalize_group_ids(value)


class TrackingSessionResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    session_id: str
    route_id: str | None = None
    scope: Scope
    creator_id: str
    group_ids: list[str]
    token: str
    token_expires_at: int
    ws_path: str


class TrackingTokenResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    session_id: str
    token: str
    token_expires_at: int
    ws_path: str


class TelemetryEvent(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    type: Literal["location.update", "ping"] = "location.update"
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    accuracy_m: float | None = Field(default=None, ge=0, le=50_000)
