import type { ApiLocation, MapScope } from "./mappingApi";

export const TRAVEL_PLAN_STORIES_KEY = "traveltraces.travelPlanStories.v1";

export type TravelPlanDestinationStatus = "planned" | "visited" | "completed";
export type TravelPlanJourneyStatus = "planning" | "ongoing" | "completed";

export type TravelPlanDestination = {
  id: string;
  order: number;
  placeName: string;
  coordinate: { lat: number; lon: number };
  plannedDay: number;
  plannedDate?: string;
  plannedTime?: string;
  notes?: string;
  status: TravelPlanDestinationStatus;
  visibility?: MapScope;
  category?: string;
  title?: string;
  description?: string;
  photos?: string[];
  dateVisited?: string;
};

export type TravelPlanStory = {
  id: string;
  ownerId: string;
  ownerName: string;
  travelPlanName: string;
  subtitle?: string;
  coverImage?: string;
  coverPosition?: string;
  coverPositionX?: number;
  coverPositionY?: number;
  description?: string;
  likesCount?: number;
  savesCount?: number;
  commentsCount?: number;
  routeGeometry?: [number, number][];
  destinations: TravelPlanDestination[];
  visibility: MapScope;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TravelPlanDraftInput = {
  ownerId: string;
  ownerName: string;
  travelPlanName: string;
  subtitle?: string;
  coverImage?: string;
  coverPosition?: string;
  coverPositionX?: number;
  coverPositionY?: number;
  description?: string;
  stops: Array<ApiLocation & { plannedDay?: number; plannedDate?: string; plannedTime?: string; notes?: string; category?: string }>;
  routeGeometry?: [number, number][];
};

export function travelPlanStatus(plan: TravelPlanStory): TravelPlanJourneyStatus {
  const destinations = plan.destinations;
  if (!destinations.length || destinations.every((destination) => destination.status === "planned")) return "planning";
  return destinations.every((destination) => destination.status !== "planned") ? "completed" : "ongoing";
}

export function completedDestinationCount(plan: TravelPlanStory): number {
  return plan.destinations.filter((destination) => destination.status !== "planned").length;
}

export function totalTravelDays(plan: TravelPlanStory): number {
  return Math.max(1, ...plan.destinations.map((destination) => Number(destination.plannedDay) || 1));
}

export function albumUnlocked(plan: TravelPlanStory): boolean {
  return plan.destinations.length > 1 && travelPlanStatus(plan) === "completed";
}

export function canPublishTravelPlan(plan: TravelPlanStory): boolean {
  return albumUnlocked(plan) && Boolean(plan.coverImage?.trim());
}

function numericCoverPosition(plan: TravelPlanStory) {
  if (Number.isFinite(plan.coverPositionX) && Number.isFinite(plan.coverPositionY)) {
    return { x: Math.max(0, Math.min(100, Number(plan.coverPositionX))), y: Math.max(0, Math.min(100, Number(plan.coverPositionY))) };
  }
  const position = plan.coverPosition ?? "50% 50%";
  const x = position.includes("left") ? 0 : position.includes("right") ? 100 : Number(position.match(/(\d+(?:\.\d+)?)%/)?.[1] ?? 50);
  const y = position.includes("top") ? 0 : position.includes("bottom") ? 100 : Number(position.match(/\d+(?:\.\d+)?%\s+(\d+(?:\.\d+)?)%/)?.[1] ?? 50);
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

export function normalizeTravelPlan(plan: TravelPlanStory): TravelPlanStory {
  const cover = numericCoverPosition(plan);
  const destinations = plan.destinations
    .map((destination, index) => ({
      ...destination,
      id: destination.id || `destination-${Date.now()}-${index}`,
      order: index + 1,
      plannedDay: Math.max(1, Number(destination.plannedDay) || 1),
      status: destination.status || "planned",
    }))
    .sort((a, b) => a.order - b.order)
    .map((destination, index) => ({ ...destination, order: index + 1 }));

  return {
    ...plan,
    coverPosition: `${cover.x}% ${cover.y}%`,
    coverPositionX: cover.x,
    coverPositionY: cover.y,
    likesCount: Math.max(0, Number(plan.likesCount) || 0),
    savesCount: Math.max(0, Number(plan.savesCount) || 0),
    commentsCount: Math.max(0, Number(plan.commentsCount) || 0),
    destinations,
    visibility: canPublishTravelPlan({ ...plan, destinations }) ? plan.visibility : "private",
    published: canPublishTravelPlan({ ...plan, destinations }) ? Boolean(plan.published) : false,
  };
}

export function readTravelPlanStories(): TravelPlanStory[] {
  if (typeof window === "undefined") return [];
  try {
    const dbRows = window.localStorage.getItem("traveltraces.db.v1.travel_plan_stories");
    const parsed = JSON.parse(dbRows ?? window.localStorage.getItem(TRAVEL_PLAN_STORIES_KEY) ?? "[]") as TravelPlanStory[];
    return Array.isArray(parsed) ? parsed.map(normalizeTravelPlan) : [];
  } catch {
    return [];
  }
}

export function writeTravelPlanStories(plans: TravelPlanStory[]) {
  const normalized = plans.map(normalizeTravelPlan);
  window.localStorage.setItem(TRAVEL_PLAN_STORIES_KEY, JSON.stringify(normalized));
  window.localStorage.setItem("traveltraces.db.v1.travel_plan_stories", JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent("traveltraces:local-db-updated", { detail: { table: "travelPlanStories" } }));
  window.dispatchEvent(new CustomEvent("traveltraces:travel-plan-stories-updated"));
}

export function upsertTravelPlanStory(plan: TravelPlanStory): TravelPlanStory {
  const normalized = normalizeTravelPlan({ ...plan, updatedAt: new Date().toISOString() });
  const next = [normalized, ...readTravelPlanStories().filter((item) => item.id !== normalized.id)];
  writeTravelPlanStories(next);
  return normalized;
}

export function deleteTravelPlanStory(planId: string): void {
  writeTravelPlanStories(readTravelPlanStories().filter((plan) => plan.id !== planId));
}

export function createTravelPlanStory(input: TravelPlanDraftInput): TravelPlanStory {
  const now = new Date().toISOString();
  const plan: TravelPlanStory = {
    id: `travel-plan-${Date.now()}`,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    travelPlanName: input.travelPlanName.trim() || "Untitled Travel Plan",
    subtitle: input.subtitle?.trim() || undefined,
    coverImage: input.coverImage,
    coverPosition: input.coverPosition || `${input.coverPositionX ?? 50}% ${input.coverPositionY ?? 50}%`,
    coverPositionX: input.coverPositionX ?? 50,
    coverPositionY: input.coverPositionY ?? 50,
    description: input.description,
    likesCount: 0,
    savesCount: 0,
    commentsCount: 0,
    routeGeometry: input.routeGeometry,
    visibility: "private",
    published: false,
    createdAt: now,
    updatedAt: now,
    destinations: input.stops.map((stop, index) => ({
      id: `destination-${Date.now()}-${index}`,
      order: index + 1,
      placeName: stop.label || `Destination ${index + 1}`,
      coordinate: { lat: stop.coordinate[0], lon: stop.coordinate[1] },
      plannedDay: stop.plannedDay ?? 1,
      plannedDate: stop.plannedDate,
      plannedTime: stop.plannedTime,
      notes: stop.notes,
      category: stop.category,
      status: "planned",
    })),
  };
  return upsertTravelPlanStory(plan);
}
