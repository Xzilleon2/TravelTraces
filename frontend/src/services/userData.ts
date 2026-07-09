import type { User } from "../context/AuthContext";
import { readLocalTable, writeLocalTable, type LocalDbTable } from "./localDb";
import type { TravelPlanStory } from "./travelPlanStories";

export type SavedItemFilter = "All" | "Places" | "Stories" | "Routes" | "Travel Plans" | "Markers" | "Favorites";

export type SavedItem = {
  id: string;
  type: Exclude<SavedItemFilter, "All">;
  title: string;
  subtitle?: string;
  createdAt?: string;
  source: unknown;
};

const USER_NAMESPACE = "traveltraces:user";

export function userStorageKey(userId: string, bucket: string) {
  return `${USER_NAMESPACE}:${userId}:${bucket}`;
}

export function readUserValue<T>(userId: string, bucket: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(userStorageKey(userId, bucket));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeUserValue<T>(userId: string, bucket: string, value: T): T {
  try {
    window.localStorage.setItem(userStorageKey(userId, bucket), JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("traveltraces:user-data-updated", { detail: { userId, bucket } }));
  } catch {
    // Local prototype storage should never break the active UI.
  }
  return value;
}

export function updateLocalUser(userId: string, updater: (user: User) => User): User | null {
  const users = readLocalTable<User>("users");
  const index = users.findIndex((row) => row.id === userId);
  if (index < 0) return null;
  const next = updater(users[index]);
  const rows = [...users];
  rows[index] = next;
  writeLocalTable<User>("users", rows);
  return next;
}

function connectionIds(user?: Pick<User, "friends" | "followers"> & { following?: Array<{ id: string }> }) {
  return {
    followers: new Set((user?.followers ?? []).map((item) => item.id)),
    following: new Set([...(user?.friends ?? []), ...(user?.following ?? [])].map((item) => item.id)),
  };
}

export function getSocialStats(profileUserId: string) {
  const users = readLocalTable<User>("users");
  const profile = users.find((row) => row.id === profileUserId);
  const own = connectionIds(profile);
  const inferredFollowers = users.filter((row) => connectionIds(row).following.has(profileUserId)).length;
  const inferredFollowing = users.filter((row) => own.following.has(row.id)).length;
  return {
    followersCount: Math.max(own.followers.size, inferredFollowers),
    followingCount: Math.max(own.following.size, inferredFollowing),
    followers: [...own.followers],
    following: [...own.following],
  };
}

export function toggleFollow(viewer: User, profile: User) {
  const viewerIds = connectionIds(viewer).following;
  const isFollowing = viewerIds.has(profile.id);
  const viewerConnection = { id: profile.id, name: profile.name || profile.email, location: profile.location, avatar: profile.avatar };
  const profileConnection = { id: viewer.id, name: viewer.name || viewer.email, location: viewer.location, avatar: viewer.avatar };
  updateLocalUser(viewer.id, (current) => ({
    ...current,
    friends: isFollowing ? current.friends.filter((item) => item.id !== profile.id) : [...current.friends.filter((item) => item.id !== profile.id), viewerConnection],
  }));
  updateLocalUser(profile.id, (current) => ({
    ...current,
    followers: isFollowing ? current.followers.filter((item) => item.id !== viewer.id) : [...current.followers.filter((item) => item.id !== viewer.id), profileConnection],
  }));
  return !isFollowing;
}

export function getSavedItemsByUser(userId: string, filter: SavedItemFilter = "All"): SavedItem[] {
  const savedStoryIds = new Set(readUserValue<Array<number | string>>(userId, "savedStories", []));
  const savedPlanIds = new Set(readUserValue<Array<string>>(userId, "savedTravelPlans", []));
  const savedPinIds = new Set(readUserValue<Array<string>>(userId, "savedMarkers", []));
  const rows: SavedItem[] = [
    ...readLocalTable<{ place_id: string; name: string; category?: string; saved_at?: string }>("savedTouristSpots")
      .filter((spot) => String((spot as { user_id?: string }).user_id ?? userId) === userId)
      .map((spot) => ({ id: spot.place_id, type: "Places" as const, title: spot.name, subtitle: spot.category, createdAt: spot.saved_at, source: spot })),
    ...readLocalTable<{ id: number | string; title: string; subtitle?: string; createdAt?: string }>("stories")
      .filter((story) => savedStoryIds.has(story.id))
      .map((story) => ({ id: String(story.id), type: "Stories" as const, title: story.title, subtitle: story.subtitle, createdAt: story.createdAt, source: story })),
    ...readLocalTable<TravelPlanStory>("travelPlanStories")
      .filter((plan) => savedPlanIds.has(plan.id))
      .map((plan) => ({ id: plan.id, type: "Travel Plans" as const, title: plan.travelPlanName, subtitle: plan.subtitle, createdAt: plan.createdAt, source: plan })),
    ...readLocalTable<{ pin_id: string; label?: string; name?: string; created_at?: string }>("pins")
      .filter((pin) => savedPinIds.has(pin.pin_id))
      .map((pin) => ({ id: pin.pin_id, type: "Markers" as const, title: pin.label || pin.name || "Saved marker", createdAt: pin.created_at, source: pin })),
  ];
  return filter === "All" ? rows : rows.filter((item) => item.type === filter);
}

export function migrateLegacyUserBucket<T>(userId: string, bucket: string, legacyKey: string, fallback: T): T {
  const existing = readUserValue<T | null>(userId, bucket, null);
  if (existing !== null) return existing;
  try {
    const raw = window.localStorage.getItem(legacyKey);
    const value = raw ? (JSON.parse(raw) as T) : fallback;
    writeUserValue(userId, bucket, value);
    return value;
  } catch {
    writeUserValue(userId, bucket, fallback);
    return fallback;
  }
}

export function writeUserTable<T>(userId: string, bucket: string, table: LocalDbTable, rows: T[]) {
  writeLocalTable<T>(table, rows);
  writeUserValue(userId, bucket, rows);
}
