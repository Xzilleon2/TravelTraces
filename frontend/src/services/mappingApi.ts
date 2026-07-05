export type ApiLocation = {
  coordinate: [number, number];
  label: string;
  provider: string;
  confidence: number;
};

export type ApiRoute = {
  route_id: string;
  session_id: string;
  mode: string;
  origin: {
    coordinate: [number, number];
    label: string;
    provider: string;
    confidence: number;
  };
  destination: {
    coordinate: [number, number];
    label: string;
    provider: string;
    confidence: number;
  };
  waypoints: unknown[];
  geometry: [number, number][];
  distance_m: number;
  duration_s: number;
  eta_utc: string;
  provider: string;
  steps: Array<{
    instruction: string;
    distance_m: number;
    duration_s: number;
    coordinate: [number, number];
  }>;
  metadata: Record<string, unknown>;
  record_id?: string | null;
  scope?: MapScope | null;
  creator_id?: string | null;
  group_ids?: string[];
};

export type RouteEngine = "osrm" | "dijkstra" | "astar";
export type MapScope = "private" | "group" | "public";
export type ParticipantSource = "friend" | "follower" | "manual";
export type TravelGroupRole = "Organizer" | "Guide" | "Traveler" | "Rider" | "Hiker" | "Diver" | "Photographer" | "Friend" | "Other";
export type LocationVisibility = "private" | "friends" | "travel_group" | "event_participants" | "public";
export type TravelActivity = "stationary" | "traveling" | "driving" | "check-in" | "ride" | "hiking" | "tour";

export type ApiPin = {
  pin_id: string;
  post_id: string;
  title: string;
  note: string;
  coordinate: { lat: number; lon: number };
  address: string;
  scope: MapScope;
  creator_id: string;
  group_ids: string[];
  source: "manual" | "search" | "exif" | "gps";
  media: Record<string, unknown> | null;
  photos?: Record<string, unknown>[];
  map_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type UserMap = {
  map_id: string;
  title: string;
  description: string;
  scope: MapScope;
  owner_id: string;
  creator_id: string;
  group_ids: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type MeetupSuggestion = {
  rank: number;
  name: string;
  label: string;
  coordinate: [number, number];
  category: string;
  distance_from_participants_m: number[];
  duration_from_participants_s: number[];
  fairness_score: number;
  provider: string;
  score_components: Record<string, number>;
  participant_routes: Array<{
    participant_id: string;
    display_name: string;
    distance_m: number;
    duration_s: number;
    provider: string;
  }>;
  accessibility: Record<string, unknown>;
};

export type MeetupParticipantInput = {
  participant_id?: string;
  display_name?: string;
  profile_photo?: string | null;
  source?: ParticipantSource;
  query?: string;
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  label?: string;
};

export type MeetupPlan = {
  request_id: string;
  midpoint: { coordinate: [number, number]; label: string };
  fair_region: {
    type: string;
    geometry: Record<string, unknown>;
    properties: {
      center: [number, number];
      bounds: Record<string, number>;
      strategy: string;
      travel_time_minutes: number;
      area_km2: number;
      fallback_chain: string[];
      cluster_regions: Array<Record<string, unknown>>;
      shapely_enabled: boolean;
      geopandas_enabled: boolean;
    };
  };
  suggestions: MeetupSuggestion[];
  participant_count: number;
  participants: Array<Record<string, unknown>>;
  algorithm: string;
  fallback_strategy: string[];
  scoring_weights: Record<string, number>;
  metadata: Record<string, unknown>;
};

export type TrackingSession = {
  session_id: string;
  route_id: string | null;
  scope: MapScope;
  creator_id: string;
  group_ids: string[];
  token: string;
  token_expires_at: number;
  ws_path: string;
};

export type TravelGroupMember = {
  user_id: string;
  display_name: string;
  role: TravelGroupRole;
  phone: string;
  avatar: string;
  admin: boolean;
  location_sharing_enabled: boolean;
  joined_at: string;
};

export type TravelGroup = {
  circle_id: string;
  group_id: string;
  name: string;
  owner_id: string;
  members: TravelGroupMember[];
  created_at: string;
  updated_at: string;
};

export type TravelGroupInvite = {
  invite_id: string;
  circle_id: string;
  code: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  uses: number;
};

export type TravelGroupLocation = {
  circle_id: string;
  user_id: string;
  coordinate: { lat: number; lon: number } | null;
  accuracy_m: number | null;
  activity: TravelActivity;
  sharing_enabled: boolean;
  visibility_scope: LocationVisibility;
  event_id: string | null;
  travel_group_id: string | null;
  status_text: string;
  inside_place_ids: string[];
  updated_at: string;
};

export type TravelNotification = {
  event_id: string;
  circle_id: string;
  user_id: string;
  type: string;
  place_id: string | null;
  message: string;
  read_by: string[];
  created_at: string;
};

export type NotificationPreferences = {
  user_id: string;
  meetup_arrivals: boolean;
  destination_arrivals: boolean;
  check_ins: boolean;
  checkpoints: boolean;
  group_ride_start: boolean;
  event_arrivals: boolean;
};

export type TravelCheckpoint = {
  place_id: string;
  circle_id: string;
  creator_id: string;
  name: string;
  label: string;
  coordinate: { lat: number; lon: number };
  radius_m: number;
  created_at: string;
  updated_at: string;
};

export type TouristCollection = {
  collection_id: string;
  owner_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type TouristSpot = {
  place_id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  saved_by: string;
  saved_at: string;
  collection_id: string | null;
  notes: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const USE_LOCAL_DB = !API_BASE_URL;

async function localDb() {
  return import("./localDb");
}

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

function validationMessageFromDetail(detail: unknown, fallback: string) {
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) return String(item.msg);
        return String(item);
      })
      .filter(Boolean)
      .join(", ");
  }
  return typeof detail === "string" && detail.trim() ? detail : fallback;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiRequestError(validationMessageFromDetail(body?.detail, `Request failed with ${response.status}`), response.status);
  }

  return response.json() as Promise<T>;
}

export async function searchLocations(query: string, limit = 6): Promise<ApiLocation[]> {
  if (USE_LOCAL_DB) {
    const { readLocalTable } = await localDb();
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const places = readLocalTable<Record<string, unknown>>("explorePlaces").map((place) => ({
      coordinate: [Number(place.latitude) || 0, Number(place.longitude) || 0] as [number, number],
      label: String(place.title ?? place.name ?? place.location_name ?? "Saved place"),
      provider: "local-db",
      confidence: 0.9,
    }));
    const pins = readLocalTable<ApiPin>("pins").map((pin) => ({
      coordinate: [pin.coordinate.lat, pin.coordinate.lon] as [number, number],
      label: pin.address || pin.title,
      provider: "local-db",
      confidence: 0.85,
    }));
    return [...places, ...pins].filter((item) => item.label.toLowerCase().includes(needle)).slice(0, limit);
  }
  const params = new URLSearchParams({ query, limit: String(limit) });
  const data = await requestJson<{ results: ApiLocation[] }>(`/api/search?${params}`);
  return data.results;
}

export async function autocompleteLocations(query: string, limit = 8): Promise<ApiLocation[]> {
  if (USE_LOCAL_DB) return searchLocations(query, limit);
  const params = new URLSearchParams({ query, limit: String(limit) });
  const data = await requestJson<{ results: ApiLocation[] }>(`/api/autocomplete?${params}`);
  return data.results;
}

export async function reverseLocation(lat: number, lon: number): Promise<ApiLocation> {
  if (USE_LOCAL_DB) {
    return {
      coordinate: [lat, lon],
      label: `Pinned location ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      provider: "local-db",
      confidence: 0.7,
    };
  }
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  return requestJson<ApiLocation>(`/api/reverse?${params}`);
}

export async function buildDrivingRoute(
  origin: string | ApiLocation,
  destination: ApiLocation,
  options: {
    engine?: RouteEngine;
    mode?: "fastest" | "shortest";
    waypoints?: ApiLocation[];
    scope?: MapScope;
    creatorId?: string;
    groupIds?: string[];
    persist?: boolean;
  } = {},
): Promise<ApiRoute> {
  if (USE_LOCAL_DB) {
    const originLocation: ApiLocation = typeof origin === "string"
      ? { coordinate: destination.coordinate, label: origin, provider: "local-db", confidence: 0.5 }
      : origin;
    const geometry = [originLocation.coordinate, ...(options.waypoints ?? []).map((waypoint) => waypoint.coordinate), destination.coordinate];
    const now = new Date().toISOString();
    const route: ApiRoute = {
      route_id: `local-route-${Date.now()}`,
      session_id: `local-session-${Date.now()}`,
      mode: options.mode ?? "fastest",
      origin: originLocation,
      destination,
      waypoints: options.waypoints ?? [],
      geometry,
      distance_m: Math.max(0, (geometry.length - 1) * 1500),
      duration_s: Math.max(0, (geometry.length - 1) * 600),
      eta_utc: now,
      provider: options.engine ?? "local",
      steps: geometry.map((coordinate, index) => ({
        instruction: index === 0 ? "Start route" : `Continue to point ${index + 1}`,
        distance_m: index === 0 ? 0 : 1500,
        duration_s: index === 0 ? 0 : 600,
        coordinate,
      })),
      metadata: { local: true },
      record_id: `local-route-record-${Date.now()}`,
      scope: options.scope ?? "private",
      creator_id: options.creatorId ?? "demo-user",
      group_ids: options.groupIds ?? [],
    };
    if (options.persist ?? true) {
      const { upsertLocalRow } = await localDb();
      upsertLocalRow("routes", route as unknown as Record<string, unknown>, (item) => String(item.record_id ?? item.route_id));
    }
    return route;
  }
  const body =
    typeof origin === "string"
      ? {
          origin: { query: origin },
          destination: {
            lat: destination.coordinate[0],
            lon: destination.coordinate[1],
            label: destination.label,
          },
        }
      : {
          origin: {
            lat: origin.coordinate[0],
            lon: origin.coordinate[1],
            label: origin.label,
          },
          destination: {
            lat: destination.coordinate[0],
            lon: destination.coordinate[1],
            label: destination.label,
          },
        };

  return requestJson<ApiRoute>("/api/routes", {
    method: "POST",
    body: JSON.stringify({
      ...body,
      waypoints: (options.waypoints ?? []).map((waypoint) => ({
        lat: waypoint.coordinate[0],
        lon: waypoint.coordinate[1],
        label: waypoint.label,
      })),
      mode: options.mode ?? "fastest",
      engine: options.engine ?? "osrm",
      scope: options.scope ?? "private",
      creator_id: options.creatorId ?? "demo-user",
      group_ids: options.groupIds ?? [],
      persist: options.persist ?? true,
    }),
  });
}

export async function listPins(viewerId: string, groupIds: string[], mapId?: string | null, scope?: MapScope | null): Promise<ApiPin[]> {
  if (USE_LOCAL_DB) {
    const { listLocalPins } = await localDb();
    return listLocalPins(viewerId, groupIds, scope);
  }
  const params = new URLSearchParams({ viewer_id: viewerId });
  if (groupIds.length) params.set("group_ids", groupIds.join(","));
  if (mapId) params.set("map_id", mapId);
  if (scope) params.set("scope", scope);
  const data = await requestJson<{ pins: ApiPin[] }>(`/api/pins?${params}`);
  return data.pins;
}

export async function listPublicPins(scope: MapScope = "public"): Promise<ApiPin[]> {
  if (USE_LOCAL_DB) {
    const { listLocalPins } = await localDb();
    return listLocalPins("public-viewer", [], scope).filter((pin) => pin.scope === "public");
  }
  const params = new URLSearchParams({ scope });
  const data = await requestJson<{ pins: ApiPin[] }>(`/api/public/pins?${params}`);
  return data.pins;
}

export async function listUserMaps(ownerId?: string): Promise<UserMap[]> {
  if (USE_LOCAL_DB) {
    const { listLocalUserMaps } = await localDb();
    return listLocalUserMaps(ownerId);
  }
  const params = new URLSearchParams();
  if (ownerId) params.set("owner_id", ownerId);
  const data = await requestJson<{ maps: UserMap[] }>(`/api/maps?${params}`);
  return data.maps;
}

export async function listPublicUserMaps(ownerId?: string): Promise<UserMap[]> {
  if (USE_LOCAL_DB) {
    const { listLocalUserMaps } = await localDb();
    return listLocalUserMaps(ownerId).filter((map) => map.scope === "public");
  }
  const params = new URLSearchParams();
  if (ownerId) params.set("owner_id", ownerId);
  const data = await requestJson<{ maps: UserMap[] }>(`/api/public/maps?${params}`);
  return data.maps;
}

export async function getDefaultMap(): Promise<UserMap> {
  if (USE_LOCAL_DB) {
    const { ensureLocalDefaultMap } = await localDb();
    return ensureLocalDefaultMap("demo-user");
  }
  return requestJson<UserMap>("/api/maps/default");
}

export async function createUserMap(input: {
  title: string;
  description?: string;
  scope: MapScope;
  ownerId: string;
  groupIds?: string[];
}): Promise<UserMap> {
  if (USE_LOCAL_DB) {
    const { upsertLocalRow } = await localDb();
    const now = new Date().toISOString();
    const map: UserMap = {
      map_id: `local-map-${Date.now()}`,
      title: input.title,
      description: input.description ?? "",
      scope: input.scope,
      owner_id: input.ownerId,
      creator_id: input.ownerId,
      group_ids: input.groupIds ?? [],
      is_default: false,
      created_at: now,
      updated_at: now,
    };
    return upsertLocalRow("userMaps", map, (item) => item.map_id);
  }
  return requestJson<UserMap>("/api/maps", {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      description: input.description ?? "",
      scope: input.scope,
      owner_id: input.ownerId,
      group_ids: input.groupIds ?? [],
    }),
  });
}

export async function suggestMeetup(input: {
  participants: MeetupParticipantInput[];
  limit?: number;
  excludeNames?: string[];
  randomize?: boolean;
  travelTimeMinutes?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  creatorId: string;
  mapId?: string | null;
  scope?: MapScope;
  groupIds?: string[];
  persist?: boolean;
}): Promise<MeetupPlan> {
  return requestJson<MeetupPlan>("/api/meetup/suggest", {
    method: "POST",
    body: JSON.stringify({
      participants: input.participants,
      limit: input.limit ?? 5,
      exclude_names: input.excludeNames ?? [],
      randomize: input.randomize ?? false,
      travel_time_minutes: input.travelTimeMinutes ?? 60,
      alpha: input.alpha ?? 0.4,
      beta: input.beta ?? 0.4,
      gamma: input.gamma ?? 0.2,
      creator_id: input.creatorId,
      map_id: input.mapId,
      scope: input.scope ?? "private",
      group_ids: input.groupIds ?? [],
      persist: input.persist ?? false,
    }),
  });
}

export async function createPin(input: {
  title: string;
  note?: string;
  lat: number;
  lon: number;
  scope: MapScope;
  creatorId: string;
  groupIds: string[];
  source: ApiPin["source"];
  media?: Record<string, unknown> | null;
  photos?: Record<string, unknown>[];
  mapId?: string | null;
  address?: string;
}): Promise<ApiPin> {
  if (USE_LOCAL_DB) {
    const { upsertLocalPin } = await localDb();
    const now = new Date().toISOString();
    const pin: ApiPin = {
      pin_id: `local-pin-${Date.now()}`,
      post_id: `local-post-${Date.now()}`,
      title: input.title,
      note: input.note ?? "",
      coordinate: { lat: input.lat, lon: input.lon },
      address: input.address ?? "",
      scope: input.scope,
      creator_id: input.creatorId,
      group_ids: input.groupIds,
      source: input.source,
      media: input.media ?? null,
      photos: input.photos ?? [],
      map_id: input.mapId ?? null,
      created_at: now,
      updated_at: now,
    };
    return upsertLocalPin(pin);
  }
  return requestJson<ApiPin>("/api/pins", {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      note: input.note ?? "",
      coordinate: { lat: input.lat, lon: input.lon },
      address: input.address ?? "",
      scope: input.scope,
      creator_id: input.creatorId,
      group_ids: input.groupIds,
      source: input.source,
      media: input.media ?? null,
      photos: input.photos ?? [],
      map_id: input.mapId ?? null,
    }),
  });
}

export async function deletePin(pinId: string, creatorId: string): Promise<void> {
  if (USE_LOCAL_DB) {
    const { deleteLocalPin } = await localDb();
    deleteLocalPin(pinId, creatorId);
    return;
  }
  const params = new URLSearchParams({ creator_id: creatorId });
  await requestJson<{ status: string }>(`/api/pins/${encodeURIComponent(pinId)}?${params}`, { method: "DELETE" });
}

export async function listTravelGroups(viewerId: string): Promise<TravelGroup[]> {
  if (USE_LOCAL_DB) {
    const { listLocalTravelGroups } = await localDb();
    return listLocalTravelGroups(viewerId);
  }
  const params = new URLSearchParams({ viewer_id: viewerId });
  const data = await requestJson<{ circles: TravelGroup[] }>(`/api/travel-groups?${params}`);
  return data.circles;
}

export async function createTravelGroup(input: {
  name: string;
  ownerId: string;
  displayName?: string;
  role?: TravelGroupRole;
  phone?: string;
  avatar?: string;
}): Promise<TravelGroup> {
  if (USE_LOCAL_DB) {
    const { upsertLocalRow } = await localDb();
    const now = new Date().toISOString();
    const group: TravelGroup = {
      circle_id: `local-group-${Date.now()}`,
      group_id: `TG-${Date.now()}`,
      name: input.name,
      owner_id: input.ownerId,
      members: [{
        user_id: input.ownerId,
        display_name: input.displayName ?? "You",
        role: input.role ?? "Organizer",
        phone: input.phone ?? "",
        avatar: input.avatar ?? "",
        admin: true,
        location_sharing_enabled: true,
        joined_at: now,
      }],
      created_at: now,
      updated_at: now,
    };
    return upsertLocalRow("travelGroups", group, (item) => item.circle_id);
  }
  return requestJson<TravelGroup>("/api/travel-groups", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      owner_id: input.ownerId,
      display_name: input.displayName,
      role: input.role ?? "Organizer",
      phone: input.phone,
      avatar: input.avatar,
    }),
  });
}

export async function joinTravelGroup(input: {
  inviteCode: string;
  userId: string;
  displayName?: string;
  role?: TravelGroupRole;
  phone?: string;
  avatar?: string;
}): Promise<TravelGroup> {
  if (USE_LOCAL_DB) {
    const groups = (await localDb()).readLocalTable<TravelGroup>("travelGroups");
    return groups[0] ?? createTravelGroup({ name: "Local Travel Group", ownerId: input.userId, displayName: input.displayName, role: input.role, phone: input.phone, avatar: input.avatar });
  }
  return requestJson<TravelGroup>("/api/travel-groups/join", {
    method: "POST",
    body: JSON.stringify({
      invite_code: input.inviteCode,
      user_id: input.userId,
      display_name: input.displayName,
      role: input.role ?? "Traveler",
      phone: input.phone,
      avatar: input.avatar,
    }),
  });
}

export async function createTravelGroupInvite(groupId: string): Promise<TravelGroupInvite> {
  if (USE_LOCAL_DB) {
    return {
      invite_id: `local-invite-${Date.now()}`,
      circle_id: groupId,
      code: `LOCAL-${Date.now()}`,
      created_by: "demo-user",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      uses: 0,
    };
  }
  return requestJson<TravelGroupInvite>(`/api/travel-groups/${groupId}/invite`, { method: "POST" });
}

export async function updateTravelGroup(groupId: string, input: { name?: string }): Promise<TravelGroup> {
  if (USE_LOCAL_DB) {
    const { readLocalTable, writeLocalTable } = await localDb();
    const groups = readLocalTable<TravelGroup>("travelGroups");
    const next = groups.map((group) => group.circle_id === groupId ? { ...group, ...input, updated_at: new Date().toISOString() } : group);
    writeLocalTable("travelGroups", next);
    return next.find((group) => group.circle_id === groupId) ?? groups[0];
  }
  return requestJson<TravelGroup>(`/api/travel-groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateTravelGroupMember(
  groupId: string,
  memberId: string,
  input: Partial<Pick<TravelGroupMember, "display_name" | "role" | "phone" | "avatar" | "admin" | "location_sharing_enabled">>,
): Promise<TravelGroup> {
  if (USE_LOCAL_DB) {
    const { readLocalTable, writeLocalTable } = await localDb();
    const groups = readLocalTable<TravelGroup>("travelGroups");
    const next = groups.map((group) => group.circle_id === groupId ? {
      ...group,
      members: group.members.map((member) => member.user_id === memberId ? { ...member, ...input } : member),
      updated_at: new Date().toISOString(),
    } : group);
    writeLocalTable("travelGroups", next);
    return next.find((group) => group.circle_id === groupId) ?? groups[0];
  }
  return requestJson<TravelGroup>(`/api/travel-groups/${groupId}/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function leaveTravelGroup(groupId: string, memberId: string): Promise<TravelGroup> {
  if (USE_LOCAL_DB) {
    const { readLocalTable, writeLocalTable } = await localDb();
    const groups = readLocalTable<TravelGroup>("travelGroups");
    const next = groups.map((group) => group.circle_id === groupId ? { ...group, members: group.members.filter((member) => member.user_id !== memberId), updated_at: new Date().toISOString() } : group);
    writeLocalTable("travelGroups", next);
    return next.find((group) => group.circle_id === groupId) ?? groups[0];
  }
  return requestJson<TravelGroup>(`/api/travel-groups/${groupId}/members/${memberId}`, { method: "DELETE" });
}

export async function listTravelCheckpoints(groupId: string): Promise<TravelCheckpoint[]> {
  if (USE_LOCAL_DB) return [];
  const data = await requestJson<{ places: TravelCheckpoint[] }>(`/api/travel-groups/${groupId}/places`);
  return data.places;
}

export async function createTravelCheckpoint(input: {
  groupId: string;
  creatorId: string;
  name: string;
  label: string;
  lat: number;
  lon: number;
  radiusM?: number;
}): Promise<TravelCheckpoint> {
  if (USE_LOCAL_DB) {
    return {
      place_id: `local-checkpoint-${Date.now()}`,
      circle_id: input.groupId,
      creator_id: input.creatorId,
      name: input.name,
      label: input.label,
      coordinate: { lat: input.lat, lon: input.lon },
      radius_m: input.radiusM ?? 220,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return requestJson<TravelCheckpoint>(`/api/travel-groups/${input.groupId}/places`, {
    method: "POST",
    body: JSON.stringify({
      creator_id: input.creatorId,
      name: input.name,
      label: input.label,
      lat: input.lat,
      lon: input.lon,
      radius_m: input.radiusM ?? 220,
    }),
  });
}

export async function listTravelGroupLocations(groupId: string): Promise<TravelGroupLocation[]> {
  if (USE_LOCAL_DB) {
    const { readLocalTable } = await localDb();
    return readLocalTable<TravelGroupLocation>("memberLocations").filter((location) => location.circle_id === groupId);
  }
  const data = await requestJson<{ locations: TravelGroupLocation[] }>(`/api/travel-groups/${groupId}/locations`);
  return data.locations;
}

export async function updateTravelGroupLocation(input: {
  groupId: string;
  userId: string;
  lat?: number;
  lon?: number;
  accuracyM?: number;
  activity?: TravelActivity;
  sharingEnabled: boolean;
  visibilityScope: LocationVisibility;
  eventId?: string | null;
}): Promise<TravelGroupLocation> {
  if (USE_LOCAL_DB) {
    const { upsertLocalRow } = await localDb();
    const location: TravelGroupLocation = {
      circle_id: input.groupId,
      user_id: input.userId,
      coordinate: input.lat != null && input.lon != null ? { lat: input.lat, lon: input.lon } : null,
      accuracy_m: input.accuracyM ?? null,
      activity: input.activity ?? "traveling",
      sharing_enabled: input.sharingEnabled,
      visibility_scope: input.visibilityScope,
      event_id: input.eventId ?? null,
      travel_group_id: input.groupId,
      status_text: input.sharingEnabled ? "Sharing locally" : "Hidden",
      inside_place_ids: [],
      updated_at: new Date().toISOString(),
    };
    return upsertLocalRow("memberLocations", location, (item) => `${item.circle_id}:${item.user_id}`);
  }
  return requestJson<TravelGroupLocation>(`/api/travel-groups/${input.groupId}/locations`, {
    method: "POST",
    body: JSON.stringify({
      user_id: input.userId,
      lat: input.lat,
      lon: input.lon,
      accuracy_m: input.accuracyM,
      activity: input.activity ?? "traveling",
      sharing_enabled: input.sharingEnabled,
      visibility_scope: input.visibilityScope,
      event_id: input.eventId,
      travel_group_id: input.groupId,
    }),
  });
}

export async function checkInTravelGroup(input: {
  groupId: string;
  userId: string;
  lat: number;
  lon: number;
  visibilityScope: LocationVisibility;
  eventId?: string | null;
}): Promise<TravelGroupLocation> {
  if (USE_LOCAL_DB) {
    return updateTravelGroupLocation({
      groupId: input.groupId,
      userId: input.userId,
      lat: input.lat,
      lon: input.lon,
      activity: "check-in",
      sharingEnabled: true,
      visibilityScope: input.visibilityScope,
      eventId: input.eventId,
    });
  }
  return requestJson<TravelGroupLocation>(`/api/travel-groups/${input.groupId}/check-in`, {
    method: "POST",
    body: JSON.stringify({
      user_id: input.userId,
      lat: input.lat,
      lon: input.lon,
      activity: "check-in",
      sharing_enabled: true,
      visibility_scope: input.visibilityScope,
      event_id: input.eventId,
      travel_group_id: input.groupId,
    }),
  });
}

export async function listTravelNotifications(groupId: string): Promise<TravelNotification[]> {
  if (USE_LOCAL_DB) return [];
  const data = await requestJson<{ events: TravelNotification[] }>(`/api/travel-groups/${groupId}/events`);
  return data.events;
}

export async function markTravelNotificationRead(groupId: string, eventId: string, viewerId: string): Promise<TravelNotification> {
  if (USE_LOCAL_DB) {
    return { event_id: eventId, circle_id: groupId, user_id: viewerId, type: "system", place_id: null, message: "Read locally", read_by: [viewerId], created_at: new Date().toISOString() };
  }
  const params = new URLSearchParams({ viewer_id: viewerId });
  return requestJson<TravelNotification>(`/api/travel-groups/${groupId}/events/${eventId}/read?${params}`, { method: "PATCH" });
}

export async function deleteTravelNotification(groupId: string, eventId: string, viewerId: string): Promise<void> {
  if (USE_LOCAL_DB) return;
  const params = new URLSearchParams({ viewer_id: viewerId });
  await requestJson<{ status: string }>(`/api/travel-groups/${groupId}/events/${eventId}?${params}`, { method: "DELETE" });
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  if (USE_LOCAL_DB) {
    return { user_id: userId, meetup_arrivals: true, destination_arrivals: true, check_ins: true, checkpoints: true, group_ride_start: true, event_arrivals: true };
  }
  return requestJson<NotificationPreferences>(`/api/travel-groups/notification-preferences/${encodeURIComponent(userId)}`);
}

export async function updateNotificationPreferences(input: NotificationPreferences): Promise<NotificationPreferences> {
  if (USE_LOCAL_DB) return input;
  return requestJson<NotificationPreferences>(`/api/travel-groups/notification-preferences/${encodeURIComponent(input.user_id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function listTouristCollections(ownerId: string): Promise<TouristCollection[]> {
  if (USE_LOCAL_DB) {
    const { listLocalTouristCollections } = await localDb();
    return listLocalTouristCollections(ownerId);
  }
  const params = new URLSearchParams({ owner_id: ownerId });
  const data = await requestJson<{ collections: TouristCollection[] }>(`/api/travel-groups/tourist-collections?${params}`);
  return data.collections;
}

export async function createTouristCollection(input: {
  ownerId: string;
  name: string;
  description?: string;
}): Promise<TouristCollection> {
  if (USE_LOCAL_DB) {
    const { upsertLocalRow } = await localDb();
    const now = new Date().toISOString();
    const collection: TouristCollection = {
      collection_id: `local-collection-${Date.now()}`,
      owner_id: input.ownerId,
      name: input.name,
      description: input.description ?? "",
      created_at: now,
      updated_at: now,
    };
    return upsertLocalRow("travelCollections", collection, (item) => item.collection_id);
  }
  return requestJson<TouristCollection>("/api/travel-groups/tourist-collections", {
    method: "POST",
    body: JSON.stringify({
      owner_id: input.ownerId,
      name: input.name,
      description: input.description ?? "",
    }),
  });
}

export async function deleteTouristCollection(collectionId: string, ownerId: string): Promise<void> {
  if (USE_LOCAL_DB) {
    const { deleteLocalRows } = await localDb();
    deleteLocalRows<TouristCollection>("travelCollections", (collection) => collection.collection_id === collectionId && collection.owner_id === ownerId);
    return;
  }
  const params = new URLSearchParams({ owner_id: ownerId });
  await requestJson<{ status: string }>(`/api/travel-groups/tourist-collections/${collectionId}?${params}`, { method: "DELETE" });
}

export async function listTouristSpots(savedBy: string, collectionId?: string | null): Promise<TouristSpot[]> {
  if (USE_LOCAL_DB) {
    const { listLocalTouristSpots } = await localDb();
    return listLocalTouristSpots(savedBy, collectionId);
  }
  const params = new URLSearchParams({ saved_by: savedBy });
  if (collectionId) params.set("collection_id", collectionId);
  const data = await requestJson<{ places: TouristSpot[] }>(`/api/travel-groups/tourist-spots?${params}`);
  return data.places;
}

export async function createTouristSpot(input: {
  savedBy: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  collectionId?: string | null;
  notes?: string;
}): Promise<TouristSpot> {
  if (USE_LOCAL_DB) {
    const { upsertLocalRow } = await localDb();
    const spot: TouristSpot = {
      place_id: `local-spot-${Date.now()}`,
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      category: input.category,
      saved_by: input.savedBy,
      saved_at: new Date().toISOString(),
      collection_id: input.collectionId ?? null,
      notes: input.notes ?? "",
    };
    return upsertLocalRow("savedTouristSpots", spot, (item) => item.place_id);
  }
  return requestJson<TouristSpot>("/api/travel-groups/tourist-spots", {
    method: "POST",
    body: JSON.stringify({
      saved_by: input.savedBy,
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      category: input.category,
      collection_id: input.collectionId,
      notes: input.notes ?? "",
    }),
  });
}

export async function deleteTouristSpot(placeId: string, savedBy: string): Promise<void> {
  if (USE_LOCAL_DB) {
    const { deleteLocalRows } = await localDb();
    deleteLocalRows<TouristSpot>("savedTouristSpots", (spot) => spot.place_id === placeId && spot.saved_by === savedBy);
    return;
  }
  const params = new URLSearchParams({ saved_by: savedBy });
  await requestJson<{ status: string }>(`/api/travel-groups/tourist-spots/${placeId}?${params}`, { method: "DELETE" });
}

export async function listRoutes(viewerId: string, groupIds: string[]) {
  if (USE_LOCAL_DB) {
    const { readLocalTable } = await localDb();
    return readLocalTable<Record<string, unknown>>("routes").filter((route) => route.creator_id === viewerId || (Array.isArray(route.group_ids) && route.group_ids.some((groupId) => groupIds.includes(String(groupId)))));
  }
  const params = new URLSearchParams({ viewer_id: viewerId });
  if (groupIds.length) params.set("group_ids", groupIds.join(","));
  const data = await requestJson<{ routes: Array<Record<string, unknown>> }>(`/api/routes?${params}`);
  return data.routes;
}

export async function createTrackingSession(input: {
  sessionId?: string;
  routeId?: string;
  scope: MapScope;
  creatorId: string;
  groupIds: string[];
}): Promise<TrackingSession> {
  if (USE_LOCAL_DB) {
    return {
      session_id: input.sessionId ?? `local-tracking-${Date.now()}`,
      route_id: input.routeId ?? null,
      scope: input.scope,
      creator_id: input.creatorId,
      group_ids: input.groupIds,
      token: `local-token-${Date.now()}`,
      token_expires_at: Date.now() + 60 * 60 * 1000,
      ws_path: "/local-tracking",
    };
  }
  return requestJson<TrackingSession>("/api/tracking/sessions", {
    method: "POST",
    body: JSON.stringify({
      session_id: input.sessionId,
      route_id: input.routeId,
      scope: input.scope,
      creator_id: input.creatorId,
      group_ids: input.groupIds,
    }),
  });
}

export function buildTrackingSocketUrl(session: TrackingSession): string {
  const base = API_BASE_URL || window.location.origin;
  const url = new URL(session.ws_path, base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("token", session.token);
  return url.toString();
}
