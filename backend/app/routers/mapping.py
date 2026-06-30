from __future__ import annotations

from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import RequestActor, effective_group_ids, effective_user_id, ensure_group_membership, get_request_actor, require_authenticated_actor
from app.core.config import settings
from app.core.map_store import ScopedMapStore
from app.core.mapping import Coordinate, GeocodingService, GraphRoutingService, Location, RouteEngine, RouteMode, RoutingService
from app.core.media_store import persist_photo_attachments
from app.core.meetup_planner import MeetupPlannerParticipant, MeetupPlannerService
from app.core.validation import clean_plain_text, normalize_group_ids
from app.models.mapping import (
    LocationInput,
    LocationResponse,
    MeetupRequest,
    MeetupResponse,
    MeetupSuggestionResponse,
    PinCreate,
    PinRecord,
    PinsResponse,
    RouteRequest,
    RouteResponse,
    RoutesResponse,
    SearchResponse,
    UserMapCreate,
    UserMapRecord,
    UserMapsResponse,
)


router = APIRouter(prefix="/api", tags=["mapping"])

geocoder = GeocodingService(
    nominatim_url=settings.nominatim_url,
    photon_url=settings.photon_url,
    region_hint=settings.region_hint,
)
routing_service = RoutingService(osrm_url=settings.osrm_url)
graph_routing_service = GraphRoutingService()
meetup_service = MeetupPlannerService(geocoder=geocoder, routing=routing_service)
store = ScopedMapStore()
UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "data" / "uploads"


def _split_groups(group_ids: str | None) -> list[str]:
    try:
        return normalize_group_ids([item.strip() for item in (group_ids or "").split(",") if item.strip()])
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def _location_response(location: Location) -> LocationResponse:
    try:
        label = clean_plain_text(location.label, max_length=240, field_name="label") or "Unknown location"
    except ValueError:
        label = "Unknown location"
    return LocationResponse(
        coordinate=location.coordinate.as_leaflet(),
        label=label,
        provider=location.provider,
        confidence=location.confidence,
    )


async def _resolve_location(payload: LocationInput) -> Location:
    if payload.lat is not None and payload.lon is not None:
        try:
            coordinate = Coordinate(payload.lat, payload.lon)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        label = payload.label or await geocoder.reverse_label(coordinate)
        return Location(coordinate=coordinate, label=label, provider="manual", confidence=1.0)

    if not payload.query:
        raise HTTPException(status_code=422, detail="Location query is required.")
    try:
        return await geocoder.resolve(payload.query)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/health")
async def api_health() -> dict[str, str]:
    return {"status": "ok", "service": "mapping"}


@router.get("/search", response_model=SearchResponse)
async def search_locations(
    query: str = Query(..., min_length=1, max_length=160),
    limit: int = Query(default=8, ge=1, le=20),
) -> SearchResponse:
    query = clean_plain_text(query, max_length=160, field_name="query") or query
    results = await geocoder.search(query=query, limit=limit)
    return SearchResponse(query=query, results=[_location_response(item) for item in results])


@router.get("/autocomplete", response_model=SearchResponse)
async def autocomplete_locations(
    query: str = Query(..., min_length=1, max_length=160),
    limit: int = Query(default=8, ge=1, le=12),
) -> SearchResponse:
    query = clean_plain_text(query, max_length=160, field_name="query") or query
    results = await geocoder.autocomplete(query=query, limit=limit)
    return SearchResponse(query=query, results=[_location_response(item) for item in results])


@router.get("/reverse", response_model=LocationResponse)
async def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
) -> LocationResponse:
    try:
        coordinate = Coordinate(lat, lon)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _location_response(await geocoder.reverse(coordinate))


@router.post("/route", response_model=RouteResponse)
@router.post("/routes", response_model=RouteResponse)
@router.post("/routes/driving", response_model=RouteResponse)
async def driving_route(request: RouteRequest, actor: RequestActor = Depends(get_request_actor)) -> RouteResponse:
    origin = await _resolve_location(request.origin)
    destination = await _resolve_location(request.destination)
    waypoints = [await _resolve_location(item) for item in request.waypoints]
    session_id = request.session_id or str(uuid.uuid4())
    route_mode = RouteMode(request.mode)
    route_engine = RouteEngine(request.engine)
    creator_id = effective_user_id(actor, request.creator_id)
    group_ids = request.group_ids
    ensure_group_membership(actor, group_ids)

    if route_engine == RouteEngine.OSRM:
        route = await routing_service.build_route(
            session_id=session_id,
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            mode=route_mode,
        )
    else:
        route = graph_routing_service.build_route(
            session_id=session_id,
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            mode=route_mode,
            engine=route_engine,
            custom_graph=request.custom_graph,
        )

    route_payload = route.to_public_dict()
    record_id = None
    if request.persist:
        if request.scope == "group" and not group_ids:
            raise HTTPException(status_code=422, detail="Group-scoped routes require at least one group id.")
        record = store.create_route(
            {
                "route_id": route.route_id,
                "session_id": route.session_id,
                "route": route_payload,
                "scope": request.scope,
                "creator_id": creator_id,
                "group_ids": group_ids,
                "engine": route_engine.value,
            }
        )
        record_id = record["record_id"]

    return RouteResponse(
        **route_payload,
        record_id=record_id,
        scope=request.scope if request.persist else None,
        creator_id=creator_id if request.persist else None,
        group_ids=group_ids if request.persist else [],
    )


@router.get("/maps", response_model=UserMapsResponse)
async def list_user_maps(
    owner_id: str | None = Query(default=None, max_length=120),
    group_ids: str | None = Query(default=None),
    actor: RequestActor = Depends(require_authenticated_actor),
) -> UserMapsResponse:
    viewer = effective_user_id(actor, actor.user_id or "demo-user")
    groups = effective_group_ids(actor, _split_groups(group_ids))
    target_owner = owner_id or viewer
    if target_owner != viewer and not actor.authenticated:
        raise HTTPException(status_code=403, detail="Cannot list maps for another user.")
    store.ensure_default_map(target_owner)
    maps = store.list_maps(viewer_id=viewer, group_ids=groups, owner_id=target_owner)
    return UserMapsResponse(maps=[UserMapRecord(**item) for item in maps])


@router.post("/maps", response_model=UserMapRecord)
async def create_user_map(
    request: UserMapCreate,
    actor: RequestActor = Depends(require_authenticated_actor),
) -> UserMapRecord:
    owner_id = effective_user_id(actor, request.owner_id)
    if owner_id != request.owner_id:
        raise HTTPException(status_code=403, detail="Cannot create maps for another user.")
    group_ids = request.group_ids
    ensure_group_membership(actor, group_ids)
    if request.scope == "group" and not group_ids:
        raise HTTPException(status_code=422, detail="Group-scoped maps require at least one group id.")
    record = store.create_map(
        {
            "title": request.title,
            "description": request.description,
            "scope": request.scope,
            "owner_id": owner_id,
            "creator_id": owner_id,
            "group_ids": group_ids,
            "is_default": False,
        }
    )
    return UserMapRecord(**record)


@router.get("/maps/default", response_model=UserMapRecord)
async def get_default_map(actor: RequestActor = Depends(require_authenticated_actor)) -> UserMapRecord:
    owner_id = effective_user_id(actor, actor.user_id or "demo-user")
    record = store.ensure_default_map(owner_id)
    return UserMapRecord(**record)


@router.get("/pins", response_model=PinsResponse)
async def list_pins(
    viewer_id: str = Query(default="demo-user", min_length=1, max_length=120),
    group_ids: str | None = Query(default=None),
    map_id: str | None = Query(default=None, max_length=120),
    scope: str | None = Query(default=None, pattern="^(private|group|public)$"),
    actor: RequestActor = Depends(get_request_actor),
) -> PinsResponse:
    viewer = effective_user_id(actor, viewer_id)
    groups = effective_group_ids(actor, _split_groups(group_ids))
    owner_filter = viewer if actor.authenticated else None
    pins = store.list_pins(viewer_id=viewer, group_ids=groups, map_id=map_id, owner_id=owner_filter)
    if scope:
        pins = [pin for pin in pins if pin.get("scope") == scope]
    return PinsResponse(pins=[PinRecord(**pin) for pin in pins])


@router.post("/pins", response_model=PinRecord)
async def create_pin(
    request: PinCreate,
    actor: RequestActor = Depends(require_authenticated_actor),
) -> PinRecord:
    creator_id = effective_user_id(actor, request.creator_id)
    group_ids = request.group_ids
    ensure_group_membership(actor, group_ids)
    if request.scope == "group" and not group_ids:
        raise HTTPException(status_code=422, detail="Group-scoped pins require at least one group id.")

    map_id = request.map_id
    if not map_id:
        default_map = store.ensure_default_map(creator_id)
        map_id = default_map["map_id"]
    else:
        target_map = store.get_map(map_id)
        if not target_map or not store.can_view(target_map, creator_id, list(actor.group_ids)):
            raise HTTPException(status_code=403, detail="Map is not visible to this user.")
        if target_map.get("scope") == "private" and target_map.get("owner_id") != creator_id:
            raise HTTPException(status_code=403, detail="Cannot add travel posts to another user's private map.")

    pin_id = str(uuid.uuid4())
    try:
        photos = persist_photo_attachments(request.photos or [], upload_root=UPLOAD_ROOT, pin_id=pin_id) if request.photos else []
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    media = photos[0] if photos else request.media
    if not media and photos:
        media = photos[0]

    record = store.create_pin(
        {
            "pin_id": pin_id,
            "post_id": pin_id,
            "title": request.title,
            "note": request.note,
            "coordinate": request.coordinate.model_dump(),
            "address": request.address,
            "scope": request.scope,
            "creator_id": creator_id,
            "group_ids": group_ids,
            "source": request.source,
            "media": media,
            "photos": photos,
            "map_id": map_id,
        }
    )
    return PinRecord(**record)


@router.get("/routes", response_model=RoutesResponse)
async def list_routes(
    viewer_id: str = Query(default="demo-user", min_length=1, max_length=120),
    group_ids: str | None = Query(default=None),
    actor: RequestActor = Depends(get_request_actor),
) -> RoutesResponse:
    viewer = effective_user_id(actor, viewer_id)
    groups = effective_group_ids(actor, _split_groups(group_ids))
    routes = store.list_routes(viewer_id=viewer, group_ids=groups)
    return RoutesResponse(routes=routes)


@router.post("/meetup/suggest", response_model=MeetupResponse)
async def suggest_meetup(
    request: MeetupRequest,
    actor: RequestActor = Depends(get_request_actor),
) -> MeetupResponse:
    creator_id = effective_user_id(actor, request.creator_id)
    group_ids = request.group_ids
    ensure_group_membership(actor, group_ids)
    participants: list[MeetupPlannerParticipant] = []
    for item in request.participants:
        location = await _resolve_location(
            LocationInput(
                query=item.query,
                lat=item.lat,
                lon=item.lon,
                label=item.label,
            )
        )
        participant_id = item.participant_id or f"{item.source}-{len(participants) + 1}"
        display_name = item.display_name or item.label or location.label.split(",")[0] or f"Participant {len(participants) + 1}"
        participants.append(
            MeetupPlannerParticipant(
                participant_id=participant_id,
                display_name=display_name,
                profile_photo=item.profile_photo,
                source=item.source,
                location=location,
            )
        )

    try:
        result = await meetup_service.suggest(
            participants,
            limit=request.limit,
            exclude_names=request.exclude_names,
            randomize=request.randomize,
            travel_time_minutes=request.travel_time_minutes,
            alpha=request.alpha,
            beta=request.beta,
            gamma=request.gamma,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if request.persist:
        store.create_meetup_request(
            {
                "creator_id": creator_id,
                "map_id": request.map_id,
                "scope": request.scope,
                "group_ids": group_ids,
                "participants": [item.model_dump(exclude_none=True) for item in request.participants],
                "fair_region": result.fair_region,
                "midpoint": result.midpoint,
                "suggestions": [item.__dict__ for item in result.suggestions],
                "fallback_strategy": result.fallback_strategy,
                "scoring_weights": result.scoring_weights,
            }
        )

    return MeetupResponse(
        request_id=result.request_id,
        midpoint=result.midpoint,
        fair_region=result.fair_region,
        suggestions=[MeetupSuggestionResponse(**item.__dict__) for item in result.suggestions],
        participant_count=result.participant_count,
        participants=result.participants,
        algorithm=result.algorithm,
        fallback_strategy=result.fallback_strategy,
        scoring_weights=result.scoring_weights,
        metadata=result.metadata,
    )
