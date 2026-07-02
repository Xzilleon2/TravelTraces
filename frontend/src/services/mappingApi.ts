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
  const params = new URLSearchParams({ query, limit: String(limit) });
  const data = await requestJson<{ results: ApiLocation[] }>(`/api/search?${params}`);
  return data.results;
}

export async function autocompleteLocations(query: string, limit = 8): Promise<ApiLocation[]> {
  const params = new URLSearchParams({ query, limit: String(limit) });
  const data = await requestJson<{ results: ApiLocation[] }>(`/api/autocomplete?${params}`);
  return data.results;
}

export async function reverseLocation(lat: number, lon: number): Promise<ApiLocation> {
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
  const params = new URLSearchParams({ viewer_id: viewerId });
  if (groupIds.length) params.set("group_ids", groupIds.join(","));
  if (mapId) params.set("map_id", mapId);
  if (scope) params.set("scope", scope);
  const data = await requestJson<{ pins: ApiPin[] }>(`/api/pins?${params}`);
  return data.pins;
}

export async function listPublicPins(scope: MapScope = "public"): Promise<ApiPin[]> {
  const params = new URLSearchParams({ scope });
  const data = await requestJson<{ pins: ApiPin[] }>(`/api/public/pins?${params}`);
  return data.pins;
}

export async function listUserMaps(ownerId?: string): Promise<UserMap[]> {
  const params = new URLSearchParams();
  if (ownerId) params.set("owner_id", ownerId);
  const data = await requestJson<{ maps: UserMap[] }>(`/api/maps?${params}`);
  return data.maps;
}

export async function listPublicUserMaps(ownerId?: string): Promise<UserMap[]> {
  const params = new URLSearchParams();
  if (ownerId) params.set("owner_id", ownerId);
  const data = await requestJson<{ maps: UserMap[] }>(`/api/public/maps?${params}`);
  return data.maps;
}

export async function getDefaultMap(): Promise<UserMap> {
  return requestJson<UserMap>("/api/maps/default");
}

export async function createUserMap(input: {
  title: string;
  description?: string;
  scope: MapScope;
  ownerId: string;
  groupIds?: string[];
}): Promise<UserMap> {
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

export async function listTravelGroups(viewerId: string): Promise<TravelGroup[]> {
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
  return requestJson<TravelGroupInvite>(`/api/travel-groups/${groupId}/invite`, { method: "POST" });
}

export async function updateTravelGroup(groupId: string, input: { name?: string }): Promise<TravelGroup> {
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
  return requestJson<TravelGroup>(`/api/travel-groups/${groupId}/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function leaveTravelGroup(groupId: string, memberId: string): Promise<TravelGroup> {
  return requestJson<TravelGroup>(`/api/travel-groups/${groupId}/members/${memberId}`, { method: "DELETE" });
}

export async function listTravelCheckpoints(groupId: string): Promise<TravelCheckpoint[]> {
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
  const data = await requestJson<{ events: TravelNotification[] }>(`/api/travel-groups/${groupId}/events`);
  return data.events;
}

export async function markTravelNotificationRead(groupId: string, eventId: string, viewerId: string): Promise<TravelNotification> {
  const params = new URLSearchParams({ viewer_id: viewerId });
  return requestJson<TravelNotification>(`/api/travel-groups/${groupId}/events/${eventId}/read?${params}`, { method: "PATCH" });
}

export async function deleteTravelNotification(groupId: string, eventId: string, viewerId: string): Promise<void> {
  const params = new URLSearchParams({ viewer_id: viewerId });
  await requestJson<{ status: string }>(`/api/travel-groups/${groupId}/events/${eventId}?${params}`, { method: "DELETE" });
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  return requestJson<NotificationPreferences>(`/api/travel-groups/notification-preferences/${encodeURIComponent(userId)}`);
}

export async function updateNotificationPreferences(input: NotificationPreferences): Promise<NotificationPreferences> {
  return requestJson<NotificationPreferences>(`/api/travel-groups/notification-preferences/${encodeURIComponent(input.user_id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function listTouristCollections(ownerId: string): Promise<TouristCollection[]> {
  const params = new URLSearchParams({ owner_id: ownerId });
  const data = await requestJson<{ collections: TouristCollection[] }>(`/api/travel-groups/tourist-collections?${params}`);
  return data.collections;
}

export async function createTouristCollection(input: {
  ownerId: string;
  name: string;
  description?: string;
}): Promise<TouristCollection> {
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
  const params = new URLSearchParams({ owner_id: ownerId });
  await requestJson<{ status: string }>(`/api/travel-groups/tourist-collections/${collectionId}?${params}`, { method: "DELETE" });
}

export async function listTouristSpots(savedBy: string, collectionId?: string | null): Promise<TouristSpot[]> {
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
  const params = new URLSearchParams({ saved_by: savedBy });
  await requestJson<{ status: string }>(`/api/travel-groups/tourist-spots/${placeId}?${params}`, { method: "DELETE" });
}

export async function listRoutes(viewerId: string, groupIds: string[]) {
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
