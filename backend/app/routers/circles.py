from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import RequestActor, effective_user_id, get_request_actor
from app.core.map_store import ScopedMapStore
from app.models.circles import (
    CircleCreate,
    CircleEventRecord,
    CircleEventsResponse,
    CircleInviteResponse,
    CircleListResponse,
    CircleLocationRecord,
    CircleLocationUpdate,
    CircleLocationsResponse,
    CircleMemberUpdate,
    CircleRecord,
    CircleUpdate,
    JoinCircleRequest,
    NotificationPreferences,
    SavedPlaceCreate,
    SavedPlaceRecord,
    SavedPlacesResponse,
    TouristCollectionCreate,
    TouristCollectionRecord,
    TouristCollectionsResponse,
    TouristSpotCreate,
    TouristSpotRecord,
    TouristSpotsResponse,
    TrackedDeviceCreate,
    TrackedDeviceRecord,
    TrackedDevicesResponse,
)


router = APIRouter(prefix="/api/travel-groups", tags=["travel-groups"])
store = ScopedMapStore()


def _require_circle(circle_id: str) -> dict:
    circle = store.get_circle(circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Travel group not found.")
    return circle


def _can_access_circle(circle: dict, user_id: str) -> bool:
    return circle.get("owner_id") == user_id or any(member.get("user_id") == user_id for member in circle.get("members", []))


def _viewer(actor: RequestActor, fallback: str = "demo-user") -> str:
    return effective_user_id(actor, fallback)


@router.get("", response_model=CircleListResponse)
async def list_circles(
    viewer_id: str = Query(default="demo-user", min_length=1, max_length=120),
    actor: RequestActor = Depends(get_request_actor),
) -> CircleListResponse:
    viewer = _viewer(actor, viewer_id)
    return CircleListResponse(circles=[CircleRecord(**circle) for circle in store.list_circles(viewer)])


@router.post("", response_model=CircleRecord)
async def create_circle(
    request: CircleCreate,
    actor: RequestActor = Depends(get_request_actor),
) -> CircleRecord:
    owner_id = _viewer(actor, request.owner_id)
    record = store.create_circle(
        {
            "name": request.name,
            "owner_id": owner_id,
            "display_name": request.display_name,
            "role": request.role,
            "phone": request.phone,
            "avatar": request.avatar,
        }
    )
    return CircleRecord(**record)


@router.post("/join", response_model=CircleRecord)
async def join_circle(
    request: JoinCircleRequest,
    actor: RequestActor = Depends(get_request_actor),
) -> CircleRecord:
    user_id = _viewer(actor, request.user_id)
    record = store.join_circle(
        request.invite_code,
        {
            "user_id": user_id,
            "display_name": request.display_name,
            "role": request.role,
            "phone": request.phone,
            "avatar": request.avatar,
        },
    )
    if not record:
        raise HTTPException(status_code=404, detail="Invite code is invalid or expired.")
    return CircleRecord(**record)


@router.patch("/{circle_id}", response_model=CircleRecord)
async def update_circle(
    circle_id: str,
    request: CircleUpdate,
    actor: RequestActor = Depends(get_request_actor),
) -> CircleRecord:
    circle = _require_circle(circle_id)
    user_id = _viewer(actor, circle.get("owner_id", "demo-user"))
    if circle.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Only the travel group owner can edit the travel group name.")
    updated = store.update_circle(circle_id, request.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Travel group not found.")
    return CircleRecord(**updated)


@router.post("/{circle_id}/invite", response_model=CircleInviteResponse)
async def create_circle_invite(
    circle_id: str,
    actor: RequestActor = Depends(get_request_actor),
) -> CircleInviteResponse:
    circle = _require_circle(circle_id)
    user_id = _viewer(actor, circle.get("owner_id", "demo-user"))
    if not _can_access_circle(circle, user_id):
        raise HTTPException(status_code=403, detail="Travel group is not visible to this user.")
    invite = store.create_circle_invite(circle_id, creator_id=user_id, ttl_hours=48)
    if not invite:
        raise HTTPException(status_code=404, detail="Travel group not found.")
    return CircleInviteResponse(**invite)


@router.patch("/{circle_id}/members/{member_id}", response_model=CircleRecord)
async def update_member(
    circle_id: str,
    member_id: str,
    request: CircleMemberUpdate,
    actor: RequestActor = Depends(get_request_actor),
) -> CircleRecord:
    circle = _require_circle(circle_id)
    user_id = _viewer(actor, member_id)
    if user_id != member_id and circle.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Only owners or the member can edit this travel group member.")
    member = store.update_circle_member(circle_id, member_id, request.model_dump(exclude_none=True))
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")
    updated = _require_circle(circle_id)
    return CircleRecord(**updated)


@router.delete("/{circle_id}/members/{member_id}", response_model=CircleRecord)
async def leave_circle(
    circle_id: str,
    member_id: str,
    actor: RequestActor = Depends(get_request_actor),
) -> CircleRecord:
    circle = _require_circle(circle_id)
    user_id = _viewer(actor, member_id)
    if user_id != member_id and circle.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Only owners or the member can remove this travel group member.")
    updated = store.leave_circle(circle_id, member_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Travel group not found.")
    return CircleRecord(**updated)


@router.get("/{circle_id}/places", response_model=SavedPlacesResponse)
async def list_saved_places(circle_id: str, actor: RequestActor = Depends(get_request_actor)) -> SavedPlacesResponse:
    circle = _require_circle(circle_id)
    user_id = _viewer(actor, circle.get("owner_id", "demo-user"))
    if not _can_access_circle(circle, user_id):
        raise HTTPException(status_code=403, detail="Travel group is not visible to this user.")
    return SavedPlacesResponse(places=[SavedPlaceRecord(**place) for place in store.list_saved_places(circle_id)])


@router.post("/{circle_id}/places", response_model=SavedPlaceRecord)
async def create_saved_place(
    circle_id: str,
    request: SavedPlaceCreate,
    actor: RequestActor = Depends(get_request_actor),
) -> SavedPlaceRecord:
    circle = _require_circle(circle_id)
    creator_id = _viewer(actor, request.creator_id)
    if not _can_access_circle(circle, creator_id):
        raise HTTPException(status_code=403, detail="Travel group is not visible to this user.")
    record = store.create_saved_place(
        {
            "circle_id": circle_id,
            "creator_id": creator_id,
            "name": request.name,
            "label": request.label,
            "coordinate": {"lat": request.lat, "lon": request.lon},
            "radius_m": request.radius_m,
        }
    )
    return SavedPlaceRecord(**record)


@router.get("/{circle_id}/devices", response_model=TrackedDevicesResponse)
async def list_devices(circle_id: str, actor: RequestActor = Depends(get_request_actor)) -> TrackedDevicesResponse:
    circle = _require_circle(circle_id)
    user_id = _viewer(actor, circle.get("owner_id", "demo-user"))
    if not _can_access_circle(circle, user_id):
        raise HTTPException(status_code=403, detail="Travel group is not visible to this user.")
    return TrackedDevicesResponse(devices=[TrackedDeviceRecord(**device) for device in store.list_tracked_devices(circle_id)])


@router.post("/{circle_id}/devices", response_model=TrackedDeviceRecord)
async def create_device(
    circle_id: str,
    request: TrackedDeviceCreate,
    actor: RequestActor = Depends(get_request_actor),
) -> TrackedDeviceRecord:
    circle = _require_circle(circle_id)
    owner_id = _viewer(actor, request.owner_id)
    if not _can_access_circle(circle, owner_id):
        raise HTTPException(status_code=403, detail="Travel group is not visible to this user.")
    record = store.create_tracked_device(
        {
            "circle_id": circle_id,
            "owner_id": owner_id,
            "name": request.name,
            "kind": request.kind,
            "status": request.status,
        }
    )
    return TrackedDeviceRecord(**record)


@router.get("/{circle_id}/locations", response_model=CircleLocationsResponse)
async def list_locations(circle_id: str, actor: RequestActor = Depends(get_request_actor)) -> CircleLocationsResponse:
    circle = _require_circle(circle_id)
    user_id = _viewer(actor, circle.get("owner_id", "demo-user"))
    if not _can_access_circle(circle, user_id):
        raise HTTPException(status_code=403, detail="Travel group is not visible to this user.")
    return CircleLocationsResponse(locations=[CircleLocationRecord(**item) for item in store.list_member_locations(circle_id)])


@router.post("/{circle_id}/locations", response_model=CircleLocationRecord)
async def update_location(
    circle_id: str,
    request: CircleLocationUpdate,
    actor: RequestActor = Depends(get_request_actor),
) -> CircleLocationRecord:
    circle = _require_circle(circle_id)
    user_id = _viewer(actor, request.user_id)
    if not _can_access_circle(circle, user_id):
        raise HTTPException(status_code=403, detail="Travel group is not visible to this user.")
    coordinate = {"lat": request.lat, "lon": request.lon} if request.lat is not None and request.lon is not None else None
    record = store.update_member_location(
        {
            "circle_id": circle_id,
            "user_id": user_id,
            "coordinate": coordinate,
            "accuracy_m": request.accuracy_m,
            "activity": request.activity,
            "sharing_enabled": request.sharing_enabled,
            "visibility_scope": request.visibility_scope,
            "event_id": request.event_id,
            "travel_group_id": request.travel_group_id,
        }
    )
    return CircleLocationRecord(**record)


@router.post("/{circle_id}/check-in", response_model=CircleLocationRecord)
async def check_in(
    circle_id: str,
    request: CircleLocationUpdate,
    actor: RequestActor = Depends(get_request_actor),
) -> CircleLocationRecord:
    request.activity = "check-in"
    return await update_location(circle_id, request, actor)


@router.get("/{circle_id}/events", response_model=CircleEventsResponse)
async def list_events(
    circle_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    actor: RequestActor = Depends(get_request_actor),
) -> CircleEventsResponse:
    circle = _require_circle(circle_id)
    user_id = _viewer(actor, circle.get("owner_id", "demo-user"))
    if not _can_access_circle(circle, user_id):
        raise HTTPException(status_code=403, detail="Travel group is not visible to this user.")
    return CircleEventsResponse(events=[CircleEventRecord(**event) for event in store.list_circle_events(circle_id, limit=limit)])


@router.patch("/{circle_id}/events/{event_id}/read", response_model=CircleEventRecord)
async def mark_event_read(
    circle_id: str,
    event_id: str,
    viewer_id: str = Query(default="demo-user", min_length=1, max_length=120),
    actor: RequestActor = Depends(get_request_actor),
) -> CircleEventRecord:
    circle = _require_circle(circle_id)
    user_id = _viewer(actor, viewer_id)
    if not _can_access_circle(circle, user_id):
        raise HTTPException(status_code=403, detail="Travel group is not visible to this user.")
    event = store.mark_circle_event_read(circle_id, event_id, user_id)
    if not event:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return CircleEventRecord(**event)


@router.delete("/{circle_id}/events/{event_id}")
async def delete_event(
    circle_id: str,
    event_id: str,
    viewer_id: str = Query(default="demo-user", min_length=1, max_length=120),
    actor: RequestActor = Depends(get_request_actor),
) -> dict[str, str]:
    circle = _require_circle(circle_id)
    user_id = _viewer(actor, viewer_id)
    if not _can_access_circle(circle, user_id):
        raise HTTPException(status_code=403, detail="Travel group is not visible to this user.")
    if not store.delete_circle_event(circle_id, event_id, user_id):
        raise HTTPException(status_code=404, detail="Notification not found.")
    return {"status": "deleted"}


@router.get("/notification-preferences/{user_id}", response_model=NotificationPreferences)
async def get_notification_preferences(
    user_id: str,
    actor: RequestActor = Depends(get_request_actor),
) -> NotificationPreferences:
    viewer = _viewer(actor, user_id)
    return NotificationPreferences(**store.get_notification_preferences(viewer))


@router.patch("/notification-preferences/{user_id}", response_model=NotificationPreferences)
async def update_notification_preferences(
    user_id: str,
    request: NotificationPreferences,
    actor: RequestActor = Depends(get_request_actor),
) -> NotificationPreferences:
    viewer = _viewer(actor, user_id)
    return NotificationPreferences(**store.update_notification_preferences(viewer, request.model_dump(exclude={"user_id"})))


@router.get("/tourist-collections", response_model=TouristCollectionsResponse)
async def list_tourist_collections(
    owner_id: str = Query(default="demo-user", min_length=1, max_length=120),
    actor: RequestActor = Depends(get_request_actor),
) -> TouristCollectionsResponse:
    viewer = _viewer(actor, owner_id)
    return TouristCollectionsResponse(collections=[TouristCollectionRecord(**item) for item in store.list_tourist_collections(viewer)])


@router.post("/tourist-collections", response_model=TouristCollectionRecord)
async def create_tourist_collection(
    request: TouristCollectionCreate,
    actor: RequestActor = Depends(get_request_actor),
) -> TouristCollectionRecord:
    owner_id = _viewer(actor, request.owner_id)
    record = store.create_tourist_collection(
        {
            "owner_id": owner_id,
            "name": request.name,
            "description": request.description,
        }
    )
    return TouristCollectionRecord(**record)


@router.delete("/tourist-collections/{collection_id}")
async def delete_tourist_collection(
    collection_id: str,
    owner_id: str = Query(default="demo-user", min_length=1, max_length=120),
    actor: RequestActor = Depends(get_request_actor),
) -> dict[str, str]:
    viewer = _viewer(actor, owner_id)
    if not store.delete_tourist_collection(collection_id, viewer):
        raise HTTPException(status_code=404, detail="Collection not found.")
    return {"status": "deleted"}


@router.get("/tourist-spots", response_model=TouristSpotsResponse)
async def list_tourist_spots(
    saved_by: str = Query(default="demo-user", min_length=1, max_length=120),
    collection_id: str | None = Query(default=None, max_length=120),
    actor: RequestActor = Depends(get_request_actor),
) -> TouristSpotsResponse:
    viewer = _viewer(actor, saved_by)
    return TouristSpotsResponse(places=[TouristSpotRecord(**item) for item in store.list_saved_tourist_spots(viewer, collection_id)])


@router.post("/tourist-spots", response_model=TouristSpotRecord)
async def create_tourist_spot(
    request: TouristSpotCreate,
    actor: RequestActor = Depends(get_request_actor),
) -> TouristSpotRecord:
    saved_by = _viewer(actor, request.saved_by)
    record = store.create_saved_tourist_spot(
        {
            "name": request.name,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "category": request.category,
            "saved_by": saved_by,
            "collection_id": request.collection_id,
            "notes": request.notes,
        }
    )
    return TouristSpotRecord(**record)


@router.delete("/tourist-spots/{place_id}")
async def delete_tourist_spot(
    place_id: str,
    saved_by: str = Query(default="demo-user", min_length=1, max_length=120),
    actor: RequestActor = Depends(get_request_actor),
) -> dict[str, str]:
    viewer = _viewer(actor, saved_by)
    if not store.delete_saved_tourist_spot(place_id, viewer):
        raise HTTPException(status_code=404, detail="Saved tourist spot not found.")
    return {"status": "deleted"}
