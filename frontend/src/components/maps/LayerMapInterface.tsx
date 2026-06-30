import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LatLngBoundsExpression, LeafletMouseEvent } from "leaflet";
import type { FeatureCollection } from "geojson";
import { CircleMarker, GeoJSON as LeafletGeoJSON, MapContainer, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as exifr from "exifr";
import { AlertCircle, Camera, LocateFixed, Lock, Map, MapPin, Radio, Route, Satellite, Search, Send, Share2, ShieldCheck, Users, WifiOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  ApiLocation,
  ApiPin,
  ApiRoute,
  MapScope,
  RouteEngine,
  TrackingSession,
  buildTrackingSocketUrl,
  buildDrivingRoute,
  createPin,
  createTrackingSession,
  listPins,
  listRoutes,
  reverseLocation,
  searchLocations,
} from "../../services/mappingApi";

type LayerKey = "standard" | "satellite" | "municipal";

const SEA_LEAFLET_BOUNDS: LatLngBoundsExpression = [
  [-11.0, 95.0],
  [28.0, 141.0],
];
const DEFAULT_GROUP_IDS = ["traveltraces-circle"];

const layerOptions: Array<{ key: LayerKey; label: string; icon: typeof Map }> = [
  { key: "standard", label: "Standard", icon: Map },
  { key: "satellite", label: "Satellite", icon: Satellite },
  { key: "municipal", label: "Boundaries", icon: MapPin },
];

const engineOptions: Array<{ key: RouteEngine; label: string }> = [
  { key: "osrm", label: "OSRM" },
  { key: "dijkstra", label: "Dijkstra" },
  { key: "astar", label: "A*" },
];

const scopeOptions: Array<{ key: MapScope; label: string; icon: typeof Lock }> = [
  { key: "private", label: "Private", icon: Lock },
  { key: "group", label: "Group", icon: Users },
  { key: "public", label: "Public", icon: Share2 },
];

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

function LayerSwitcher({ activeLayer, onChange }: { activeLayer: LayerKey; onChange: (layer: LayerKey) => void }) {
  return (
    <div className="absolute left-4 top-4 z-[1000] overflow-hidden rounded border border-[#2D4A2D]/15 bg-[#F5F0E8]/95 shadow-lg backdrop-blur">
      {layerOptions.map((option) => {
        const Icon = option.icon;
        const selected = activeLayer === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`flex min-h-11 w-40 items-center gap-2 border-b border-[#2D4A2D]/10 px-3 py-2 text-left font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.05em] transition last:border-b-0 ${
              selected ? "bg-[#2D4A2D] text-[#F5F0E8]" : "text-[#2D4A2D] hover:bg-[#EDEAE0]"
            }`}
            aria-pressed={selected}
          >
            <Icon size={15} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ScopeControl({ value, onChange }: { value: MapScope; onChange: (scope: MapScope) => void }) {
  return (
    <div className="grid grid-cols-3 overflow-hidden rounded border border-[#2D4A2D]/15">
      {scopeOptions.map((option) => {
        const Icon = option.icon;
        const selected = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`flex min-h-11 items-center justify-center gap-1.5 px-2 font-[var(--font-label)] text-[0.68rem] font-semibold uppercase tracking-[0.06em] transition ${
              selected ? "bg-[#2D4A2D] text-[#F5F0E8]" : "bg-[#F5F0E8] text-[#2D4A2D] hover:bg-[#EDEAE0]"
            }`}
            aria-pressed={selected}
          >
            <Icon size={13} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function EngineControl({ value, onChange }: { value: RouteEngine; onChange: (engine: RouteEngine) => void }) {
  return (
    <div className="grid grid-cols-3 overflow-hidden rounded border border-[#2D4A2D]/15">
      {engineOptions.map((option) => {
        const selected = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`min-h-11 px-2 font-[var(--font-label)] text-[0.68rem] font-semibold uppercase tracking-[0.06em] transition ${
              selected ? "bg-[#C4713A] text-[#F5F0E8]" : "bg-[#F5F0E8] text-[#2D4A2D] hover:bg-[#EDEAE0]"
            }`}
            aria-pressed={selected}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function LocatorControl({
  active,
  onLocation,
  onError,
  onToggle,
}: {
  active: boolean;
  onLocation: (location: ApiLocation) => void;
  onError: (message: string) => void;
  onToggle: (active: boolean) => void;
}) {
  const map = useMap();

  const handleLocate = () => {
    if (active) {
      onToggle(false);
      return;
    }

    if (!navigator.geolocation) {
      onError("Geolocation is unavailable in this browser.");
      return;
    }

    onToggle(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo([latitude, longitude], 15, { duration: 0.8 });
        try {
          const resolved = await reverseLocation(latitude, longitude);
          onLocation(resolved);
        } catch {
          onLocation({
            coordinate: [latitude, longitude],
            label: "Current location",
            provider: "navigator",
            confidence: 1,
          });
        }
      },
      (error) => {
        onToggle(false);
        onError(error.message || "Location permission was denied.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      className={`absolute right-4 top-4 z-[1000] flex min-h-11 min-w-11 items-center justify-center rounded border shadow-lg transition ${
        active
          ? "border-[#C4713A] bg-[#C4713A] text-[#F5F0E8]"
          : "border-[#2D4A2D]/15 bg-[#F5F0E8]/95 text-[#2D4A2D] hover:bg-[#EDEAE0]"
      }`}
      aria-label={active ? "Disable GPS locator" : "Enable GPS locator"}
      title={active ? "Disable GPS locator" : "Enable GPS locator"}
    >
      <LocateFixed size={18} />
    </button>
  );
}

function ReverseClickHandler({ onReverse }: { onReverse: (location: ApiLocation) => void }) {
  useMapEvents({
    click: async (event: LeafletMouseEvent) => {
      const location = await reverseLocation(event.latlng.lat, event.latlng.lng).catch(() => ({
        coordinate: [event.latlng.lat, event.latlng.lng] as [number, number],
        label: `${event.latlng.lat.toFixed(5)}, ${event.latlng.lng.toFixed(5)}`,
        provider: "manual",
        confidence: 1,
      }));
      onReverse(location);
    },
  });
  return null;
}

function FlyToLocation({ location }: { location: ApiLocation | null }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo(location.coordinate, 13, { duration: 0.8 });
    }
  }, [location, map]);

  return null;
}

function pinColor(pin: ApiPin) {
  if (pin.source === "exif") return "#5C8A9E";
  if (pin.scope === "public") return "#C4713A";
  if (pin.scope === "group") return "#7A9E6F";
  return "#2D4A2D";
}

function GeotaggedMediaCapture({
  disabled,
  onCapture,
  onError,
}: {
  disabled: boolean;
  onCapture: (input: { lat: number; lon: number; title: string; media: Record<string, unknown>; previewUrl: string }) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const gps = (await exifr.gps(file)) as { latitude?: number; longitude?: number } | undefined;
      if (!gps?.latitude || !gps?.longitude) {
        onError("No embedded GPS coordinates found in that image.");
        return;
      }
      const nextPreview = URL.createObjectURL(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(nextPreview);
      await onCapture({
        lat: gps.latitude,
        lon: gps.longitude,
        title: file.name.replace(/\.[^.]+$/, "").slice(0, 110) || "Geotagged photo",
        previewUrl: nextPreview,
        media: {
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          last_modified: file.lastModified,
          preview_url: nextPreview,
        },
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not read image metadata.");
    }
  };

  return (
    <div className="rounded border border-[#2D4A2D]/15 bg-[#EDEAE0] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Camera size={18} className="text-[#5C8A9E]" />
        <h2 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2D4A2D]">Photo Pin</h2>
      </div>
      <label
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded px-4 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] transition ${
          disabled ? "cursor-not-allowed bg-[#D8D4C8] text-[#6B6B5A]" : "cursor-pointer bg-[#5C8A9E] text-[#F5F0E8] hover:bg-[#4c7688]"
        }`}
      >
        <Camera size={15} />
        Capture or Upload
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {previewUrl && (
        <div className="mt-3 overflow-hidden rounded border border-[#2D4A2D]/15">
          <img src={previewUrl} alt="Selected geotagged media" className="h-28 w-full object-cover" />
        </div>
      )}
    </div>
  );
}

function TelemetryPanel({
  connected,
  disabled,
  session,
  remoteCount,
  onStart,
  onPublish,
  onStop,
}: {
  connected: boolean;
  disabled: boolean;
  session: TrackingSession | null;
  remoteCount: number;
  onStart: () => void;
  onPublish: () => void;
  onStop: () => void;
}) {
  return (
    <div className="rounded border border-[#2D4A2D]/15 bg-[#EDEAE0] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {connected ? <ShieldCheck size={18} className="text-[#7A9E6F]" /> : <Radio size={18} className="text-[#5C8A9E]" />}
          <h2 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2D4A2D]">Telemetry</h2>
        </div>
        <span className="font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#6B6B5A]">
          {remoteCount} nodes
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={disabled || connected}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#5C8A9E] px-3 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F0E8] transition hover:bg-[#4c7688] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Radio size={15} />
          Start
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={!connected}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#2D4A2D]/20 bg-[#F5F0E8] px-3 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#2D4A2D] transition hover:bg-[#EDEAE0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <WifiOff size={15} />
          Stop
        </button>
      </div>
      <button
        type="button"
        onClick={onPublish}
        disabled={!connected || disabled}
        className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded bg-[#2D4A2D] px-4 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F0E8] transition hover:bg-[#234023] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send size={15} />
        Publish Position
      </button>
      <div className="mt-3 rounded bg-[#F5F0E8] p-3 text-xs text-[#6B6B5A]">
        <span className="block font-[var(--font-label)] font-semibold uppercase tracking-[0.08em] text-[#2D4A2D]">
          {connected ? "Signed session active" : "No active socket"}
        </span>
        <span className="mt-1 block break-all">{session?.session_id ?? "Create a scoped session from the current route or map state."}</span>
      </div>
    </div>
  );
}

export function LayerMapInterface() {
  const { user } = useAuth();
  const viewerId = user?.id ?? "demo-user";
  const viewerGroups = DEFAULT_GROUP_IDS;
  const socketRef = useRef<WebSocket | null>(null);

  const [activeLayer, setActiveLayer] = useState<LayerKey>("standard");
  const [boundaries, setBoundaries] = useState<FeatureCollection | null>(null);
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState("Metro Manila");
  const [results, setResults] = useState<ApiLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ApiLocation | null>(null);
  const [gpsLocation, setGpsLocation] = useState<ApiLocation | null>(null);
  const [route, setRoute] = useState<ApiRoute | null>(null);
  const [routeEngine, setRouteEngine] = useState<RouteEngine>("osrm");
  const [scope, setScope] = useState<MapScope>("private");
  const [pins, setPins] = useState<ApiPin[]>([]);
  const [savedRouteCount, setSavedRouteCount] = useState(0);
  const [trackingSession, setTrackingSession] = useState<TrackingSession | null>(null);
  const [telemetryConnected, setTelemetryConnected] = useState(false);
  const [remotePoints, setRemotePoints] = useState<Record<string, { lat: number; lon: number; updatedAt: string }>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);

  const scopedGroupIds = scope === "group" ? viewerGroups : [];

  const refreshScopedData = useCallback(async () => {
    const [nextPins, nextRoutes] = await Promise.all([listPins(viewerId, viewerGroups), listRoutes(viewerId, viewerGroups)]);
    setPins(nextPins);
    setSavedRouteCount(nextRoutes.length);
  }, [viewerGroups, viewerId]);

  useEffect(() => {
    fetch("/data/philippines-municipal-boundaries.geojson")
      .then((response) => response.json())
      .then((data) => setBoundaries(data))
      .catch(() => setStatus("Municipal boundary overlay failed to load."));
  }, []);

  useEffect(() => {
    void refreshScopedData().catch(() => setStatus("Scoped map records could not be loaded."));
  }, [refreshScopedData]);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const routeLine = useMemo(() => route?.geometry ?? [], [route]);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setBusy(true);
    setStatus(null);
    try {
      const matches = await searchLocations(trimmed);
      setResults(matches);
      if (matches[0]) setSelectedLocation(matches[0]);
      if (!matches.length) setStatus("No matching places found.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  };

  const addPin = async (input: {
    title: string;
    note?: string;
    lat: number;
    lon: number;
    source: ApiPin["source"];
    media?: Record<string, unknown> | null;
  }) => {
    setBusy(true);
    setStatus(null);
    try {
      const pin = await createPin({
        ...input,
        scope,
        creatorId: viewerId,
        groupIds: scopedGroupIds,
      });
      setPins((current) => [pin, ...current.filter((item) => item.pin_id !== pin.pin_id)]);
      setSelectedLocation({
        coordinate: [pin.coordinate.lat, pin.coordinate.lon],
        label: pin.title,
        provider: pin.source,
        confidence: 1,
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Pin could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSelectedPin = async () => {
    if (!selectedLocation) {
      setStatus("Select a place first.");
      return;
    }
    await addPin({
      title: selectedLocation.label.split(",")[0] || "Saved map pin",
      note: selectedLocation.label,
      lat: selectedLocation.coordinate[0],
      lon: selectedLocation.coordinate[1],
      source: selectedLocation.provider === "navigator" ? "gps" : "search",
    });
  };

  const handleRoute = async () => {
    const destination = selectedLocation ?? results[0];
    if (!destination) {
      setStatus("Select a destination first.");
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const originLocation = gpsLocation ?? origin;
      const nextRoute = await buildDrivingRoute(originLocation, destination, {
        engine: routeEngine,
        scope,
        creatorId: viewerId,
        groupIds: scopedGroupIds,
      });
      setRoute(nextRoute);
      setSavedRouteCount((count) => (nextRoute.record_id ? count + 1 : count));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Route request failed.");
    } finally {
      setBusy(false);
    }
  };

  const stopTelemetry = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setTelemetryConnected(false);
  }, []);

  const startTelemetry = async () => {
    setBusy(true);
    setStatus(null);
    try {
      stopTelemetry();
      const session = await createTrackingSession({
        sessionId: route?.session_id,
        routeId: route?.route_id,
        scope,
        creatorId: viewerId,
        groupIds: scopedGroupIds,
      });
      setTrackingSession(session);
      const socket = new WebSocket(buildTrackingSocketUrl(session));
      socketRef.current = socket;
      socket.onopen = () => setTelemetryConnected(true);
      socket.onclose = () => setTelemetryConnected(false);
      socket.onerror = () => setStatus("Telemetry socket connection failed.");
      socket.onmessage = (message) => {
        const event = JSON.parse(message.data);
        if (event.type === "location.updated" && event.data?.current) {
          const [lat, lon] = event.data.current as [number, number];
          setRemotePoints((current) => ({
            ...current,
            [event.data.user_id as string]: {
              lat,
              lon,
              updatedAt: event.data.updated_at as string,
            },
          }));
        }
      };
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Telemetry session could not be started.");
    } finally {
      setBusy(false);
    }
  };

  const publishTelemetry = () => {
    const socket = socketRef.current;
    const location = gpsLocation ?? selectedLocation;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setStatus("Telemetry socket is not connected.");
      return;
    }
    if (!location) {
      setStatus("Select a place or use GPS before publishing telemetry.");
      return;
    }
    socket.send(
      JSON.stringify({
        type: "location.update",
        lat: location.coordinate[0],
        lon: location.coordinate[1],
        accuracy_m: location.provider === "navigator" ? 15 : null,
      }),
    );
  };

  return (
    <section className="min-h-dvh bg-[#F5F0E8] px-4 py-6 font-[var(--font-ui)] text-[#1A1A1A] sm:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
        <header className="flex flex-col justify-between gap-4 border-b border-[#2D4A2D]/10 pb-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-1 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.14em] text-[#7A9E6F]">
              Phase III Mapping Layer
            </p>
            <h1 className="m-0 font-[var(--font-display)] text-3xl font-semibold text-[#2D4A2D]">
              Live Base Map
            </h1>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_minmax(220px,1.4fr)_auto]">
            <label className="sr-only" htmlFor="route-origin">
              Route origin
            </label>
            <input
              id="route-origin"
              value={gpsLocation ? gpsLocation.label : origin}
              onChange={(event) => {
                setGpsLocation(null);
                setOrigin(event.target.value);
              }}
              className="min-h-11 rounded border border-[#2D4A2D]/15 bg-[#EDEAE0] px-3 text-sm outline-none transition focus:border-[#2D4A2D]"
              placeholder="Origin"
            />
            <label className="sr-only" htmlFor="place-search">
              Destination search
            </label>
            <input
              id="place-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleSearch();
              }}
              className="min-h-11 rounded border border-[#2D4A2D]/15 bg-white px-3 text-sm outline-none transition focus:border-[#2D4A2D]"
              placeholder="Search destination"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#2D4A2D] px-4 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F0E8] transition hover:bg-[#234023] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search size={15} />
              Search
            </button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative min-h-[560px] overflow-hidden rounded border border-[#2D4A2D]/15 bg-[#EDEAE0] shadow-sm">
            <MapContainer
              bounds={SEA_LEAFLET_BOUNDS}
              maxBounds={SEA_LEAFLET_BOUNDS}
              maxBoundsViscosity={0.65}
              scrollWheelZoom
              className="h-[560px] w-full"
            >
              {activeLayer === "satellite" ? (
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              ) : (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              )}

              {activeLayer === "municipal" && boundaries && (
                <LeafletGeoJSON
                  data={boundaries}
                  style={{
                    color: "#C4713A",
                    fillColor: "#C4713A",
                    fillOpacity: 0.12,
                    opacity: 0.9,
                    weight: 2,
                  }}
                  onEachFeature={(feature, layer) => {
                    const name = feature.properties?.name ?? "Municipal boundary";
                    const region = feature.properties?.region ?? "Philippines";
                    layer.bindPopup(`<strong>${name}</strong><br />${region}`);
                  }}
                />
              )}

              {pins.map((pin) => (
                <CircleMarker
                  key={pin.pin_id}
                  center={[pin.coordinate.lat, pin.coordinate.lon]}
                  pathOptions={{ color: pinColor(pin), fillColor: pinColor(pin), fillOpacity: 0.9 }}
                  radius={7}
                >
                  <Popup>
                    <strong>{pin.title}</strong>
                    <br />
                    {pin.scope} / {pin.source}
                    {pin.note && (
                      <>
                        <br />
                        {pin.note}
                      </>
                    )}
                  </Popup>
                </CircleMarker>
              ))}

              {(Object.entries(remotePoints) as Array<[string, { lat: number; lon: number; updatedAt: string }]>).map(([userId, point]) => (
                <CircleMarker
                  key={userId}
                  center={[point.lat, point.lon]}
                  pathOptions={{ color: "#5C8A9E", fillColor: "#5C8A9E", fillOpacity: 0.85 }}
                  radius={10}
                >
                  <Popup>
                    <strong>{userId}</strong>
                    <br />
                    Live telemetry
                    <br />
                    {point.updatedAt}
                  </Popup>
                </CircleMarker>
              ))}

              {gpsLocation && (
                <CircleMarker center={gpsLocation.coordinate} pathOptions={{ color: "#2D4A2D", fillColor: "#7A9E6F", fillOpacity: 0.9 }} radius={9}>
                  <Popup>{gpsLocation.label}</Popup>
                </CircleMarker>
              )}

              {selectedLocation && (
                <CircleMarker center={selectedLocation.coordinate} pathOptions={{ color: "#C4713A", fillColor: "#C4713A", fillOpacity: 0.9 }} radius={8}>
                  <Popup>{selectedLocation.label}</Popup>
                </CircleMarker>
              )}

              {routeLine.length > 0 && <Polyline positions={routeLine} pathOptions={{ color: "#2D4A2D", weight: 5, opacity: 0.85 }} />}

              <ReverseClickHandler onReverse={setSelectedLocation} />
              <FlyToLocation location={selectedLocation} />
              <LocatorControl
                active={gpsActive}
                onToggle={setGpsActive}
                onLocation={(location) => {
                  setGpsLocation(location);
                  setSelectedLocation(location);
                }}
                onError={setStatus}
              />
            </MapContainer>
            <LayerSwitcher activeLayer={activeLayer} onChange={setActiveLayer} />
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded border border-[#2D4A2D]/15 bg-[#EDEAE0] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2D4A2D]">Scope</h2>
                <span className="font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#6B6B5A]">
                  {pins.length} pins / {savedRouteCount} routes
                </span>
              </div>
              <ScopeControl value={scope} onChange={setScope} />
              <button
                type="button"
                onClick={handleSaveSelectedPin}
                disabled={busy || !selectedLocation}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded bg-[#2D4A2D] px-4 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F0E8] transition hover:bg-[#234023] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MapPin size={15} />
                Save Pin
              </button>
            </div>

            <div className="rounded border border-[#2D4A2D]/15 bg-[#EDEAE0] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2D4A2D]">Places</h2>
                <span className="font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#6B6B5A]">
                  {results.length} results
                </span>
              </div>
              <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                {results.map((item) => {
                  const selected = selectedLocation?.label === item.label;
                  return (
                    <button
                      key={`${item.label}-${item.coordinate.join(",")}`}
                      type="button"
                      onClick={() => setSelectedLocation(item)}
                      className={`rounded border px-3 py-2 text-left transition ${
                        selected
                          ? "border-[#2D4A2D] bg-[#2D4A2D] text-[#F5F0E8]"
                          : "border-[#2D4A2D]/10 bg-[#F5F0E8] text-[#1A1A1A] hover:border-[#2D4A2D]/30"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="mt-1 block font-[var(--font-label)] text-[0.68rem] uppercase tracking-[0.06em] opacity-75">
                        {item.provider} / {Math.round(item.confidence * 100)}%
                      </span>
                    </button>
                  );
                })}
                {!results.length && (
                  <div className="rounded border border-dashed border-[#2D4A2D]/20 bg-[#F5F0E8] p-4 text-sm text-[#6B6B5A]">
                    Search or click the map to select a place.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded border border-[#2D4A2D]/15 bg-[#EDEAE0] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Route size={18} className="text-[#C4713A]" />
                <h2 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2D4A2D]">Driving Route</h2>
              </div>
              <EngineControl value={routeEngine} onChange={setRouteEngine} />
              <button
                type="button"
                onClick={handleRoute}
                disabled={busy || !selectedLocation}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded bg-[#C4713A] px-4 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F0E8] transition hover:bg-[#a85f31] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Generate Route
              </button>
              {route && (
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded bg-[#F5F0E8] p-3">
                    <dt className="font-[var(--font-label)] text-[0.68rem] uppercase tracking-[0.08em] text-[#6B6B5A]">Distance</dt>
                    <dd className="m-0 mt-1 font-semibold text-[#2D4A2D]">{formatDistance(route.distance_m)}</dd>
                  </div>
                  <div className="rounded bg-[#F5F0E8] p-3">
                    <dt className="font-[var(--font-label)] text-[0.68rem] uppercase tracking-[0.08em] text-[#6B6B5A]">Duration</dt>
                    <dd className="m-0 mt-1 font-semibold text-[#2D4A2D]">{formatDuration(route.duration_s)}</dd>
                  </div>
                  <div className="col-span-2 rounded bg-[#F5F0E8] p-3">
                    <dt className="font-[var(--font-label)] text-[0.68rem] uppercase tracking-[0.08em] text-[#6B6B5A]">Engine</dt>
                    <dd className="m-0 mt-1 font-semibold text-[#2D4A2D]">{route.provider}</dd>
                  </div>
                </dl>
              )}
            </div>

            <TelemetryPanel
              connected={telemetryConnected}
              disabled={busy}
              session={trackingSession}
              remoteCount={Object.keys(remotePoints).length}
              onStart={() => void startTelemetry()}
              onPublish={publishTelemetry}
              onStop={stopTelemetry}
            />

            <GeotaggedMediaCapture
              disabled={busy}
              onError={setStatus}
              onCapture={async ({ lat, lon, title, media }) => {
                await addPin({
                  title,
                  note: "Geotagged photo",
                  lat,
                  lon,
                  source: "exif",
                  media,
                });
              }}
            />

            {status && (
              <div className="flex items-start gap-2 rounded border border-[#C4713A]/25 bg-[#C4713A]/10 p-3 text-sm text-[#8a4b26]" role="status">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{status}</span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
