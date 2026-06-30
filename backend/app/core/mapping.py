"""
Reusable Mapping, Navigation, and Real-Time Tracking Engine.

Phase I uses geocoding, reverse geocoding, and OSRM routing. The remaining
engine classes are kept here for later phases without exposing them yet.
"""
from __future__ import annotations

import asyncio
import math
import re
import time
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple
from urllib.parse import parse_qs, unquote, urlparse

try:
    import httpx
except Exception:  # pragma: no cover - dependency fallback
    httpx = None

try:
    import polyline
except Exception:  # pragma: no cover - dependency fallback
    polyline = None


EARTH_RADIUS_M = 6_371_000
DEFAULT_USER_AGENT = "TravelAppReusableMappingEngine/1.0"
DEFAULT_REGION_HINT = "Southeast Asia"
PUBLIC_OSRM_URL = "https://router.project-osrm.org"
NOMINATIM_URL = "https://nominatim.openstreetmap.org"
PHOTON_URL = "https://photon.komoot.io"


class RouteMode(str, Enum):
    FASTEST = "fastest"
    SHORTEST = "shortest"


class RouteEngine(str, Enum):
    OSRM = "osrm"
    DIJKSTRA = "dijkstra"
    ASTAR = "astar"


class TrackingStatus(str, Enum):
    CREATED = "created"
    ACTIVE = "active"
    ARRIVED = "arrived"
    PAUSED = "paused"
    OFF_ROUTE = "off_route"


@dataclass(frozen=True)
class Coordinate:
    lat: float
    lon: float

    def __post_init__(self) -> None:
        if not (-90 <= float(self.lat) <= 90 and -180 <= float(self.lon) <= 180):
            raise ValueError(f"Invalid coordinate: {self.lat}, {self.lon}")

    def as_osrm(self) -> str:
        return f"{self.lon},{self.lat}"

    def as_leaflet(self) -> list[float]:
        return [self.lat, self.lon]


@dataclass
class Location:
    coordinate: Coordinate
    label: str
    provider: str = "manual"
    confidence: float = 1.0
    raw: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RouteStep:
    instruction: str
    distance_m: float
    duration_s: float
    coordinate: Coordinate


@dataclass
class Route:
    route_id: str
    session_id: str
    mode: RouteMode
    origin: Location
    destination: Location
    waypoints: list[Location]
    geometry: list[Coordinate]
    distance_m: float
    duration_s: float
    eta_utc: str
    provider: str
    steps: list[RouteStep] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_public_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["mode"] = self.mode.value
        data["geometry"] = [c.as_leaflet() for c in self.geometry]
        data["origin"]["coordinate"] = self.origin.coordinate.as_leaflet()
        data["destination"]["coordinate"] = self.destination.coordinate.as_leaflet()
        data["waypoints"] = [
            {**asdict(waypoint), "coordinate": waypoint.coordinate.as_leaflet()}
            for waypoint in self.waypoints
        ]
        data["steps"] = [
            {
                "instruction": step.instruction,
                "distance_m": step.distance_m,
                "duration_s": step.duration_s,
                "coordinate": step.coordinate.as_leaflet(),
            }
            for step in self.steps
        ]
        return data


@dataclass
class TrackingSession:
    session_id: str
    user_id: str
    route: Route
    current: Coordinate
    status: TrackingStatus = TrackingStatus.CREATED
    progress_percent: float = 0.0
    remaining_distance_m: float = 0.0
    eta_seconds: float = 0.0
    last_update_utc: str = field(default_factory=lambda: utc_now())
    location_buffer: list[Dict[str, Any]] = field(default_factory=list)

    def to_public_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "status": self.status.value,
            "current": self.current.as_leaflet(),
            "progress_percent": self.progress_percent,
            "remaining_distance_m": self.remaining_distance_m,
            "eta_seconds": self.eta_seconds,
            "eta_text": format_duration(self.eta_seconds),
            "remaining_distance_text": format_distance(self.remaining_distance_m),
            "last_update_utc": self.last_update_utc,
            "route_id": self.route.route_id,
        }


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def haversine_m(a: Coordinate, b: Coordinate) -> float:
    lat1 = math.radians(a.lat)
    lat2 = math.radians(b.lat)
    dlat = math.radians(b.lat - a.lat)
    dlon = math.radians(b.lon - a.lon)
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(h))


def format_duration(seconds: float) -> str:
    hours, remainder = divmod(max(0, int(seconds)), 3600)
    minutes, _ = divmod(remainder, 60)
    return f"{hours}h {minutes}m" if hours else f"{minutes}m"


def format_distance(meters: float) -> str:
    return f"{meters / 1000:.2f} km" if meters >= 1000 else f"{meters:.0f} m"


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


class LocationParser:
    COORD_RE = re.compile(r"^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$")
    AT_COORD_RE = re.compile(r"@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)")
    QUERY_COORD_RE = re.compile(r"[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)")
    MAP_PLACE_RE = re.compile(r"/place/([^/?]+)")

    @classmethod
    def parse_direct_coordinate(cls, text: str) -> Optional[Coordinate]:
        cleaned = unquote((text or "").strip())
        match = cls.COORD_RE.match(cleaned)
        if match:
            return Coordinate(float(match.group(1)), float(match.group(2)))
        for pattern in (cls.AT_COORD_RE, cls.QUERY_COORD_RE):
            match = pattern.search(cleaned)
            if match:
                return Coordinate(float(match.group(1)), float(match.group(2)))
        parsed = urlparse(cleaned)
        query = parse_qs(parsed.query)
        for key in ("q", "query", "ll"):
            if key in query and query[key]:
                coord = cls.parse_direct_coordinate(query[key][0])
                if coord:
                    return coord
        return None

    @classmethod
    def normalize_query(cls, text: str, region_hint: str = DEFAULT_REGION_HINT) -> str:
        value = re.sub(r"\s+", " ", (text or "").strip())
        if not value or cls.parse_direct_coordinate(value):
            return value
        if "http://" in value or "https://" in value:
            place_match = cls.MAP_PLACE_RE.search(value)
            if place_match:
                value = place_match.group(1).replace("+", " ")
        if region_hint.lower() not in value.lower():
            value = f"{value}, {region_hint}"
        return value


class GeocodingService:
    def __init__(
        self,
        nominatim_url: str = NOMINATIM_URL,
        photon_url: str = PHOTON_URL,
        user_agent: str = DEFAULT_USER_AGENT,
        region_hint: str = DEFAULT_REGION_HINT,
        timeout_s: float = 12,
    ) -> None:
        self.nominatim_url = nominatim_url.rstrip("/")
        self.photon_url = photon_url.rstrip("/")
        self.user_agent = user_agent
        self.region_hint = region_hint
        self.timeout_s = timeout_s
        self.cache: Dict[str, Tuple[float, list[Location]]] = {}
        self.cache_ttl_s = 300

    async def autocomplete(self, query: str, limit: int = 8) -> list[Location]:
        return await self.search(query, limit=limit, min_confidence=0.35)

    async def resolve(self, query: str, min_confidence: float = 0.42) -> Location:
        direct = LocationParser.parse_direct_coordinate(query)
        if direct:
            label = await self.reverse_label(direct)
            return Location(direct, label=label, provider="direct", confidence=1.0)
        results = await self.search(query, limit=8, min_confidence=min_confidence)
        if not results:
            raise ValueError(f"Could not confidently resolve location: {query}")
        return results[0]

    async def search(self, query: str, limit: int = 8, min_confidence: float = 0.35) -> list[Location]:
        normalized = LocationParser.normalize_query(query, self.region_hint)
        if not normalized:
            return []
        cache_key = f"{normalized}|{limit}"
        cached = self.cache.get(cache_key)
        if cached and time.time() - cached[0] < self.cache_ttl_s:
            return cached[1]

        candidates: list[Location] = []
        if httpx:
            async with httpx.AsyncClient(timeout=self.timeout_s, headers={"User-Agent": self.user_agent}) as client:
                candidates.extend(await self._photon_search(client, normalized, limit))
                candidates.extend(await self._nominatim_search(client, normalized, limit))
        deduped = self._dedupe_and_rank(query, candidates, min_confidence)
        from app.core.sea_region import is_in_sea_bounds, label_in_sea_region

        filtered = [
            item
            for item in deduped
            if is_in_sea_bounds(item.coordinate) or label_in_sea_region(item.label)
        ]
        self.cache[cache_key] = (time.time(), filtered[:limit])
        return filtered[:limit]

    async def reverse(self, coordinate: Coordinate) -> Location:
        label = await self.reverse_label(coordinate)
        return Location(coordinate=coordinate, label=label, provider="reverse", confidence=1.0)

    async def reverse_label(self, coordinate: Coordinate) -> str:
        if not httpx:
            return f"{coordinate.lat:.6f}, {coordinate.lon:.6f}"
        params = {
            "format": "jsonv2",
            "lat": coordinate.lat,
            "lon": coordinate.lon,
            "zoom": 18,
            "addressdetails": 1,
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout_s, headers={"User-Agent": self.user_agent}) as client:
                response = await client.get(f"{self.nominatim_url}/reverse", params=params)
                response.raise_for_status()
                data = response.json()
                return data.get("display_name") or f"{coordinate.lat:.6f}, {coordinate.lon:.6f}"
        except Exception:
            return f"{coordinate.lat:.6f}, {coordinate.lon:.6f}"

    async def _photon_search(self, client: Any, query: str, limit: int) -> list[Location]:
        try:
            response = await client.get(f"{self.photon_url}/api/", params={"q": query, "limit": limit})
            response.raise_for_status()
            data = response.json()
        except Exception:
            return []
        results: list[Location] = []
        for item in data.get("features", []):
            coords = item.get("geometry", {}).get("coordinates") or []
            props = item.get("properties", {})
            if len(coords) < 2:
                continue
            label = ", ".join(
                str(part)
                for part in [
                    props.get("name"),
                    props.get("street"),
                    props.get("district"),
                    props.get("city"),
                    props.get("county"),
                    props.get("state"),
                    props.get("country"),
                ]
                if part
            )
            try:
                results.append(
                    Location(
                        coordinate=Coordinate(float(coords[1]), float(coords[0])),
                        label=label or query,
                        provider="photon",
                        confidence=0.5,
                        raw=item,
                    )
                )
            except ValueError:
                continue
        return results

    async def _nominatim_search(self, client: Any, query: str, limit: int) -> list[Location]:
        try:
            response = await client.get(
                f"{self.nominatim_url}/search",
                params={"q": query, "format": "jsonv2", "limit": limit, "addressdetails": 1, "dedupe": 1},
            )
            response.raise_for_status()
            data = response.json()
        except Exception:
            return []
        results: list[Location] = []
        for item in data:
            try:
                results.append(
                    Location(
                        coordinate=Coordinate(float(item["lat"]), float(item["lon"])),
                        label=item.get("display_name") or query,
                        provider="nominatim",
                        confidence=0.5,
                        raw=item,
                    )
                )
            except Exception:
                continue
        return results

    def _dedupe_and_rank(self, original_query: str, candidates: list[Location], min_confidence: float) -> list[Location]:
        seen: set[str] = set()
        ranked: list[Location] = []
        query_tokens = self._tokens(original_query)
        for loc in candidates:
            key = f"{round(loc.coordinate.lat, 5)}:{round(loc.coordinate.lon, 5)}"
            if key in seen:
                continue
            seen.add(key)
            label_tokens = self._tokens(loc.label)
            overlap = len(query_tokens & label_tokens) / max(1, len(query_tokens))
            exact_boost = 0.22 if original_query.lower().strip() in loc.label.lower() else 0
            provider_boost = 0.08 if loc.provider == "nominatim" else 0.04
            loc.confidence = clamp(0.25 + overlap * 0.55 + exact_boost + provider_boost, 0, 1)
            if loc.confidence >= min_confidence:
                ranked.append(loc)
        return sorted(ranked, key=lambda item: item.confidence, reverse=True)

    @staticmethod
    def _tokens(text: str) -> Set[str]:
        return {token for token in re.findall(r"[a-z0-9]+", text.lower()) if len(token) > 1}


class GraphPathfinder:
    def __init__(self) -> None:
        self.graph: Dict[str, Dict[str, float]] = {}
        self.coordinates: Dict[str, Coordinate] = {}

    def add_node(self, node_id: str, coordinate: Coordinate) -> None:
        self.coordinates[node_id] = coordinate
        self.graph.setdefault(node_id, {})

    def add_edge(self, a: str, b: str, weight_m: Optional[float] = None, bidirectional: bool = True) -> None:
        if weight_m is None:
            weight_m = haversine_m(self.coordinates[a], self.coordinates[b])
        self.graph.setdefault(a, {})[b] = weight_m
        if bidirectional:
            self.graph.setdefault(b, {})[a] = weight_m

    def dijkstra(self, start: str, goal: str) -> Tuple[list[str], float]:
        import heapq

        heap = [(0.0, start, [])]
        visited: set[str] = set()
        while heap:
            cost, node, path = heapq.heappop(heap)
            if node in visited:
                continue
            visited.add(node)
            path = path + [node]
            if node == goal:
                return path, cost
            for neighbor, edge_cost in self.graph.get(node, {}).items():
                if neighbor not in visited:
                    heapq.heappush(heap, (cost + edge_cost, neighbor, path))
        return [], math.inf

    def astar(self, start: str, goal: str) -> Tuple[list[str], float]:
        import heapq

        open_heap = [(0.0, 0.0, start, [])]
        best_cost = {start: 0.0}
        while open_heap:
            _, cost, node, path = heapq.heappop(open_heap)
            path = path + [node]
            if node == goal:
                return path, cost
            for neighbor, edge_cost in self.graph.get(node, {}).items():
                new_cost = cost + edge_cost
                if new_cost < best_cost.get(neighbor, math.inf):
                    best_cost[neighbor] = new_cost
                    heuristic = haversine_m(self.coordinates[neighbor], self.coordinates[goal])
                    heapq.heappush(open_heap, (new_cost + heuristic, new_cost, neighbor, path))
        return [], math.inf


class RoutingService:
    def __init__(self, osrm_url: str = PUBLIC_OSRM_URL, timeout_s: float = 18) -> None:
        self.osrm_url = osrm_url.rstrip("/")
        self.timeout_s = timeout_s

    async def snap_to_road(self, coordinate: Coordinate) -> Coordinate:
        """Snap a coordinate to the nearest routable road when OSRM is available."""
        if not httpx:
            return coordinate
        try:
            async with httpx.AsyncClient(timeout=self.timeout_s) as client:
                response = await client.get(
                    f"{self.osrm_url}/nearest/v1/driving/{coordinate.as_osrm()}",
                    params={"number": 1},
                )
                response.raise_for_status()
                payload = response.json()
        except Exception:
            return coordinate
        waypoints = payload.get("waypoints") or []
        location = waypoints[0].get("location") if waypoints else None
        if not location or len(location) < 2:
            return coordinate
        try:
            return Coordinate(lat=float(location[1]), lon=float(location[0]))
        except Exception:
            return coordinate

    async def build_route(
        self,
        session_id: str,
        origin: Location,
        destination: Location,
        waypoints: Optional[list[Location]] = None,
        mode: RouteMode = RouteMode.FASTEST,
    ) -> Route:
        waypoints = waypoints or []
        coords = [origin.coordinate] + [w.coordinate for w in waypoints] + [destination.coordinate]
        route = await self._osrm_route(session_id, origin, destination, waypoints, coords, mode)
        return route if route else self._fallback_route(session_id, origin, destination, waypoints, mode)

    async def _osrm_route(
        self,
        session_id: str,
        origin: Location,
        destination: Location,
        waypoints: list[Location],
        coords: list[Coordinate],
        mode: RouteMode,
    ) -> Optional[Route]:
        if not httpx:
            return None
        try:
            async with httpx.AsyncClient(timeout=self.timeout_s) as client:
                response = await client.get(
                    f"{self.osrm_url}/route/v1/driving/{';'.join(c.as_osrm() for c in coords)}",
                    params={
                        "overview": "full",
                        "geometries": "polyline6",
                        "steps": "true",
                        "annotations": "duration,distance",
                        "alternatives": "true",
                    },
                )
                response.raise_for_status()
                payload = response.json()
        except Exception:
            return None
        routes = payload.get("routes") or []
        if not routes:
            return None
        selected = min(
            routes,
            key=lambda route: float(route.get("distance" if mode == RouteMode.SHORTEST else "duration", math.inf)),
        )
        geometry = (
            [Coordinate(lat, lon) for lat, lon in polyline.decode(selected["geometry"], precision=6)]
            if selected.get("geometry") and polyline
            else coords
        )
        duration = float(selected.get("duration", 0))
        return Route(
            route_id=str(uuid.uuid4()),
            session_id=session_id,
            mode=mode,
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            geometry=geometry,
            distance_m=float(selected.get("distance", 0)),
            duration_s=duration,
            eta_utc=datetime.fromtimestamp(time.time() + duration, timezone.utc).isoformat(),
            provider="osrm",
            steps=self._extract_steps(selected),
            metadata={"alternatives": len(routes), "selection": mode.value},
        )

    def _extract_steps(self, route_payload: Dict[str, Any]) -> list[RouteStep]:
        steps: list[RouteStep] = []
        for leg in route_payload.get("legs", []):
            for step in leg.get("steps", []):
                maneuver = step.get("maneuver", {})
                location = maneuver.get("location") or [0, 0]
                road = step.get("name") or "the road"
                action = maneuver.get("type", "continue").replace("_", " ").title()
                modifier = maneuver.get("modifier")
                instruction = f"{action} {modifier} onto {road}" if modifier else f"{action} on {road}"
                try:
                    steps.append(
                        RouteStep(
                            instruction=instruction,
                            distance_m=float(step.get("distance", 0)),
                            duration_s=float(step.get("duration", 0)),
                            coordinate=Coordinate(float(location[1]), float(location[0])),
                        )
                    )
                except Exception:
                    continue
        return steps

    def _fallback_route(
        self,
        session_id: str,
        origin: Location,
        destination: Location,
        waypoints: list[Location],
        mode: RouteMode,
    ) -> Route:
        points = [origin.coordinate] + [w.coordinate for w in waypoints] + [destination.coordinate]
        geometry: list[Coordinate] = []
        for a, b in zip(points, points[1:]):
            geometry.extend(interpolate_line(a, b, steps=36)[:-1])
        geometry.append(points[-1])
        distance = route_distance_m(geometry)
        duration = distance / (11.11 if mode == RouteMode.FASTEST else 8.33)
        return Route(
            route_id=str(uuid.uuid4()),
            session_id=session_id,
            mode=mode,
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            geometry=geometry,
            distance_m=distance,
            duration_s=duration,
            eta_utc=datetime.fromtimestamp(time.time() + duration, timezone.utc).isoformat(),
            provider="local-fallback",
            steps=[
                RouteStep(
                    instruction="Follow generated fallback path",
                    distance_m=distance,
                    duration_s=duration,
                    coordinate=origin.coordinate,
                )
            ],
            metadata={"warning": "OSRM approximate path."},
        )


class GraphRoutingService:
    STANDARD_NODES: Dict[str, Coordinate] = {
        "manila": Coordinate(14.5995, 120.9842),
        "baguio": Coordinate(16.4023, 120.5960),
        "legazpi": Coordinate(13.1391, 123.7438),
        "puerto_galera": Coordinate(13.5022, 120.9517),
        "coron": Coordinate(11.9996, 120.2043),
        "el_nido": Coordinate(11.1956, 119.4075),
        "iloilo": Coordinate(10.7202, 122.5621),
        "cebu": Coordinate(10.3157, 123.8854),
        "dumaguete": Coordinate(9.3068, 123.3054),
        "bohol": Coordinate(9.8500, 124.1435),
        "cagayan_de_oro": Coordinate(8.4542, 124.6319),
        "davao": Coordinate(7.1907, 125.4553),
        "siargao": Coordinate(9.8482, 126.0458),
    }
    STANDARD_EDGES: tuple[tuple[str, str], ...] = (
        ("baguio", "manila"),
        ("manila", "legazpi"),
        ("manila", "puerto_galera"),
        ("puerto_galera", "coron"),
        ("coron", "el_nido"),
        ("puerto_galera", "iloilo"),
        ("iloilo", "cebu"),
        ("cebu", "bohol"),
        ("cebu", "dumaguete"),
        ("dumaguete", "cagayan_de_oro"),
        ("bohol", "cagayan_de_oro"),
        ("cagayan_de_oro", "davao"),
        ("cagayan_de_oro", "siargao"),
        ("davao", "siargao"),
    )

    def build_route(
        self,
        session_id: str,
        origin: Location,
        destination: Location,
        waypoints: Optional[list[Location]] = None,
        mode: RouteMode = RouteMode.FASTEST,
        engine: RouteEngine = RouteEngine.DIJKSTRA,
        custom_graph: Optional[Dict[str, Any]] = None,
    ) -> Route:
        waypoints = waypoints or []
        graph, source = self._build_graph(custom_graph)
        trip_nodes = self._attach_trip_nodes(graph, [origin] + waypoints + [destination])

        path_nodes: list[str] = []
        total_distance = 0.0
        for start, goal in zip(trip_nodes, trip_nodes[1:]):
            segment_nodes, segment_distance = self._solve(graph, engine, start, goal)
            if not segment_nodes:
                return self._fallback_graph_route(session_id, origin, destination, waypoints, mode, engine)
            path_nodes.extend(segment_nodes if not path_nodes else segment_nodes[1:])
            total_distance += segment_distance

        geometry = [graph.coordinates[node_id] for node_id in path_nodes]
        duration = total_distance / (11.11 if mode == RouteMode.FASTEST else 8.33)
        steps = [
            RouteStep(
                instruction=f"Continue via {node_id.replace('_', ' ').title()}",
                distance_m=0.0,
                duration_s=0.0,
                coordinate=graph.coordinates[node_id],
            )
            for node_id in path_nodes
        ]
        return Route(
            route_id=str(uuid.uuid4()),
            session_id=session_id,
            mode=mode,
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            geometry=geometry,
            distance_m=total_distance,
            duration_s=duration,
            eta_utc=datetime.fromtimestamp(time.time() + duration, timezone.utc).isoformat(),
            provider=engine.value,
            steps=steps,
            metadata={
                "route_engine": engine.value,
                "graph_source": source,
                "path_nodes": path_nodes,
                "graph_nodes": len(graph.coordinates),
                "selection": mode.value,
            },
        )

    def _build_graph(self, custom_graph: Optional[Dict[str, Any]]) -> tuple[GraphPathfinder, str]:
        graph = GraphPathfinder()
        if custom_graph and custom_graph.get("nodes"):
            for node in custom_graph.get("nodes", []):
                node_id = str(node.get("id", "")).strip()
                if not node_id:
                    continue
                graph.add_node(node_id, Coordinate(float(node["lat"]), float(node["lon"])))
            for edge in custom_graph.get("edges", []):
                a = str(edge.get("from", "")).strip()
                b = str(edge.get("to", "")).strip()
                if a in graph.coordinates and b in graph.coordinates:
                    graph.add_edge(
                        a,
                        b,
                        weight_m=float(edge["weight_m"]) if edge.get("weight_m") is not None else None,
                        bidirectional=bool(edge.get("bidirectional", True)),
                    )
            if graph.coordinates:
                return graph, "custom"

        for node_id, coordinate in self.STANDARD_NODES.items():
            graph.add_node(node_id, coordinate)
        for a, b in self.STANDARD_EDGES:
            graph.add_edge(a, b)
        return graph, "standard-philippines"

    def _attach_trip_nodes(self, graph: GraphPathfinder, locations: list[Location]) -> list[str]:
        trip_nodes: list[str] = []
        for index, location in enumerate(locations):
            node_id = f"trip_{index}"
            graph.add_node(node_id, location.coordinate)
            nearest = sorted(
                (
                    (haversine_m(location.coordinate, coordinate), candidate_id)
                    for candidate_id, coordinate in graph.coordinates.items()
                    if not candidate_id.startswith("trip_")
                ),
                key=lambda item: item[0],
            )[:4]
            for _, candidate_id in nearest:
                graph.add_edge(node_id, candidate_id)
            trip_nodes.append(node_id)
        return trip_nodes

    def _solve(self, graph: GraphPathfinder, engine: RouteEngine, start: str, goal: str) -> tuple[list[str], float]:
        return graph.astar(start, goal) if engine == RouteEngine.ASTAR else graph.dijkstra(start, goal)

    def _fallback_graph_route(
        self,
        session_id: str,
        origin: Location,
        destination: Location,
        waypoints: list[Location],
        mode: RouteMode,
        engine: RouteEngine,
    ) -> Route:
        points = [origin.coordinate] + [w.coordinate for w in waypoints] + [destination.coordinate]
        geometry: list[Coordinate] = []
        for a, b in zip(points, points[1:]):
            geometry.extend(interpolate_line(a, b, steps=24)[:-1])
        geometry.append(points[-1])
        distance = route_distance_m(geometry)
        duration = distance / (11.11 if mode == RouteMode.FASTEST else 8.33)
        return Route(
            route_id=str(uuid.uuid4()),
            session_id=session_id,
            mode=mode,
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            geometry=geometry,
            distance_m=distance,
            duration_s=duration,
            eta_utc=datetime.fromtimestamp(time.time() + duration, timezone.utc).isoformat(),
            provider=f"{engine.value}-fallback",
            steps=[RouteStep("Follow generated fallback graph path", distance, duration, origin.coordinate)],
            metadata={"route_engine": engine.value, "warning": "Graph path unavailable; generated fallback path."},
        )


def interpolate_line(a: Coordinate, b: Coordinate, steps: int = 24) -> list[Coordinate]:
    steps = max(2, steps)
    return [
        Coordinate(a.lat + (b.lat - a.lat) * i / (steps - 1), a.lon + (b.lon - a.lon) * i / (steps - 1))
        for i in range(steps)
    ]


def route_distance_m(points: Sequence[Coordinate]) -> float:
    return sum(haversine_m(a, b) for a, b in zip(points, points[1:]))


class ETAService:
    def calculate_progress(
        self,
        route: Route,
        current: Coordinate,
        observed_speed_mps: Optional[float] = None,
    ) -> Dict[str, Any]:
        if not route.geometry:
            return {"progress_percent": 0, "remaining_distance_m": 0, "eta_seconds": 0, "nearest_index": 0}
        nearest_index, distance_to_route = nearest_route_index(route.geometry, current)
        completed = route_distance_m(route.geometry[: nearest_index + 1])
        total = max(route.distance_m, 1)
        remaining = max(0.0, total - completed)
        speed = observed_speed_mps if observed_speed_mps and observed_speed_mps > 0.5 else route.distance_m / max(route.duration_s, 1)
        arrived = haversine_m(current, route.destination.coordinate) <= 35 or (completed / total) * 100 >= 99.5
        return {
            "progress_percent": 100.0 if arrived else clamp((completed / total) * 100, 0, 100),
            "remaining_distance_m": 0.0 if arrived else remaining,
            "eta_seconds": 0.0 if arrived else remaining / max(speed, 0.5),
            "nearest_index": nearest_index,
            "distance_to_route_m": distance_to_route,
            "arrived": arrived,
            "off_route": distance_to_route > 120,
        }


def nearest_route_index(points: Sequence[Coordinate], current: Coordinate) -> Tuple[int, float]:
    best_i = 0
    best_d = math.inf
    for i, point in enumerate(points):
        d = haversine_m(point, current)
        if d < best_d:
            best_i, best_d = i, d
    return best_i, best_d


class GeofenceService:
    def __init__(self) -> None:
        self.polygons: Dict[str, list[list[Coordinate]]] = {}

    def load_geojson(self, name: str, geojson: Dict[str, Any]) -> None:
        polygons: list[list[Coordinate]] = []
        features = geojson.get("features") or [{"geometry": geojson}]
        for feature in features:
            geom = feature.get("geometry", {})
            if geom.get("type") == "Polygon":
                polygons.extend(self._polygon_coords(geom.get("coordinates", [])))
            elif geom.get("type") == "MultiPolygon":
                for polygon in geom.get("coordinates", []):
                    polygons.extend(self._polygon_coords(polygon))
        self.polygons[name] = polygons

    def validate(self, coordinate: Coordinate, geofence_names: Optional[list[str]] = None) -> bool:
        names = geofence_names or list(self.polygons)
        return True if not names else any(
            self._contains_polygon(coordinate, polygon)
            for name in names
            for polygon in self.polygons.get(name, [])
        )

    @staticmethod
    def _polygon_coords(raw: list[Any]) -> list[list[Coordinate]]:
        return [[Coordinate(float(lat), float(lon)) for lon, lat in ring] for ring in raw[:1]]

    @staticmethod
    def _contains_polygon(point: Coordinate, polygon: list[Coordinate]) -> bool:
        inside = False
        j = len(polygon) - 1
        x, y = point.lon, point.lat
        for i in range(len(polygon)):
            xi, yi = polygon[i].lon, polygon[i].lat
            xj, yj = polygon[j].lon, polygon[j].lat
            if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi):
                inside = not inside
            j = i
        return inside


class WebSocketHub:
    def __init__(self) -> None:
        self._connections: Dict[str, Set[Any]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, session_id: str, websocket: Any) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(session_id, set()).add(websocket)

    async def disconnect(self, session_id: str, websocket: Any) -> None:
        async with self._lock:
            if session_id in self._connections:
                self._connections[session_id].discard(websocket)
                if not self._connections[session_id]:
                    del self._connections[session_id]

    async def broadcast(self, session_id: str, event: Dict[str, Any]) -> None:
        async with self._lock:
            clients = list(self._connections.get(session_id, set()))
        dead: list[Any] = []
        for ws in clients:
            try:
                await ws.send_json(event)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(session_id, ws)


class TrackingService:
    def __init__(self, eta_service: ETAService, routing_service: RoutingService, hub: Optional[WebSocketHub] = None) -> None:
        self.eta_service = eta_service
        self.routing_service = routing_service
        self.hub = hub
        self.sessions: Dict[str, TrackingSession] = {}
        self._last_points: Dict[str, Tuple[Coordinate, float]] = {}

    async def create_session(self, user_id: str, route: Route) -> TrackingSession:
        session = TrackingSession(
            session_id=route.session_id,
            user_id=user_id,
            route=route,
            current=route.origin.coordinate,
            remaining_distance_m=route.distance_m,
            eta_seconds=route.duration_s,
        )
        self.sessions[session.session_id] = session
        await self._emit(session.session_id, "session.created", session.to_public_dict() | {"route": route.to_public_dict()})
        return session

    def get(self, session_id: str) -> TrackingSession:
        if session_id not in self.sessions:
            raise KeyError(f"Unknown session: {session_id}")
        return self.sessions[session_id]

    async def update_location(
        self,
        session_id: str,
        coordinate: Coordinate,
        accuracy_m: Optional[float] = None,
    ) -> TrackingSession:
        session = self.get(session_id)
        previous = self._last_points.get(session_id)
        now = time.time()
        speed = None
        if previous:
            speed = haversine_m(previous[0], coordinate) / max(now - previous[1], 0.001)
        progress = self.eta_service.calculate_progress(session.route, coordinate, speed)
        session.current = coordinate
        session.progress_percent = progress["progress_percent"]
        session.remaining_distance_m = progress["remaining_distance_m"]
        session.eta_seconds = progress["eta_seconds"]
        session.last_update_utc = utc_now()
        session.status = (
            TrackingStatus.ARRIVED
            if progress["arrived"]
            else TrackingStatus.OFF_ROUTE
            if progress["off_route"]
            else TrackingStatus.ACTIVE
        )
        self._last_points[session_id] = (coordinate, now)
        await self._emit(
            session_id,
            "location.updated",
            session.to_public_dict()
            | {
                "accuracy_m": accuracy_m,
                "nearest_index": progress["nearest_index"],
                "distance_to_route_m": progress["distance_to_route_m"],
            },
        )
        return session

    async def reroute_if_needed(self, session_id: str, threshold_m: float = 120) -> Optional[Route]:
        session = self.get(session_id)
        _, distance_to_route = nearest_route_index(session.route.geometry, session.current)
        if distance_to_route <= threshold_m or session.status == TrackingStatus.ARRIVED:
            return None
        new_route = await self.routing_service.build_route(
            session_id=session_id,
            origin=Location(session.current, "Current location", "tracking", 1.0),
            destination=session.route.destination,
            waypoints=[],
            mode=session.route.mode,
        )
        session.route = new_route
        session.status = TrackingStatus.ACTIVE
        await self._emit(session_id, "route.rerouted", new_route.to_public_dict())
        return new_route

    async def _emit(self, session_id: str, event_type: str, data: Dict[str, Any]) -> None:
        if self.hub:
            await self.hub.broadcast(session_id, {"type": event_type, "data": data, "sent_at": utc_now()})
