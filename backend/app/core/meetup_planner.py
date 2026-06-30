"""Smart Meetup Planner with isochrone regions, fallbacks, and minimax routing.

The implementation is intentionally JSON/PostGIS shaped: fair regions are
returned as GeoJSON-like polygons and every candidate keeps route-scoring
components that can later map cleanly to relational columns.
"""
from __future__ import annotations

import math
import random
import uuid
from dataclasses import dataclass, field
from typing import Any, Literal

from app.core.mapping import Coordinate, GeocodingService, Location, RouteMode, RoutingService, haversine_m
from app.core.sea_region import SEA_BOUNDS, is_in_sea_bounds, label_in_sea_region

try:  # Optional accelerator. The service falls back to bbox math if absent.
    import geopandas as gpd  # type: ignore
    from shapely.geometry import Point, Polygon, mapping  # type: ignore
except Exception:  # pragma: no cover - optional geospatial dependency
    gpd = None  # type: ignore[assignment]
    Point = None  # type: ignore[assignment]
    Polygon = None  # type: ignore[assignment]
    mapping = None  # type: ignore[assignment]


ParticipantSource = Literal["friend", "follower", "manual"]

PREFERRED_VENUE_KEYWORDS = (
    "restaurant",
    "cafe",
    "coffee",
    "mall",
    "market",
    "park",
    "museum",
    "attraction",
    "venue",
    "plaza",
    "food",
    "dining",
    "recreation",
    "community",
    "event",
    "stadium",
    "theatre",
    "theater",
)

EXCLUDED_VENUE_KEYWORDS = (
    "hotel",
    "motel",
    "hostel",
    "resort",
    "lodging",
    "residence",
    "residential",
    "apartment",
    "condominium",
    "housing",
    "private",
    "restricted",
    "closed",
    "permanently closed",
    "home",
)

TRAVEL_LIMIT_SEQUENCE_MIN = (60, 75, 90, 120)
ISOCHRONE_SEGMENTS = 48
URBAN_TRAVEL_SPEED_KMH = 35.0

# Default scoring weights.
# Raising ALPHA favors efficiency for the whole group by reducing total time.
# Raising BETA favors accessibility by protecting the person with the longest trip.
# Raising GAMMA favors fairness by making participant travel times more equal.
ALPHA = 0.4
BETA = 0.4
GAMMA = 0.2


@dataclass
class MeetupPlannerParticipant:
    participant_id: str
    display_name: str
    profile_photo: str | None
    source: ParticipantSource
    location: Location


@dataclass
class FairRegion:
    center: Coordinate
    bounds: dict[str, float]
    geometry: dict[str, Any]
    strategy: str
    travel_time_minutes: int
    area_km2: float
    fallback_chain: list[str] = field(default_factory=list)
    cluster_regions: list[dict[str, Any]] = field(default_factory=list)
    polygon: Any | None = field(default=None, repr=False)

    def contains(self, coordinate: Coordinate) -> bool:
        if not is_in_sea_bounds(coordinate):
            return False
        if self.polygon is not None and Point is not None:
            return bool(self.polygon.buffer(1e-9).contains(Point(coordinate.lon, coordinate.lat)))
        return (
            self.bounds["min_lat"] <= coordinate.lat <= self.bounds["max_lat"]
            and self.bounds["min_lon"] <= coordinate.lon <= self.bounds["max_lon"]
        )

    def public_dict(self) -> dict[str, Any]:
        return {
            "type": "Feature",
            "geometry": self.geometry,
            "properties": {
                "center": self.center.as_leaflet(),
                "bounds": self.bounds,
                "strategy": self.strategy,
                "travel_time_minutes": self.travel_time_minutes,
                "area_km2": round(self.area_km2, 2),
                "fallback_chain": self.fallback_chain,
                "cluster_regions": self.cluster_regions,
                "shapely_enabled": self.polygon is not None,
                "geopandas_enabled": gpd is not None,
            },
        }


@dataclass
class MeetupSuggestion:
    rank: int
    name: str
    label: str
    coordinate: list[float]
    category: str
    distance_from_participants_m: list[float]
    duration_from_participants_s: list[float]
    fairness_score: float
    provider: str = "photon"
    score_components: dict[str, float] = field(default_factory=dict)
    participant_routes: list[dict[str, Any]] = field(default_factory=list)
    accessibility: dict[str, Any] = field(default_factory=dict)


@dataclass
class MeetupPlanResult:
    request_id: str
    midpoint: dict[str, Any]
    fair_region: dict[str, Any]
    suggestions: list[MeetupSuggestion]
    participant_count: int
    participants: list[dict[str, Any]]
    algorithm: str = "isochrone_intersection_minimax_routing"
    fallback_strategy: list[str] = field(default_factory=list)
    scoring_weights: dict[str, float] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)


def _destination_point(origin: Coordinate, bearing_deg: float, distance_km: float) -> Coordinate:
    radius_km = 6371.0
    bearing = math.radians(bearing_deg)
    lat1 = math.radians(origin.lat)
    lon1 = math.radians(origin.lon)
    angular = distance_km / radius_km

    lat2 = math.asin(math.sin(lat1) * math.cos(angular) + math.cos(lat1) * math.sin(angular) * math.cos(bearing))
    lon2 = lon1 + math.atan2(
        math.sin(bearing) * math.sin(angular) * math.cos(lat1),
        math.cos(angular) - math.sin(lat1) * math.sin(lat2),
    )
    return Coordinate(lat=math.degrees(lat2), lon=math.degrees(lon2))


def _isochrone_ring(latitude: float, longitude: float, travel_time_minutes: int) -> list[list[float]]:
    origin = Coordinate(lat=latitude, lon=longitude)
    radius_km = max(1.0, (travel_time_minutes / 60.0) * URBAN_TRAVEL_SPEED_KMH)
    ring = []
    for index in range(ISOCHRONE_SEGMENTS + 1):
        point = _destination_point(origin, (360 / ISOCHRONE_SEGMENTS) * index, radius_km)
        ring.append([point.lon, point.lat])
    return ring


def generate_isochrone(latitude: float, longitude: float, travel_time_minutes: int = 60) -> dict[str, Any]:
    """Generate a local travel-time isochrone polygon.

    This local approximation keeps development reliable when provider keys for
    OpenRouteService, Mapbox, or GraphHopper are not configured. The returned
    polygon shape can be replaced by external provider output without changing
    the planner contract.
    """
    ring = _isochrone_ring(latitude, longitude, travel_time_minutes)
    return {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [ring]},
        "properties": {
            "travel_time_minutes": travel_time_minutes,
            "provider": "local_isochrone",
            "candidate_providers": ["OpenRouteService", "OSRM", "Mapbox", "GraphHopper"],
        },
    }


class MeetupPlannerService:
    def __init__(self, geocoder: GeocodingService, routing: RoutingService) -> None:
        self.geocoder = geocoder
        self.routing = routing
        self._route_cache: dict[str, tuple[float, float, str]] = {}

    async def suggest(
        self,
        participants: list[MeetupPlannerParticipant],
        *,
        limit: int = 5,
        exclude_names: list[str] | None = None,
        randomize: bool = False,
        travel_time_minutes: int = 60,
        alpha: float = ALPHA,
        beta: float = BETA,
        gamma: float = GAMMA,
    ) -> MeetupPlanResult:
        if len(participants) < 2:
            raise ValueError("At least two participants are required.")

        exclude = {name.lower().strip() for name in (exclude_names or []) if name.strip()}
        region = await self._build_fair_region(participants, travel_time_minutes)
        search_center = await self._random_accessible_point(region, participants) if randomize else region.center

        venues = await self._discover_venues(region, search_center, limit=max(limit * 3, 8))
        if not venues:
            venues = await self._fallback_accessible_candidates(region, participants, limit=max(limit, 3))

        scored: list[MeetupSuggestion] = []
        for venue in venues:
            if venue.label.lower().strip() in exclude:
                continue
            suggestion = await self._score_venue(
                venue,
                participants,
                alpha=alpha,
                beta=beta,
                gamma=gamma,
                fair_region=region,
            )
            if suggestion:
                scored.append(suggestion)

        scored.sort(key=lambda item: item.fairness_score)
        if randomize and len(scored) > 1:
            pool = scored[: min(len(scored), max(3, limit + 3))]
            random.shuffle(pool)
            scored = pool + [item for item in scored if item not in pool]

        suggestions = []
        for index, suggestion in enumerate(scored[:limit], start=1):
            suggestion.rank = index
            suggestions.append(suggestion)

        return MeetupPlanResult(
            request_id=str(uuid.uuid4()),
            midpoint={
                "coordinate": region.center.as_leaflet(),
                "label": f"Fair meetup region near {region.center.lat:.4f}, {region.center.lon:.4f}",
            },
            fair_region=region.public_dict(),
            suggestions=suggestions,
            participant_count=len(participants),
            participants=[self._participant_public_dict(item) for item in participants],
            fallback_strategy=region.fallback_chain,
            scoring_weights={"alpha": alpha, "beta": beta, "gamma": gamma},
            metadata={
                "excluded": list(exclude),
                "randomize": randomize,
                "travel_time_minutes_requested": travel_time_minutes,
                "travel_time_minutes_used": region.travel_time_minutes,
                "venue_count_considered": len(venues),
            },
        )

    async def _build_fair_region(self, participants: list[MeetupPlannerParticipant], requested_minutes: int) -> FairRegion:
        fallback_chain: list[str] = []
        sequence = [minutes for minutes in TRAVEL_LIMIT_SEQUENCE_MIN if minutes >= requested_minutes]
        if requested_minutes not in sequence:
            sequence.insert(0, requested_minutes)

        for minutes in sequence:
            region = self._intersect_isochrones(participants, minutes, fallback_chain)
            if region:
                if minutes > requested_minutes:
                    fallback_chain.append(f"expanded travel limit to {minutes} minutes")
                    region.strategy = "expanded_isochrone_intersection"
                region.fallback_chain = list(fallback_chain)
                return region
            fallback_chain.append(f"no common isochrone intersection at {minutes} minutes")

        fallback_chain.append("weighted geographic center fallback")
        center = self._weighted_geographic_midpoint([item.location for item in participants])
        accessible_center = await self._most_accessible_shared_node(participants, center)
        fallback_chain.append("road-network accessibility fallback")
        cluster_regions = self._cluster_candidate_regions(participants)
        fallback_chain.append("cluster candidate region fallback")
        return self._region_from_center(
            accessible_center,
            strategy="weighted_center_road_accessibility",
            travel_time_minutes=sequence[-1] if sequence else requested_minutes,
            fallback_chain=fallback_chain,
            cluster_regions=cluster_regions,
        )

    def _intersect_isochrones(
        self,
        participants: list[MeetupPlannerParticipant],
        travel_time_minutes: int,
        fallback_chain: list[str],
    ) -> FairRegion | None:
        rings = [
            _isochrone_ring(item.location.coordinate.lat, item.location.coordinate.lon, travel_time_minutes)
            for item in participants
        ]

        if Polygon is not None:
            polygons = [Polygon(ring) for ring in rings]
            intersection = polygons[0]
            for polygon in polygons[1:]:
                intersection = intersection.intersection(polygon)
            if intersection.is_empty:
                return None
            if hasattr(intersection, "geoms"):
                intersection = max(intersection.geoms, key=lambda geom: geom.area)
            return self._region_from_polygon(intersection, "isochrone_intersection", travel_time_minutes, fallback_chain)

        bounds = [self._bounds_from_ring(ring) for ring in rings]
        min_lon = max(item["min_lon"] for item in bounds)
        max_lon = min(item["max_lon"] for item in bounds)
        min_lat = max(item["min_lat"] for item in bounds)
        max_lat = min(item["max_lat"] for item in bounds)
        if min_lon >= max_lon or min_lat >= max_lat:
            return None
        center = Coordinate(lat=(min_lat + max_lat) / 2, lon=(min_lon + max_lon) / 2)
        return self._region_from_bounds(
            bounds={"min_lon": min_lon, "max_lon": max_lon, "min_lat": min_lat, "max_lat": max_lat},
            center=center,
            strategy="bbox_isochrone_intersection",
            travel_time_minutes=travel_time_minutes,
            fallback_chain=fallback_chain,
        )

    def _region_from_polygon(
        self,
        polygon: Any,
        strategy: str,
        travel_time_minutes: int,
        fallback_chain: list[str],
    ) -> FairRegion:
        centroid = polygon.centroid
        min_lon, min_lat, max_lon, max_lat = polygon.bounds
        center = Coordinate(lat=float(centroid.y), lon=float(centroid.x))
        area_km2 = self._approx_area_km2(polygon.area, center.lat)
        geometry = mapping(polygon) if mapping else {"type": "Polygon", "coordinates": []}
        return FairRegion(
            center=center,
            bounds={"min_lon": min_lon, "max_lon": max_lon, "min_lat": min_lat, "max_lat": max_lat},
            geometry=geometry,
            strategy=strategy,
            travel_time_minutes=travel_time_minutes,
            area_km2=area_km2,
            fallback_chain=list(fallback_chain),
            polygon=polygon,
        )

    def _region_from_center(
        self,
        center: Coordinate,
        *,
        strategy: str,
        travel_time_minutes: int,
        fallback_chain: list[str],
        cluster_regions: list[dict[str, Any]] | None = None,
    ) -> FairRegion:
        delta = 0.18
        bounds = {
            "min_lon": max(SEA_BOUNDS["min_lon"], center.lon - delta),
            "max_lon": min(SEA_BOUNDS["max_lon"], center.lon + delta),
            "min_lat": max(SEA_BOUNDS["min_lat"], center.lat - delta),
            "max_lat": min(SEA_BOUNDS["max_lat"], center.lat + delta),
        }
        return self._region_from_bounds(
            bounds=bounds,
            center=center,
            strategy=strategy,
            travel_time_minutes=travel_time_minutes,
            fallback_chain=fallback_chain,
            cluster_regions=cluster_regions or [],
        )

    @staticmethod
    def _region_from_bounds(
        *,
        bounds: dict[str, float],
        center: Coordinate,
        strategy: str,
        travel_time_minutes: int,
        fallback_chain: list[str],
        cluster_regions: list[dict[str, Any]] | None = None,
    ) -> FairRegion:
        ring = [
            [bounds["min_lon"], bounds["min_lat"]],
            [bounds["max_lon"], bounds["min_lat"]],
            [bounds["max_lon"], bounds["max_lat"]],
            [bounds["min_lon"], bounds["max_lat"]],
            [bounds["min_lon"], bounds["min_lat"]],
        ]
        width_km = haversine_m(Coordinate(center.lat, bounds["min_lon"]), Coordinate(center.lat, bounds["max_lon"])) / 1000
        height_km = haversine_m(Coordinate(bounds["min_lat"], center.lon), Coordinate(bounds["max_lat"], center.lon)) / 1000
        return FairRegion(
            center=center,
            bounds=bounds,
            geometry={"type": "Polygon", "coordinates": [ring]},
            strategy=strategy,
            travel_time_minutes=travel_time_minutes,
            area_km2=width_km * height_km,
            fallback_chain=list(fallback_chain),
            cluster_regions=cluster_regions or [],
        )

    @staticmethod
    def _bounds_from_ring(ring: list[list[float]]) -> dict[str, float]:
        lons = [point[0] for point in ring]
        lats = [point[1] for point in ring]
        return {"min_lon": min(lons), "max_lon": max(lons), "min_lat": min(lats), "max_lat": max(lats)}

    @staticmethod
    def _approx_area_km2(area_degrees: float, latitude: float) -> float:
        return abs(area_degrees) * 111.32 * 111.32 * max(0.2, math.cos(math.radians(latitude)))

    @staticmethod
    def _weighted_geographic_midpoint(locations: list[Location]) -> Coordinate:
        lat_sum = sum(item.coordinate.lat for item in locations)
        lon_sum = sum(item.coordinate.lon for item in locations)
        count = len(locations)
        return Coordinate(lat=lat_sum / count, lon=lon_sum / count)

    async def _most_accessible_shared_node(
        self,
        participants: list[MeetupPlannerParticipant],
        seed: Coordinate,
    ) -> Coordinate:
        offsets = [(0.0, 0.0), (0.12, 0.0), (-0.12, 0.0), (0.0, 0.12), (0.0, -0.12), (0.18, 0.18), (-0.18, -0.18)]
        candidates = [
            Coordinate(
                lat=max(SEA_BOUNDS["min_lat"], min(SEA_BOUNDS["max_lat"], seed.lat + dlat)),
                lon=max(SEA_BOUNDS["min_lon"], min(SEA_BOUNDS["max_lon"], seed.lon + dlon)),
            )
            for dlat, dlon in offsets
        ]
        best = seed
        best_score = math.inf
        for candidate in candidates:
            durations = []
            target = Location(candidate, "candidate shared node", "computed", 0.6)
            for participant in participants:
                _, duration, _ = await self._route_metrics(participant.location, target)
                durations.append(duration)
            score = max(durations) if durations else math.inf
            if score < best_score:
                best = candidate
                best_score = score
        return best

    def _cluster_candidate_regions(self, participants: list[MeetupPlannerParticipant]) -> list[dict[str, Any]]:
        if len(participants) < 3:
            return []
        points = [item.location.coordinate for item in participants]
        k = min(3, len(points))
        centers = points[:k]
        for _ in range(5):
            buckets: list[list[Coordinate]] = [[] for _ in range(k)]
            for point in points:
                nearest_index = min(range(k), key=lambda idx: haversine_m(point, centers[idx]))
                buckets[nearest_index].append(point)
            next_centers = []
            for index, bucket in enumerate(buckets):
                if not bucket:
                    next_centers.append(centers[index])
                    continue
                next_centers.append(
                    Coordinate(
                        lat=sum(point.lat for point in bucket) / len(bucket),
                        lon=sum(point.lon for point in bucket) / len(bucket),
                    )
                )
            centers = next_centers
        return [
            {
                "cluster_id": f"cluster-{index + 1}",
                "center": center.as_leaflet(),
                "participant_count": sum(1 for point in points if min(centers, key=lambda c: haversine_m(point, c)) == center),
            }
            for index, center in enumerate(centers)
        ]

    async def _discover_venues(self, region: FairRegion, center: Coordinate, limit: int) -> list[Location]:
        queries = [
            f"restaurant near {center.lat},{center.lon}",
            f"cafe near {center.lat},{center.lon}",
            f"coffee shop near {center.lat},{center.lon}",
            f"mall near {center.lat},{center.lon}",
            f"public park near {center.lat},{center.lon}",
            f"tourist attraction near {center.lat},{center.lon}",
            f"community space near {center.lat},{center.lon}",
            f"event venue near {center.lat},{center.lon}",
        ]
        venues: list[Location] = []
        seen: set[str] = set()
        for query in queries:
            results = await self.geocoder.search(query, limit=6, min_confidence=0.25)
            for item in results:
                if len(venues) >= limit:
                    return venues
                if not region.contains(item.coordinate):
                    continue
                if not self._is_preferred_venue(item):
                    continue
                key = f"{round(item.coordinate.lat, 5)}:{round(item.coordinate.lon, 5)}"
                if key in seen:
                    continue
                seen.add(key)
                venues.append(item)
        return venues

    async def _fallback_accessible_candidates(
        self,
        region: FairRegion,
        participants: list[MeetupPlannerParticipant],
        limit: int,
    ) -> list[Location]:
        candidates: list[Location] = []
        for index in range(max(limit, 3)):
            coordinate = await self._random_accessible_point(region, participants)
            candidates.append(
                Location(
                    coordinate=coordinate,
                    label=f"Road-accessible meetup zone {index + 1}",
                    provider="computed",
                    confidence=0.45,
                    raw={"poi_fallback": True},
                )
            )
        return candidates

    async def _random_accessible_point(
        self,
        region: FairRegion,
        participants: list[MeetupPlannerParticipant],
    ) -> Coordinate:
        coordinate = self._random_point_within_region(region)
        snapped = await self.routing.snap_to_road(coordinate)
        if not region.contains(snapped):
            snapped = coordinate
        target = Location(snapped, "random meetup point", "computed", 0.5)
        for participant in participants:
            _, duration, _ = await self._route_metrics(participant.location, target)
            if not math.isfinite(duration):
                return region.center
        return snapped

    def _random_point_within_region(self, region: FairRegion) -> Coordinate:
        bounds = region.bounds
        for _ in range(100):
            lat = random.uniform(bounds["min_lat"], bounds["max_lat"])
            lon = random.uniform(bounds["min_lon"], bounds["max_lon"])
            candidate = Coordinate(lat=lat, lon=lon)
            if region.contains(candidate):
                return candidate
        return region.center

    @staticmethod
    def _is_preferred_venue(location: Location) -> bool:
        label = location.label.lower()
        if any(term in label for term in EXCLUDED_VENUE_KEYWORDS):
            return False
        if any(term in label for term in PREFERRED_VENUE_KEYWORDS):
            return True
        return label_in_sea_region(label)

    async def _score_venue(
        self,
        venue: Location,
        participants: list[MeetupPlannerParticipant],
        *,
        alpha: float,
        beta: float,
        gamma: float,
        fair_region: FairRegion,
    ) -> MeetupSuggestion | None:
        if not fair_region.contains(venue.coordinate):
            return None

        distances: list[float] = []
        durations: list[float] = []
        participant_routes: list[dict[str, Any]] = []
        for participant in participants:
            distance, duration, provider = await self._route_metrics(participant.location, venue)
            distances.append(distance)
            durations.append(duration)
            participant_routes.append(
                {
                    "participant_id": participant.participant_id,
                    "display_name": participant.display_name,
                    "distance_m": round(distance, 1),
                    "duration_s": round(duration, 1),
                    "provider": provider,
                }
            )

        if not durations:
            return None

        total_duration = sum(durations)
        max_duration = max(durations)
        spread = max_duration - min(durations)
        fairness = alpha * total_duration + beta * max_duration + gamma * spread

        name = venue.label.split(",")[0].strip() or venue.label
        category = MeetupPlannerService._infer_category(venue.label)

        return MeetupSuggestion(
            rank=0,
            name=name,
            label=venue.label,
            coordinate=venue.coordinate.as_leaflet(),
            category=category,
            distance_from_participants_m=[round(value, 1) for value in distances],
            duration_from_participants_s=[round(value, 1) for value in durations],
            fairness_score=round(fairness, 2),
            provider=venue.provider,
            score_components={
                "total_duration_s": round(total_duration, 1),
                "max_duration_s": round(max_duration, 1),
                "travel_time_spread_s": round(spread, 1),
                "alpha_total_component": round(alpha * total_duration, 2),
                "beta_max_component": round(beta * max_duration, 2),
                "gamma_spread_component": round(gamma * spread, 2),
            },
            participant_routes=participant_routes,
            accessibility={
                "inside_fair_region": True,
                "road_accessible": all(math.isfinite(value) for value in durations),
                "public_accessibility_status": "preferred_public_poi" if venue.provider != "computed" else "computed_accessible_zone",
                "excluded_private_or_lodging": not any(term in venue.label.lower() for term in EXCLUDED_VENUE_KEYWORDS),
            },
        )

    async def _route_metrics(self, origin: Location, destination: Location) -> tuple[float, float, str]:
        key = (
            f"{round(origin.coordinate.lat, 5)},{round(origin.coordinate.lon, 5)}:"
            f"{round(destination.coordinate.lat, 5)},{round(destination.coordinate.lon, 5)}"
        )
        cached = self._route_cache.get(key)
        if cached:
            return cached
        try:
            route = await self.routing.build_route(
                session_id=str(uuid.uuid4()),
                origin=origin,
                destination=destination,
                mode=RouteMode.FASTEST,
            )
            metrics = (route.distance_m, route.duration_s, route.provider)
        except Exception:
            distance = haversine_m(origin.coordinate, destination.coordinate) * 1.35
            metrics = (distance, distance / 11.11, "estimated")
        self._route_cache[key] = metrics
        return metrics

    @staticmethod
    def _infer_category(label: str) -> str:
        lowered = label.lower()
        if "restaurant" in lowered or "food" in lowered or "dining" in lowered:
            return "restaurant"
        if "cafe" in lowered or "coffee" in lowered:
            return "cafe"
        if "mall" in lowered or "market" in lowered:
            return "mall"
        if "park" in lowered or "recreation" in lowered:
            return "recreation"
        if "museum" in lowered or "attraction" in lowered or "tourist" in lowered:
            return "attraction"
        if "community" in lowered:
            return "community_space"
        if "event" in lowered or "venue" in lowered or "stadium" in lowered or "theatre" in lowered:
            return "event_venue"
        return "venue"

    @staticmethod
    def _participant_public_dict(participant: MeetupPlannerParticipant) -> dict[str, Any]:
        return {
            "participant_id": participant.participant_id,
            "display_name": participant.display_name,
            "profile_photo": participant.profile_photo,
            "source": participant.source,
            "coordinate": participant.location.coordinate.as_leaflet(),
            "label": participant.location.label,
        }
