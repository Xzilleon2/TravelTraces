import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import type { Feature, FeatureCollection, Geometry, LineString, Point } from "geojson";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Bookmark,
  Download,
  Layers,
  LocateFixed,
  Lock,
  MapPin,
  MousePointer2,
  BookOpen,
  Route,
  Search,
  Share2,
  Timer,
  Users,
  WifiOff,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TravelTracesToolbar, type TravelTracesToolbarMenu } from "../components/TravelTracesToolbar";
import { useAuth } from "../context/AuthContext";
import { GatedPage } from "../components/GatedPage";
import { MarkerFormModal } from "../components/MarkerFormModal";
import { MarkerDetailPanel } from "../components/MarkerDetailPanel";
import { SmartMeetupPlanner } from "../components/SmartMeetupPlanner";
import { WorkspaceButton } from "../components/workspace/WorkspaceButton";
import { WorkspaceToggleGroup } from "../components/workspace/WorkspaceToggleGroup";
import {
  fieldLabel,
  iconButton,
  inputField,
  toggleGrid,
} from "../components/workspace/workspaceStyles";
import { MapLayerSelector } from "../components/maps/MapLayerSelector";
import type { ApiLocation, ApiPin, ApiRoute, LocationVisibility, MapScope, MeetupPlan, MeetupSuggestion, TouristSpot, TravelGroup, TravelGroupLocation, UserMap } from "../services/mappingApi";
import {
  buildDrivingRoute,
  checkInTravelGroup,
  createPin,
  getDefaultMap,
  listPins,
  listRoutes,
  listTouristSpots,
  listTravelGroupLocations,
  listTravelGroups,
  reverseLocation,
  searchLocations,
  updateTravelGroupLocation,
} from "../services/mappingApi";
import { publishWorkspaceEvent, subscribeWorkspaceEvents } from "../utils/workspaceSync";
import { markerSavePayload, primaryPhotoUrl, type PendingMarkerPhoto } from "../utils/photoPinHelpers";
import { SEA_BOUNDS } from "../utils/seaBounds";
import { LOCAL_STORIES_KEY, STORIES, STORY_MAP_POINTS, STORY_PHOTOS, type TravelStory } from "./StoriesPage";
import drawRouteIcon from "../assets/icons/draw-route.png";
import meetupIcon from "../assets/icons/meetup.png";
import panIcon from "../assets/icons/pan.png";
import pathIcon from "../assets/icons/path.png";
import pinIcon from "../assets/icons/pin.png";

type BaseLayer = "street" | "satellite" | "terrain";
type RouteMode = "fastest" | "shortest";
type DrawRouteInputMode = "click" | "drag";
type PickTarget = "from" | "to" | "marker" | null;
type ExportFormat = "png" | "jpeg";
type TravelToolbarTool = "path" | "draw" | "sharing" | "meetup" | "markers" | "spots";
type WorkspaceSidePanel = TravelToolbarTool | "export" | null;
type BoxZoomDrag = { startX: number; startY: number; currentX: number; currentY: number };
type StoryMapHandoff = { storyId?: number; title?: string; place?: string; coordinate?: { lat: number; lon: number } };

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY ?? "OxFhSEPyrURM6Iii2vm0";
const MAPTILER_STYLES: Record<BaseLayer, string> = {
  street: `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`,
  satellite: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
  terrain: `https://api.maptiler.com/maps/topo-v2/style.json?key=${MAPTILER_KEY}`,
};

const DEFAULT_GROUP_IDS = ["traveltraces-circle"];
const ROUTE_SOURCE_ID = "workspace-route";
const POINT_SOURCE_ID = "workspace-points";
const PIN_SOURCE_ID = "workspace-pins";
const TOURIST_SPOT_SOURCE_ID = "workspace-tourist-spots";
const MEETUP_AREA_SOURCE_ID = "workspace-meetup-area";
const PHOTO_PIN_LAYER = "workspace-photo-pins";
const PIN_CATEGORY_LABEL_LAYER = "workspace-pin-category-labels";
const PIN_ICON_IDS = {
  private: "workspace-pin-private",
  public: "workspace-pin-public",
  group: "workspace-pin-group",
  story: "workspace-pin-story",
  photo: "workspace-pin-photo",
} as const;

const workspaceModes: Array<{
  key: MapScope;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    key: "private",
    label: "Private Map",
    title: "Only you can view and edit this trip.",
    description: "A personal workspace with a photo wall tied to exact route coordinates.",
    icon: Lock,
  },
  {
    key: "group",
    label: "Group Map",
    title: "Invite-only collaboration.",
    description: "Share a unique link or add friends to co-edit the same map workspace.",
    icon: Users,
  },
  {
    key: "public",
    label: "Public Map",
    title: "Visible to the community.",
    description: "Designed for public rides, events, meetups, and shared travel routes.",
    icon: Share2,
  },
];

const friendList = [
  {
    id: "ana",
    name: "Ana Villanueva",
    location: "Quezon City",
    avatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=80&h=80&fit=crop&auto=format",
  },
  {
    id: "carlo",
    name: "Carlo Reyes",
    location: "Cebu City",
    avatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=80&h=80&fit=crop&auto=format",
  },
  {
    id: "leila",
    name: "Leila Marcos",
    location: "Davao City",
    avatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=80&h=80&fit=crop&auto=format",
  },
];

function storyToMapPin(story: TravelStory): ApiPin | null {
  const point = story.storyPoint ?? STORY_MAP_POINTS[story.id];
  if (!point) return null;
  const storyPhotos = story.photos?.length ? story.photos : STORY_PHOTOS[story.id] ?? [story.img];
  const photos = storyPhotos.map((url, index) => ({
    filename: `story-${story.id}-${index + 1}.jpg`,
    mime_type: "image/jpeg",
    size_bytes: 0,
    preview_url: url,
    thumbnail_url: url,
    source: "upload",
  }));
  const storyLinkMedia = story.local ? { storyDraftId: story.id } : { storyId: story.id };
  const storyDate = new Date(story.date);
  const timestamp = Number.isNaN(storyDate.getTime()) ? new Date().toISOString() : storyDate.toISOString();

  return {
    pin_id: `story-${story.id}`,
    post_id: `story-${story.id}`,
    title: story.title,
    note: story.excerpt,
    coordinate: point.coordinate,
    address: `${point.place}, Philippines`,
    scope: "public",
    creator_id: story.author,
    group_ids: DEFAULT_GROUP_IDS,
    source: "manual",
    media: {
      ...storyLinkMedia,
      category: story.category,
      place_name: point.place,
      filename: `story-${story.id}.jpg`,
      mime_type: "image/jpeg",
      size_bytes: 0,
      preview_url: story.img,
      thumbnail_url: story.img,
    },
    photos,
    map_id: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

const COMMUNITY_STORY_PINS = STORIES.map(storyToMapPin).filter((pin): pin is ApiPin => Boolean(pin));

function readLocalMapStories(): TravelStory[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_STORIES_KEY) ?? "[]") as TravelStory[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistPrototypeStory(input: {
  storyId: number;
  pin: ApiPin;
  category: string;
  placeName: string;
  author: string;
  authorAvatar?: string;
}) {
  const photos = (input.pin.photos ?? [])
    .map((photo) => {
      const data = photo as { data_url?: unknown; preview_url?: unknown; thumbnail_url?: unknown };
      return String(data.data_url ?? data.preview_url ?? data.thumbnail_url ?? "");
    })
    .filter(Boolean);
  const cover = photos[0] ?? "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&h=620&fit=crop&auto=format";
  const story: TravelStory = {
    id: input.storyId,
    title: input.pin.title,
    author: input.author,
    authorAvatar: input.authorAvatar ?? "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=48&h=48&fit=crop&auto=format",
    region: input.placeName,
    readTime: "Draft",
    date: "Just now",
    likes: 0,
    saves: 0,
    img: cover,
    category: input.category,
    excerpt: input.pin.note || `A new TravelTraces story pinned at ${input.placeName}.`,
    body: input.pin.note || `A new TravelTraces story pinned at ${input.placeName}.`,
    photos: photos.length ? photos : [cover],
    storyPoint: { place: input.placeName, coordinate: input.pin.coordinate },
    local: true,
  };

  try {
    const current = JSON.parse(window.localStorage.getItem(LOCAL_STORIES_KEY) ?? "[]") as TravelStory[];
    const next = [story, ...current.filter((item) => item.id !== story.id)].slice(0, 24);
    window.localStorage.setItem(LOCAL_STORIES_KEY, JSON.stringify(next));
  } catch {
    window.localStorage.setItem(LOCAL_STORIES_KEY, JSON.stringify([story]));
  }
}

const emptyLineCollection: FeatureCollection<LineString> = { type: "FeatureCollection", features: [] };
const emptyPointCollection: FeatureCollection<Point> = { type: "FeatureCollection", features: [] };
const emptyGeometryCollection: FeatureCollection<Geometry> = { type: "FeatureCollection", features: [] };

function formatDistance(meters?: number) {
  if (!meters) return "0 m";
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds?: number) {
  if (!seconds) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function routeEndpointToLocation(endpoint: unknown): ApiLocation | null {
  const data = endpoint as { coordinate?: unknown; label?: unknown; provider?: unknown; confidence?: unknown };
  if (!Array.isArray(data.coordinate) || data.coordinate.length < 2) return null;
  return {
    coordinate: [Number(data.coordinate[0]), Number(data.coordinate[1])],
    label: String(data.label ?? "Route point"),
    provider: String(data.provider ?? "route"),
    confidence: Number(data.confidence ?? 1),
  };
}

function locationFromMapClick(event: MapMouseEvent): ApiLocation {
  return {
    coordinate: [event.lngLat.lat, event.lngLat.lng],
    label: `${event.lngLat.lat.toFixed(5)}, ${event.lngLat.lng.toFixed(5)}`,
    provider: "manual",
    confidence: 1,
  };
}

function workspaceMapCursor(input: { markerPlacementActive: boolean; pickTarget: PickTarget; drawingActive: boolean; boxZoomActive: boolean }) {
  if (input.boxZoomActive) return "zoom-in";
  if (input.markerPlacementActive) return "copy";
  if (input.pickTarget === "from") return "alias";
  if (input.pickTarget === "to") return "context-menu";
  if (input.drawingActive) return "cell";
  return "grab";
}

async function reverseFromMapClick(event: MapMouseEvent): Promise<ApiLocation> {
  return reverseLocation(event.lngLat.lat, event.lngLat.lng).catch(() => locationFromMapClick(event));
}

function pinColor(pin: ApiPin) {
  if (pin.source === "exif" || pin.source === "gps") return "#5C8A9E";
  if (pin.scope === "public") return "#C4713A";
  if (pin.scope === "group") return "#9E6B5C";
  return "#3A2A22";
}

function pinIconId(pin: ApiPin) {
  if (pin.source === "exif" || pin.source === "gps") return PIN_ICON_IDS.photo;
  if (pin.scope === "private") return PIN_ICON_IDS.private;
  if (pin.scope === "public") return PIN_ICON_IDS.public;
  if (pin.scope === "group") return PIN_ICON_IDS.group;
  return PIN_ICON_IDS.story;
}

function pinCategory(pin: ApiPin) {
  if (pin.media && typeof pin.media.category === "string") return pin.media.category;
  if (pin.source === "exif" || pin.source === "gps") return "Photo";
  if (pin.scope === "group") return "Group";
  return "Story";
}

function pinStoryHref(pin: ApiPin) {
  const storyId = typeof pin.media?.storyId === "number" ? pin.media.storyId : null;
  const storyDraftId = typeof pin.media?.storyDraftId === "number" ? pin.media.storyDraftId : null;
  if (storyId) return `/stories?story=${storyId}`;
  if (storyDraftId) return `/stories?localStory=${storyDraftId}`;
  return null;
}

function routeToGeoJson(route: ApiRoute | null): FeatureCollection<LineString> {
  if (!route?.geometry?.length) return emptyLineCollection;
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: route.geometry.map(([lat, lon]) => [lon, lat]),
        },
        properties: {},
      },
    ],
  };
}

function pointsToGeoJson(input: {
  fromLocation: ApiLocation | null;
  toLocation: ApiLocation | null;
  draftStops: ApiLocation[];
}): FeatureCollection<Point> {
  const features: Array<Feature<Point>> = [];
  if (input.fromLocation) {
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [input.fromLocation.coordinate[1], input.fromLocation.coordinate[0]] },
      properties: { title: "From", kind: "from", color: "#3A2A22" },
    });
  }
  if (input.toLocation) {
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [input.toLocation.coordinate[1], input.toLocation.coordinate[0]] },
      properties: { title: "To", kind: "to", color: "#C4713A" },
    });
  }
  input.draftStops.forEach((stop, index) => {
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [stop.coordinate[1], stop.coordinate[0]] },
      properties: { title: `Stop ${index + 1}`, kind: "stop", color: "#5C8A9E" },
    });
  });
  return { type: "FeatureCollection", features };
}

function pinsToGeoJson(pins: ApiPin[], scope: MapScope): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: pins
      .filter((pin) => pin.scope === scope)
      .map((pin) => {
        const thumb = primaryPhotoUrl(pin);
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [pin.coordinate.lon, pin.coordinate.lat] },
          properties: {
            pin_id: pin.pin_id,
            title: pin.title,
            kind: pin.source,
            color: pinColor(pin),
            pinIcon: pinIconId(pin),
            category: pinCategory(pin),
            hasPhoto: Boolean(thumb),
            thumbUrl: thumb ?? "",
            storyHref: pinStoryHref(pin) ?? "",
          },
        };
      }),
  };
}

function touristSpotsToGeoJson(spots: TouristSpot[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: spots.map((spot) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [spot.longitude, spot.latitude] },
      properties: {
        place_id: spot.place_id,
        title: spot.name,
        category: spot.category,
      },
    })),
  };
}

function isMeetupGeometry(input: unknown): input is Geometry {
  if (!input || typeof input !== "object") return false;
  const geometry = input as { type?: unknown; coordinates?: unknown };
  return (geometry.type === "Polygon" || geometry.type === "MultiPolygon") && Array.isArray(geometry.coordinates);
}

function circleGeometry(center: [number, number], radiusKm: number): Geometry {
  const [lat, lon] = center;
  const ring: number[][] = [];
  const earthRadiusKm = 6371;
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const angularDistance = radiusKm / earthRadiusKm;

  for (let index = 0; index <= 72; index += 1) {
    const bearing = ((index * 5) * Math.PI) / 180;
    const nextLat = Math.asin(
      Math.sin(latRad) * Math.cos(angularDistance) +
        Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const nextLon =
      lonRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
        Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(nextLat),
      );
    ring.push([(nextLon * 180) / Math.PI, (nextLat * 180) / Math.PI]);
  }

  return { type: "Polygon", coordinates: [ring] };
}

function meetupAreaToGeoJson(plan: MeetupPlan | null): FeatureCollection<Geometry> {
  if (!plan) return emptyGeometryCollection;
  const geometry = isMeetupGeometry(plan.fair_region.geometry)
    ? plan.fair_region.geometry
    : circleGeometry(plan.suggestions[0]?.coordinate ?? plan.midpoint.coordinate ?? plan.fair_region.properties.center, Math.max(1.5, plan.fair_region.properties.travel_time_minutes * 0.35));

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry,
        properties: {
          title: "Convenient meetup area",
          strategy: plan.fair_region.properties.strategy,
        },
      },
    ],
  };
}

function setGeoJsonSource(map: MapLibreMap, sourceId: string, data: FeatureCollection) {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;
  source?.setData(data);
}

function createPinIcon(color: string) {
  const canvas = document.createElement("canvas");
  const size = 72;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    return new ImageData(size, size);
  }

  context.clearRect(0, 0, size, size);
  context.shadowColor = "rgba(58, 42, 34, 0.22)";
  context.shadowBlur = 5;
  context.shadowOffsetY = 3;
  context.fillStyle = color;
  context.strokeStyle = "#FBF7F0";
  context.lineWidth = 4;

  context.beginPath();
  context.moveTo(36, 68);
  context.bezierCurveTo(31, 56, 13, 40, 13, 24);
  context.bezierCurveTo(13, 11, 23, 4, 36, 4);
  context.bezierCurveTo(49, 4, 59, 11, 59, 24);
  context.bezierCurveTo(59, 40, 41, 56, 36, 68);
  context.closePath();
  context.fill();
  context.stroke();

  context.shadowColor = "transparent";
  context.fillStyle = "#FBF7F0";
  context.beginPath();
  context.arc(36, 25, 8.5, 0, Math.PI * 2);
  context.fill();

  return context.getImageData(0, 0, size, size);
}

function ensurePinImages(map: MapLibreMap) {
  const pinImages: Array<[string, string]> = [
    [PIN_ICON_IDS.private, "#3A2A22"],
    [PIN_ICON_IDS.public, "#C4713A"],
    [PIN_ICON_IDS.group, "#9E6B5C"],
    [PIN_ICON_IDS.story, "#3A2A22"],
    [PIN_ICON_IDS.photo, "#5C8A9E"],
  ];

  pinImages.forEach(([id, color]) => {
    if (!map.hasImage(id)) {
      map.addImage(id, createPinIcon(color), { pixelRatio: 2 });
    }
  });
}

function ensureWorkspaceLayers(map: MapLibreMap) {
  ensurePinImages(map);
  if (!map.getSource(ROUTE_SOURCE_ID)) {
    map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: emptyLineCollection });
  }
  if (!map.getSource(POINT_SOURCE_ID)) {
    map.addSource(POINT_SOURCE_ID, { type: "geojson", data: emptyPointCollection });
  }
  if (!map.getSource(PIN_SOURCE_ID)) {
    map.addSource(PIN_SOURCE_ID, { type: "geojson", data: emptyPointCollection });
  }
  if (!map.getSource(TOURIST_SPOT_SOURCE_ID)) {
    map.addSource(TOURIST_SPOT_SOURCE_ID, { type: "geojson", data: emptyPointCollection });
  }
  if (!map.getSource(MEETUP_AREA_SOURCE_ID)) {
    map.addSource(MEETUP_AREA_SOURCE_ID, { type: "geojson", data: emptyGeometryCollection });
  }

  if (!map.getLayer("workspace-route-halo")) {
    map.addLayer({
      id: "workspace-route-halo",
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#F5F0E8", "line-opacity": 0.9, "line-width": 10 },
    });
  }
  if (!map.getLayer("workspace-route-line")) {
    map.addLayer({
      id: "workspace-route-line",
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#3A2A22", "line-opacity": 0.92, "line-width": 5 },
    });
  }
  if (!map.getLayer("workspace-meetup-area-outline")) {
    map.addLayer({
      id: "workspace-meetup-area-outline",
      type: "line",
      source: MEETUP_AREA_SOURCE_ID,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#EA9940",
        "line-width": 3,
        "line-opacity": 0.95,
        "line-dasharray": [2, 2],
      },
    });
  }
  if (!map.getLayer("workspace-pins")) {
    map.addLayer({
      id: "workspace-pins",
      type: "symbol",
      source: PIN_SOURCE_ID,
      filter: ["!", ["get", "hasPhoto"]],
      layout: {
        "icon-image": ["get", "pinIcon"],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 4, 0.34, 10, 0.52, 15, 0.72],
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });
  }
  if (!map.getLayer(PHOTO_PIN_LAYER)) {
    map.addLayer({
      id: PHOTO_PIN_LAYER,
      type: "symbol",
      source: PIN_SOURCE_ID,
      filter: ["get", "hasPhoto"],
      layout: {
        "icon-image": ["get", "pinIcon"],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 4, 0.38, 10, 0.58, 15, 0.78],
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });
  }
  if (!map.getLayer(PIN_CATEGORY_LABEL_LAYER)) {
    map.addLayer({
      id: PIN_CATEGORY_LABEL_LAYER,
      type: "symbol",
      source: PIN_SOURCE_ID,
      minzoom: 9,
      layout: {
        "text-field": ["get", "category"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 9, 10, 13, 12, 16, 14],
        "text-offset": [0, -3.25],
        "text-anchor": "bottom",
        "text-font": ["Noto Sans Regular"],
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#3A2A22",
        "text-halo-color": "#FBF7F0",
        "text-halo-width": 2,
      },
    });
  }
  if (!map.getLayer("workspace-tourist-spots")) {
    map.addLayer({
      id: "workspace-tourist-spots",
      type: "circle",
      source: TOURIST_SPOT_SOURCE_ID,
      paint: {
        "circle-color": "#6D3AB2",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 4, 9, 7, 14, 11],
        "circle-stroke-color": "#F5F0E8",
        "circle-stroke-width": 2,
      },
    });
  }
  if (!map.getLayer("workspace-tourist-labels")) {
    map.addLayer({
      id: "workspace-tourist-labels",
      type: "symbol",
      source: TOURIST_SPOT_SOURCE_ID,
      minzoom: 8,
      layout: {
        "text-field": ["get", "title"],
        "text-size": 11,
        "text-offset": [0, 1.25],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#3D1D78",
        "text-halo-color": "#F5F0E8",
        "text-halo-width": 1.5,
      },
    });
  }
  if (!map.getLayer("workspace-points")) {
    map.addLayer({
      id: "workspace-points",
      type: "circle",
      source: POINT_SOURCE_ID,
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": ["case", ["==", ["get", "kind"], "stop"], 6, 8],
        "circle-stroke-color": "#F5F0E8",
        "circle-stroke-width": 2,
      },
    });
  }
  if (!map.getLayer("workspace-labels")) {
    map.addLayer({
      id: "workspace-labels",
      type: "symbol",
      source: POINT_SOURCE_ID,
      layout: {
        "text-field": ["get", "title"],
        "text-size": 12,
        "text-offset": [0, 1.35],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#1A1A1A",
        "text-halo-color": "#F5F0E8",
        "text-halo-width": 1.5,
      },
    });
  }
}

function useLocationSuggestions(query: string, limit = 8) {
  const [results, setResults] = useState<ApiLocation[]>([]);
  const [busy, setBusy] = useState(false);
  const cacheRef = useRef(new Map<string, ApiLocation[]>());

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setBusy(false);
      return;
    }

    const cacheKey = `${trimmed.toLowerCase()}|${limit}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setResults(cached);
      setBusy(false);
      return;
    }

    let cancelled = false;
    setBusy(true);
    const timer = window.setTimeout(() => {
      searchLocations(trimmed, limit)
        .then((matches) => {
          if (cancelled) return;
          cacheRef.current.set(cacheKey, matches);
          setResults(matches);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setBusy(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [limit, query]);

  return { results, busy };
}

function LocationField({
  id,
  label,
  value,
  selected,
  results,
  busy,
  onValueChange,
  onSelect,
  onPick,
}: {
  id: string;
  label: string;
  value: string;
  selected: ApiLocation | null;
  results: ApiLocation[];
  busy: boolean;
  onValueChange: (value: string) => void;
  onSelect: (location: ApiLocation) => void;
  onPick: () => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <label htmlFor={id} className={fieldLabel}>
          {label}
        </label>
        {selected && <span className="font-[var(--font-label)] text-xs uppercase tracking-[0.04em] text-[#9E6B5C]">Pinned</span>}
      </div>
      <div className="flex gap-3">
        <input
          id={id}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className={`${inputField} min-w-0 flex-1`}
          placeholder="Type a place or coordinates"
        />
        <button
          type="button"
          onClick={onPick}
          className={iconButton}
          aria-label={`Pick ${label.toLowerCase()} on map`}
          title={`Pick ${label} on map`}
        >
          <MousePointer2 size={18} />
        </button>
      </div>
      <div className="mt-3 flex max-h-36 flex-col gap-2 overflow-y-auto overscroll-contain scroll-smooth">
        {busy && <div className="rounded-lg bg-[#F5F0E8] px-3 py-2 text-sm text-[#6B6B5A]">Searching...</div>}
        {!busy &&
          results.slice(0, 4).map((item) => (
            <button
              key={`${id}-${item.label}-${item.coordinate.join(",")}`}
              type="button"
              onClick={() => onSelect(item)}
              className="rounded-lg border border-[#3A2A22]/10 bg-[#F5F0E8] px-3 py-2 text-left text-sm transition hover:border-[#3A2A22]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2A22] focus-visible:ring-offset-2"
            >
              <span className="block font-semibold text-[#1A1A1A]">{item.label}</span>
              <span className="mt-1 block text-xs text-[#6B6B5A]">
                {item.provider} / {Math.round(item.confidence * 100)}%
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}

function ToolbarPanelTitle({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[#9A978C]">{children}</span>
      {meta ? <span className="text-xs font-semibold text-[#6B6B5A]">{meta}</span> : null}
    </div>
  );
}

function ToolbarAssetIcon({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="h-5 w-5 object-contain" />;
}

function ToolbarActionRow({
  icon,
  label,
  description,
  shortcut,
  selected = false,
  onClick,
}: {
  key?: string;
  icon: ReactNode;
  label: string;
  description: string;
  shortcut?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      title={shortcut ? `${label} (${shortcut})` : label}
      onClick={onClick}
      className={`flex min-h-16 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8A9E] focus-visible:ring-offset-2 ${
        selected ? "bg-[#E7F3F1] text-[#356E72]" : "text-[#1A1A1A] hover:bg-[#F5F0E8]"
      }`}
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${selected ? "bg-white/70" : "bg-[#F5F0E8]"}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-[var(--font-label)] text-sm font-bold text-[#1A1A1A]">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[#858176]">
          {description}
          {shortcut ? <span className="ml-1 font-[var(--font-label)] font-bold text-[#356E72]">Shortcut: {shortcut}</span> : null}
        </span>
      </span>
    </button>
  );
}

export default function MapsWorkspacePage() {
  return (
    <GatedPage featureName="Your personal map workspace">
      <MapsWorkspaceContent />
    </GatedPage>
  );
}

function MapsWorkspaceContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const viewerId = user!.id;
  const groupIds = user?.groupIds ?? DEFAULT_GROUP_IDS;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const clickHandlerRef = useRef<(event: MapMouseEvent) => void>(() => undefined);

  const [mapReady, setMapReady] = useState(false);
  const [styleRevision, setStyleRevision] = useState(0);
  const [baseLayer, setBaseLayer] = useState<BaseLayer>("street");
  const [scope, setScope] = useState<MapScope>("private");

  const [fromText, setFromText] = useState("Metro Manila");
  const [toText, setToText] = useState("");
  const [fromLocation, setFromLocation] = useState<ApiLocation | null>(null);
  const [toLocation, setToLocation] = useState<ApiLocation | null>(null);
  const fromSuggestions = useLocationSuggestions(fromText);
  const toSuggestions = useLocationSuggestions(toText);
  const [markerSearch, setMarkerSearch] = useState("");
  const markerSuggestions = useLocationSuggestions(markerSearch, 6);

  const [pickTarget, setPickTarget] = useState<PickTarget>(null);
  const [drawingActive, setDrawingActive] = useState(false);
  const [boxZoomActive, setBoxZoomActive] = useState(false);
  const [boxZoomDrag, setBoxZoomDrag] = useState<BoxZoomDrag | null>(null);
  const [draftStops, setDraftStops] = useState<ApiLocation[]>([]);
  const [route, setRoute] = useState<ApiRoute | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>("shortest");
  const [routeColor, setRouteColor] = useState("#3A2A22");
  const [routeWidth, setRouteWidth] = useState(5);
  const [draftMarkerLocation, setDraftMarkerLocation] = useState<ApiLocation | null>(null);
  const [markerModalLocation, setMarkerModalLocation] = useState<ApiLocation | null>(null);
  const [selectedPin, setSelectedPin] = useState<ApiPin | null>(null);
  const [activeMap, setActiveMap] = useState<UserMap | null>(null);
  const [placementPreview, setPlacementPreview] = useState<string | null>(null);

  const [pins, setPins] = useState<ApiPin[]>([]);
  const [touristSpots, setTouristSpots] = useState<TouristSpot[]>([]);
  const [travelGroups, setTravelGroups] = useState<TravelGroup[]>([]);
  const [activeTravelGroupId, setActiveTravelGroupId] = useState("");
  const [travelLocations, setTravelLocations] = useState<TravelGroupLocation[]>([]);
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [visibilityScope, setVisibilityScope] = useState<LocationVisibility>("travel_group");
  const [savedRouteCount, setSavedRouteCount] = useState(0);
  const [legend, setLegend] = useState({
    enabled: true,
    title: "Travel Route",
    labels: "Green route: planned street path. Blue points: drawn stops. Photo pins: captured memories.",
    from: "",
    to: "",
    time: "",
  });
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeToolbarMenu, setActiveToolbarMenu] = useState<TravelTracesToolbarMenu | null>(null);
  const [activeTravelTool, setActiveTravelTool] = useState<TravelToolbarTool>("path");
  const [activeSidePanel, setActiveSidePanel] = useState<WorkspaceSidePanel>(null);
  const [meetupPlan, setMeetupPlan] = useState<MeetupPlan | null>(null);
  const [localMapStories, setLocalMapStories] = useState<TravelStory[]>(() => readLocalMapStories());
  const [pendingStoryViewPin, setPendingStoryViewPin] = useState<StoryMapHandoff | null>(null);

  const scopedGroupIds = useMemo(() => (scope === "group" ? groupIds : []), [scope, groupIds]);
  const activeMode = workspaceModes.find((mode) => mode.key === scope) ?? workspaceModes[0];
  const localStoryPins = useMemo(() => localMapStories.map(storyToMapPin).filter((pin): pin is ApiPin => Boolean(pin)), [localMapStories]);
  const mapPins = useMemo(() => [...COMMUNITY_STORY_PINS, ...localStoryPins, ...pins], [localStoryPins, pins]);
  const visiblePins = useMemo(() => mapPins.filter((pin) => pin.scope === scope), [mapPins, scope]);
  const markerPlacementActive = pickTarget === "marker";
  const workspaceFriends = user?.friends?.length ? user.friends : friendList;
  const workspaceFollowers = user?.followers ?? [];

  const routeData = useMemo(() => routeToGeoJson(route), [route]);
  const pointData = useMemo(() => pointsToGeoJson({ fromLocation, toLocation, draftStops }), [draftStops, fromLocation, toLocation]);
  const pinData = useMemo(() => pinsToGeoJson(mapPins, scope), [mapPins, scope]);
  const touristSpotData = useMemo(() => touristSpotsToGeoJson(touristSpots), [touristSpots]);
  const meetupAreaData = useMemo(() => meetupAreaToGeoJson(meetupPlan), [meetupPlan]);
  const activeTravelGroup = useMemo(
    () => travelGroups.find((group) => group.circle_id === activeTravelGroupId) ?? travelGroups[0] ?? null,
    [activeTravelGroupId, travelGroups],
  );
  const markerStorySuggestions = useMemo(() => {
    const query = markerSearch.trim().toLowerCase();
    if (query.length < 2) return [];
    return STORIES.filter((story) => {
      const point = STORY_MAP_POINTS[story.id];
      return [story.title, story.author, story.region, story.category, point?.place ?? ""].some((value) => value.toLowerCase().includes(query));
    }).slice(0, 4);
  }, [markerSearch]);

  const refreshScopedData = useCallback(async () => {
    const mapId = activeMap?.map_id;
    const [nextPins, nextRoutes, nextTouristSpots] = await Promise.all([
      listPins(viewerId, groupIds, mapId),
      listRoutes(viewerId, groupIds),
      listTouristSpots(viewerId),
    ]);
    setPins(nextPins);
    setSavedRouteCount(nextRoutes.length);
    setTouristSpots(nextTouristSpots);
  }, [activeMap?.map_id, groupIds, viewerId]);

  useEffect(() => {
    void getDefaultMap()
      .then((map) => setActiveMap(map))
      .catch(() => undefined);
  }, [viewerId]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAPTILER_STYLES.street,
      bounds: SEA_BOUNDS,
      fitBoundsOptions: { padding: 36 },
      maxBounds: SEA_BOUNDS,
      pitch: 0,
      bearing: 0,
      attributionControl: { compact: true },
      canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true },
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.on("load", () => {
      ensureWorkspaceLayers(map);
      map.fitBounds(SEA_BOUNDS, { padding: 36, duration: 0 });
      setMapReady(true);
      setStyleRevision((value) => value + 1);
    });
    map.on("style.load", () => {
      ensureWorkspaceLayers(map);
      setStyleRevision((value) => value + 1);
    });
    map.on("click", (event) => clickHandlerRef.current(event));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    const resizeMap = () => map.resize();
    resizeMap();

    const observer = new ResizeObserver(resizeMap);
    observer.observe(container);
    window.addEventListener("resize", resizeMap);
    window.addEventListener("orientationchange", resizeMap);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeMap);
      window.removeEventListener("orientationchange", resizeMap);
    };
  }, [baseLayer, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const refreshLayers = () => setStyleRevision((value) => value + 1);
    map.once("idle", refreshLayers);
    map.setStyle(MAPTILER_STYLES[baseLayer]);
    return () => {
      map.off("idle", refreshLayers);
    };
  }, [baseLayer, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.isStyleLoaded()) return;
    ensureWorkspaceLayers(map);
    setGeoJsonSource(map, ROUTE_SOURCE_ID, routeData);
    setGeoJsonSource(map, POINT_SOURCE_ID, pointData);
    setGeoJsonSource(map, PIN_SOURCE_ID, pinData);
    setGeoJsonSource(map, TOURIST_SPOT_SOURCE_ID, touristSpotData);
    setGeoJsonSource(map, MEETUP_AREA_SOURCE_ID, meetupAreaData);
    if (map.getLayer("workspace-route-line")) {
      map.setPaintProperty("workspace-route-line", "line-color", routeColor);
      map.setPaintProperty("workspace-route-line", "line-width", routeWidth);
      map.setPaintProperty("workspace-route-halo", "line-width", routeWidth + 5);
    }
  }, [mapReady, meetupAreaData, pinData, pointData, routeColor, routeData, routeWidth, styleRevision, touristSpotData]);

  useEffect(() => {
    if (!activeMap) return;
    void refreshScopedData().catch(() => setStatus("Map pins and saved routes could not be loaded."));
  }, [activeMap, refreshScopedData]);

  useEffect(() => {
    void listTravelGroups(viewerId)
      .then((groups) => {
        setTravelGroups(groups);
        setActiveTravelGroupId((current) => current || groups[0]?.circle_id || "");
      })
      .catch(() => undefined);
  }, [viewerId]);

  useEffect(() => {
    if (!activeTravelGroupId) return;
    void listTravelGroupLocations(activeTravelGroupId)
      .then(setTravelLocations)
      .catch(() => undefined);
  }, [activeTravelGroupId]);

  useEffect(() => {
    return subscribeWorkspaceEvents((event) => {
      if (event.type === "pin.created") {
        setPins((current) => [event.pin, ...current.filter((pin) => pin.pin_id !== event.pin.pin_id)]);
      }
      if (event.type === "route.updated") {
        setRoute(event.route);
      }
    });
  }, []);

  useEffect(() => {
    setLocalMapStories(readLocalMapStories());

    const pendingStoryView = window.localStorage.getItem("traveltraces.pendingStoryViewPin");
    if (pendingStoryView) {
      window.localStorage.removeItem("traveltraces.pendingStoryViewPin");
      try {
        const parsed = JSON.parse(pendingStoryView) as StoryMapHandoff;
        setPendingStoryViewPin(parsed);
        setScope("public");
        setActiveTravelTool("markers");
        setActiveSidePanel("markers");
        setActiveToolbarMenu(null);
        setStatus(`Opening ${parsed.place ?? parsed.title ?? "this story"} on the public map.`);
      } catch {
        setStatus("Opening this story on the public map.");
      }
    }

    const pendingStoryPin = window.localStorage.getItem("traveltraces.pendingStoryPin");
    if (pendingStoryPin) {
      window.localStorage.removeItem("traveltraces.pendingStoryPin");
      try {
        const parsed = JSON.parse(pendingStoryPin) as StoryMapHandoff;
        if (parsed.coordinate) {
          setScope("public");
          setDraftMarkerLocation({
            coordinate: [parsed.coordinate.lat, parsed.coordinate.lon],
            label: parsed.place ?? parsed.title ?? "Story location",
            provider: "story",
            confidence: 1,
          });
          setMarkerModalLocation(null);
          setPickTarget(null);
          setDrawingActive(false);
          setBoxZoomActive(false);
          setBoxZoomDrag(null);
          setActiveTravelTool("markers");
          setActiveSidePanel("markers");
          setActiveToolbarMenu(null);
          setStatus(`Ready to pin your own story from ${parsed.place ?? parsed.title ?? "this location"}.`);
          return;
        }
      } catch {
        setStatus("Story location is ready to pin. Search the place or drop a marker on the map.");
      }
    }

    const pendingPin = window.localStorage.getItem("traveltraces.pendingExplorePin");
    if (!pendingPin) return;
    window.localStorage.removeItem("traveltraces.pendingExplorePin");
    try {
      const parsed = JSON.parse(pendingPin) as { name?: string; province?: string };
      setScope("public");
      setActiveTravelTool("markers");
      setActiveSidePanel("markers");
      setStatus(`${parsed.name ?? "This Explore destination"} is ready to pin. Drop a marker or open a related story pin in the public map.`);
    } catch {
      setStatus("Explore destination is ready to pin. Drop a marker or open a related story pin in the public map.");
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const canvas = map.getCanvas();
    const precisionPickActive = markerPlacementActive || Boolean(pickTarget) || drawingActive || boxZoomActive;
    if (precisionPickActive) {
      canvas.style.cursor = workspaceMapCursor({ markerPlacementActive, pickTarget, drawingActive, boxZoomActive });
      map.dragPan.disable();
      map.touchZoomRotate.disableRotation();
      return;
    }
    canvas.style.cursor = workspaceMapCursor({ markerPlacementActive, pickTarget, drawingActive, boxZoomActive });
    map.dragPan.enable();
    map.touchZoomRotate.enableRotation();
    setPlacementPreview(null);
  }, [boxZoomActive, drawingActive, mapReady, markerPlacementActive, pickTarget]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !pendingStoryViewPin?.coordinate) return;
    const { coordinate } = pendingStoryViewPin;
    const matchingPin = mapPins.find((pin) => {
      const storyId = typeof pin.media?.storyId === "number" ? pin.media.storyId : null;
      const storyDraftId = typeof pin.media?.storyDraftId === "number" ? pin.media.storyDraftId : null;
      return storyId === pendingStoryViewPin.storyId || storyDraftId === pendingStoryViewPin.storyId;
    });

    map.flyTo({ center: [coordinate.lon, coordinate.lat], zoom: 12.8, duration: 900 });
    setScope("public");
    setSelectedPin(matchingPin ?? null);
    setStatus(matchingPin ? `Showing ${pendingStoryViewPin.place ?? matchingPin.title} on the public map.` : `Showing ${pendingStoryViewPin.place ?? "this story location"} on the public map.`);
    setPendingStoryViewPin(null);
  }, [mapPins, mapReady, pendingStoryViewPin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !markerModalLocation) return;
    map.flyTo({ center: [markerModalLocation.coordinate[1], markerModalLocation.coordinate[0]], zoom: 12, duration: 900 });
  }, [mapReady, markerModalLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !draftMarkerLocation) return;

    const marker = new maplibregl.Marker({ color: "#C4713A", draggable: true })
      .setLngLat([draftMarkerLocation.coordinate[1], draftMarkerLocation.coordinate[0]])
      .addTo(map);

    marker.on("dragend", () => {
      const point = marker.getLngLat();
      const applyDraggedLocation = (location: ApiLocation) => {
        setDraftMarkerLocation(location);
        setMarkerModalLocation((current) => (current ? location : current));
      };
      void reverseLocation(point.lat, point.lng)
        .then(applyDraggedLocation)
        .catch(() =>
          applyDraggedLocation({
            coordinate: [point.lat, point.lng],
            label: `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
            provider: "manual",
            confidence: 1,
          }),
        );
    });

    map.flyTo({ center: [draftMarkerLocation.coordinate[1], draftMarkerLocation.coordinate[0]], zoom: Math.max(map.getZoom(), 12), duration: 700 });
    return () => marker.remove();
  }, [draftMarkerLocation, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const handleMove = (event: MapMouseEvent) => {
      if (!markerPlacementActive && !drawingActive && !pickTarget) return;
      setPlacementPreview(`${event.lngLat.lat.toFixed(5)}, ${event.lngLat.lng.toFixed(5)}`);
    };
    map.on("mousemove", handleMove);
    return () => {
      map.off("mousemove", handleMove);
    };
  }, [drawingActive, mapReady, markerPlacementActive, pickTarget]);

  const fitRoute = useCallback((nextRoute: ApiRoute) => {
    const map = mapRef.current;
    if (!map || !nextRoute.geometry.length) return;
    const bounds = new maplibregl.LngLatBounds();
    nextRoute.geometry.forEach(([lat, lon]) => bounds.extend([lon, lat]));
    map.fitBounds(bounds, { padding: 72, duration: 650, maxZoom: 15 });
  }, []);

  const addOrReplacePin = useCallback((pin: ApiPin) => {
    setPins((current) => [pin, ...current.filter((item) => item.pin_id !== pin.pin_id)]);
    publishWorkspaceEvent({ type: "pin.created", pin });
  }, []);

  const buildRouteFromStops = useCallback(
    async (stops: ApiLocation[], persist = false) => {
      if (stops.length < 2) return null;
      setBusy(true);
      setStatus(null);
      try {
        const nextRoute = await buildDrivingRoute(stops[0], stops[stops.length - 1], {
          waypoints: stops.slice(1, -1),
          mode: routeMode,
          engine: "osrm",
          scope,
          creatorId: viewerId,
          groupIds: scopedGroupIds,
          persist,
        });
        setRoute(nextRoute);
        publishWorkspaceEvent({ type: "route.updated", route: nextRoute });
        fitRoute(nextRoute);
        return nextRoute;
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Route snapping failed.");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [fitRoute, routeMode, scope, scopedGroupIds, viewerId],
  );

  const handleGenerateRoute = async () => {
    setBusy(true);
    setStatus(null);
    try {
      let destination = toLocation;
      if (!destination && toText.trim()) {
        const matches = await searchLocations(toText.trim(), 8);
        destination = matches[0] ?? null;
        if (destination) setToLocation(destination);
      }
      if (!destination) {
        setStatus("Choose a To location by typing or clicking the map.");
        return;
      }

      const originInput = fromLocation ?? fromText.trim();
      if (!originInput) {
        setStatus("Choose a From location by typing or clicking the map.");
        return;
      }

      const nextRoute = await buildDrivingRoute(originInput, destination, {
        mode: routeMode,
        engine: "osrm",
        scope,
        creatorId: viewerId,
        groupIds: scopedGroupIds,
        persist: true,
      });
      setRoute(nextRoute);
      setDraftStops([]);
      setSavedRouteCount((count) => count + (nextRoute.record_id ? 1 : 0));
      const resolvedOrigin = routeEndpointToLocation(nextRoute.origin);
      const resolvedDestination = routeEndpointToLocation(nextRoute.destination);
      if (resolvedOrigin) {
        setFromLocation(resolvedOrigin);
        setFromText(resolvedOrigin.label);
      }
      if (resolvedDestination) {
        setToLocation(resolvedDestination);
        setToText(resolvedDestination.label);
      }
      setLegend((current) => ({
        ...current,
        from: resolvedOrigin?.label ?? fromText,
        to: resolvedDestination?.label ?? destination?.label ?? toText,
        time: formatDuration(nextRoute.duration_s),
      }));
      publishWorkspaceEvent({ type: "route.updated", route: nextRoute });
      fitRoute(nextRoute);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Route request failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleMapMarkerDrop = useCallback((location: ApiLocation) => {
    setDraftMarkerLocation(location);
    setMarkerModalLocation(null);
    setPickTarget(null);
    setStatus(`Draft pin placed at ${location.label}. Drag it for accuracy, then write your story.`);
  }, []);

  const openMarkerAtLocation = useCallback((location: ApiLocation, message?: string) => {
    setDraftMarkerLocation(location);
    setMarkerModalLocation(null);
    setPickTarget(null);
    setDrawingActive(false);
    setBoxZoomActive(false);
    setBoxZoomDrag(null);
    setActiveTravelTool("markers");
    setActiveSidePanel("markers");
    setActiveToolbarMenu(null);
    setStatus(message ?? `Draft pin placed at ${location.label}. Drag it for accuracy, then write your story.`);
    mapRef.current?.flyTo({ center: [location.coordinate[1], location.coordinate[0]], zoom: 12, duration: 900 });
  }, []);

  const saveMarkerFromModal = useCallback(
    async (input: { placeName: string; title: string; description: string; category: string; scope: MapScope; photos: PendingMarkerPhoto[]; source: ApiPin["source"] }) => {
      if (!markerModalLocation) return;
      setBusy(true);
      setStatus(null);
      try {
        const payload = markerSavePayload({
          title: input.title,
          description: input.description,
          category: input.category,
          placeName: input.placeName,
          lat: markerModalLocation.coordinate[0],
          lon: markerModalLocation.coordinate[1],
          address: input.placeName,
          scope: input.scope,
          creatorId: viewerId,
          groupIds: input.scope === "group" ? groupIds : [],
          mapId: activeMap?.map_id,
          photos: input.photos,
          source: input.source,
        });
        const storyId = Date.now();
        let pin: ApiPin;
        let savedLocally = false;
        try {
          pin = await createPin({
            ...payload,
            media: { ...(payload.media ?? {}), storyDraftId: storyId },
          });
          pin = { ...pin, media: { ...(pin.media ?? {}), ...(payload.media ?? {}), storyDraftId: storyId } };
        } catch {
          const now = new Date().toISOString();
          const localPinId = `local-marker-${storyId}`;
          pin = {
            pin_id: localPinId,
            post_id: localPinId,
            title: payload.title,
            note: payload.note,
            coordinate: { lat: payload.lat, lon: payload.lon },
            address: payload.address,
            scope: payload.scope,
            creator_id: user?.name ?? viewerId,
            group_ids: payload.groupIds,
            source: payload.source,
            media: { ...(payload.media ?? {}), storyDraftId: storyId },
            photos: payload.photos,
            map_id: payload.mapId,
            created_at: now,
            updated_at: now,
          };
          savedLocally = true;
        }
        persistPrototypeStory({
          storyId,
          pin,
          category: input.category,
          placeName: input.placeName,
          author: user?.name ?? "You",
          authorAvatar: user?.avatar,
        });
        addOrReplacePin(pin);
        setSelectedPin(pin);
        setMarkerModalLocation(null);
        setDraftMarkerLocation(null);
        setScope(input.scope);
        setStatus(savedLocally ? "Saved locally for prototype mode. Click the pin to open the full story." : "Marker saved. Click the pin to open the full story.");
      } finally {
        setBusy(false);
      }
    },
    [activeMap?.map_id, addOrReplacePin, groupIds, markerModalLocation, user?.avatar, user?.name, viewerId],
  );

  const handlePickedLocation = useCallback(
    (location: ApiLocation) => {
      if (pickTarget === "from") {
        setFromLocation(location);
        setFromText(location.label);
        setPickTarget(null);
        return;
      }

      if (pickTarget === "to") {
        setToLocation(location);
        setToText(location.label);
        setPickTarget(null);
        return;
      }

      if (pickTarget === "marker") {
        handleMapMarkerDrop(location);
        return;
      }

      if (drawingActive) {
        setDraftStops((current) => {
          const next = [...current, location];
          if (next.length === 1) {
            setStatus("Route start set. Click the destination point and TravelTraces will correct the line to the best route.");
          } else {
            setStatus("Correcting your drawn line to the right route...");
            void buildRouteFromStops(next, false).then((nextRoute) => {
              if (nextRoute) {
                setStatus(next.length === 2 ? "Route corrected from your first point to your destination." : "Route updated with the new routed stop.");
              }
            });
          }
          return next;
        });
      }
    },
    [buildRouteFromStops, drawingActive, handleMapMarkerDrop, pickTarget],
  );

  useEffect(() => {
    clickHandlerRef.current = (event) => {
      if (boxZoomActive) return;
      void reverseFromMapClick(event).then(handlePickedLocation);
    };
  }, [boxZoomActive, handlePickedLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !boxZoomActive) {
      setBoxZoomDrag(null);
      return;
    }

    let dragState: BoxZoomDrag | null = null;
    const setDrag = (next: BoxZoomDrag | null) => {
      dragState = next;
      setBoxZoomDrag(next);
    };

    const handleMouseDown = (event: MapMouseEvent) => {
      if (event.originalEvent.button !== 0) return;
      event.preventDefault();
      event.originalEvent.stopPropagation();
      const next = { startX: event.point.x, startY: event.point.y, currentX: event.point.x, currentY: event.point.y };
      setDrag(next);
    };

    const handleMouseMove = (event: MapMouseEvent) => {
      if (!dragState) return;
      setDrag({ ...dragState, currentX: event.point.x, currentY: event.point.y });
    };

    const handleMouseUp = (event: MapMouseEvent) => {
      if (!dragState) return;
      event.preventDefault();
      event.originalEvent.stopPropagation();
      const drag = dragState;
      setDrag(null);
      const minX = Math.min(drag.startX, drag.currentX);
      const maxX = Math.max(drag.startX, drag.currentX);
      const minY = Math.min(drag.startY, drag.currentY);
      const maxY = Math.max(drag.startY, drag.currentY);
      if (maxX - minX < 8 || maxY - minY < 8) {
        map.zoomIn({ duration: 350 });
        return;
      }
      const northWest = map.unproject([minX, minY]);
      const southEast = map.unproject([maxX, maxY]);
      map.fitBounds(
        new maplibregl.LngLatBounds([northWest.lng, southEast.lat], [southEast.lng, northWest.lat]),
        { padding: 48, duration: 650, maxZoom: 17 },
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDrag(null);
      setBoxZoomActive(false);
      setStatus("Box zoom cancelled.");
    };

    map.dragPan.disable();
    map.getCanvas().style.cursor = workspaceMapCursor({ markerPlacementActive, pickTarget, drawingActive, boxZoomActive: true });
    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [boxZoomActive, drawingActive, mapReady, markerPlacementActive, pickTarget]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const layers = ["workspace-pins", PHOTO_PIN_LAYER, PIN_CATEGORY_LABEL_LAYER];
    const onPinClick = (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const pinId = feature?.properties?.pin_id;
      if (!pinId) return;
      const pin = mapPins.find((item) => item.pin_id === pinId);
      if (!pin) return;

      const storyHref = pinStoryHref(pin);
      if (storyHref) {
        navigate(storyHref);
        return;
      }

      setSelectedPin(pin);
    };
    const onPinEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onPinLeave = () => {
      map.getCanvas().style.cursor = workspaceMapCursor({ markerPlacementActive, pickTarget, drawingActive, boxZoomActive });
    };
    layers.forEach((layer) => {
      map.on("click", layer, onPinClick);
      map.on("mouseenter", layer, onPinEnter);
      map.on("mouseleave", layer, onPinLeave);
    });
    return () => {
      layers.forEach((layer) => {
        map.off("click", layer, onPinClick);
        map.off("mouseenter", layer, onPinEnter);
        map.off("mouseleave", layer, onPinLeave);
      });
    };
  }, [boxZoomActive, drawingActive, mapPins, mapReady, markerPlacementActive, navigate, pickTarget, styleRevision]);

  const handleMeetupVenueSelect = useCallback((suggestion: MeetupSuggestion) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [suggestion.coordinate[1], suggestion.coordinate[0]], zoom: 13, duration: 900 });
    setStatus(`Meetup suggestion: ${suggestion.name}`);
  }, []);

  const handleMeetupPlanChange = useCallback((nextPlan: MeetupPlan | null) => {
    setMeetupPlan(nextPlan);
  }, []);

  const handleRouteModeChange = useCallback((mode: RouteMode) => {
    setRouteMode(mode);
  }, []);

  const handleBaseLayerChange = useCallback((layer: BaseLayer) => {
    setBoxZoomActive(false);
    setBoxZoomDrag(null);
    setBaseLayer(layer);
  }, []);

  const handlePanTool = useCallback(() => {
    const map = mapRef.current;
    setBoxZoomActive(false);
    setBoxZoomDrag(null);
    setDrawingActive(false);
    setPickTarget(null);
    setPlacementPreview(null);
    if (map) {
      map.dragPan.enable();
      map.getCanvas().style.cursor = workspaceMapCursor({ markerPlacementActive: false, pickTarget: null, drawingActive: false, boxZoomActive: false });
    }
    setStatus("Pan mode active.");
  }, []);

  const handleBoxZoomTool = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      map.scrollZoom.enable();
      map.touchZoomRotate.enable();
      map.dragPan.disable();
      map.getCanvas().style.cursor = workspaceMapCursor({ markerPlacementActive: false, pickTarget: null, drawingActive: false, boxZoomActive: true });
    }
    setDrawingActive(false);
    setPickTarget(null);
    setPlacementPreview(null);
    setBoxZoomActive(true);
    setStatus("Zoom In Box active. Drag a rectangle on the map, or press Escape to cancel.");
  }, []);

  const handleZoomOutTool = useCallback(() => {
    const map = mapRef.current;
    setBoxZoomActive(false);
    setBoxZoomDrag(null);
    if (map) {
      map.zoomOut({ duration: 450 });
    }
    setStatus("Zoomed out from the current map center.");
  }, []);

  const handleDrawingToggle = useCallback(() => {
    setBoxZoomActive(false);
    setBoxZoomDrag(null);
    setDrawingActive((value) => {
      const next = !value;
      setStatus(next ? "Draw Route active. Click the route start, then click the destination. The line will snap to the right route." : "Draw Route stopped.");
      return next;
    });
    setPickTarget(null);
  }, []);

  const handleClearDraw = useCallback(() => {
    setDraftStops([]);
    setRoute(null);
  }, []);

  const handleDropMarkerClick = useCallback(() => {
    setBoxZoomActive(false);
    setBoxZoomDrag(null);
    setPickTarget("marker");
    setDrawingActive(false);
    setStatus("Marker Placement Mode Active. Click on the map to place your travel post.");
  }, []);

  const handlePickFrom = useCallback(() => {
    setBoxZoomActive(false);
    setBoxZoomDrag(null);
    setDrawingActive(false);
    setPickTarget("from");
    setStatus("Pick From active. Click the map to set the route origin.");
  }, []);
  const handlePickTo = useCallback(() => {
    setBoxZoomActive(false);
    setBoxZoomDrag(null);
    setDrawingActive(false);
    setPickTarget("to");
    setStatus("Pick To active. Click the map to set the route destination.");
  }, []);

  const handleFromValueChange = useCallback((value: string) => {
    setFromText(value);
    setFromLocation(null);
  }, []);

  const handleToValueChange = useCallback((value: string) => {
    setToText(value);
    setToLocation(null);
  }, []);

  const handleFromSelect = useCallback((location: ApiLocation) => {
    setFromLocation(location);
    setFromText(location.label);
  }, []);

  const handleToSelect = useCallback((location: ApiLocation) => {
    setToLocation(location);
    setToText(location.label);
  }, []);

  const touristSpotToLocation = useCallback((spot: TouristSpot): ApiLocation => ({
    coordinate: [spot.latitude, spot.longitude],
    label: spot.name,
    provider: "saved-tourist-spot",
    confidence: 1,
  }), []);

  const handleUseSpotAsFrom = useCallback((spot: TouristSpot) => {
    const location = touristSpotToLocation(spot);
    setFromLocation(location);
    setFromText(location.label);
    setStatus(`${spot.name} set as route origin.`);
  }, [touristSpotToLocation]);

  const handleUseSpotAsTo = useCallback((spot: TouristSpot) => {
    const location = touristSpotToLocation(spot);
    setToLocation(location);
    setToText(location.label);
    setStatus(`${spot.name} set as route destination.`);
  }, [touristSpotToLocation]);

  const handleCreatePostFromSpot = useCallback((spot: TouristSpot) => {
    handleMapMarkerDrop(touristSpotToLocation(spot));
  }, [handleMapMarkerDrop, touristSpotToLocation]);

  const handleFlyToTouristSpot = useCallback((spot: TouristSpot) => {
    mapRef.current?.flyTo({ center: [spot.longitude, spot.latitude], zoom: 12.5, duration: 850 });
    setStatus(`${spot.name} selected. Use it as a route point, meetup destination, or travel post location.`);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer("workspace-tourist-spots")) return;
    const onSpotClick = (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const placeId = feature?.properties?.place_id;
      if (!placeId) return;
      const spot = touristSpots.find((item) => item.place_id === placeId);
      if (spot) handleUseSpotAsTo(spot);
    };
    map.on("click", "workspace-tourist-spots", onSpotClick);
    map.on("mouseenter", "workspace-tourist-spots", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "workspace-tourist-spots", () => {
      map.getCanvas().style.cursor = workspaceMapCursor({ markerPlacementActive, pickTarget, drawingActive, boxZoomActive });
    });
    return () => {
      map.off("click", "workspace-tourist-spots", onSpotClick);
    };
  }, [boxZoomActive, drawingActive, handleUseSpotAsTo, mapReady, markerPlacementActive, pickTarget, styleRevision, touristSpots]);

  const handleExportFormatChange = useCallback((format: ExportFormat) => {
    setExportFormat(format);
  }, []);

  const handleCloseSelectedPin = useCallback(() => setSelectedPin(null), []);
  const handleCloseMarkerModal = useCallback(() => setMarkerModalLocation(null), []);

  const handleUseRouteTimeForLegend = useCallback(() => {
    setLegend((current) => ({ ...current, time: formatDuration(route?.duration_s) }));
  }, [route?.duration_s]);

  const handleUseGpsAsFrom = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("Geolocation is unavailable in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = await reverseLocation(position.coords.latitude, position.coords.longitude).catch(() => ({
          coordinate: [position.coords.latitude, position.coords.longitude] as [number, number],
          label: "Current location",
          provider: "navigator",
          confidence: 1,
        }));
        setFromLocation(location);
        setFromText(location.label);
        mapRef.current?.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 14 });
      },
      (error) => setStatus(error.message || "Location permission was denied."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);

  const captureCurrentPosition = useCallback(() => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is unavailable in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 });
  }), []);

  const refreshTravelLocations = useCallback(async () => {
    if (!activeTravelGroupId) return;
    const locations = await listTravelGroupLocations(activeTravelGroupId);
    setTravelLocations(locations);
  }, [activeTravelGroupId]);

  const handleEnableLocationSharing = useCallback(async () => {
    if (!activeTravelGroupId) {
      setStatus("Create or join a travel group before sharing location.");
      return;
    }
    setBusy(true);
    try {
      const position = await captureCurrentPosition();
      await updateTravelGroupLocation({
        groupId: activeTravelGroupId,
        userId: viewerId,
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracyM: position.coords.accuracy,
        activity: "traveling",
        sharingEnabled: true,
        visibilityScope,
      });
      setSharingEnabled(true);
      await refreshTravelLocations();
      setStatus("Live location sharing is on for the selected travel scope.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Location sharing could not be enabled.");
    } finally {
      setBusy(false);
    }
  }, [activeTravelGroupId, captureCurrentPosition, refreshTravelLocations, viewerId, visibilityScope]);

  const handleStopLocationSharing = useCallback(async () => {
    if (!activeTravelGroupId) return;
    setBusy(true);
    try {
      await updateTravelGroupLocation({
        groupId: activeTravelGroupId,
        userId: viewerId,
        sharingEnabled: false,
        visibilityScope,
      });
      setSharingEnabled(false);
      await refreshTravelLocations();
      setStatus("Location sharing stopped. Your live location is no longer visible.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Location sharing could not be stopped.");
    } finally {
      setBusy(false);
    }
  }, [activeTravelGroupId, refreshTravelLocations, viewerId, visibilityScope]);

  const handleTravelCheckIn = useCallback(async () => {
    if (!activeTravelGroupId) return;
    setBusy(true);
    try {
      const position = await captureCurrentPosition();
      await checkInTravelGroup({
        groupId: activeTravelGroupId,
        userId: viewerId,
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        visibilityScope,
      });
      setSharingEnabled(true);
      await refreshTravelLocations();
      setStatus("Check-in shared with the selected travel group.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Check-in failed.");
    } finally {
      setBusy(false);
    }
  }, [activeTravelGroupId, captureCurrentPosition, refreshTravelLocations, viewerId, visibilityScope]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (isTyping) return;

      const key = event.key.toLowerCase();
      const closeToolbar = () => setActiveToolbarMenu(null);

      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "p") {
        event.preventDefault();
        setActiveSidePanel(null);
        handlePanTool();
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "b") {
        event.preventDefault();
        setActiveSidePanel(null);
        handleBoxZoomTool();
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "e") {
        event.preventDefault();
        setActiveSidePanel("export");
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "d") {
        event.preventDefault();
        setActiveTravelTool("draw");
        setActiveSidePanel("draw");
        handleDrawingToggle();
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "m") {
        event.preventDefault();
        setActiveTravelTool("markers");
        setActiveSidePanel("markers");
        handleDropMarkerClick();
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "f") {
        event.preventDefault();
        setActiveTravelTool("path");
        setActiveSidePanel("path");
        handlePickFrom();
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "t") {
        event.preventDefault();
        setActiveTravelTool("path");
        setActiveSidePanel("path");
        handlePickTo();
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "l") {
        event.preventDefault();
        setActiveTravelTool("sharing");
        setActiveSidePanel("sharing");
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "k") {
        event.preventDefault();
        setActiveTravelTool("meetup");
        setActiveSidePanel("meetup");
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && event.shiftKey && key === "s") {
        event.preventDefault();
        setActiveTravelTool("spots");
        setActiveSidePanel("spots");
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "-") {
        event.preventDefault();
        setActiveSidePanel(null);
        handleZoomOutTool();
        closeToolbar();
        return;
      }
      if (event.ctrlKey && event.altKey && !event.shiftKey && key === "1") {
        event.preventDefault();
        handleBaseLayerChange("street");
        closeToolbar();
        return;
      }
      if (event.ctrlKey && event.altKey && !event.shiftKey && key === "2") {
        event.preventDefault();
        handleBaseLayerChange("satellite");
        closeToolbar();
        return;
      }
      if (event.ctrlKey && event.altKey && !event.shiftKey && key === "3") {
        event.preventDefault();
        handleBaseLayerChange("terrain");
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "1") {
        event.preventDefault();
        setScope("private");
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "2") {
        event.preventDefault();
        setScope("group");
        closeToolbar();
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && key === "3") {
        event.preventDefault();
        setScope("public");
        closeToolbar();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [
    handleBaseLayerChange,
    handleBoxZoomTool,
    handleDrawingToggle,
    handleDropMarkerClick,
    handlePanTool,
    handlePickFrom,
    handlePickTo,
    handleZoomOutTool,
  ]);

  const handleExport = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    setBusy(true);
    setStatus(null);
    try {
      map.easeTo({ pitch: 0, bearing: 0, duration: 0 });
      await new Promise<void>((resolve) => {
        if (map.loaded()) {
          window.setTimeout(resolve, 120);
        } else {
          map.once("idle", () => resolve());
        }
      });
      const sourceCanvas = map.getCanvas();
      const output = document.createElement("canvas");
      output.width = sourceCanvas.width;
      output.height = sourceCanvas.height;
      const context = output.getContext("2d");
      if (!context) throw new Error("Canvas export is unavailable.");
      context.drawImage(sourceCanvas, 0, 0);

      if (legend.enabled) {
        const scale = output.width / Math.max(1, sourceCanvas.clientWidth);
        const panelWidth = Math.min(output.width * 0.42, 460 * scale);
        const padding = 16 * scale;
        const x = output.width - panelWidth - 22 * scale;
        const y = 22 * scale;
        context.fillStyle = "rgba(245, 240, 232, 0.94)";
        context.strokeStyle = "rgba(45, 74, 45, 0.25)";
        context.lineWidth = scale;
        context.fillRect(x, y, panelWidth, 170 * scale);
        context.strokeRect(x, y, panelWidth, 170 * scale);
        context.fillStyle = "#3A2A22";
        context.font = `${18 * scale}px Georgia`;
        context.fillText(legend.title || "Map Export", x + padding, y + 28 * scale);
        context.fillStyle = "#1A1A1A";
        context.font = `${12 * scale}px Arial`;
        const rows = [
          `From: ${legend.from || fromLocation?.label || fromText || "Not set"}`,
          `To: ${legend.to || toLocation?.label || toText || "Not set"}`,
          `Estimated time: ${legend.time || formatDuration(route?.duration_s)}`,
          legend.labels,
        ].filter(Boolean);
        rows.forEach((row, index) => {
          context.fillText(String(row).slice(0, 80), x + padding, y + (55 + index * 24) * scale);
        });
      }

      const mime = exportFormat === "jpeg" ? "image/jpeg" : "image/png";
      const dataUrl = output.toDataURL(mime, 0.94);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `travelplaces-map-${Date.now()}.${exportFormat === "jpeg" ? "jpg" : "png"}`;
      link.click();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Map export failed. The basemap may have blocked canvas capture.");
    } finally {
      setBusy(false);
    }
  }, [exportFormat, fromLocation?.label, fromText, legend, route?.duration_s, toLocation?.label, toText]);

  const pathFinderControls = (
    <div className="grid gap-4">
      <LocationField
        id="toolbar-from"
        label="From"
        value={fromText}
        selected={fromLocation}
        results={fromSuggestions.results}
        busy={fromSuggestions.busy}
        onValueChange={handleFromValueChange}
        onSelect={handleFromSelect}
        onPick={() => {
          handlePickFrom();
          setActiveToolbarMenu(null);
        }}
      />
      <LocationField
        id="toolbar-to"
        label="To"
        value={toText}
        selected={toLocation}
        results={toSuggestions.results}
        busy={toSuggestions.busy}
        onValueChange={handleToValueChange}
        onSelect={handleToSelect}
        onPick={() => {
          handlePickTo();
          setActiveToolbarMenu(null);
        }}
      />
      <WorkspaceToggleGroup
        value={routeMode}
        options={[
          { value: "shortest", label: "shortest" },
          { value: "fastest", label: "fastest" },
        ]}
        onChange={handleRouteModeChange}
      />
      <WorkspaceButton variant="primary" icon={Route} disabled={busy} onClick={() => void handleGenerateRoute()}>
        Generate Snapped Route
      </WorkspaceButton>
      {route ? (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-[#F5F0E8] p-3">
            <dt className="text-xs font-bold uppercase tracking-[0.04em] text-[#6B6B5A]">Distance</dt>
            <dd className="m-0 mt-1 font-semibold text-[#3A2A22]">{formatDistance(route.distance_m)}</dd>
          </div>
          <div className="rounded-lg bg-[#F5F0E8] p-3">
            <dt className="text-xs font-bold uppercase tracking-[0.04em] text-[#6B6B5A]">Travel Time</dt>
            <dd className="m-0 mt-1 font-semibold text-[#3A2A22]">{formatDuration(route.duration_s)}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );

  const drawRouteControls = (
    <div className="grid gap-4">
      <div className={toggleGrid}>
        <WorkspaceButton
          variant={drawingActive ? "accent" : "neutral"}
          icon={MousePointer2}
          onClick={() => {
            handleDrawingToggle();
            setActiveToolbarMenu(null);
          }}
        >
          {drawingActive ? "Drawing" : "Draw"}
        </WorkspaceButton>
        <WorkspaceButton variant="neutral" icon={X} onClick={handleClearDraw}>
          Clear
        </WorkspaceButton>
      </div>
      <label className="grid gap-2">
        <span className={fieldLabel}>Route Color</span>
        <input
          type="color"
          value={routeColor}
          onChange={(event) => setRouteColor(event.target.value)}
          className="h-12 w-full cursor-pointer rounded-lg border border-[#3A2A22]/15 bg-[#F5F0E8] p-1"
        />
      </label>
      <label className="grid gap-2">
        <span className={fieldLabel}>Path Width: {routeWidth}px</span>
        <input type="range" min={3} max={12} value={routeWidth} onChange={(event) => setRouteWidth(Number(event.target.value))} className="w-full" />
      </label>
      <div className="rounded-lg bg-[#F5F0E8] p-3 text-sm leading-6 text-[#6B6B5A]">
        {draftStops.length} drawn points. Each segment is routed through OSRM so the line follows street geometry.
      </div>
    </div>
  );

  const liveSharingControls = (
    <div className="grid gap-3">
      <label className="grid gap-2">
        <span className={fieldLabel}>Travel Group</span>
        <select value={activeTravelGroupId} onChange={(event) => setActiveTravelGroupId(event.target.value)} className={inputField}>
          {travelGroups.map((group) => (
            <option key={group.circle_id} value={group.circle_id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        <span className={fieldLabel}>Visibility</span>
        <select value={visibilityScope} onChange={(event) => setVisibilityScope(event.target.value as LocationVisibility)} className={inputField}>
          <option value="private">Private</option>
          <option value="friends">Friends</option>
          <option value="travel_group">Travel Group</option>
          <option value="event_participants">Event Participants</option>
          <option value="public">Public</option>
        </select>
      </label>
      <div className={toggleGrid}>
        <WorkspaceButton variant={sharingEnabled ? "accent" : "secondary"} icon={LocateFixed} disabled={busy || !activeTravelGroup} onClick={() => void handleEnableLocationSharing()}>
          {sharingEnabled ? "Update" : "Share"}
        </WorkspaceButton>
        <WorkspaceButton variant="neutral" icon={WifiOff} disabled={busy || !activeTravelGroup} onClick={() => void handleStopLocationSharing()}>
          Stop
        </WorkspaceButton>
      </div>
      <WorkspaceButton variant="primary" icon={MapPin} disabled={busy || !activeTravelGroup} onClick={() => void handleTravelCheckIn()}>
        Check In
      </WorkspaceButton>
      <div className="rounded-lg bg-[#F5F0E8] p-3 text-xs leading-5 text-[#6B6B5A]">
        <span className="mb-1 block font-bold text-[#3A2A22]">
          {sharingEnabled ? `Sharing with ${activeTravelGroup?.name ?? "selected travel group"}` : "Location sharing is off"}
        </span>
        {travelLocations.filter((item) => item.sharing_enabled && item.coordinate).length} travelers currently visible. Disabled sharing hides coordinates immediately.
      </div>
    </div>
  );

  const savedSpotControls = (
    <div className="grid gap-3">
      <div className="rounded-lg bg-[#F5F0E8] p-3 text-sm text-[#3A2A22]">
        <span className="font-bold">{touristSpots.length}</span> saved tourist spots
      </div>
      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
        {touristSpots.slice(0, 8).map((spot) => (
          <div key={spot.place_id} className="rounded-lg border border-[#3A2A22]/10 bg-[#F5F0E8] p-3 text-sm">
            <button type="button" onClick={() => handleFlyToTouristSpot(spot)} className="w-full text-left font-semibold text-[#1A1A1A]">
              {spot.name}
            </button>
            <div className="mt-1 text-xs text-[#6B6B5A]">{spot.category}</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => handleUseSpotAsFrom(spot)} className="min-h-9 rounded border border-[#3A2A22]/15 text-xs font-semibold uppercase text-[#3A2A22]">
                From
              </button>
              <button type="button" onClick={() => handleUseSpotAsTo(spot)} className="min-h-9 rounded border border-[#3A2A22]/15 text-xs font-semibold uppercase text-[#3A2A22]">
                To
              </button>
              <button type="button" onClick={() => handleCreatePostFromSpot(spot)} className="min-h-9 rounded bg-[#C4713A] text-xs font-semibold uppercase text-[#F5F0E8]">
                Post
              </button>
            </div>
          </div>
        ))}
        {!touristSpots.length ? <div className="rounded-lg bg-[#F5F0E8] p-4 text-sm text-[#6B6B5A]">Saved tourist spots will appear here.</div> : null}
      </div>
    </div>
  );

  const markerControls = (
    <div className="grid gap-4">
      <WorkspaceButton
        variant={markerPlacementActive ? "accent" : "secondary"}
        icon={MapPin}
        onClick={() => {
          handleDropMarkerClick();
          setActiveToolbarMenu(null);
        }}
      >
        {markerPlacementActive ? "Placing Marker" : "Drop Marker"}
      </WorkspaceButton>
      {draftMarkerLocation ? (
        <div className="rounded-lg border border-[#C4713A]/25 bg-[#C4713A]/10 p-3 text-sm">
          <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#C4713A]">Draft pin</p>
          <p className="m-0 mt-2 font-semibold text-[#3A2A22]">{draftMarkerLocation.label}</p>
          <p className="m-0 mt-1 text-xs leading-5 text-[#6B6B5A]">Drag the pin on the map to make the location more accurate before writing the post.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMarkerModalLocation(draftMarkerLocation)}
              className="min-h-10 rounded bg-[#3A2A22] px-3 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#F5F0E8]"
            >
              Write Story
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftMarkerLocation(null);
                setMarkerModalLocation(null);
              }}
              className="min-h-10 rounded border border-[#3A2A22]/15 px-3 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#3A2A22]"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
      <div className="rounded-lg border border-[#3A2A22]/10 bg-[#F5F0E8] p-3">
        <label className="mb-2 block font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#3A2A22]">
          Search a place to pin
        </label>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9E6B5C]" />
          <input
            value={markerSearch}
            onChange={(event) => setMarkerSearch(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-[#3A2A22]/15 bg-white pl-9 pr-3 text-sm text-[#1A1A1A] outline-none transition focus:border-[#9E6B5C] focus:ring-2 focus:ring-[#9E6B5C]/20"
            placeholder="Search a beach, cafe, trail, city..."
          />
        </div>
        {markerSearch.trim().length >= 2 ? (
          <div className="mt-3 grid gap-2">
            {markerSuggestions.busy ? <div className="rounded bg-white px-3 py-2 text-xs text-[#6B6B5A]">Searching places...</div> : null}
            {markerSuggestions.results.slice(0, 4).map((item) => (
              <button
                key={`${item.label}-${item.coordinate.join(",")}`}
                type="button"
                onClick={() => {
                  setMarkerSearch(item.label);
                  openMarkerAtLocation(item, `Draft pin placed at ${item.label}. Drag it for accuracy, then write your story.`);
                }}
                className="rounded-lg border border-[#3A2A22]/10 bg-white px-3 py-2 text-left text-xs transition hover:border-[#9E6B5C]/50"
              >
                <span className="flex items-center gap-2 font-semibold text-[#1A1A1A]"><MapPin size={13} />{item.label}</span>
                <span className="mt-1 block text-[#6B6B5A]">{item.provider} / {Math.round(item.confidence * 100)}% match</span>
              </button>
            ))}
            {markerStorySuggestions.map((story) => {
              const point = STORY_MAP_POINTS[story.id];
              return (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => navigate(`/stories?story=${story.id}`)}
                  className="rounded-lg border border-[#C4713A]/20 bg-[#C4713A]/10 px-3 py-2 text-left text-xs transition hover:border-[#C4713A]/50"
                >
                  <span className="flex items-center gap-2 font-semibold text-[#3A2A22]"><BookOpen size={13} />{story.title}</span>
                  <span className="mt-1 block text-[#6B6B5A]">{point?.place ?? story.region} / open full story</span>
                </button>
              );
            })}
            {!markerSuggestions.busy && !markerSuggestions.results.length && !markerStorySuggestions.length ? (
              <div className="rounded bg-white px-3 py-2 text-xs text-[#6B6B5A]">No matching places or stories yet.</div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex max-h-56 flex-col gap-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
        {visiblePins.slice(0, 6).map((pin) => (
          <button
            key={pin.pin_id}
            type="button"
            onClick={() => setSelectedPin(pin)}
            className="rounded-lg border border-[#3A2A22]/10 bg-[#F5F0E8] p-3 text-left text-sm transition hover:border-[#3A2A22]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2A22] focus-visible:ring-offset-2"
          >
            <span className="block font-semibold text-[#1A1A1A]">{pin.title}</span>
            <span className="mt-1 block text-xs text-[#6B6B5A]">{pin.note || "No notes yet"}</span>
          </button>
        ))}
        {!visiblePins.length ? <div className="rounded-lg bg-[#F5F0E8] p-4 text-sm text-[#6B6B5A]">Travel post markers will appear here.</div> : null}
      </div>
    </div>
  );

  const exportControls = (
    <div className="grid gap-3">
      <label className="flex min-h-10 items-center gap-3 text-sm text-[#1A1A1A]">
        <input type="checkbox" checked={legend.enabled} onChange={(event) => setLegend((current) => ({ ...current, enabled: event.target.checked }))} />
        Include legend
      </label>
      <input value={legend.title} onChange={(event) => setLegend((current) => ({ ...current, title: event.target.value }))} className={inputField} placeholder="Travel route title" />
      <input value={legend.from} onChange={(event) => setLegend((current) => ({ ...current, from: event.target.value }))} className={inputField} placeholder="From details" />
      <input value={legend.to} onChange={(event) => setLegend((current) => ({ ...current, to: event.target.value }))} className={inputField} placeholder="To details" />
      <div className="flex gap-3">
        <input value={legend.time} onChange={(event) => setLegend((current) => ({ ...current, time: event.target.value }))} className={`${inputField} min-w-0 flex-1`} placeholder="Estimated travel time" />
        <button type="button" onClick={handleUseRouteTimeForLegend} className={iconButton} aria-label="Use route travel time" title="Use route travel time">
          <Timer size={18} />
        </button>
      </div>
      <textarea value={legend.labels} onChange={(event) => setLegend((current) => ({ ...current, labels: event.target.value }))} rows={3} className={`${inputField} resize-none`} placeholder="Label meanings" />
      <WorkspaceToggleGroup
        value={exportFormat}
        options={[
          { value: "png", label: "png" },
          { value: "jpeg", label: "jpeg" },
        ]}
        activeVariant="toggle-active-dark"
        onChange={handleExportFormatChange}
      />
      <WorkspaceButton variant="primary" icon={Download} disabled={busy} onClick={() => void handleExport()}>
        Export Map
      </WorkspaceButton>
    </div>
  );

  const travelToolPanels: Record<TravelToolbarTool, ReactNode> = {
    path: pathFinderControls,
    draw: drawRouteControls,
    sharing: liveSharingControls,
    meetup: (
      <SmartMeetupPlanner
        creatorId={viewerId}
        mapId={activeMap?.map_id}
        scope={scope}
        groupIds={scopedGroupIds}
        friends={workspaceFriends}
        followers={workspaceFollowers}
        onSelectVenue={handleMeetupVenueSelect}
        onPlanChange={handleMeetupPlanChange}
      />
    ),
    markers: markerControls,
    spots: savedSpotControls,
  };

  const travelToolRows: Array<{
    key: TravelToolbarTool;
    label: string;
    description: string;
    shortcut: string;
    icon: ReactNode;
  }> = [
    { key: "path", label: "Path Finder", description: "From, to, autocomplete, and snapped routing.", shortcut: "Ctrl+F / Ctrl+T", icon: <ToolbarAssetIcon src={pathIcon} alt="" /> },
    { key: "draw", label: "Draw Route", description: "Freehand route stops with routed street geometry.", shortcut: "Ctrl+D", icon: <ToolbarAssetIcon src={drawRouteIcon} alt="" /> },
    { key: "sharing", label: "Live Travel Sharing", description: "Share, stop, check in, and control visibility.", shortcut: "Ctrl+L", icon: <LocateFixed size={18} /> },
    { key: "meetup", label: "Smart Meetup Planner", description: "Participants, travel limits, and venue suggestions.", shortcut: "Ctrl+K", icon: <ToolbarAssetIcon src={meetupIcon} alt="" /> },
    { key: "markers", label: "Travel Markers", description: "Drop a marker and create a database-backed travel post.", shortcut: "Ctrl+M", icon: <ToolbarAssetIcon src={pinIcon} alt="" /> },
    { key: "spots", label: "Saved Tourist Spots", description: "Use saved places for routes, meetups, and posts.", shortcut: "Ctrl+Shift+S", icon: <Bookmark size={18} /> },
  ];

  const mapToolsPanel = (
    <div className="max-h-[72vh] overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
      <ToolbarPanelTitle meta={baseLayer}>Map Tools</ToolbarPanelTitle>
      <div className="grid gap-1">
        <ToolbarActionRow
          icon={<ToolbarAssetIcon src={panIcon} alt="" />}
          label="Pan"
          description="Click and drag to move the map."
          shortcut="Ctrl+P"
          selected={!pickTarget && !drawingActive && !boxZoomActive}
          onClick={() => {
            setActiveSidePanel(null);
            handlePanTool();
            setActiveToolbarMenu(null);
          }}
        />
        <ToolbarActionRow
          icon={<ZoomIn size={18} />}
          label="Zoom In Box"
          description="Drag a rectangle to zoom into that map area."
          shortcut="Ctrl+B"
          selected={boxZoomActive}
          onClick={() => {
            setActiveSidePanel(null);
            handleBoxZoomTool();
            setActiveToolbarMenu(null);
          }}
        />
        <ToolbarActionRow
          icon={<ZoomOut size={18} />}
          label="Zoom Out"
          description="Smoothly zoom out from the current map center."
          shortcut="Mouse wheel / Ctrl+-"
          onClick={() => {
            setActiveSidePanel(null);
            handleZoomOutTool();
            setActiveToolbarMenu(null);
          }}
        />
        <ToolbarActionRow
          icon={<Download size={18} />}
          label="Export Map"
          description="Open export settings and download the current map."
          shortcut="Ctrl+E"
          selected={activeSidePanel === "export"}
          onClick={() => {
            setActiveSidePanel("export");
            setActiveToolbarMenu(null);
          }}
        />
      </div>
    </div>
  );

  const travelToolsPanel = (
    <div className="max-h-[72vh] overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
      <ToolbarPanelTitle meta={`${visiblePins.length} pins`}>Travel Tools</ToolbarPanelTitle>
      <div className="grid gap-1">
        {travelToolRows.map((tool) => (
          <ToolbarActionRow
            key={tool.key}
            icon={tool.icon}
            label={tool.label}
            description={tool.description}
            selected={activeTravelTool === tool.key}
            shortcut={tool.shortcut}
            onClick={() => {
              setActiveTravelTool(tool.key);
              setActiveSidePanel(tool.key);
              setActiveToolbarMenu(null);
            }}
          />
        ))}
      </div>
    </div>
  );

  const mapModePanel = (
    <div className="max-h-[72vh] overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
      <ToolbarPanelTitle meta={`${visiblePins.length} pins`}>Map Mode</ToolbarPanelTitle>
      <div className="grid gap-1">
        {workspaceModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <ToolbarActionRow
              key={mode.key}
              icon={<Icon size={18} />}
              label={mode.label}
              description={mode.description}
              selected={scope === mode.key}
              shortcut={mode.key === "private" ? "Ctrl+1" : mode.key === "group" ? "Ctrl+2" : "Ctrl+3"}
              onClick={() => {
                setScope(mode.key);
                setActiveToolbarMenu(null);
              }}
            />
          );
        })}
      </div>
      <div className="mt-4 rounded-xl bg-[#F5F0E8] p-3 text-sm leading-6 text-[#6B6B5A]">
        <span className="block font-bold text-[#3A2A22]">{activeMode.title}</span>
        {activeMode.description}
      </div>
    </div>
  );

  const activeSidePanelTitle =
    activeSidePanel === "export"
      ? "Export Map"
      : activeSidePanel
        ? (travelToolRows.find((tool) => tool.key === activeSidePanel)?.label ?? "Travel Tool")
        : "";
  const activeSidePanelContent = activeSidePanel === "export" ? exportControls : activeSidePanel ? travelToolPanels[activeSidePanel] : null;

  const toolbarButtons = [
    {
      id: "map" as const,
      label: "Map Tools",
      icon: <ToolbarAssetIcon src={panIcon} alt="" />,
      panel: mapToolsPanel,
    },
    {
      id: "travel" as const,
      label: "Travel Tools",
      icon: <ToolbarAssetIcon src={pinIcon} alt="" />,
      panel: travelToolsPanel,
      active: Boolean(pickTarget || drawingActive || sharingEnabled),
    },
    {
      id: "mode" as const,
      label: "Map Mode",
      icon: <Layers size={18} />,
      panel: mapModePanel,
    },
  ];

  return (
    <section className="h-[calc(100dvh-64px)] min-h-[480px] overflow-hidden bg-[#F5F0E8] font-[var(--font-ui)] text-[#1A1A1A]">
      <div className="grid h-full min-h-0 grid-cols-1">
        <div className="relative h-full min-h-0 overflow-hidden bg-[#D8D4C8]">
          <div ref={mapContainerRef} className="h-full min-h-0 w-full" />
          <MarkerDetailPanel pin={selectedPin} creatorName={user?.name} onClose={handleCloseSelectedPin} />
          <MapLayerSelector activeLayer={baseLayer} onLayerChange={handleBaseLayerChange} />
          {boxZoomDrag ? (
            <div
              className="pointer-events-none absolute z-30 border-2 border-[#EA9940] bg-transparent shadow-[0_0_0_1px_rgba(18,33,46,0.22)]"
              style={{
                left: Math.min(boxZoomDrag.startX, boxZoomDrag.currentX),
                top: Math.min(boxZoomDrag.startY, boxZoomDrag.currentY),
                width: Math.abs(boxZoomDrag.currentX - boxZoomDrag.startX),
                height: Math.abs(boxZoomDrag.currentY - boxZoomDrag.startY),
              }}
            />
          ) : null}

          {activeSidePanelContent ? (
            <aside className="absolute inset-x-3 bottom-28 top-20 z-30 overflow-y-auto rounded-xl border border-[#3A2A22]/12 bg-white p-3 text-[#1A1A1A] shadow-[0_20px_45px_rgba(27,37,38,0.18)] sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:max-h-[calc(100%-7rem)] sm:w-[min(24rem,calc(100%-2rem))] sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
                <div>
                  <p className="font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9A978C]">Tool Panel</p>
                  <h2 className="m-0 font-[var(--font-display)] text-lg font-semibold text-[#3A2A22] sm:text-xl">{activeSidePanelTitle}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSidePanel(null)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#3A2A22]/12 text-[#3A2A22] transition hover:bg-[#F5F0E8]"
                  aria-label="Close tool panel"
                  title="Close tool panel"
                >
                  <X size={18} />
                </button>
              </div>
              {activeSidePanelContent}
            </aside>
          ) : null}

          <div className="absolute left-3 right-3 top-3 z-10 rounded-lg border border-[#3A2A22]/15 bg-[#F5F0E8]/95 p-3 text-xs text-[#3A2A22] shadow-lg backdrop-blur sm:left-4 sm:right-auto sm:top-4 sm:max-w-[min(26rem,calc(100%-2rem))] sm:p-4 sm:text-sm">
            {markerPlacementActive ? (
              <div className="grid gap-1">
                <span className="font-[var(--font-label)] text-sm font-semibold uppercase tracking-[0.04em]">
                  Marker Placement Mode Active
                </span>
                <span>Click on the map to place your travel post.</span>
                {placementPreview && <span className="font-[var(--font-label)] text-xs uppercase tracking-[0.05em] text-[#6B6B5A]">{placementPreview}</span>}
              </div>
            ) : (
              <span className="font-[var(--font-label)] text-sm font-semibold uppercase tracking-[0.04em]">
                {pickTarget
                  ? `Click the map to set ${pickTarget}.`
                  : status
                    ? status
                    : drawingActive
                      ? "Click streets to add snapped route stops."
                      : "Vector MapTiler workspace active."}
              </span>
            )}
          </div>
        </div>
      </div>
      <TravelTracesToolbar activeMenu={activeToolbarMenu} buttons={toolbarButtons} onActiveMenuChange={setActiveToolbarMenu} />
      <MarkerFormModal
        open={Boolean(markerModalLocation)}
        location={markerModalLocation}
        scope={scope}
        onScopeChange={setScope}
        busy={busy}
        onClose={handleCloseMarkerModal}
        onSave={saveMarkerFromModal}
      />
    </section>
  );
}
