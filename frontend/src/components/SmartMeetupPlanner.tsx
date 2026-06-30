import { useEffect, useMemo, useRef, useState } from "react";
import { Coffee, MapPin, RefreshCw, Search, Sparkles, UserPlus, Users, X } from "lucide-react";
import type { ConnectionProfile } from "../context/AuthContext";
import type { ApiLocation, MapScope, MeetupParticipantInput, MeetupPlan, MeetupSuggestion, ParticipantSource } from "../services/mappingApi";
import { autocompleteLocations, suggestMeetup } from "../services/mappingApi";

type PlannerParticipant = {
  localId: string;
  participantId?: string;
  displayName: string;
  profilePhoto?: string | null;
  source: ParticipantSource;
  locationText: string;
  selectedLocation?: ApiLocation | null;
};

type Props = {
  creatorId: string;
  mapId?: string | null;
  scope?: MapScope;
  groupIds?: string[];
  friends?: ConnectionProfile[];
  followers?: ConnectionProfile[];
  onSelectVenue?: (suggestion: MeetupSuggestion) => void;
  onPlanChange?: (plan: MeetupPlan | null) => void;
};

const DEFAULT_FRIENDS: ConnectionProfile[] = [
  {
    id: "ana",
    name: "Ana Villanueva",
    location: "Quezon City",
    avatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=80&h=80&fit=crop&auto=format",
    lat: 14.676,
    lon: 121.0437,
  },
  {
    id: "carlo",
    name: "Carlo Reyes",
    location: "Cebu City",
    avatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=80&h=80&fit=crop&auto=format",
    lat: 10.3157,
    lon: 123.8854,
  },
];

const DEFAULT_FOLLOWERS: ConnectionProfile[] = [
  {
    id: "ramon",
    name: "Ramon Dela Cruz",
    location: "Baguio City",
    avatar: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=80&h=80&fit=crop&auto=format",
    lat: 16.4023,
    lon: 120.596,
  },
  {
    id: "leila",
    name: "Leila Marcos",
    location: "Davao City",
    avatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=80&h=80&fit=crop&auto=format",
    lat: 7.1907,
    lon: 125.4553,
  },
];

const LOCAL_MEETUP_PLACES: ApiLocation[] = [
  { label: "Rizal Park, Manila", coordinate: [14.5826, 120.9787], provider: "travelplaces-local", confidence: 0.95 },
  { label: "Intramuros, Manila", coordinate: [14.5896, 120.9747], provider: "travelplaces-local", confidence: 0.94 },
  { label: "BGC High Street, Taguig", coordinate: [14.5508, 121.0517], provider: "travelplaces-local", confidence: 0.93 },
  { label: "UP Diliman Sunken Garden, Quezon City", coordinate: [14.6541, 121.0646], provider: "travelplaces-local", confidence: 0.9 },
  { label: "Ayala Center Cebu", coordinate: [10.3181, 123.9056], provider: "travelplaces-local", confidence: 0.92 },
  { label: "Magellan's Cross, Cebu City", coordinate: [10.293, 123.902], provider: "travelplaces-local", confidence: 0.92 },
  { label: "SM Lanang Premier, Davao City", coordinate: [7.0985, 125.6307], provider: "travelplaces-local", confidence: 0.89 },
  { label: "People's Park, Davao City", coordinate: [7.0645, 125.6078], provider: "travelplaces-local", confidence: 0.9 },
  { label: "Burnham Park, Baguio City", coordinate: [16.4127, 120.5935], provider: "travelplaces-local", confidence: 0.9 },
  { label: "Session Road, Baguio City", coordinate: [16.4138, 120.5987], provider: "travelplaces-local", confidence: 0.88 },
  { label: "El Nido Town, Palawan", coordinate: [11.1956, 119.4075], provider: "travelplaces-local", confidence: 0.91 },
  { label: "Coron Town Plaza, Palawan", coordinate: [11.9986, 120.2043], provider: "travelplaces-local", confidence: 0.9 },
  { label: "Alona Beach, Bohol", coordinate: [9.5478, 123.7691], provider: "travelplaces-local", confidence: 0.9 },
  { label: "Cloud 9, Siargao", coordinate: [9.8138, 126.1653], provider: "travelplaces-local", confidence: 0.91 },
  { label: "Samal Island Ferry Terminal, Davao", coordinate: [7.1206, 125.6618], provider: "travelplaces-local", confidence: 0.88 },
  { label: "Mount Apo Trailhead, Davao del Sur", coordinate: [7.0061, 125.2706], provider: "travelplaces-local", confidence: 0.88 },
  { label: "Ben Thanh Market, Ho Chi Minh City", coordinate: [10.7725, 106.698], provider: "travelplaces-local", confidence: 0.82 },
  { label: "Marina Bay Sands, Singapore", coordinate: [1.2834, 103.8607], provider: "travelplaces-local", confidence: 0.82 },
];

function normalizeSearch(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function scoreLocalLocation(query: string, location: ApiLocation) {
  const normalizedQuery = normalizeSearch(query);
  const haystack = normalizeSearch(`${location.label} ${location.provider}`);
  if (!normalizedQuery) return 0;
  if (haystack === normalizedQuery) return 1000;
  if (haystack.startsWith(normalizedQuery)) return 900;
  if (haystack.includes(normalizedQuery)) return 700 - haystack.indexOf(normalizedQuery);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const matchedTokens = queryTokens.filter((token) => haystack.includes(token));
  return matchedTokens.length ? matchedTokens.length * 120 - queryTokens.length * 8 : 0;
}

function mergeLocations(limit: number, ...groups: ApiLocation[][]) {
  const seen = new Set<string>();
  return groups
    .flat()
    .filter((location) => {
      const key = `${normalizeSearch(location.label)}|${location.coordinate.map((value) => value.toFixed(4)).join(",")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function localMeetupSuggestions(query: string, limit: number) {
  return LOCAL_MEETUP_PLACES.map((location) => ({ location, score: scoreLocalLocation(query, location) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.location.confidence - left.location.confidence)
    .map((item) => item.location)
    .slice(0, limit);
}

function newManualParticipant(index: number): PlannerParticipant {
  return {
    localId: crypto.randomUUID ? crypto.randomUUID() : `manual-${Date.now()}-${index}`,
    displayName: `Participant ${index + 1}`,
    source: "manual",
    locationText: "",
    selectedLocation: null,
  };
}

function participantFromConnection(profile: ConnectionProfile, source: Exclude<ParticipantSource, "manual">): PlannerParticipant {
  return {
    localId: `${source}-${profile.id}-${Date.now()}`,
    participantId: profile.id,
    displayName: profile.name,
    profilePhoto: profile.avatar,
    source,
    locationText: profile.location,
    selectedLocation:
      profile.lat !== undefined && profile.lon !== undefined
        ? {
            coordinate: [profile.lat, profile.lon],
            label: profile.location,
            provider: source,
            confidence: 1,
          }
        : null,
  };
}

function formatDuration(seconds?: number) {
  if (!seconds) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function useParticipantSuggestions(query: string, limit = 5) {
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

    const localMatches = localMeetupSuggestions(trimmed, limit);
    if (localMatches.length) setResults(localMatches);

    const cacheKey = `${normalizeSearch(trimmed)}|${limit}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setResults(mergeLocations(limit, localMatches, cached));
      setBusy(false);
      return;
    }

    let cancelled = false;
    setBusy(true);
    const timer = window.setTimeout(() => {
      autocompleteLocations(trimmed, Math.max(limit * 2, 8))
        .then((matches) => {
          if (cancelled) return;
          const merged = mergeLocations(limit, localMatches, matches);
          cacheRef.current.set(cacheKey, merged);
          setResults(merged);
        })
        .catch(() => {
          if (!cancelled) setResults(localMatches);
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

function ParticipantLocationField({
  participant,
  onChange,
  onSelect,
}: {
  participant: PlannerParticipant;
  onChange: (value: string) => void;
  onSelect: (location: ApiLocation) => void;
}) {
  const { results, busy } = useParticipantSuggestions(participant.locationText);

  return (
    <div className="min-w-0 flex-1">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B5A]" />
        <input
          value={participant.locationText}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search address or place"
          className="min-h-10 w-full rounded border border-[#2D4A2D]/15 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#2D4A2D]"
        />
      </div>
      {(busy || results.length > 0) && (
        <div className="mt-2 max-h-32 overflow-y-auto rounded border border-[#2D4A2D]/10 bg-[#F5F0E8]">
          {busy && <div className="px-3 py-2 text-xs text-[#6B6B5A]">Searching...</div>}
          {!busy &&
            results.slice(0, 4).map((item) => (
              <button
                key={`${participant.localId}-${item.label}-${item.coordinate.join(",")}`}
                type="button"
                onClick={() => onSelect(item)}
                className="block w-full border-b border-[#2D4A2D]/8 px-3 py-2 text-left text-xs text-[#1A1A1A] last:border-b-0 hover:bg-[#EDEAE0]"
              >
                <span className="block font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-[#6B6B5A]">{item.provider}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function participantPayload(participant: PlannerParticipant): MeetupParticipantInput | null {
  const query = participant.locationText.trim();
  const location = participant.selectedLocation;
  if (!query && !location) return null;
  return {
    participant_id: participant.participantId || participant.localId,
    display_name: participant.displayName,
    profile_photo: participant.profilePhoto ?? null,
    source: participant.source,
    query: location ? undefined : query,
    lat: location?.coordinate[0],
    lon: location?.coordinate[1],
    label: location?.label || query || participant.displayName,
  };
}

export function SmartMeetupPlanner({
  creatorId,
  mapId,
  scope = "private",
  groupIds = [],
  friends = DEFAULT_FRIENDS,
  followers = DEFAULT_FOLLOWERS,
  onSelectVenue,
  onPlanChange,
}: Props) {
  const [participants, setParticipants] = useState<PlannerParticipant[]>([newManualParticipant(0), newManualParticipant(1)]);
  const [pickerMode, setPickerMode] = useState<"friend" | "follower" | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [travelLimit, setTravelLimit] = useState(60);
  const [plan, setPlan] = useState<MeetupPlan | null>(null);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectionOptions = pickerMode === "friend" ? friends : followers;
  const activeParticipants = useMemo(() => participants.map(participantPayload).filter(Boolean) as MeetupParticipantInput[], [participants]);
  const participantSignature = useMemo(
    () => JSON.stringify(activeParticipants.map((item) => [item.participant_id, item.label, item.lat, item.lon, item.query])),
    [activeParticipants],
  );

  useEffect(() => {
    setPlan(null);
    setExcluded([]);
    onPlanChange?.(null);
  }, [onPlanChange, participantSignature, travelLimit]);

  const updateParticipant = (localId: string, patch: Partial<PlannerParticipant>) => {
    setParticipants((current) => current.map((item) => (item.localId === localId ? { ...item, ...patch } : item)));
  };

  const addManualParticipant = () => {
    if (participants.length < 12) setParticipants((current) => [...current, newManualParticipant(current.length)]);
  };

  const removeParticipant = (localId: string) => {
    setParticipants((current) => (current.length <= 2 ? current : current.filter((item) => item.localId !== localId)));
  };

  const startConnectionPicker = (mode: "friend" | "follower") => {
    setPickerMode(mode);
    setSelectedConnectionId((mode === "friend" ? friends[0]?.id : followers[0]?.id) ?? "");
  };

  const addSelectedConnection = () => {
    if (!pickerMode) return;
    const profile = connectionOptions.find((item) => item.id === selectedConnectionId);
    if (!profile) return;
    setParticipants((current) => {
      if (current.some((item) => item.participantId === profile.id && item.source === pickerMode)) return current;
      return [...current, participantFromConnection(profile, pickerMode)];
    });
    setPickerMode(null);
  };

  const runSuggest = async (randomize = false, explicitExcluded = excluded) => {
    if (activeParticipants.length < 2) {
      setError("Add at least two participant locations.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await suggestMeetup({
        participants: activeParticipants,
        creatorId,
        mapId,
        scope,
        groupIds: scope === "group" ? groupIds : [],
        excludeNames: explicitExcluded,
        randomize,
        travelTimeMinutes: travelLimit,
        persist: true,
      });
      setPlan(result);
      onPlanChange?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Meetup suggestions could not be generated.");
    } finally {
      setBusy(false);
    }
  };

  const handleAnother = async () => {
    const nextExcluded = plan?.suggestions[0]?.name ? [...excluded, plan.suggestions[0].name] : excluded;
    setExcluded(nextExcluded);
    await runSuggest(true, nextExcluded);
  };

  return (
    <div className="rounded border border-[#2D4A2D]/15 bg-[#EDEAE0] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles size={18} className="shrink-0 text-[#C4713A]" />
          <h2 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2D4A2D]">Smart Meetup Planner</h2>
        </div>
        <span className="rounded bg-[#F5F0E8] px-2 py-1 font-[var(--font-label)] text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-[#6B6B5A]">
          {activeParticipants.length} people
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => startConnectionPicker("friend")}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded border border-[#2D4A2D]/20 bg-[#F5F0E8] px-2 font-[var(--font-label)] text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-[#2D4A2D]"
        >
          <UserPlus size={13} />
          Add Friend
        </button>
        <button
          type="button"
          onClick={() => startConnectionPicker("follower")}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded border border-[#2D4A2D]/20 bg-[#F5F0E8] px-2 font-[var(--font-label)] text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-[#2D4A2D]"
        >
          <Users size={13} />
          Add Follower
        </button>
        <button
          type="button"
          onClick={addManualParticipant}
          disabled={participants.length >= 12}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded border border-[#2D4A2D]/20 bg-[#F5F0E8] px-2 font-[var(--font-label)] text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-[#2D4A2D] disabled:opacity-50"
        >
          <MapPin size={13} />
          Manual
        </button>
      </div>

      {pickerMode && (
        <div className="mt-3 rounded border border-[#2D4A2D]/15 bg-[#F5F0E8] p-3">
          <label className="grid gap-2">
            <span className="font-[var(--font-label)] text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[#6B6B5A]">
              {pickerMode === "friend" ? "Select Friend" : "Select Participant"}
            </span>
            <select
              value={selectedConnectionId}
              onChange={(event) => setSelectedConnectionId(event.target.value)}
              className="min-h-10 rounded border border-[#2D4A2D]/15 bg-white px-3 text-sm text-[#1A1A1A] outline-none"
            >
              {connectionOptions.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} / {profile.location}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={addSelectedConnection}
              disabled={!selectedConnectionId}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-[#2D4A2D] px-3 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.06em] text-[#F5F0E8] disabled:opacity-50"
            >
              Add Participant
            </button>
            <button
              type="button"
              onClick={() => setPickerMode(null)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-[#2D4A2D]/20 bg-white px-3 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.06em] text-[#2D4A2D]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {participants.map((participant, index) => (
          <div key={participant.localId} className="rounded border border-[#2D4A2D]/10 bg-[#F5F0E8] p-3">
            <div className="mb-2 flex items-center gap-2">
              {participant.profilePhoto ? (
                <img src={participant.profilePhoto} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D4A2D] font-[var(--font-label)] text-xs font-bold text-[#F5F0E8]">
                  {String.fromCharCode(65 + index)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <input
                  value={participant.displayName}
                  onChange={(event) => updateParticipant(participant.localId, { displayName: event.target.value })}
                  className="h-7 w-full rounded border border-transparent bg-transparent px-1 text-sm font-semibold text-[#1A1A1A] outline-none focus:border-[#2D4A2D]/20 focus:bg-white"
                />
                <span className="block px-1 font-[var(--font-label)] text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[#6B6B5A]">
                  {participant.source}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeParticipant(participant.localId)}
                disabled={participants.length <= 2}
                className="flex h-8 w-8 items-center justify-center rounded border border-[#2D4A2D]/15 text-[#6B6B5A] disabled:opacity-35"
                aria-label={`Remove ${participant.displayName}`}
                title={`Remove ${participant.displayName}`}
              >
                <X size={14} />
              </button>
            </div>
            <ParticipantLocationField
              participant={participant}
              onChange={(value) => updateParticipant(participant.localId, { locationText: value, selectedLocation: null })}
              onSelect={(location) => updateParticipant(participant.localId, { locationText: location.label, selectedLocation: location })}
            />
          </div>
        ))}
      </div>

      <label className="mt-4 grid gap-2">
        <span className="font-[var(--font-label)] text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[#6B6B5A]">
          Travel Limit: {travelLimit} min
        </span>
        <input
          type="range"
          min={30}
          max={120}
          step={15}
          value={travelLimit}
          onChange={(event) => setTravelLimit(Number(event.target.value))}
          className="w-full"
        />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void runSuggest(false)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#2D4A2D] px-3 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F0E8] disabled:opacity-60"
        >
          <MapPin size={15} />
          Generate Meetup
        </button>
        <button
          type="button"
          disabled={busy || !plan}
          onClick={() => void handleAnother()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#2D4A2D]/20 bg-[#F5F0E8] px-3 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#2D4A2D] disabled:opacity-60"
        >
          <RefreshCw size={15} />
          Generate Another
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-[#8a4b26]">{error}</p>}

      {plan && (
        <div className="mt-4 space-y-2">
          <div className="rounded bg-[#F5F0E8] p-3 text-xs text-[#6B6B5A]">
            <span className="block font-[var(--font-label)] font-semibold uppercase tracking-[0.06em] text-[#2D4A2D]">
              {plan.fair_region.properties.strategy.replaceAll("_", " ")}
            </span>
            <span className="mt-1 block">
              {plan.fair_region.properties.travel_time_minutes} min region / {plan.fair_region.properties.area_km2.toFixed(1)} km2
            </span>
          </div>
          {plan.suggestions.map((item) => (
            <button
              key={`${item.rank}-${item.name}-${item.coordinate.join(",")}`}
              type="button"
              onClick={() => onSelectVenue?.(item)}
              className="w-full rounded border border-[#2D4A2D]/10 bg-[#F5F0E8] p-3 text-left transition hover:border-[#2D4A2D]/35"
            >
              <span className="flex items-center gap-2 font-semibold text-[#1A1A1A]">
                <Coffee size={15} className="text-[#C4713A]" />
                {item.rank}. {item.name}
              </span>
              <span className="mt-1 block text-xs text-[#6B6B5A]">{item.label}</span>
              <span className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#2D4A2D]">
                <span>Score {Math.round(item.fairness_score)}</span>
                <span>Max {formatDuration(item.score_components.max_duration_s)}</span>
                <span>Total {formatDuration(item.score_components.total_duration_s)}</span>
                <span>Spread {formatDuration(item.score_components.travel_time_spread_s)}</span>
              </span>
              <span className="mt-2 block text-xs text-[#6B6B5A]">
                {item.participant_routes.map((route) => `${route.display_name}: ${formatDuration(route.duration_s)}`).join(" / ")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
