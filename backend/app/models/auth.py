from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from app.core.validation import STRICT_MODEL_CONFIG, clean_plain_text, normalize_email, validate_safe_id


class LoginRequest(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=8, max_length=256)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class SignupRequest(LoginRequest):
    model_config = STRICT_MODEL_CONFIG

    name: str = Field(..., min_length=1, max_length=120)
    user_id: str | None = Field(default=None, min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = clean_plain_text(value, max_length=120, field_name="name")
        if not cleaned:
            raise ValueError("name is required.")
        return cleaned

    @field_validator("user_id")
    @classmethod
    def validate_user_id(cls, value: str | None) -> str | None:
        return validate_safe_id(value, field_name="user_id") if value else None


class AuthUserResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    user_id: str
    email: str
    group_ids: list[str]
    token_expires_at: int
