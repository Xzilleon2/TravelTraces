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
  coverImage?: string;
  description?: string;
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
  coverImage?: string;
  description?: string;
  stops: Array<ApiLocation & { plannedDay?: number; plannedDate?: string; plannedTime?: string; notes?: string }>;
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
  return albumUnlocked(plan);
}

export function normalizeTravelPlan(plan: TravelPlanStory): TravelPlanStory {
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
    destinations,
    visibility: canPublishTravelPlan({ ...plan, destinations }) ? plan.visibility : "private",
    published: canPublishTravelPlan({ ...plan, destinations }) ? Boolean(plan.published) : false,
  };
}

export function readTravelPlanStories(): TravelPlanStory[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TRAVEL_PLAN_STORIES_KEY) ?? "[]") as TravelPlanStory[];
    return Array.isArray(parsed) ? parsed.map(normalizeTravelPlan) : [];
  } catch {
    return [];
  }
}

export function writeTravelPlanStories(plans: TravelPlanStory[]) {
  window.localStorage.setItem(TRAVEL_PLAN_STORIES_KEY, JSON.stringify(plans.map(normalizeTravelPlan)));
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
    coverImage: input.coverImage,
    description: input.description,
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
      status: "planned",
    })),
  };
  return upsertTravelPlanStory(plan);
}
