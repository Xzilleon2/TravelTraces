from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.core.validation import (
    STRICT_MODEL_CONFIG,
    clean_optional_plain_text,
    clean_plain_text,
    clean_rich_html,
    normalize_group_ids,
    validate_custom_graph,
    validate_safe_id,
)


class CoordinateInput(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class LocationInput(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    query: str | None = Field(default=None, min_length=1, max_length=160)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    label: str | None = Field(default=None, max_length=180)

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str | None) -> str | None:
        return clean_optional_plain_text(value, max_length=160, field_name="query")

    @field_validator("label")
    @classmethod
    def validate_label(cls, value: str | None) -> str | None:
        return clean_optional_plain_text(value, max_length=180, field_name="label")

    @model_validator(mode="after")
    def validate_query_or_coordinate(self) -> "LocationInput":
        has_query = bool(self.query and self.query.strip())
        has_coordinate = self.lat is not None and self.lon is not None
        if not has_query and not has_coordinate:
            raise ValueError("Provide either query or lat/lon.")
        return self


class LocationResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    coordinate: list[float]
    label: str
    provider: str
    confidence: float


Scope = Literal["private", "group", "public"]
RouteEngine = Literal["osrm", "dijkstra", "astar"]


class SearchResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    query: str
    results: list[LocationResponse]


class RouteRequest(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    origin: LocationInput
    destination: LocationInput
    waypoints: list[LocationInput] = Field(default_factory=list, max_length=10)
    mode: Literal["fastest", "shortest"] = "fastest"
    engine: RouteEngine = "osrm"
    session_id: str | None = Field(default=None, max_length=120)
    scope: Scope = "private"
    creator_id: str = Field(default="demo-user", min_length=1, max_length=120)
    group_ids: list[str] = Field(default_factory=list, max_length=20)
    persist: bool = True
    custom_graph: dict[str, Any] | None = None

    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, value: str | None) -> str | None:
        return validate_safe_id(value, field_name="session_id") if value else None

    @field_validator("creator_id")
    @classmethod
    def validate_creator_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="creator_id")

    @field_validator("group_ids")
    @classmethod
    def validate_group_ids(cls, value: list[str]) -> list[str]:
        return normalize_group_ids(value)

    @field_validator("custom_graph")
    @classmethod
    def validate_graph(cls, value: dict[str, Any] | None) -> dict[str, Any] | None:
        return validate_custom_graph(value)

    @model_validator(mode="after")
    def validate_group_scope(self) -> "RouteRequest":
        if self.scope == "group" and not self.group_ids:
            raise ValueError("Group-scoped routes require at least one group id.")
        return self


class RouteResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    route_id: str
    session_id: str
    mode: str
    origin: dict[str, Any]
    destination: dict[str, Any]
    waypoints: list[dict[str, Any]]
    geometry: list[list[float]]
    distance_m: float
    duration_s: float
    eta_utc: str
    provider: str
    steps: list[dict[str, Any]]
    metadata: dict[str, Any]
    record_id: str | None = None
    scope: Scope | None = None
    creator_id: str | None = None
    group_ids: list[str] = Field(default_factory=list)


class PinCreate(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    title: str = Field(..., min_length=1, max_length=120)
    note: str = Field(default="", max_length=1000)
    coordinate: CoordinateInput
    scope: Scope = "private"
    creator_id: str = Field(default="demo-user", min_length=1, max_length=120)
    group_ids: list[str] = Field(default_factory=list, max_length=20)
    source: Literal["manual", "search", "exif", "gps"] = "manual"
    media: dict[str, Any] | None = None
    photos: list[dict[str, Any]] = Field(default_factory=list, max_length=12)
    map_id: str | None = Field(default=None, max_length=120)
    address: str = Field(default="", max_length=500)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        cleaned = clean_plain_text(value, max_length=120, field_name="title")
        if cleaned is None:
            raise ValueError("title is required.")
        return cleaned

    @field_validator("note")
    @classmethod
    def validate_note(cls, value: str) -> str:
        return clean_rich_html(value, max_length=1000)

    @field_validator("address")
    @classmethod
    def validate_address(cls, value: str) -> str:
        return clean_optional_plain_text(value, max_length=500, field_name="address") or ""

    @field_validator("creator_id")
    @classmethod
    def validate_creator_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="creator_id")

    @field_validator("group_ids")
    @classmethod
    def validate_group_ids(cls, value: list[str]) -> list[str]:
        return normalize_group_ids(value)

    @model_validator(mode="after")
    def validate_group_scope(self) -> "PinCreate":
        if self.scope == "group" and not self.group_ids:
            raise ValueError("Group-scoped pins require at least one group id.")
        return self


class PinRecord(PinCreate):
    model_config = STRICT_MODEL_CONFIG

    pin_id: str
    post_id: str
    created_at: str
    updated_at: str


class PinsResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    pins: list[PinRecord]


class ScopedRouteRecord(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    record_id: str
    route_id: str
    session_id: str
    route: dict[str, Any]
    scope: Scope
    creator_id: str
    group_ids: list[str] = Field(default_factory=list)
    engine: RouteEngine
    created_at: str
    updated_at: str


class RoutesResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    routes: list[ScopedRouteRecord]


class PhotoAttachment(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    filename: str = Field(..., min_length=1, max_length=200)
    mime_type: str = Field(default="image/jpeg", max_length=80)
    size_bytes: int = Field(default=0, ge=0)
    preview_url: str | None = Field(default=None, max_length=2048)
    thumbnail_url: str | None = Field(default=None, max_length=2048)
    captured_at: str | None = Field(default=None, max_length=40)
    source: Literal["upload", "exif", "gps", "camera"] = "upload"


class UserMapCreate(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    title: str = Field(..., min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)
    scope: Scope = "private"
    owner_id: str = Field(..., min_length=1, max_length=120)
    group_ids: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        cleaned = clean_plain_text(value, max_length=120, field_name="title")
        if cleaned is None:
            raise ValueError("title is required.")
        return cleaned

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        return clean_rich_html(value, max_length=500)

    @field_validator("owner_id")
    @classmethod
    def validate_owner_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="owner_id")

    @field_validator("group_ids")
    @classmethod
    def validate_group_ids(cls, value: list[str]) -> list[str]:
        return normalize_group_ids(value)


class UserMapRecord(UserMapCreate):
    model_config = STRICT_MODEL_CONFIG

    map_id: str
    creator_id: str
    is_default: bool = False
    created_at: str
    updated_at: str


class UserMapsResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    maps: list[UserMapRecord]


class MeetupParticipantInput(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    participant_id: str | None = Field(default=None, max_length=120)
    display_name: str | None = Field(default=None, max_length=120)
    profile_photo: str | None = Field(default=None, max_length=2048)
    source: Literal["friend", "follower", "manual"] = "manual"
    query: str | None = Field(default=None, min_length=1, max_length=160)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    label: str | None = Field(default=None, max_length=180)

    @field_validator("participant_id")
    @classmethod
    def validate_participant_id(cls, value: str | None) -> str | None:
        return validate_safe_id(value, field_name="participant_id") if value else None

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, value: str | None) -> str | None:
        return clean_optional_plain_text(value, max_length=120, field_name="display_name")

    @field_validator("profile_photo")
    @classmethod
    def validate_profile_photo(cls, value: str | None) -> str | None:
        return clean_optional_plain_text(value, max_length=2048, field_name="profile_photo")

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str | None) -> str | None:
        return clean_optional_plain_text(value, max_length=160, field_name="query")

    @field_validator("label")
    @classmethod
    def validate_label(cls, value: str | None) -> str | None:
        return clean_optional_plain_text(value, max_length=180, field_name="label")

    @model_validator(mode="after")
    def validate_query_or_coordinate(self) -> "MeetupParticipantInput":
        if self.lat is None and self.latitude is not None:
            self.lat = self.latitude
        if self.lon is None and self.longitude is not None:
            self.lon = self.longitude
        has_query = bool(self.query and self.query.strip())
        has_coordinate = self.lat is not None and self.lon is not None
        if not has_query and not has_coordinate:
            raise ValueError("Provide either query or lat/lon for each participant.")
        return self


class MeetupRequest(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    participants: list[MeetupParticipantInput] = Field(..., min_length=2, max_length=12)
    limit: int = Field(default=5, ge=1, le=10)
    exclude_names: list[str] = Field(default_factory=list, max_length=20)
    randomize: bool = False
    travel_time_minutes: int = Field(default=60, ge=15, le=180)
    alpha: float = Field(default=0.4, ge=0, le=1)
    beta: float = Field(default=0.4, ge=0, le=1)
    gamma: float = Field(default=0.2, ge=0, le=1)
    persist: bool = False
    creator_id: str = Field(default="demo-user", min_length=1, max_length=120)
    map_id: str | None = Field(default=None, max_length=120)
    scope: Scope = "private"
    group_ids: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("creator_id")
    @classmethod
    def validate_creator_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="creator_id")

    @field_validator("group_ids")
    @classmethod
    def validate_group_ids(cls, value: list[str]) -> list[str]:
        return normalize_group_ids(value)

    @model_validator(mode="after")
    def validate_weights_and_scope(self) -> "MeetupRequest":
        if self.alpha + self.beta + self.gamma <= 0:
            raise ValueError("At least one scoring weight must be greater than zero.")
        if self.scope == "group" and not self.group_ids:
            raise ValueError("Group-scoped meetup requests require at least one group id.")
        return self


class MeetupSuggestionResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    rank: int
    name: str
    label: str
    coordinate: list[float]
    category: str
    distance_from_participants_m: list[float]
    duration_from_participants_s: list[float]
    fairness_score: float
    provider: str = "photon"
    score_components: dict[str, float] = Field(default_factory=dict)
    participant_routes: list[dict[str, Any]] = Field(default_factory=list)
    accessibility: dict[str, Any] = Field(default_factory=dict)


class MeetupResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    request_id: str
    midpoint: dict[str, Any]
    fair_region: dict[str, Any]
    suggestions: list[MeetupSuggestionResponse]
    participant_count: int
    participants: list[dict[str, Any]] = Field(default_factory=list)
    algorithm: str
    fallback_strategy: list[str] = Field(default_factory=list)
    scoring_weights: dict[str, float] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class MeetupCandidate(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    candidate_id: str = Field(..., min_length=1, max_length=120)
    request_id: str | None = Field(default=None, max_length=120)
    name: str = Field(..., min_length=1, max_length=160)
    category: str = Field(default="venue", max_length=80)
    coordinate: CoordinateInput
    provider: str = Field(default="computed", max_length=80)
    score_components: dict[str, float] = Field(default_factory=dict)
    participant_routes: list[dict[str, Any]] = Field(default_factory=list)
    accessibility: dict[str, Any] = Field(default_factory=dict)


class MeetupRequestRecord(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    request_id: str
    creator_id: str
    map_id: str | None = None
    scope: Scope = "private"
    group_ids: list[str] = Field(default_factory=list)
    participants: list[MeetupParticipantInput]
    fair_region: dict[str, Any] = Field(default_factory=dict)
    midpoint: dict[str, Any] = Field(default_factory=dict)
    suggestions: list[dict[str, Any]] = Field(default_factory=list)
    created_at: str
    updated_at: str


class TravelPostCreate(PinCreate):
    model_config = STRICT_MODEL_CONFIG

    post_type: Literal["travel_post"] = "travel_post"
    tags: list[str] = Field(default_factory=list, max_length=12)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value: list[str]) -> list[str]:
        cleaned: list[str] = []
        for tag in value:
            item = clean_optional_plain_text(tag, max_length=40, field_name="tag")
            if item and item not in cleaned:
                cleaned.append(item)
        return cleaned


class ParticipantList(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    list_id: str
    owner_id: str
    title: str = Field(..., min_length=1, max_length=120)
    participants: list[MeetupParticipantInput] = Field(default_factory=list, max_length=100)
    scope: Scope = "private"
    group_ids: list[str] = Field(default_factory=list, max_length=20)


class FriendBasedInvitation(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    invitation_id: str
    request_id: str | None = None
    map_id: str | None = None
    inviter_id: str
    invitee_id: str
    invitee_source: Literal["friend", "follower"] = "friend"
    status: Literal["draft", "sent", "accepted", "declined", "expired"] = "draft"
    suggested_location: CoordinateInput | None = None
    created_at: str | None = None
    updated_at: str | None = None
