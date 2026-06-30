import React, { useState } from "react";
import { Users, Compass, Search, MapPin, Map, RefreshCw } from "lucide-react";
import { COMPANIONS_DATA, MIDPOINT_HUBS, calculateDistance, Companion, MidpointHub } from "../utils/mapHelpers";

export const LOCATIONS_PRESET = [
  { name: "Quezon City", x: 48, y: 32 },
  { name: "Cebu City", x: 55, y: 57 },
  { name: "Manila", x: 48, y: 35 },
  { name: "Davao City", x: 70, y: 74 },
  { name: "Baguio City", x: 47, y: 25 },
  { name: "Iloilo City", x: 42, y: 56 },
  { name: "Siargao", x: 78, y: 60 },
  { name: "El Nido", x: 20, y: 62 },
  { name: "Coron", x: 25, y: 55 },
  { name: "Boracay", x: 38, y: 53 },
  { name: "Batanes", x: 48, y: 8 },
  { name: "Dumaguete", x: 48, y: 64 },
  { name: "Cagayan de Oro", x: 65, y: 68 },
  { name: "Legazpi City", x: 57, y: 41 },
  { name: "Puerto Galera", x: 38, y: 47 },
  { name: "Bacolod City", x: 47, y: 58 },
  { name: "Tacloban City", x: 69, y: 52 },
  { name: "Puerto Princesa", x: 18, y: 68 },
  { name: "Tagbilaran (Bohol)", x: 60, y: 60 },
  { name: "Camiguin", x: 65, y: 63 },
  { name: "Sagada", x: 47, y: 26 }
];

interface CompanionFinderProps {
  userLocation: { x: number; y: number; name: string };
  onSelectionChange: (state: {
    active: boolean;
    companion: Companion | null;
    midpoint: { x: number; y: number } | null;
    suggestedHub: MidpointHub | null;
    distance: number;
    userLocation?: { x: number; y: number; name: string } | null;
  }) => void;
}

export function CompanionFinder({ userLocation, onSelectionChange }: CompanionFinderProps) {
  const [userQuery, setUserQuery] = useState("");
  const [companionQuery, setCompanionQuery] = useState("");

  // Validation error state
  const [errorMsg, setErrorMsg] = useState("");

  const [activeMidpoint, setActiveMidpoint] = useState<{
    active: boolean;
    userLocation: { x: number; y: number; name: string };
    companion: Companion;
    midpoint: { x: number; y: number };
    suggestedHub: MidpointHub;
    distance: number;
  } | null>(null);

  // Matcher function helper with full-freedom fallback coordinate hashing
  const resolveLocation = (query: string): { name: string; x: number; y: number; isCustom: boolean } => {
    if (!query) return { name: "", x: 50, y: 50, isCustom: true };
    const q = query.trim();
    const qLower = q.toLowerCase();

    // 1. Try precise match
    const exact = LOCATIONS_PRESET.find(l => l.name.toLowerCase() === qLower);
    if (exact) return { name: exact.name, x: exact.x, y: exact.y, isCustom: false };

    // 2. Try substring match
    const fragment = LOCATIONS_PRESET.find(l => l.name.toLowerCase().includes(qLower) || qLower.includes(l.name.toLowerCase()));
    if (fragment) return { name: fragment.name, x: fragment.x, y: fragment.y, isCustom: false };

    // 3. Fallback: Deterministic coordinate plotting for freeform input!
    let hash = 0;
    for (let i = 0; i < q.length; i++) {
      hash = q.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Confine coordinates inside visual Philippine archipelago boundaries
    const x = 20 + (Math.abs(hash) % 56); // 20% to 75%
    const y = 15 + (Math.abs(hash >> 3) % 61); // 15% to 75%
    return { name: q, x, y, isCustom: true };
  };

  const handleCalculateMidpoint = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!userQuery.trim() || !companionQuery.trim()) {
      setErrorMsg("Please enter both your location and your companion's location.");
      return;
    }

    const resolvedUser = resolveLocation(userQuery);
    const resolvedComp = resolveLocation(companionQuery);

    // Distance in KM
    const distanceVal = calculateDistance(resolvedUser.x, resolvedUser.y, resolvedComp.x, resolvedComp.y);

    // Midpoint Cartesian coordinates
    const mx = (resolvedUser.x + resolvedComp.x) / 2;
    const my = (resolvedUser.y + resolvedComp.y) / 2;

    // Find closest MidpointHub
    let closestHub = MIDPOINT_HUBS[0];
    let minDistance = Infinity;

    MIDPOINT_HUBS.forEach((hub) => {
      const d = calculateDistance(mx, my, hub.x, hub.y);
      if (d < minDistance) {
        minDistance = d;
        closestHub = hub;
      }
    });

    // Create virtual companion and user parameters
    const fakeComp: Companion = {
      id: 9991,
      name: resolvedComp.name,
      location: resolvedComp.isCustom ? `${resolvedComp.name} (Estimated Map Location)` : resolvedComp.name,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&auto=format",
      bio: "Calculated travel partner location on map.",
      x: resolvedComp.x,
      y: resolvedComp.y,
    };

    const finalUserLoc = {
      x: resolvedUser.x,
      y: resolvedUser.y,
      name: resolvedUser.isCustom ? `${resolvedUser.name} (Estimated Map Location)` : resolvedUser.name
    };

    const result = {
      active: true,
      userLocation: finalUserLoc,
      companion: fakeComp,
      midpoint: { x: mx, y: my },
      suggestedHub: closestHub,
      distance: distanceVal,
    };

    setActiveMidpoint(result);
    onSelectionChange(result);
  };

  const resetFinder = () => {
    setUserQuery("");
    setCompanionQuery("");
    setErrorMsg("");
    setActiveMidpoint(null);
    onSelectionChange({
      active: false,
      companion: null,
      midpoint: null,
      suggestedHub: null,
      distance: 0,
      userLocation: null,
    });
  };

  return (
    <div id="companion-finder-panel" style={{ padding: "1.25rem", backgroundColor: "#EDEAE0", borderRadius: "0.25rem", border: "1px solid rgba(45,74,45,0.12)" }}>
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <Users size={18} color="#2D4A2D" />
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600, color: "#2D4A2D", margin: 0 }}>
          Find your midpoint
        </h3>
      </div>

      {/* Subtitle */}
      <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "#6B6B5A", lineHeight: 1.5, marginBottom: "1.25rem", margin: "0 0 1.25rem 0" }}>
        Enter your location and a companion's location — TravelTraces calculates the midpoint and suggests destinations.
      </p>

      {!activeMidpoint ? (
        <form onSubmit={handleCalculateMidpoint} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Your Location query input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A" }}>
              Your location
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="user-location-input"
                type="text"
                placeholder="e.g. Quezon City"
                value={userQuery}
                onChange={(e) => {
                  setUserQuery(e.target.value);
                  setErrorMsg("");
                }}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  backgroundColor: "#F5F0E8",
                  border: "1px solid rgba(45,74,45,0.15)",
                  borderRadius: "0.25rem",
                  fontSize: "0.85rem",
                  color: "#1A1A1A",
                  fontFamily: "var(--font-ui)",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Companion's Location query input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A" }}>
              Companion's location
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="companion-location-input"
                type="text"
                placeholder="e.g. Cebu City"
                value={companionQuery}
                onChange={(e) => {
                  setCompanionQuery(e.target.value);
                  setErrorMsg("");
                }}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  backgroundColor: "#F5F0E8",
                  border: "1px solid rgba(45,74,45,0.15)",
                  borderRadius: "0.25rem",
                  fontSize: "0.85rem",
                  color: "#1A1A1A",
                  fontFamily: "var(--font-ui)",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{ fontSize: "0.75rem", color: "#C4713A", fontFamily: "var(--font-ui)", display: "flex", gap: "0.25rem" }}>
              <span>⚠️</span> <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            id="calculate-midpoint-button"
            type="submit"
            style={{
              width: "100%",
              padding: "0.625rem",
              backgroundColor: "#2D4A2D",
              color: "#F5F0E8",
              border: "none",
              borderRadius: "0.25rem",
              fontSize: "0.80rem",
              fontFamily: "var(--font-label)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontWeight: 700,
              cursor: "pointer",
              transition: "transform 0.1s, background-color 0.15s",
              marginTop: "0.25rem"
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#243B24")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2D4A2D")}
          >
            Find midpoints
          </button>
        </form>
      ) : (
        /* Result output state display panel card */
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: ".25rem" }}>

          <div style={{ backgroundColor: "#F5F0E8", border: "1px solid rgba(45,74,45,0.1)", borderRadius: "0.25rem", padding: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(45,74,45,0.06)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.68rem", fontFamily: "var(--font-label)", letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A", fontWeight: 700 }}>Resolved Hubs</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#C4713A", fontFamily: "var(--font-display)" }}>{activeMidpoint.distance} km</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontFamily: "var(--font-ui)", color: "#1A1A1A" }}>
                <span>📍 You:</span>
                <span style={{ fontWeight: 600 }}>{activeMidpoint.userLocation.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontFamily: "var(--font-ui)", color: "#1A1A1A" }}>
                <span>👥 Partner:</span>
                <span style={{ fontWeight: 600 }}>{activeMidpoint.companion.name}</span>
              </div>
            </div>
          </div>

          {/* Suggested Midpoint central hub */}
          <div
            style={{
              backgroundColor: "#E2DEC9",
              borderRadius: "0.25rem",
              padding: "0.85rem",
              border: "1px solid rgba(45,74,45,0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem" }}>
              <Compass size={14} color="#7A9E6F" />
              <span style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#7A9E6F", fontWeight: 700 }}>
                Suggested Midpoint Destination
              </span>
            </div>
            <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "#2D4A2D", margin: "0 0 0.15rem 0" }}>
              {activeMidpoint.suggestedHub.name}
            </h4>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#6B6B5A", margin: "0 0 0.5rem 0", fontWeight: 500 }}>
              Region: {activeMidpoint.suggestedHub.region}
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "#3A3A2A", lineHeight: 1.45, margin: 0 }}>
              {activeMidpoint.suggestedHub.desc}
            </p>
          </div>

          {/* Reset / Search Again action button */}
          <button
            onClick={resetFinder}
            style={{
              width: "100%",
              padding: "0.5rem",
              backgroundColor: "transparent",
              color: "#2D4A2D",
              border: "1px solid #2D4A2D",
              borderRadius: "0.25rem",
              fontSize: "0.75rem",
              fontFamily: "var(--font-label)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Search another midpoint
          </button>
        </div>
      )}
    </div>
  );
}
