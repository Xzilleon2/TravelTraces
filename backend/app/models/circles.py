from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from app.core.validation import (
    STRICT_MODEL_CONFIG,
    clean_optional_plain_text,
    clean_plain_text,
    validate_safe_id,
)


CircleRole = Literal["Organizer", "Guide", "Traveler", "Rider", "Hiker", "Diver", "Photographer", "Friend", "Other"]
DeviceKind = Literal["camera", "luggage", "backpack", "bike", "motorcycle", "dive_gear", "other"]
MemberActivity = Literal["stationary", "traveling", "driving", "check-in", "ride", "hiking", "tour"]
LocationVisibility = Literal["private", "friends", "travel_group", "event_participants", "public"]


class CircleMember(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    user_id: str
    display_name: str
    role: CircleRole = "Other"
    phone: str = ""
    avatar: str = ""
    admin: bool = False
    location_sharing_enabled: bool = True
    joined_at: str


class CircleCreate(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    name: str = Field(..., min_length=1, max_length=120)
    owner_id: str = Field(default="demo-user", min_length=1, max_length=120)
    display_name: str | None = Field(default=None, max_length=120)
    role: CircleRole = "Other"
    phone: str | None = Field(default=None, max_length=40)
    avatar: str | None = Field(default=None, max_length=2048)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = clean_plain_text(value, max_length=120, field_name="circle name")
        if cleaned is None:
            raise ValueError("circle name is required.")
        return cleaned

    @field_validator("owner_id")
    @classmethod
    def validate_owner_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="owner_id")

    @field_validator("display_name", "phone", "avatar")
    @classmethod
    def validate_optional_text(cls, value: str | None) -> str | None:
        return clean_optional_plain_text(value, max_length=2048, field_name="value")


class CircleUpdate(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    name: str | None = Field(default=None, min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        return clean_optional_plain_text(value, max_length=120, field_name="circle name")


class CircleMemberUpdate(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    display_name: str | None = Field(default=None, max_length=120)
    role: CircleRole | None = None
    phone: str | None = Field(default=None, max_length=40)
    avatar: str | None = Field(default=None, max_length=2048)
    admin: bool | None = None
    location_sharing_enabled: bool | None = None

    @field_validator("display_name", "phone", "avatar")
    @classmethod
    def validate_optional_text(cls, value: str | None) -> str | None:
        return clean_optional_plain_text(value, max_length=2048, field_name="value")


class CircleRecord(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    circle_id: str
    group_id: str
    name: str
    owner_id: str
    members: list[CircleMember]
    created_at: str
    updated_at: str


class CircleListResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    circles: list[CircleRecord]


class CircleInviteResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    invite_id: str
    circle_id: str
    code: str
    created_by: str
    created_at: str
    expires_at: str
    uses: int = 0


class JoinCircleRequest(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    invite_code: str = Field(..., min_length=4, max_length=24)
    user_id: str = Field(default="demo-user", min_length=1, max_length=120)
    display_name: str | None = Field(default=None, max_length=120)
    role: CircleRole = "Other"
    phone: str | None = Field(default=None, max_length=40)
    avatar: str | None = Field(default=None, max_length=2048)

    @field_validator("user_id")
    @classmethod
    def validate_user_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="user_id")

    @field_validator("invite_code", "display_name", "phone", "avatar")
    @classmethod
    def validate_text(cls, value: str | None) -> str | None:
        return clean_optional_plain_text(value, max_length=2048, field_name="value")


class SavedPlaceCreate(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    name: str = Field(..., min_length=1, max_length=80)
    label: str = Field(..., min_length=1, max_length=120)
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    radius_m: int = Field(default=180, ge=50, le=5000)
    creator_id: str = Field(default="demo-user", min_length=1, max_length=120)

    @field_validator("name", "label")
    @classmethod
    def validate_label(cls, value: str) -> str:
        cleaned = clean_plain_text(value, max_length=120, field_name="place label")
        if cleaned is None:
            raise ValueError("label is required.")
        return cleaned

    @field_validator("creator_id")
    @classmethod
    def validate_creator_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="creator_id")


class SavedPlaceRecord(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    place_id: str
    circle_id: str
    creator_id: str
    name: str
    label: str
    coordinate: dict[str, float]
    radius_m: int
    created_at: str
    updated_at: str


class SavedPlacesResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    places: list[SavedPlaceRecord]


class TrackedDeviceCreate(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    name: str = Field(..., min_length=1, max_length=100)
    kind: DeviceKind = "other"
    owner_id: str = Field(default="demo-user", min_length=1, max_length=120)
    status: str = Field(default="not seen yet", max_length=120)

    @field_validator("name", "status")
    @classmethod
    def validate_text(cls, value: str) -> str:
        cleaned = clean_plain_text(value, max_length=120, field_name="device text")
        if cleaned is None:
            raise ValueError("device text is required.")
        return cleaned

    @field_validator("owner_id")
    @classmethod
    def validate_owner_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="owner_id")


class TrackedDeviceRecord(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    device_id: str
    circle_id: str
    owner_id: str
    name: str
    kind: DeviceKind
    status: str
    battery_percent: int | None = None
    last_seen: str | None = None
    last_coordinate: dict[str, float] | None = None
    created_at: str
    updated_at: str


class TrackedDevicesResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    devices: list[TrackedDeviceRecord]


class CircleLocationUpdate(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    user_id: str = Field(default="demo-user", min_length=1, max_length=120)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    accuracy_m: float | None = Field(default=None, ge=0, le=50_000)
    activity: MemberActivity = "stationary"
    sharing_enabled: bool = True
    visibility_scope: LocationVisibility = "travel_group"
    event_id: str | None = Field(default=None, max_length=120)
    travel_group_id: str | None = Field(default=None, max_length=120)

    @field_validator("user_id")
    @classmethod
    def validate_user_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="user_id")


class CircleLocationRecord(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    circle_id: str
    user_id: str
    coordinate: dict[str, float] | None = None
    accuracy_m: float | None = None
    activity: MemberActivity
    sharing_enabled: bool
    visibility_scope: LocationVisibility = "travel_group"
    event_id: str | None = None
    travel_group_id: str | None = None
    status_text: str
    inside_place_ids: list[str] = Field(default_factory=list)
    updated_at: str


class CircleLocationsResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    locations: list[CircleLocationRecord]


class CircleEventRecord(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    event_id: str
    circle_id: str
    user_id: str
    type: str
    place_id: str | None = None
    message: str
    read_by: list[str] = Field(default_factory=list)
    created_at: str


class CircleEventsResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    events: list[CircleEventRecord]


class NotificationPreferences(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    user_id: str = Field(default="demo-user", min_length=1, max_length=120)
    meetup_arrivals: bool = True
    destination_arrivals: bool = True
    check_ins: bool = True
    checkpoints: bool = True
    group_ride_start: bool = True
    event_arrivals: bool = True

    @field_validator("user_id")
    @classmethod
    def validate_user_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="user_id")


class TouristCollectionCreate(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    name: str = Field(..., min_length=1, max_length=120)
    owner_id: str = Field(default="demo-user", min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = clean_plain_text(value, max_length=120, field_name="collection name")
        if cleaned is None:
            raise ValueError("collection name is required.")
        return cleaned

    @field_validator("owner_id")
    @classmethod
    def validate_owner_id(cls, value: str) -> str:
        return validate_safe_id(value, field_name="owner_id")

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        return clean_optional_plain_text(value, max_length=500, field_name="description") or ""


class TouristCollectionRecord(TouristCollectionCreate):
    model_config = STRICT_MODEL_CONFIG

    collection_id: str
    created_at: str
    updated_at: str


class TouristCollectionsResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    collections: list[TouristCollectionRecord]


class TouristSpotCreate(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    name: str = Field(..., min_length=1, max_length=160)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    category: str = Field(default="Tourist Attraction", max_length=80)
    saved_by: str = Field(default="demo-user", min_length=1, max_length=120)
    collection_id: str | None = Field(default=None, max_length=120)
    notes: str = Field(default="", max_length=500)

    @field_validator("name", "category", "notes")
    @classmethod
    def validate_text(cls, value: str) -> str:
        return clean_optional_plain_text(value, max_length=500, field_name="tourist spot text") or ""

    @field_validator("saved_by")
    @classmethod
    def validate_saved_by(cls, value: str) -> str:
        return validate_safe_id(value, field_name="saved_by")


class TouristSpotRecord(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    place_id: str
    name: str
    latitude: float
    longitude: float
    category: str
    saved_by: str
    saved_at: str
    collection_id: str | None = None
    notes: str = ""


class TouristSpotsResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    places: list[TouristSpotRecord]


class AccountDeletionRequest(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    password: str = Field(..., min_length=12, max_length=256)
    final_confirmation: Literal["Delete My Account"]


class AccountDeletionResponse(BaseModel):
    model_config = STRICT_MODEL_CONFIG

    status: Literal["deleted"]
    deleted_counts: dict[str, int]
    residual_access_removed: bool = True
