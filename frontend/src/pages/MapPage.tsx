import React, { useEffect, useState } from "react";
import { MapPin, X, Info, ArrowUp, Calendar, Compass, Users } from "lucide-react";
import { GatedPage } from "../components/GatedPage";
import { UpgradeModal } from "../components/UpgradeModal";
import { useAuth } from "../context/AuthContext";
import { PLAN_LIMITS } from "../context/AuthContext";

// Modular additions
import { Pin, Companion, MidpointHub, INITIAL_PINS, getRegionFromCoordinates } from "../utils/mapHelpers";
import { MapCustomForm } from "../components/MapCustomForm";
import { CompanionFinder } from "../components/CompanionFinder";
import { sanitizeRichHtml } from "../security/sanitize";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function latLonToMapPercent(coordinate: { lat: number; lon: number }): { x: number; y: number } {
  const x = ((coordinate.lon - 116) / 11.5) * 82 + 9;
  const y = ((21.5 - coordinate.lat) / 17.5) * 88 + 5;
  return {
    x: clamp(x, 6, 94),
    y: clamp(y, 5, 94),
  };
}

function PhilippinesMap({
  pins,
  onPinClick,
  selectedPin,
  onMapClick,
  companionState,
  mapMode,
  routePoints,
}: {
  pins: Pin[];
  onPinClick: (p: Pin) => void;
  selectedPin: Pin | null;
  onMapClick: (x: number, y: number) => void;
  companionState: any;
  mapMode: "private" | "public";
  routePoints: { x: number; y: number; label: string; order: number }[];
}) {
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If user clicked any button or SVG pin icon, do not trigger coordinate pin creation
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onMapClick(x, y);
  };

  return (
    <div
      onClick={handleMapClick}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#B8D4E8",
        borderRadius: "0.25rem",
        overflow: "hidden",
        cursor: mapMode === "private" ? "crosshair" : "default",
      }}
    >
      {/* Ocean texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 80%, rgba(158,107,92,0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(92,138,158,0.12) 0%, transparent 50%)" }} />

      {/* Map label */}
      <div style={{ position: "absolute", top: "1rem", left: "1rem", fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(26,26,26,0.5)", zIndex: 10 }}>
        Philippine Archipelago
      </div>

      {mapMode === "private" ? (
        <div style={{ position: "absolute", top: "2.2rem", left: "1rem", fontFamily: "var(--font-ui)", fontSize: "0.68rem", color: "#3A2A22", backgroundColor: "rgba(245,240,232,0.85)", padding: "0.25rem 0.6rem", borderRadius: "1rem", zIndex: 10, border: "1px solid rgba(58,42,34,0.1)", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
          📍 Click anywhere to leave a pin & write a story
        </div>
      ) : (
        <div style={{ position: "absolute", top: "2.2rem", left: "1rem", fontFamily: "var(--font-ui)", fontSize: "0.68rem", color: "#C4713A", backgroundColor: "rgba(245,240,232,0.85)", padding: "0.25rem 0.6rem", borderRadius: "1rem", zIndex: 10, border: "1px solid rgba(196,113,58,0.1)", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
          👥 Viewing Community Public Map (Other travelers' pins)
        </div>
      )}

      {/* Simplified island outlines via SVG */}
      <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.25 }}>
        {/* Luzon */}
        <ellipse cx="50" cy="30" rx="14" ry="22" fill="#3A2A22" />
        {/* Mindoro */}
        <ellipse cx="38" cy="47" rx="5" ry="8" fill="#3A2A22" />
        {/* Palawan */}
        <ellipse cx="22" cy="60" rx="4" ry="18" fill="#3A2A22" transform="rotate(-30 22 60)" />
        {/* Panay */}
        <ellipse cx="40" cy="55" rx="7" ry="6" fill="#3A2A22" />
        {/* Cebu */}
        <ellipse cx="55" cy="57" rx="3" ry="9" fill="#3A2A22" />
        {/* Negros */}
        <ellipse cx="48" cy="58" rx="4" ry="10" fill="#3A2A22" />
        {/* Bohol */}
        <ellipse cx="62" cy="59" rx="6" ry="5" fill="#3A2A22" />
        {/* Leyte */}
        <ellipse cx="67" cy="52" rx="4" ry="9" fill="#3A2A22" />
        {/* Samar */}
        <ellipse cx="73" cy="47" rx="6" ry="8" fill="#3A2A22" />
        {/* Mindanao */}
        <ellipse cx="70" cy="72" rx="18" ry="14" fill="#3A2A22" />
        {/* Siargao area */}
        <ellipse cx="78" cy="62" rx="3" ry="3" fill="#3A2A22" />
      </svg>

      {/* Anchor baseline User Location for context of Companion search */}
      <div style={{ position: "absolute", left: `${companionState.active && companionState.userLocation ? companionState.userLocation.x : 48}%`, top: `${companionState.active && companionState.userLocation ? companionState.userLocation.y : 35}%`, transform: "translate(-50%, -100%)", zIndex: 11 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#3A2A22", border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 5, height: 5, backgroundColor: "#9E6B5C", borderRadius: "50%" }} />
          </div>
          <div style={{ backgroundColor: "#3A2A22", color: "#F5F0E8", padding: "0.1rem 0.35rem", borderRadius: "1rem", fontSize: "0.55rem", whiteSpace: "nowrap", marginTop: "0.08rem", fontFamily: "var(--font-label)", fontWeight: "bold", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
            You ({companionState.active && companionState.userLocation ? companionState.userLocation.name : "Manila"})
          </div>
        </div>
      </div>

      {/* DRAW COMPANION RELATIONSHIP ON SVG */}
      {companionState.active && companionState.companion && (
        <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 6, pointerEvents: "none" }}>
          <line
            x1={companionState.userLocation ? companionState.userLocation.x : 48}
            y1={companionState.userLocation ? companionState.userLocation.y : 35}
            x2={companionState.companion.x}
            y2={companionState.companion.y}
            stroke="#C4713A"
            strokeWidth={0.8}
            strokeDasharray="1.5,1.5"
          />
          <line
            x1={companionState.userLocation ? companionState.userLocation.x : 48}
            y1={companionState.userLocation ? companionState.userLocation.y : 35}
            x2={companionState.companion.x}
            y2={companionState.companion.y}
            stroke="#3A2A22"
            strokeWidth={0.4}
            strokeDasharray="1"
          />
          <g transform={`translate(${((companionState.userLocation ? companionState.userLocation.x : 48) + companionState.companion.x) / 2}, ${((companionState.userLocation ? companionState.userLocation.y : 35) + companionState.companion.y) / 2})`}>
            <rect x={-20} y={-6} width={40} height={12} rx={2} fill="#3A2A22" stroke="#EDEAE0" strokeWidth={0.3} />
            <text x={0} y={2.5} fill="#F5F0E8" fontSize={3.2} fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">
              {companionState.distance}km
            </text>
          </g>
        </svg>
      )}

      {routePoints.length > 1 ? (
        <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 8, pointerEvents: "none" }}>
          <polyline
            points={routePoints.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="#C4713A"
            strokeWidth={0.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 1.2"
          />
          {routePoints.map((point) => (
            <g key={`${point.order}-${point.label}`} transform={`translate(${point.x}, ${point.y})`}>
              <circle r={2.2} fill="#3A2A22" stroke="#FBF7F0" strokeWidth={0.6} />
              <text x={0} y={0.9} textAnchor="middle" fill="#FBF7F0" fontSize={2.2} fontWeight="700" fontFamily="var(--font-label)">
                {point.order}
              </text>
            </g>
          ))}
        </svg>
      ) : null}

      {/* Selected companion avatar pin styling on map */}
      {companionState.active && companionState.companion && (
        <div style={{ position: "absolute", left: `${companionState.companion.x}%`, top: `${companionState.companion.y}%`, transform: "translate(-50%, -100%)", zIndex: 12, pointerEvents: "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img
              src={companionState.companion.avatar}
              alt={companionState.companion.name}
              style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #C4713A", objectFit: "cover", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
            />
            <div style={{ backgroundColor: "#C4713A", color: "#F5F0E8", padding: "0.1rem 0.35rem", borderRadius: "10px", fontSize: "0.55rem", whiteSpace: "nowrap", marginTop: "0.1rem", fontWeight: "bold", fontFamily: "var(--font-label)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
              {companionState.companion.name}
            </div>
          </div>
        </div>
      )}

      {/* Midpoint glowing suggestion star pin with text coordinate wrapper */}
      {companionState.active && companionState.midpoint && companionState.suggestedHub && (
        <div style={{ position: "absolute", left: `${companionState.midpoint.x}%`, top: `${companionState.midpoint.y}%`, transform: "translate(-50%, -50%)", zIndex: 14, pointerEvents: "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                width: "24px",
                height: "24px",
                backgroundColor: "rgba(158,107,92,0.5)",
                borderRadius: "50%",
                animation: "ping 1.5s infinite",
              }}
              className="midpoint-pulse"
            />
            <div style={{ backgroundColor: "#9E6B5C", color: "#F5F0E8", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #F5F0E8", boxShadow: "0 2px 6px rgba(0,0,0,0.3)", zIndex: 2 }}>
              <span style={{ fontSize: "0.7rem" }}>★</span>
            </div>
            <div style={{ backgroundColor: "#3A2A22", color: "#F5F0E8", padding: "0.1rem 0.4rem", borderRadius: "0.15rem", fontSize: "0.55rem", whiteSpace: "nowrap", marginTop: "0.25rem", fontWeight: "bold", fontFamily: "var(--font-label)", border: "0.5px solid rgba(245,240,232,0.15)", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", zIndex: 2 }}>
              Midpoint: {companionState.suggestedHub.name}
            </div>
          </div>
        </div>
      )}

      {/* Main Pins layer */}
      {pins.map((pin) => (
        <button
          key={pin.id}
          onClick={() => onPinClick(pin)}
          style={{
            position: "absolute",
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            transform: "translate(-50%, -100%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            zIndex: 10,
          }}
          title={pin.name}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50% 50% 50% 0",
                transform: "rotate(-45deg)",
                backgroundColor: pin.type === "visited" ? "#3A2A22" : "#C4713A",
                border: selectedPin?.id === pin.id ? "2px solid #F5F0E8" : "2px solid white",
                boxShadow: selectedPin?.id === pin.id ? "0 0 0 2px " + (pin.type === "visited" ? "#3A2A22" : "#C4713A") + ", 0 4px 12px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
                transition: "box-shadow 0.15s, transform 0.15s",
              }}
            />
            {/* Tiny text card styling if selected */}
            {selectedPin?.id === pin.id && (
              <span style={{ position: "absolute", top: "-1.2rem", backgroundColor: "#3A2A22", color: "#F5F0E8", fontSize: "0.52rem", padding: "0.1rem 0.35rem", borderRadius: "2px", whiteSpace: "nowrap", fontFamily: "var(--font-label)", fontWeight: "bold", textTransform: "uppercase", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                {pin.category}
              </span>
            )}
          </div>
        </button>
      ))}

      {/* Legend inside map view */}
      <div style={{ position: "absolute", bottom: "1rem", right: "1rem", backgroundColor: "rgba(245,240,232,0.92)", borderRadius: "0.25rem", padding: "0.6rem 0.85rem", backdropFilter: "blur(4px)", zIndex: 10, border: "1px solid rgba(58,42,34,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <p style={{ margin: "0 0 0.3rem 0", fontFamily: "var(--font-label)", fontSize: "0.55rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A", fontWeight: 600 }}>Pin Type</p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
          <div style={{ width: 10, height: 10, backgroundColor: "#3A2A22", borderRadius: "50%" }} />
          <span style={{ fontFamily: "var(--font-label)", fontSize: "0.65rem", letterSpacing: "0.06em", color: "#1A1A1A" }}>Visited</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 10, height: 10, backgroundColor: "#C4713A", borderRadius: "50%" }} />
          <span style={{ fontFamily: "var(--font-label)", fontSize: "0.65rem", letterSpacing: "0.06em", color: "#1A1A1A" }}>Wishlist</span>
        </div>
      </div>
    </div>
  );
}

function MapContent() {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>(INITIAL_PINS);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [filter, setFilter] = useState<"all" | "visited" | "wishlist">("all");
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Private Map vs Public Map mode requested by user
  const [mapMode, setMapMode] = useState<"private" | "public">("private");
  const [publicNoticeActive, setPublicNoticeActive] = useState(false);
  const [activeRoutePoints, setActiveRoutePoints] = useState<{ x: number; y: number; label: string; order: number }[]>([]);

  // Forms coordinate active state
  const [activeFormCoords, setActiveFormCoords] = useState<{ x: number; y: number; region: string } | null>(null);

  // Companion Finder matching state
  const [companionFinderState, setCompanionFinderState] = useState<{
    active: boolean;
    companion: Companion | null;
    midpoint: { x: number; y: number } | null;
    suggestedHub: MidpointHub | null;
    distance: number;
    userLocation?: { x: number; y: number; name: string } | null;
  }>({
    active: false,
    companion: null,
    midpoint: null,
    suggestedHub: null,
    distance: 0,
    userLocation: null,
  });

  const planLimit = user ? PLAN_LIMITS[user.plan].pins : 30;
  // Count private user pins specifically for the plan limitation
  const privatePinsCount = pins.filter((p) => p.isPrivate).length;
  const atPinLimit = privatePinsCount >= planLimit && planLimit !== Infinity;

  // Filter showing pins matching both Map Mode (Private/Only Me vs Public/Other Users) AND visited filter
  const filteredPins: Pin[] = pins.filter((p: Pin): boolean => {
    const modeMatches = mapMode === "private" ? p.isPrivate : !p.isPrivate;
    const typeMatches = filter === "all" ? true : p.type === filter;
    return modeMatches && typeMatches;
  });

  const visitedCount = pins.filter((p) => p.isPrivate && p.type === "visited").length;
  const wishlistCount = pins.filter((p) => p.isPrivate && p.type === "wishlist").length;

  const handleMapClick = (x: number, y: number) => {
    if (mapMode === "public") {
      setPublicNoticeActive(true);
      setTimeout(() => setPublicNoticeActive(false), 5500);
      return;
    }

    if (atPinLimit) {
      setShowUpgrade(true);
      return;
    }

    const detectedRegion = getRegionFromCoordinates(x, y);
    setActiveFormCoords({ x, y, region: detectedRegion });
  };

  useEffect(() => {
    const readJson = <T,>(key: string): T | null => {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    };

    const storyPayload = readJson<{ storyId?: number; title: string; place: string; coordinate: { lat: number; lon: number } }>("traveltraces.pendingStoryViewPin");
    const storyPinPayload = readJson<{ storyId?: number; title: string; place: string; coordinate: { lat: number; lon: number } }>("traveltraces.pendingStoryPin");
    const explorePayload = readJson<{ name: string; province: string; category: string; description: string; coordinate?: { lat: number; lon: number } }>("traveltraces.pendingExplorePin");
    const routePayload = readJson<{
      planId: string;
      title: string;
      ownerName: string;
      points: Array<{ order: number; title: string; place: string; category?: string; coordinate: { lat: number; lon: number }; description?: string; date?: string }>;
    }>("traveltraces.pendingTravelPlanRoute");

    if (routePayload?.points?.length) {
      const routePins = routePayload.points.map((point) => {
        const projected = latLonToMapPercent(point.coordinate);
        return {
          id: Number(`${Date.now()}${point.order}`),
          name: `Point ${point.order}: ${point.title || point.place}`,
          region: point.place,
          x: projected.x,
          y: projected.y,
          lat: point.coordinate.lat,
          lon: point.coordinate.lon,
          type: "visited" as const,
          category: point.category ?? "Travel Plan",
          note: point.description || `${routePayload.title} route stop by ${routePayload.ownerName}.`,
          author: routePayload.ownerName,
          isPrivate: false,
          date: point.date,
        };
      });
      setPins((current) => [...routePins, ...current.filter((pin) => !routePins.some((routePin) => routePin.name === pin.name && routePin.author === pin.author))]);
      setActiveRoutePoints(routePins.map((pin, index) => ({ x: pin.x, y: pin.y, label: pin.name, order: index + 1 })));
      setMapMode("public");
      setSelectedPin(routePins[0] ?? null);
      window.localStorage.removeItem("traveltraces.pendingTravelPlanRoute");
      return;
    }

    const pointPayload = storyPayload ?? storyPinPayload;
    if (pointPayload?.coordinate) {
      const projected = latLonToMapPercent(pointPayload.coordinate);
      const newPin: Pin = {
        id: pointPayload.storyId ? 800000 + pointPayload.storyId : Date.now(),
        name: pointPayload.title,
        region: pointPayload.place,
        x: projected.x,
        y: projected.y,
        lat: pointPayload.coordinate.lat,
        lon: pointPayload.coordinate.lon,
        type: "visited",
        category: "Story",
        note: `Pinned story location: ${pointPayload.place}`,
        author: storyPinPayload ? "You" : "TravelTraces",
        isPrivate: Boolean(storyPinPayload),
        date: "From Stories",
      };
      setPins((current) => [newPin, ...current.filter((pin) => pin.id !== newPin.id)]);
      setMapMode(storyPinPayload ? "private" : "public");
      setSelectedPin(newPin);
      setActiveRoutePoints([]);
      window.localStorage.removeItem("traveltraces.pendingStoryViewPin");
      window.localStorage.removeItem("traveltraces.pendingStoryPin");
      return;
    }

    if (explorePayload?.coordinate) {
      const projected = latLonToMapPercent(explorePayload.coordinate);
      const newPin: Pin = {
        id: Date.now(),
        name: explorePayload.name,
        region: explorePayload.province,
        x: projected.x,
        y: projected.y,
        lat: explorePayload.coordinate.lat,
        lon: explorePayload.coordinate.lon,
        type: "wishlist",
        category: explorePayload.category,
        note: explorePayload.description,
        author: "You",
        isPrivate: true,
        date: "From Explore",
      };
      setPins((current) => [newPin, ...current]);
      setMapMode("private");
      setSelectedPin(newPin);
      setActiveRoutePoints([]);
      window.localStorage.removeItem("traveltraces.pendingExplorePin");
    }
  }, []);

  const handleSavePinData = (formData: {
    name: string;
    category: string;
    note: string;
    type: "visited" | "wishlist";
    isBold: boolean;
    isItalic: boolean;
    isQuote: boolean;
    align: "left" | "center" | "right";
    isBullet: boolean;
    imageUrl?: string;
  }) => {
    if (!activeFormCoords) return;

    const newPin: Pin = {
      id: Date.now(),
      name: formData.name,
      region: activeFormCoords.region,
      x: activeFormCoords.x,
      y: activeFormCoords.y,
      type: formData.type,
      category: formData.category,
      note: formData.note,
      author: "You",
      isPrivate: true,
      isBold: formData.isBold,
      isItalic: formData.isItalic,
      isQuote: formData.isQuote,
      align: formData.align,
      isBullet: formData.isBullet,
      date: "Just now",
      imageUrl: formData.imageUrl,
    };

    setPins((prev) => [newPin, ...prev]);
    setSelectedPin(newPin);
    setActiveFormCoords(null);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F0E8", display: "flex", flexDirection: "column" }}>
      {/* Upper header section */}
      <div style={{ padding: "2rem 1.5rem 1rem", maxWidth: 1400, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

        {/* Toggle Private vs Public buttons state */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.25rem", borderBottom: "1px solid rgba(58,42,34,0.1)", paddingBottom: "1.25rem", marginBottom: "1.5rem" }}>
          <div>
            <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#9E6B5C", marginBottom: "0.25rem" }}>
              Explore the Philippines mapping hub
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "#3A2A22", margin: 0 }}>
              {mapMode === "private" ? "My Secret Travel Map" : "Community Explorer Stories Map"}
            </h1>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => {
                setMapMode("private");
                setSelectedPin(null);
                setActiveRoutePoints([]);
              }}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.25rem",
                cursor: "pointer",
                fontFamily: "var(--font-label)",
                fontSize: "0.8rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontWeight: 600,
                border: "1px solid",
                borderColor: mapMode === "private" ? "#3A2A22" : "rgba(58,42,34,0.2)",
                backgroundColor: mapMode === "private" ? "#3A2A22" : "transparent",
                color: mapMode === "private" ? "#F5F0E8" : "#3A2A22",
                transition: "all 0.15s",
              }}
            >
              🔒 My Private Map ({privatePinsCount})
            </button>
            <button
              onClick={() => {
                setMapMode("public");
                setSelectedPin(null);
                setActiveRoutePoints([]);
              }}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.25rem",
                cursor: "pointer",
                fontFamily: "var(--font-label)",
                fontSize: "0.8rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontWeight: 600,
                border: "1px solid",
                borderColor: mapMode === "public" ? "#3A2A22" : "rgba(58,42,34,0.2)",
                backgroundColor: mapMode === "public" ? "#3A2A22" : "transparent",
                color: mapMode === "public" ? "#F5F0E8" : "#3A2A22",
                transition: "all 0.15s",
              }}
            >
              👥 Public Map ({pins.filter(p => !p.isPrivate).length})
            </button>
          </div>
        </div>

        {/* Counter summary list \& status filter pill group */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["all", "visited", "wishlist"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "0.45rem 1rem", borderRadius: "0.25rem", border: "1px solid", borderColor: filter === f ? "#3A2A22" : "rgba(58,42,34,0.2)", backgroundColor: filter === f ? "#3A2A22" : "transparent", color: filter === f ? "#F5F0E8" : "#3A2A22", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.78rem", letterSpacing: "0.05em", textTransform: "capitalize" }}>
                {f === "all" ? "All statuses" : f}
              </button>
            ))}
          </div>

          {mapMode === "private" && (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ backgroundColor: "#EDEAE0", padding: "0.4rem 0.85rem", borderRadius: "0.25rem", textAlign: "center" }}>
                <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-label)", color: "#6B6B5A", textTransform: "uppercase" }}>Visited</span>
                <span style={{ display: "block", fontSize: "1.1rem", fontWeight: "bold", color: "#3A2A22" }}>{visitedCount}</span>
              </div>
              <div style={{ backgroundColor: "#EDEAE0", padding: "0.4rem 0.85rem", borderRadius: "0.25rem", textAlign: "center" }}>
                <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-label)", color: "#6B6B5A", textTransform: "uppercase" }}>Wishlist</span>
                <span style={{ display: "block", fontSize: "1.1rem", fontWeight: "bold", color: "#C4713A" }}>{wishlistCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Public Map Notice */}
      {publicNoticeActive && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 1.5rem 0.75rem", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(196,113,58,0.12)", border: "1px solid rgba(196,113,58,0.3)", borderRadius: "0.25rem", padding: "0.75rem 1.25rem" }}>
            <Info size={16} color="#C4713A" />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "#C4713A" }}>
              You are viewing the <strong>Community Public Map</strong>. To pin anywhere on the archipelago and leave your own travel story, click <strong>🔒 My Private Map</strong> above.
            </span>
          </div>
        </div>
      )}

      {/* Pin limit warning */}
      {atPinLimit && mapMode === "private" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 1.5rem 0.75rem", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(196,113,58,0.1)", border: "1px solid rgba(196,113,58,0.3)", borderRadius: "0.25rem", padding: "0.75rem 1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: "#C4713A" }}>
              You've reached your <strong>{planLimit}-pin limit</strong> on the Free plan. Upgrade to pin unlimited destinations.
            </span>
            <button onClick={() => setShowUpgrade(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.875rem", backgroundColor: "#C4713A", color: "#F5F0E8", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              <ArrowUp size={12} /> Upgrade
            </button>
          </div>
        </div>
      )}

      {/* Map + Sidebars layout */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", padding: "0 1.5rem 2rem", maxWidth: 1400, margin: "0 auto", width: "100%", boxSizing: "border-box" }} className="map-grid">

        {/* MAP STAGE CANVAS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ height: 530, borderRadius: "0.25rem", overflow: "hidden", border: "1px solid rgba(58,42,34,0.12)", boxShadow: "0 4px 15px rgba(0,0,0,0.04)" }}>
            <PhilippinesMap
              pins={filteredPins}
              onPinClick={setSelectedPin}
              selectedPin={selectedPin}
              onMapClick={handleMapClick}
              companionState={companionFinderState}
              mapMode={mapMode}
              routePoints={activeRoutePoints}
            />
          </div>

          {/* COMPANION CALCULATOR INTEGRATED AT THE MAP SCREEN */}
          <CompanionFinder
            userLocation={{ x: 48, y: 35, name: "Metro Manila" }}
            onSelectionChange={(state) => {
              setCompanionFinderState(state);
              // Focus map focus or clear selection if cleared
              if (!state.active) {
                setSelectedPin(null);
              }
            }}
          />
        </div>

        {/* SIDEBAR OR PIN DETAILS SCROLL PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Display Pinned Story card inside the side layout */}
          <div style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", flex: 1, overflowY: "auto", minHeight: 400, border: "1px solid rgba(58,42,34,0.12)" }}>
            {selectedPin ? (
              <div style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.68rem", fontFamily: "var(--font-label)", letterSpacing: "0.06em", textTransform: "uppercase", padding: "0.2rem 0.55rem", backgroundColor: "#EDEAE0", border: "1px solid rgba(58,42,34,0.15)", borderRadius: "2px", color: "#6B6B5A" }}>
                    Category Story
                  </span>
                  <button onClick={() => setSelectedPin(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6B5A", padding: "0.2rem" }}>
                    <X size={18} />
                  </button>
                </div>

                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 600, color: "#3A2A22", lineHeight: 1.3, marginBottom: "0.5rem" }}>
                  {selectedPin.name}
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <MapPin size={13} color="#9E6B5C" />
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "#6B6B5A", fontWeight: 500 }}>
                    {selectedPin.region}
                  </span>
                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: "2rem", fontSize: "0.7rem", fontFamily: "var(--font-label)", backgroundColor: selectedPin.type === "visited" ? "rgba(58,42,34,0.12)" : "rgba(196,113,58,0.12)", color: selectedPin.type === "visited" ? "#3A2A22" : "#C4713A", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
                    {selectedPin.type}
                  </span>
                </div>

                {selectedPin.lat !== undefined && selectedPin.lon !== undefined ? (
                  <div style={{ marginBottom: "1rem", border: "1px solid rgba(58,42,34,0.12)", backgroundColor: "#F5F0E8", borderRadius: "0.25rem", padding: "0.7rem 0.85rem" }}>
                    <p style={{ margin: "0 0 0.2rem", fontFamily: "var(--font-label)", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#9E6B5C", fontWeight: 700 }}>Pinned coordinates</p>
                    <p style={{ margin: 0, fontFamily: "var(--font-ui)", fontSize: "0.84rem", color: "#3A2A22", fontWeight: 700 }}>
                      {selectedPin.lat.toFixed(4)}, {selectedPin.lon.toFixed(4)}
                    </p>
                  </div>
                ) : null}

                 {/* VISUAL RICH STYLED STORY CARD DETAILED VIEW (Matches Form Toolbars) */}
                 <div
                   style={{
                     backgroundColor: "#F5F0E8",
                     padding: "1.25rem",
                     borderRadius: "0.25rem",
                     border: "1px solid rgba(58,42,34,0.1)",
                     boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                     marginBottom: "1rem"
                   }}
                 >
                   {/* Inline Story Hero Image inside details card */}
                   {selectedPin.imageUrl && (
                     <div style={{ width: "100%", height: "160px", borderRadius: "0.15rem", overflow: "hidden", marginBottom: "0.85rem", border: "1px solid rgba(58,42,34,0.12)" }}>
                       <img
                         src={selectedPin.imageUrl}
                         alt={selectedPin.name}
                         referrerPolicy="no-referrer"
                         style={{ width: "100%", height: "100%", objectFit: "cover" }}
                       />
                     </div>
                   )}

                   <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
                     <span style={{ fontFamily: "var(--font-label)", fontSize: "0.65rem", padding: "0.15rem 0.5rem", backgroundColor: "#C4713A", color: "#F5F0E8", borderRadius: "2px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                       {selectedPin.category}
                     </span>
                     <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", color: "#6B6B5A", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                       • By {selectedPin.author}
                     </span>
                   </div>

                   {/* Render formatted text layout (supports html selections or plain text fallback) */}
                   {selectedPin.note.includes("<") && selectedPin.note.includes(">") ? (
                     <div
                       style={{
                         fontFamily: "var(--font-body)",
                         fontSize: "0.92rem",
                         lineHeight: 1.6,
                         color: "#1A1A1A",
                         outline: "none"
                       }}
                       dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(selectedPin.note) }}
                     />
                   ) : selectedPin.isQuote ? (
                     <blockquote
                       style={{
                         borderLeft: "3.5px solid #9E6B5C",
                         paddingLeft: "0.85rem",
                         margin: "0.75rem 0",
                         fontFamily: "var(--font-body)",
                         fontSize: "0.92rem",
                         fontStyle: "italic",
                         color: "#5B5A4A",
                         fontWeight: selectedPin.isBold ? "bold" : "normal",
                         textAlign: selectedPin.align || "left",
                         lineHeight: 1.6
                       }}
                     >
                       “{selectedPin.note}”
                     </blockquote>
                   ) : selectedPin.isBullet ? (
                     <ul
                       style={{
                         paddingLeft: "1.2rem",
                         margin: "0.75rem 0",
                         fontFamily: "var(--font-body)",
                         fontSize: "0.92rem",
                         listStyleType: "disc",
                         fontWeight: selectedPin.isBold ? "bold" : "normal",
                         fontStyle: selectedPin.isItalic ? "italic" : "normal",
                         textAlign: selectedPin.align || "left",
                         lineHeight: 1.6
                       }}
                     >
                       {selectedPin.note.split("\n").filter(el => el.trim()).map((line, idx) => (
                         <li key={idx} style={{ marginBottom: "0.25rem" }}>
                           {line}
                         </li>
                       ))}
                     </ul>
                   ) : (
                     <p
                       style={{
                         fontFamily: "var(--font-body)",
                         fontSize: "0.92rem",
                         lineHeight: 1.65,
                         color: "#1A1A1A",
                         margin: 0,
                         fontWeight: selectedPin.isBold ? "bold" : "normal",
                         fontStyle: selectedPin.isItalic ? "italic" : "normal",
                         textAlign: selectedPin.align || "left",
                         whiteSpace: "pre-wrap"
                       }}
                     >
                       {selectedPin.note}
                     </p>
                   )}
                 </div>

                {/* Additional metadata tag for the story card */}
                {selectedPin.date && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "#6B6B5A", fontFamily: "var(--font-ui)" }}>
                    <Calendar size={12} />
                    <span>Published: {selectedPin.date}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Info size={14} color="#9E6B5C" />
                  <span style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A" }}>
                    {mapMode === "private" ? "My Pinned Stories" : "Community Stories"}
                  </span>
                </div>

                {filteredPins.length === 0 ? (
                  <div style={{ padding: "1rem 0", textAlign: "center", color: "#6B6B5A" }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", margin: "0 0 0.5rem 0" }}>No pins matching filter</p>
                    {mapMode === "private" && (
                      <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "#9E6B5C", fontWeight: 600 }}>Click anywhere on the map above to select and pin a story!</p>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {filteredPins.map((p: Pin) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPin(p)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.75rem",
                          width: "100%",
                          background: "none",
                          border: "none",
                          padding: "0.6rem",
                          borderRadius: "0.25rem",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background-color 0.1s",
                          backgroundColor: selectedPin?.id === p.id ? "rgba(58,42,34,0.08)" : "",
                        }}
                        onMouseEnter={(e) => {
                          if (selectedPin?.id !== p.id) {
                            e.currentTarget.style.backgroundColor = "rgba(58,42,34,0.05)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedPin?.id !== p.id) {
                            e.currentTarget.style.backgroundColor = "";
                          }
                        }}
                      >
                        <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: p.type === "visited" ? "#3A2A22" : "#C4713A", marginTop: 3, flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", fontWeight: 600, color: "#1A1A1A", margin: "0 0 0.1rem 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.7rem", color: "#9E6B5C", fontFamily: "var(--font-label)", textTransform: "uppercase", fontWeight: 600 }}>{p.category}</span>
                            {p.author !== "You" && <span style={{ fontSize: "0.68rem", color: "#6B6B5A" }}>@{p.author.split(" ")[0]}</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RENDER DYNAMIC CUSTOM NEW STYLED PIN STORY FORM MODAL */}
      {activeFormCoords && (
        <MapCustomForm
          x={activeFormCoords.x}
          y={activeFormCoords.y}
          region={activeFormCoords.region}
          onSave={handleSavePinData}
          onCancel={() => setActiveFormCoords(null)}
        />
      )}

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        @media (max-width: 768px) {
          .map-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {showUpgrade && <UpgradeModal reason="pins" onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}

export default function MapPage() {
  return (
    <GatedPage featureName="The interactive pin map">
      <MapContent />
    </GatedPage>
  );
}
