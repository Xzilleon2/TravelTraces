import type { ApiPin, MapScope, TouristCollection, TouristSpot, TravelGroup, UserMap } from "./mappingApi";
import type { HostedTourMeetupRecord } from "./eventsApi";

export const LOCAL_DB_VERSION = 1;
export const LOCAL_DB_PREFIX = "traveltraces.db.v1";
export const LOCAL_STORAGE_SCHEMA_RESET_VERSION = "2026-07-09-local-only-v1";
const LOCAL_STORAGE_SCHEMA_RESET_KEY = `${LOCAL_DB_PREFIX}.schema_reset_version`;

export const localDbTables = {
  users: `${LOCAL_DB_PREFIX}.users`,
  authSessions: `${LOCAL_DB_PREFIX}.auth_sessions`,
  explorePlaces: `${LOCAL_DB_PREFIX}.explore_places`,
  stories: `${LOCAL_DB_PREFIX}.stories`,
  storyPhotos: `${LOCAL_DB_PREFIX}.story_photos`,
  storyComments: `${LOCAL_DB_PREFIX}.story_comments`,
  storyLikes: `${LOCAL_DB_PREFIX}.story_likes`,
  savedStories: `${LOCAL_DB_PREFIX}.saved_stories`,
  storyCollections: `${LOCAL_DB_PREFIX}.story_collections`,
  userMaps: `${LOCAL_DB_PREFIX}.user_maps`,
  pins: `${LOCAL_DB_PREFIX}.pins`,
  pinPhotos: `${LOCAL_DB_PREFIX}.pin_photos`,
  routes: `${LOCAL_DB_PREFIX}.routes`,
  routePoints: `${LOCAL_DB_PREFIX}.route_points`,
  travelPlanStories: `${LOCAL_DB_PREFIX}.travel_plan_stories`,
  travelPlanDestinations: `${LOCAL_DB_PREFIX}.travel_plan_destinations`,
  travelPlanDestinationDocuments: `${LOCAL_DB_PREFIX}.travel_plan_destination_documents`,
  travelPlanAlbums: `${LOCAL_DB_PREFIX}.travel_plan_albums`,
  travelPlanComments: `${LOCAL_DB_PREFIX}.travel_plan_comments`,
  savedTravelPlans: `${LOCAL_DB_PREFIX}.saved_travel_plans`,
  userCalendarItems: `${LOCAL_DB_PREFIX}.user_calendar_items`,
  travelGroups: `${LOCAL_DB_PREFIX}.travel_groups`,
  travelGroupMembers: `${LOCAL_DB_PREFIX}.travel_group_members`,
  events: `${LOCAL_DB_PREFIX}.events`,
  eventParticipants: `${LOCAL_DB_PREFIX}.event_participants`,
  conversations: `${LOCAL_DB_PREFIX}.conversations`,
  messages: `${LOCAL_DB_PREFIX}.messages`,
  travelCollections: `${LOCAL_DB_PREFIX}.travel_collections`,
  savedTouristSpots: `${LOCAL_DB_PREFIX}.saved_tourist_spots`,
  memberLocations: `${LOCAL_DB_PREFIX}.member_locations`,
  todayAgendas: `${LOCAL_DB_PREFIX}.today_agendas`,
  auditLog: `${LOCAL_DB_PREFIX}.audit_log`,
} as const;

export type LocalDbTable = keyof typeof localDbTables;

export type LocalStoryRecord = {
  id: number;
  title: string;
  author: string;
  authorAvatar: string;
  region: string;
  readTime: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  likes: number;
  saves: number;
  img: string;
  category: string;
  excerpt: string;
  body: string;
  subtitle?: string;
  photos?: Array<string | Record<string, unknown>>;
  imagePosition?: string;
  storyPoint?: { place: string; coordinate: { lat: number; lon: number } };
  scope?: MapScope;
  visibility?: "public" | "friends" | "private";
  ownerId?: string;
  groupIds?: string[];
  local?: boolean;
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function placeholderImage(label = "TravelTraces") {
  const safeLabel = label.replace(/[<>&"]/g, "").slice(0, 48) || "TravelTraces";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560"><rect width="900" height="560" fill="#EFE7DC"/><circle cx="450" cy="250" r="76" fill="#C4713A" opacity=".18"/><text x="50%" y="53%" text-anchor="middle" font-family="Georgia,serif" font-size="42" fill="#3A2A22">${safeLabel}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function compactImageValue(value: unknown, fallbackLabel?: string): string {
  const text = typeof value === "string" ? value : "";
  if (!text) return placeholderImage(fallbackLabel);
  return text.startsWith("data:image") && text.length > 360_000 ? placeholderImage(fallbackLabel) : text;
}

function compactStoryRecord(story: LocalStoryRecord): LocalStoryRecord {
  const img = compactImageValue(story.img, story.title);
  const photos = (story.photos ?? [img]).slice(0, 4).map((photo) => {
    if (typeof photo === "string") return compactImageValue(photo, story.title);
    const preview = compactImageValue(photo.preview_url ?? photo.data_url ?? photo.thumbnail_url ?? img, story.title);
    return {
      preview_url: preview,
      thumbnail_url: preview,
      object_position: typeof photo.object_position === "string" ? photo.object_position : story.imagePosition ?? "center center",
      photoPositionX: typeof photo.photoPositionX === "number" ? photo.photoPositionX : undefined,
      photoPositionY: typeof photo.photoPositionY === "number" ? photo.photoPositionY : undefined,
    };
  });
  return { ...story, img, photos };
}

function compactPinRecord(pin: ApiPin): ApiPin {
  const photos = (pin.photos ?? []).slice(0, 4).map((photo) => {
    const preview = compactImageValue(photo.preview_url ?? photo.data_url ?? photo.thumbnail_url ?? "", pin.title);
    return { ...photo, data_url: preview, preview_url: preview, thumbnail_url: preview };
  });
  const media = pin.media ? { ...pin.media } : null;
  if (media) {
    const preview = compactImageValue(media.preview_url ?? media.data_url ?? media.thumbnail_url ?? "", pin.title);
    media.data_url = preview;
    media.preview_url = preview;
    media.thumbnail_url = preview;
  }
  return { ...pin, photos, media };
}

function rowsForStorage<T>(table: LocalDbTable, rows: T[]): T[] {
  if (table === "stories") return (rows as LocalStoryRecord[]).map(compactStoryRecord) as T[];
  if (table === "pins") return (rows as ApiPin[]).map(compactPinRecord) as T[];
  return rows;
}

export function initializeLocalStorageSchema() {
  if (!canUseStorage()) return;
  const currentVersion = window.localStorage.getItem(LOCAL_STORAGE_SCHEMA_RESET_KEY);
  if (currentVersion === LOCAL_STORAGE_SCHEMA_RESET_VERSION) return;
  try {
    window.localStorage.clear();
    window.localStorage.setItem(LOCAL_STORAGE_SCHEMA_RESET_KEY, LOCAL_STORAGE_SCHEMA_RESET_VERSION);
  } catch {
    // Local storage may be blocked; the app can still run with in-memory React state.
  }
}

export function readLocalTable<T>(table: LocalDbTable): T[] {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(localDbTables[table]) ?? "[]") as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalTable<T>(table: LocalDbTable, rows: T[]) {
  if (!canUseStorage()) return;
  const storageRows = rowsForStorage(table, rows);
  try {
    window.localStorage.setItem(localDbTables[table], JSON.stringify(storageRows));
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "QuotaExceededError") throw error;
    const compactRows = rowsForStorage(table, rows.slice(0, table === "stories" || table === "pins" ? 8 : rows.length));
    window.localStorage.removeItem("traveltraces.localStories");
    try {
      window.localStorage.setItem(localDbTables[table], JSON.stringify(compactRows));
    } catch (retryError) {
      if (!(retryError instanceof DOMException) || retryError.name !== "QuotaExceededError") throw retryError;
      if (table === "stories") {
        window.localStorage.setItem(localDbTables[table], JSON.stringify((compactRows as LocalStoryRecord[]).slice(0, 3).map(compactStoryRecord)));
      } else if (table === "pins") {
        window.localStorage.setItem(localDbTables[table], JSON.stringify((compactRows as ApiPin[]).slice(0, 3).map(compactPinRecord)));
      } else {
        window.localStorage.setItem(localDbTables[table], JSON.stringify([]));
      }
    }
  }
  window.dispatchEvent(new CustomEvent("traveltraces:local-db-updated", { detail: { table } }));
}

export function upsertLocalRow<T>(table: LocalDbTable, row: T, getId: (item: T) => string | number) {
  const id = getId(row);
  const next = [row, ...readLocalTable<T>(table).filter((item) => getId(item) !== id)];
  writeLocalTable(table, next);
  return row;
}

export function deleteLocalRows<T>(table: LocalDbTable, predicate: (item: T) => boolean) {
  const next = readLocalTable<T>(table).filter((item) => !predicate(item));
  writeLocalTable(table, next);
}

export function migrateLegacyLocalStorage() {
  if (!canUseStorage()) return;

  const legacyStories = JSON.parse(window.localStorage.getItem("traveltraces.localStories") ?? "[]") as LocalStoryRecord[];
  if (Array.isArray(legacyStories) && legacyStories.length && !readLocalTable<LocalStoryRecord>("stories").length) {
    writeLocalTable("stories", legacyStories);
  }
  if (Array.isArray(legacyStories) && legacyStories.length) {
    window.localStorage.removeItem("traveltraces.localStories");
  }

  const legacyPlans = JSON.parse(window.localStorage.getItem("traveltraces.travelPlanStories.v1") ?? "[]") as unknown[];
  if (Array.isArray(legacyPlans) && legacyPlans.length && !readLocalTable<unknown>("travelPlanStories").length) {
    writeLocalTable("travelPlanStories", legacyPlans);
  }

  const legacyHostedTours = JSON.parse(window.localStorage.getItem("travelplaces.hostedTourMeetups.v1") ?? "[]") as HostedTourMeetupRecord[];
  if (Array.isArray(legacyHostedTours) && legacyHostedTours.length && !readLocalTable<HostedTourMeetupRecord>("events").length) {
    writeLocalTable("events", legacyHostedTours);
  }
}

export function listLocalStories() {
  migrateLegacyLocalStorage();
  return readLocalTable<LocalStoryRecord>("stories");
}

export function writeLocalStories(stories: LocalStoryRecord[]) {
  // NOTE: previously this also mirrored the full, uncompacted `stories` array to the
  // legacy "traveltraces.localStories" key via a raw setItem with no try/catch. That
  // duplicate write is why upsertLocalStory() could throw an uncaught QuotaExceededError
  // even though writeLocalTable() above already compacts images and retries on quota
  // errors. The legacy key is only ever read once (in migrateLegacyLocalStorage, as a
  // one-time migration into the versioned table), so nothing needs to write back to it.
  writeLocalTable("stories", stories);
  window.dispatchEvent(new CustomEvent("traveltraces:local-stories-updated"));
}

export function upsertLocalStory(story: LocalStoryRecord) {
  const next = [story, ...listLocalStories().filter((item) => item.id !== story.id)];
  writeLocalStories(next);
  return story;
}

export function deleteLocalStoryCascade(storyId: number) {
  writeLocalStories(listLocalStories().filter((story) => story.id !== storyId));
  deleteLocalRows<ApiPin>("pins", (pin) => {
    const media = pin.media as { storyId?: unknown; storyDraftId?: unknown } | null;
    return Number(media?.storyId ?? media?.storyDraftId) === storyId || pin.pin_id === `story-${storyId}` || pin.pin_id === `local-marker-${storyId}`;
  });
  deleteLocalRows<{ story_id?: number; storyId?: number }>("savedStories", (row) => Number(row.story_id ?? row.storyId) === storyId);
  deleteLocalRows<{ story_id?: number; storyId?: number }>("storyComments", (row) => Number(row.story_id ?? row.storyId) === storyId);
}

export function listLocalPins(viewerId: string, groupIds: string[] = [], scope?: MapScope | null) {
  return readLocalTable<ApiPin>("pins").filter((pin) => {
    if (scope && pin.scope !== scope) return false;
    if (pin.scope === "public") return true;
    if (pin.creator_id === viewerId) return true;
    if (pin.scope === "group") return pin.group_ids.some((groupId) => groupIds.includes(groupId)) || Boolean(pin.collaboratorIds?.includes(viewerId));
    return false;
  });
}

export function upsertLocalPin(pin: ApiPin) {
  return upsertLocalRow<ApiPin>("pins", pin, (item) => item.pin_id);
}

export function deleteLocalPin(pinId: string, creatorId: string) {
  deleteLocalRows<ApiPin>("pins", (pin) => pin.pin_id === pinId && (!creatorId || pin.creator_id === creatorId));
}

export function listLocalUserMaps(ownerId?: string) {
  return readLocalTable<UserMap>("userMaps").filter((map) => !ownerId || map.owner_id === ownerId);
}

export function ensureLocalDefaultMap(ownerId: string): UserMap {
  const existing = listLocalUserMaps(ownerId).find((map) => map.is_default);
  if (existing) return existing;
  const now = new Date().toISOString();
  const map: UserMap = {
    map_id: `local-map-${ownerId}`,
    title: "My TravelTraces Map",
    description: "Local testing map",
    scope: "private",
    owner_id: ownerId,
    creator_id: ownerId,
    group_ids: [],
    is_default: true,
    created_at: now,
    updated_at: now,
  };
  upsertLocalRow<UserMap>("userMaps", map, (item) => item.map_id);
  return map;
}

export function listLocalTravelGroups(viewerId: string) {
  return readLocalTable<TravelGroup>("travelGroups").filter((group) => group.owner_id === viewerId || group.members.some((member) => member.user_id === viewerId));
}

export function listLocalTouristCollections(ownerId: string) {
  return readLocalTable<TouristCollection>("travelCollections").filter((collection) => collection.owner_id === ownerId);
}

export function listLocalTouristSpots(ownerId: string, collectionId?: string | null) {
  return readLocalTable<TouristSpot>("savedTouristSpots").filter((spot) => spot.saved_by === ownerId && (!collectionId || spot.collection_id === collectionId));
}
