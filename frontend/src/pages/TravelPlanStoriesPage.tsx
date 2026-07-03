import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, BookOpen, CalendarDays, MapPin, Plus, Printer, Search, Trash2 } from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { GatedPage } from "../components/GatedPage";
import { useAuth } from "../context/AuthContext";
import {
  albumUnlocked,
  completedDestinationCount,
  deleteTravelPlanStory,
  readTravelPlanStories,
  totalTravelDays,
  travelPlanStatus,
  upsertTravelPlanStory,
  type TravelPlanDestination,
  type TravelPlanStory,
} from "../services/travelPlanStories";

const planCategories = ["All", "Hiking", "Food Place", "Hidden Gems", "Beaches", "Forest", "Culture", "More"];
const sampleTravelPlans: TravelPlanStory[] = [
  {
    id: "sample-siargao-book",
    ownerId: "sample-mika-santos",
    ownerName: "Mika Santos",
    travelPlanName: "Three Days Around Siargao",
    coverImage: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=760&fit=crop&auto=format",
    description:
      "A completed three-day Siargao route built for testing the TravelTraces Album Maker: early surf light at Cloud 9, a slow community sunset at Catangnan Bridge, and a blue-water lagoon day in Del Carmen. Each stop is documented as part of one continuous island journey instead of separate marker posts.",
    routeGeometry: [
      [9.8131, 126.1649],
      [9.812, 126.158],
      [9.8504, 126.1192],
      [9.9224, 126.0494],
    ],
    visibility: "public",
    published: true,
    createdAt: "2026-04-18T08:00:00.000Z",
    updatedAt: "2026-04-22T18:30:00.000Z",
    destinations: [
      {
        id: "sample-siargao-point-1",
        order: 1,
        placeName: "Cloud 9 Boardwalk",
        coordinate: { lat: 9.8131, lon: 126.1649 },
        plannedDay: 1,
        plannedDate: "2026-04-18",
        plannedTime: "06:00",
        notes: "Sunrise surf watching before General Luna gets busy.",
        status: "completed",
        visibility: "public",
        category: "Beaches",
        title: "Morning Swell at Cloud 9",
        description:
          "The journey opened before the island was fully awake. I arrived at Cloud 9 while the boardwalk lights were still soft and the horizon was only beginning to turn pale orange. A few surfers were already out beyond the reef, sitting quietly on their boards and waiting for the first clean sets to arrive. From the viewing deck, the waves looked organized and patient, curling over the shallow reef with that famous Siargao rhythm.\n\nThis stop became the emotional opening page of the album because it captured the reason people keep returning to the island: not only the surf, but the ceremony around it. Vendors were setting up coffee, locals were greeting each other by name, and travelers who had just arrived stood quietly beside people who had lived with this break for years. It felt like a good beginning because nothing needed to be rushed. The route started with watching, listening, and letting the island set the pace.",
        photos: [
          "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=1100&h=720&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1100&h=720&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1100&h=720&fit=crop&auto=format",
        ],
        dateVisited: "2026-04-18",
      },
      {
        id: "sample-siargao-point-2",
        order: 2,
        placeName: "Catangnan-Cabitoonan Bridge",
        coordinate: { lat: 9.8504, lon: 126.1192 },
        plannedDay: 1,
        plannedDate: "2026-04-18",
        plannedTime: "16:45",
        notes: "Moved from Day 2 to Day 1 after the weather cleared.",
        status: "completed",
        visibility: "public",
        category: "Culture",
        title: "Golden Hour at Catangnan Bridge",
        description:
          "Catangnan Bridge was originally planned for the second day, but the weather cleared so beautifully that I moved it into the first afternoon. That change made the route feel more natural. After the morning at Cloud 9, this stop gave the day a slower, more local rhythm: motorcycles passing in both directions, small groups leaning on the railings, and kids timing their jumps into the river below whenever the light hit the water just right.\n\nWhat made the bridge memorable was how ordinary and cinematic it felt at the same time. It was not a place that demanded attention through a big entrance or a ticket booth. It was simply a crossing point that had become a gathering place. The sunset turned the concrete warm, the river reflected the sky in broken strips, and the whole scene felt like the middle chapter of a travel book: quieter than the opening, but full of texture, movement, and people.",
        photos: [
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1100&h=720&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1100&h=720&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1100&h=720&fit=crop&auto=format",
        ],
        dateVisited: "2026-04-18",
      },
      {
        id: "sample-siargao-point-3",
        order: 3,
        placeName: "Sugba Lagoon",
        coordinate: { lat: 9.9224, lon: 126.0494 },
        plannedDay: 2,
        plannedDate: "2026-04-19",
        plannedTime: "10:30",
        notes: "Boat transfer from Del Carmen, best visited before lunch crowds.",
        status: "completed",
        visibility: "public",
        category: "Hidden Gems",
        title: "Blue Silence in Sugba Lagoon",
        description:
          "The last stop began with the boat transfer from Del Carmen, passing through stretches of mangroves that made the route feel protected from the louder parts of the island. Sugba Lagoon opened slowly, first as narrow channels of green water and then as a wider blue space surrounded by limestone, trees, and floating platforms. It was brighter than the first two stops, but also quieter in a deeper way. Even with other visitors nearby, the lagoon had a calm that made people lower their voices without being told.\n\nThis destination completed the travel plan because it gave the album its closing image: water changing color under the sun, kayaks moving between shadows, and everyone drifting into their own version of stillness. I added more photos here because the lagoon needs sequence to make sense. One frame shows the approach, another catches the open water, and another holds the small human details that make a scenic place feel remembered rather than simply visited.",
        photos: [
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1100&h=720&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1100&h=720&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1100&h=720&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1100&h=720&fit=crop&auto=format",
        ],
        dateVisited: "2026-04-19",
      },
    ],
  },
];

const todayDate = () => new Date().toISOString().slice(0, 10);

function destinationScheduleKey(destination: TravelPlanDestination, patch?: Partial<TravelPlanDestination>): string | null {
  const plannedDate = patch?.plannedDate ?? destination.plannedDate ?? destination.dateVisited;
  const plannedTime = patch?.plannedTime ?? destination.plannedTime;
  if (!plannedDate || !plannedTime) return null;
  return `${plannedDate}-${plannedTime}`;
}

function plannedDateTime(destination: TravelPlanDestination): Date | null {
  if (!destination.plannedDate || !destination.plannedTime) return null;
  const scheduled = new Date(`${destination.plannedDate}T${destination.plannedTime}:00`);
  return Number.isNaN(scheduled.getTime()) ? null : scheduled;
}

function canDocumentDestination(destination: TravelPlanDestination): boolean {
  if (destination.status !== "planned") return true;
  const scheduled = plannedDateTime(destination);
  return Boolean(scheduled && scheduled.getTime() <= Date.now());
}

function documentLockMessage(destination: TravelPlanDestination): string {
  const scheduled = plannedDateTime(destination);
  if (!scheduled) return "Add a planned date and time before this destination can be documented.";
  return `You can document this stop on ${scheduled.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} at ${scheduled.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}.`;
}

function meaningfulStopNote(note?: string): string | null {
  const value = note?.trim();
  if (!value) return null;
  const lower = value.toLowerCase();
  if (/^(asd|asdf|test|sample|dummy|lorem|ipsum)/.test(lower)) return null;
  if (/^[asd\s]+$/i.test(value) && value.length >= 6) return null;
  return value;
}

function scheduleSummary(destination: TravelPlanDestination): string {
  const parts = [`Day ${destination.plannedDay}`];
  if (destination.plannedDate) parts.push(new Date(`${destination.plannedDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }));
  if (destination.plannedTime) parts.push(destination.plannedTime);
  return parts.join(" / ");
}

function stopDisplayTitle(destination: TravelPlanDestination): string {
  const title = destination.title?.trim();
  return title || destination.placeName || `Destination ${destination.order}`;
}

function statusCopy(status: ReturnType<typeof travelPlanStatus>) {
  if (status === "planning") return "Planning";
  if (status === "ongoing") return "Ongoing";
  return "Completed";
}

function statusPillClass(status: ReturnType<typeof travelPlanStatus>) {
  if (status === "completed") return "border-[#5C8A9E]/30 bg-[#5C8A9E]/12 text-[#315568]";
  if (status === "ongoing") return "border-[#C4713A]/30 bg-[#C4713A]/12 text-[#8A4B26]";
  return "border-[#3A2A22]/15 bg-[#EFE7DC] text-[#3A2A22]";
}

function formatPlanCoordinates(coordinate: { lat: number; lon: number }): string {
  return `${coordinate.lat.toFixed(4)}, ${coordinate.lon.toFixed(4)}`;
}

function openTravelPlanRouteInMap(plan: TravelPlanStory, navigate: (path: string) => void) {
  const points = [...plan.destinations]
    .sort((a, b) => a.order - b.order)
    .filter((destination) => Number.isFinite(destination.coordinate.lat) && Number.isFinite(destination.coordinate.lon))
    .map((destination) => ({
      order: destination.order,
      title: destination.title ?? destination.placeName,
      place: destination.placeName,
      category: destination.category,
      coordinate: destination.coordinate,
      description: destination.description,
      date: destination.dateVisited ?? destination.plannedDate,
    }));

  if (!points.length) return;

  window.localStorage.setItem(
    "traveltraces.pendingTravelPlanRoute",
    JSON.stringify({
      planId: plan.id,
      title: plan.travelPlanName,
      ownerName: plan.ownerName,
      points,
    }),
  );
  navigate("/maps");
}

function PublicTravelPlanBook({ plan, onBack }: { plan: TravelPlanStory; onBack: () => void }) {
  const navigate = useNavigate();
  const destinations = [...plan.destinations].sort((a, b) => a.order - b.order);
  const pointCount = destinations.length;
  const travelDates = Array.from(new Set(destinations.map((destination) => destination.dateVisited).filter(Boolean)));

  if (!destinations.length) {
    return null;
  }

  const scrollToPoint = (pointId: string) => {
    document.getElementById(pointId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pointNav = (
    <div className="fixed right-4 top-1/2 z-[1000] flex -translate-y-1/2 flex-col gap-2 rounded-full border border-[#3A2A22]/12 bg-[#FBF7F0]/95 p-2 shadow-[0_14px_32px_rgba(58,42,34,0.14)] backdrop-blur">
      {destinations.map((destination) => (
        <button
          key={destination.id}
          type="button"
          onClick={() => scrollToPoint(`travel-plan-point-${destination.order}`)}
          className="grid h-9 w-9 place-items-center rounded-full border border-[#3A2A22]/14 bg-[#EFE7DC] font-[var(--font-label)] text-xs font-bold text-[#3A2A22] transition hover:bg-[#3A2A22] hover:text-[#F5F0E8]"
          aria-label={`Jump to point ${destination.order}`}
          title={`Point ${destination.order}`}
        >
          {destination.order}
        </button>
      ))}
    </div>
  );

  return (
    <div id="travel-plan-book-top" className="min-h-screen bg-[#FBF7F0] px-4 py-8 text-[#1A1A1A] sm:px-6 lg:px-8">
      <article className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#3A2A22]/18 px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#3A2A22]">
            <ArrowLeft size={15} /> Travel Plans
          </button>
          <button type="button" onClick={() => openTravelPlanRouteInMap(plan, navigate)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#3A2A22]/18 px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#3A2A22] transition hover:bg-[#EFE7DC]">
            <MapPin size={15} /> View Route in Map
          </button>
        </div>

        <header className="mx-auto mb-10 max-w-3xl">
          <p className="mb-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#9E6B5C]">Completed public travel plan</p>
          <h1 className="m-0 font-[var(--font-display)] text-5xl font-semibold leading-[0.98] text-[#1A1A1A] sm:text-7xl">{plan.travelPlanName}</h1>
          <p className="mt-6 font-[var(--font-body)] text-lg leading-8 text-[#4A4A3A]">{plan.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-[#3A2A22]/14 py-4 font-[var(--font-ui)] text-sm text-[#5B4A40]">
            <span>By {plan.ownerName}</span>
            <span className="inline-flex items-center gap-2"><BookOpen size={15} /> {pointCount} point{pointCount === 1 ? "" : "s"}</span>
            <span className="inline-flex items-center gap-2"><CalendarDays size={15} /> {travelDates.length || totalTravelDays(plan)} travel date{(travelDates.length || totalTravelDays(plan)) === 1 ? "" : "s"}</span>
          </div>
        </header>

        <section className="mx-auto grid max-w-3xl gap-16">
          {destinations.map((destination) => (
            <article key={destination.id} id={`travel-plan-point-${destination.order}`} className="scroll-mt-28 border-t border-[#3A2A22]/14 pt-10">
              <div className="mb-6">
                <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#9E6B5C]">Point {destination.order} of {pointCount}</p>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
                  <h2 className="m-0 min-w-0 flex-1 font-[var(--font-display)] text-4xl font-semibold leading-tight text-[#3A2A22] sm:text-5xl">{destination.title}</h2>
                  <span className="mt-1 shrink-0 rounded-full border border-[#3A2A22]/16 px-4 py-2 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#3A2A22]">
                    Day {destination.plannedDay}
                  </span>
                </div>
              </div>

              <div className="mb-7 flex flex-wrap gap-3 border-y border-[#3A2A22]/12 py-4 text-sm text-[#5B4A40]">
                <span className="inline-flex items-center gap-2"><MapPin size={14} /> {destination.placeName}</span>
                <span>{formatPlanCoordinates(destination.coordinate)}</span>
                <span>{destination.category}</span>
                <span>{destination.dateVisited}</span>
                {destination.plannedTime ? <span>{destination.plannedTime}</span> : null}
              </div>

              {destination.photos?.[0] ? (
                <img src={destination.photos[0]} alt="" className="mb-7 h-[clamp(240px,42vw,440px)] w-full rounded-lg object-cover" />
              ) : null}

              <p className="font-[var(--font-body)] text-lg leading-9 text-[#1A1A1A]">{destination.description}</p>

              {destination.notes ? (
                <div className="mt-8 rounded-lg border border-[#C4713A]/20 bg-[#EFE7DC] p-5">
                  <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[#9E6B5C]">Route note</p>
                  <p className="m-0 mt-2 text-sm leading-6 text-[#5B4A40]">{destination.notes}</p>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </article>

      {typeof document !== "undefined" ? createPortal(pointNav, document.body) : null}

    </div>
  );
}

function TravelPlanDetail({ plan, onBack, onUpdate, onDelete }: { plan: TravelPlanStory; onBack: () => void; onUpdate: (plan: TravelPlanStory) => void; onDelete: (planId: string) => void }) {
  const navigate = useNavigate();
  const [deleteRequest, setDeleteRequest] = useState<{ kind: "plan" | "destination"; id: string; label: string } | null>(null);
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const [draggedDestinationId, setDraggedDestinationId] = useState<string | null>(null);

  const total = plan.destinations.length;
  const sortedDestinations = [...plan.destinations].sort((a, b) => a.order - b.order);
  const travelDates = Array.from(new Set(plan.destinations.map((destination) => destination.dateVisited ?? destination.plannedDate).filter(Boolean)));

  const scrollToPoint = (pointId: string) => {
    document.getElementById(pointId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pointNav = total ? (
    <div className="fixed right-4 top-1/2 z-[1000] flex -translate-y-1/2 flex-col gap-2 rounded-full border border-[#3A2A22]/12 bg-[#FBF7F0]/95 p-2 shadow-[0_14px_32px_rgba(58,42,34,0.14)] backdrop-blur">
      {sortedDestinations.map((destination) => (
        <button
          key={destination.id}
          type="button"
          onClick={() => scrollToPoint(`travel-plan-point-${destination.order}`)}
          className="grid h-9 w-9 place-items-center rounded-full border border-[#3A2A22]/14 bg-[#EFE7DC] font-[var(--font-label)] text-xs font-bold text-[#3A2A22] transition hover:bg-[#3A2A22] hover:text-[#F5F0E8]"
          aria-label={`Jump to point ${destination.order}`}
          title={`Point ${destination.order}`}
        >
          {destination.order}
        </button>
      ))}
    </div>
  ) : null;

  const commitPlan = (next: TravelPlanStory) => {
    const saved = upsertTravelPlanStory(next);
    onUpdate(saved);
  };

  const updateDestination = (destinationId: string, patch: Partial<TravelPlanDestination>) => {
    const currentDestination = plan.destinations.find((destination) => destination.id === destinationId);
    if (!currentDestination) return;
    const normalizedPatch = { ...patch };
    if (normalizedPatch.plannedDate && normalizedPatch.plannedDate < todayDate()) {
      normalizedPatch.plannedDate = todayDate();
      setPlanNotice("Travel Plan dates must be today or a future date.");
    }
    const nextKey = destinationScheduleKey(currentDestination, normalizedPatch);
    if (nextKey) {
      const duplicate = plan.destinations.some((destination) => destination.id !== destinationId && destinationScheduleKey(destination) === nextKey);
      if (duplicate) {
        setPlanNotice("Two destinations cannot share the same planned date and time.");
        return;
      }
    }
    if (normalizedPatch.plannedDate || normalizedPatch.plannedTime) setPlanNotice(null);
    commitPlan({
      ...plan,
      destinations: plan.destinations.map((destination) => (destination.id === destinationId ? { ...destination, ...normalizedPatch } : destination)),
    });
  };

  const reorderDestination = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sorted = [...plan.destinations].sort((a, b) => a.order - b.order);
    const sourceIndex = sorted.findIndex((destination) => destination.id === sourceId);
    const targetIndex = sorted.findIndex((destination) => destination.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [item] = sorted.splice(sourceIndex, 1);
    if (!item) return;
    sorted.splice(targetIndex, 0, item);
    commitPlan({ ...plan, destinations: sorted.map((destination, nextIndex) => ({ ...destination, order: nextIndex + 1 })) });
  };

  const deleteDestination = (destinationId: string) => {
    const nextDestinations = plan.destinations.filter((destination) => destination.id !== destinationId);
    commitPlan({ ...plan, destinations: nextDestinations.map((destination, index) => ({ ...destination, order: index + 1 })) });
  };

  const addDestination = () => {
    const nextOrder = plan.destinations.length + 1;
    commitPlan({
      ...plan,
      destinations: [
        ...plan.destinations,
        {
          id: `destination-${Date.now()}`,
          order: nextOrder,
          placeName: `Destination ${nextOrder}`,
          coordinate: { lat: 0, lon: 0 },
          plannedDay: totalTravelDays(plan),
          plannedDate: new Date().toISOString().slice(0, 10),
          status: "planned",
          notes: "",
        },
      ],
    });
  };

  const ensureDocumentable = (destination: TravelPlanDestination): boolean => {
    if (!canDocumentDestination(destination)) {
      setPlanNotice(documentLockMessage(destination));
      return false;
    }
    setPlanNotice(null);
    return true;
  };

  const documentDestination = (destination: TravelPlanDestination, patch: Partial<TravelPlanDestination>) => {
    const nextDescription = patch.description ?? destination.description;
    const nextPhotos = patch.photos ?? destination.photos;
    const hasMinimumStory = Boolean(nextDescription?.trim() && nextPhotos?.length);
    updateDestination(destination.id, {
      visibility: destination.visibility ?? "private",
      category: destination.category ?? "Hidden Gems",
      title: destination.title ?? destination.placeName,
      dateVisited: destination.dateVisited ?? todayDate(),
      ...patch,
      status: hasMinimumStory ? "completed" : destination.status,
    });
  };

  const addPointPhotos = (destination: TravelPlanDestination) => {
    if (!ensureDocumentable(destination)) return;
    const current = destination.photos?.join("\n") ?? "";
    const value = window.prompt("Add photo URLs, separated by comma or line break.", current);
    if (value === null) return;
    documentDestination(destination, {
      photos: value
        .split(/\n|,/)
        .map((photo) => photo.trim())
        .filter(Boolean),
    });
  };

  const confirmDelete = () => {
    if (!deleteRequest) return;
    if (deleteRequest.kind === "plan") {
      onDelete(deleteRequest.id);
      return;
    }
    deleteDestination(deleteRequest.id);
    setDeleteRequest(null);
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] px-4 py-8 text-[#1A1A1A] sm:px-6 lg:px-8">
      <article className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#3A2A22]/18 px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#3A2A22]">
            <ArrowLeft size={15} /> Travel Plans
          </button>
          <div className="flex flex-wrap justify-end gap-2">
            {albumUnlocked(plan) ? (
              <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#3A2A22] px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#FFF9F0] shadow-[0_12px_28px_rgba(58,42,34,0.16)] transition hover:bg-[#2C211C]">
                <Printer size={15} /> Print Album
              </button>
            ) : null}
            <button type="button" onClick={() => openTravelPlanRouteInMap(plan, navigate)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#3A2A22]/18 px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#3A2A22] transition hover:bg-[#EFE7DC]">
              <MapPin size={15} /> View Route in Map
            </button>
            <button type="button" onClick={addDestination} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#3A2A22]/18 px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#3A2A22] transition hover:bg-[#EFE7DC]">
              <Plus size={14} /> Add Destination
            </button>
            <button type="button" onClick={() => setDeleteRequest({ kind: "plan", id: plan.id, label: plan.travelPlanName })} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#B23B2E]/30 bg-[#B23B2E]/10 px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#8A2F25]">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {planNotice ? <div className="mx-auto mb-6 max-w-3xl rounded-lg border border-[#B23B2E]/25 bg-[#B23B2E]/10 p-4 text-sm font-semibold text-[#8A2F25]">{planNotice}</div> : null}

        <header className="mx-auto mb-10 max-w-3xl">
          <p className="mb-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#9E6B5C]">Itinerary Story</p>
          <h1 className="m-0 font-[var(--font-display)] text-5xl font-semibold leading-[0.98] text-[#1A1A1A] sm:text-7xl">{plan.travelPlanName}</h1>
          {plan.description ? <p className="mt-6 font-[var(--font-body)] text-lg leading-8 text-[#4A4A3A]">{plan.description}</p> : null}
          <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-[#3A2A22]/14 py-4 font-[var(--font-ui)] text-sm text-[#5B4A40]">
            <span>By {plan.ownerName}</span>
            <span className="inline-flex items-center gap-2"><BookOpen size={15} /> {total} point{total === 1 ? "" : "s"}</span>
            <span className="inline-flex items-center gap-2"><CalendarDays size={15} /> {travelDates.length || totalTravelDays(plan)} travel date{(travelDates.length || totalTravelDays(plan)) === 1 ? "" : "s"}</span>
          </div>
        </header>

        {total <= 1 ? (
          <div className="mb-8 rounded-xl border border-[#C4713A]/25 bg-[#C4713A]/10 p-4 text-sm leading-6 text-[#5B4A40]">
            Only one destination remains, so this is treated like a Drop Marker. Album Maker is disabled until this has multiple completed destinations.
          </div>
        ) : null}

        <section className="mx-auto grid max-w-3xl gap-12">
          <div className="grid gap-12">
                  {sortedDestinations.map((destination) => {
                    const isPlanned = destination.status === "planned";
                    const documentReady = canDocumentDestination(destination);
                    const note = meaningfulStopNote(destination.notes);
                    const title = stopDisplayTitle(destination);

                    if (!isPlanned) {
                      return (
                        <article
                          key={destination.id}
                          id={`travel-plan-point-${destination.order}`}
                          draggable
                          onDragStart={() => setDraggedDestinationId(destination.id)}
                          onDragEnd={() => setDraggedDestinationId(null)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (draggedDestinationId) reorderDestination(draggedDestinationId, destination.id);
                            setDraggedDestinationId(null);
                          }}
                          className={`scroll-mt-28 border-t border-[#3A2A22]/14 pt-10 transition ${draggedDestinationId === destination.id ? "opacity-50" : "cursor-grab active:cursor-grabbing"}`}
                        >
                          <div className="mb-6">
                            <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#9E6B5C]">Point {destination.order} of {total}</p>
                            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
                              <h2 className="m-0 min-w-0 flex-1 font-[var(--font-display)] text-4xl font-semibold leading-tight text-[#3A2A22] sm:text-5xl">{title}</h2>
                              <span className="mt-1 shrink-0 rounded-full border border-[#3A2A22]/16 px-4 py-2 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#3A2A22]">Day {destination.plannedDay}</span>
                            </div>
                          </div>

                          <div className="mb-7 flex flex-wrap gap-3 border-y border-[#3A2A22]/12 py-4 text-sm text-[#5B4A40]">
                            <span className="inline-flex items-center gap-2"><MapPin size={14} /> {destination.placeName}</span>
                            <span>{formatPlanCoordinates(destination.coordinate)}</span>
                            {destination.category ? <span>{destination.category}</span> : null}
                            {destination.dateVisited ? <span>{destination.dateVisited}</span> : null}
                            {destination.plannedTime ? <span>{destination.plannedTime}</span> : null}
                          </div>

                          {destination.photos?.[0] ? <img src={destination.photos[0]} alt="" className="mb-7 h-[clamp(240px,42vw,440px)] w-full rounded-lg object-cover" /> : null}
                          {destination.photos && destination.photos.length > 1 ? (
                            <div className="mb-7 grid grid-cols-3 gap-2">
                              {destination.photos.slice(1, 4).map((photo) => <img key={photo} src={photo} alt="" className="h-28 w-full rounded-lg object-cover" />)}
                            </div>
                          ) : null}

                          <div className="space-y-5 font-[var(--font-body)] text-lg leading-9 text-[#1A1A1A]">
                            {(destination.description ?? "").split("\n\n").filter(Boolean).map((paragraph) => <p key={paragraph} className="m-0">{paragraph}</p>)}
                          </div>

                          {note ? (
                            <div className="mt-8 rounded-lg border border-[#C4713A]/20 bg-[#EFE7DC] p-5">
                              <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[#9E6B5C]">Route note</p>
                              <p className="m-0 mt-2 text-sm leading-6 text-[#5B4A40]">{note}</p>
                            </div>
                          ) : null}

                        </article>
                      );
                    }

                    return (
                      <article
                        key={destination.id}
                        id={`travel-plan-point-${destination.order}`}
                        draggable
                        onDragStart={() => setDraggedDestinationId(destination.id)}
                        onDragEnd={() => setDraggedDestinationId(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (draggedDestinationId) reorderDestination(draggedDestinationId, destination.id);
                          setDraggedDestinationId(null);
                        }}
                        className={`scroll-mt-28 border-t border-[#3A2A22]/14 pt-10 transition ${draggedDestinationId === destination.id ? "opacity-50" : "cursor-grab active:cursor-grabbing"}`}
                      >
                        <div className="mb-6">
                          <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#9E6B5C]">Point {destination.order} of {total}</p>
                          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
                            <h2 className="m-0 min-w-0 flex-1 font-[var(--font-display)] text-4xl font-semibold leading-tight text-[#3A2A22] sm:text-5xl">{title}</h2>
                            <span className="mt-1 shrink-0 rounded-full border border-[#3A2A22]/16 px-4 py-2 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#3A2A22]">Day {destination.plannedDay}</span>
                          </div>
                        </div>
                        <div className="mb-7 flex flex-wrap gap-3 border-y border-[#3A2A22]/12 py-4 text-sm text-[#5B4A40]">
                          <span className="inline-flex items-center gap-2"><MapPin size={14} /> {destination.placeName}</span>
                          <span>{formatPlanCoordinates(destination.coordinate)}</span>
                          <span>{destination.category ?? "Category pending"}</span>
                          {destination.plannedDate ? <span>{destination.plannedDate}</span> : null}
                          {destination.plannedTime ? <span>{destination.plannedTime}</span> : null}
                        </div>

                        {destination.photos?.[0] ? (
                          <img src={destination.photos[0]} alt="" className="mb-7 h-[clamp(240px,42vw,440px)] w-full rounded-lg object-cover" />
                        ) : (
                          <button type="button" onClick={() => addPointPhotos(destination)} className="mb-7 grid h-[clamp(240px,42vw,440px)] w-full place-items-center rounded-lg border border-dashed border-[#3A2A22]/20 bg-[#EFE7DC] font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#7A4B32]">
                            Add photo here
                          </button>
                        )}

                        {documentReady ? (
                          <textarea
                            defaultValue={destination.description ?? ""}
                            onBlur={(event) => documentDestination(destination, { description: event.target.value })}
                            rows={5}
                            className="w-full resize-none rounded-lg border border-dashed border-[#3A2A22]/20 bg-transparent px-0 py-2 font-[var(--font-body)] text-lg leading-9 text-[#1A1A1A] outline-none placeholder:uppercase placeholder:tracking-[0.08em] placeholder:text-[#7A685E] focus:border-[#C4713A]/45 focus:bg-[#FFF9F0]/60 focus:px-3"
                            placeholder="TYPE HERE"
                          />
                        ) : (
                          <button type="button" onClick={() => ensureDocumentable(destination)} className="block w-full rounded-lg border border-dashed border-[#3A2A22]/20 bg-[#EFE7DC]/70 px-4 py-7 text-left font-[var(--font-body)] text-lg leading-8 text-[#7A685E]">
                            TYPE HERE
                          </button>
                        )}

                        {note ? (
                          <div className="mt-8 rounded-lg border border-[#C4713A]/20 bg-[#EFE7DC] p-5">
                            <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[#9E6B5C]">Route note</p>
                            <p className="m-0 mt-2 text-sm leading-6 text-[#5B4A40]">{note}</p>
                          </div>
                        ) : null}

                      </article>
                    );
                  })}
          </div>
        </section>

        <ConfirmDialog
          open={Boolean(deleteRequest)}
          title={`Delete ${deleteRequest?.label ?? "this item"}?`}
          description={`Are you sure you want to delete "${deleteRequest?.label ?? "this item"}"? This action updates your Travel Plan immediately.`}
          confirmLabel={deleteRequest?.kind === "plan" ? "Delete Travel Plan" : "Delete Stop"}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteRequest(null)}
        />
      </article>
      {typeof document !== "undefined" && pointNav ? createPortal(pointNav, document.body) : null}
    </div>
  );
}

function TravelPlanStoriesContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<TravelPlanStory[]>(() => readTravelPlanStories());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activePlanId, setActivePlanId] = useState<string | null>(() => new URLSearchParams(location.search).get("plan"));

  useEffect(() => {
    setPlans(readTravelPlanStories());
    const requestedPlan = new URLSearchParams(location.search).get("plan");
    if (requestedPlan) setActivePlanId(requestedPlan);
  }, [location.search]);

  useEffect(() => {
    const refresh = () => setPlans(readTravelPlanStories());
    window.addEventListener("traveltraces:travel-plan-stories-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("traveltraces:travel-plan-stories-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const displayPlans = useMemo(() => {
    const savedIds = new Set(plans.map((plan) => plan.id));
    return [...plans, ...sampleTravelPlans.filter((plan) => !savedIds.has(plan.id))];
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();
    return displayPlans.filter((plan) => {
      const searchable = [plan.travelPlanName, plan.ownerName, plan.description ?? "", ...plan.destinations.map((destination) => destination.placeName)].join(" ").toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesCategory = category === "All" || plan.destinations.some((destination) => destination.category === category);
      return matchesSearch && matchesCategory;
    });
  }, [category, displayPlans, search]);

  const activePlan = activePlanId ? displayPlans.find((plan) => plan.id === activePlanId) ?? null : null;
  const activePlanIsSample = activePlan ? sampleTravelPlans.some((plan) => plan.id === activePlan.id) : false;

  const removeTravelPlan = (planId: string) => {
    deleteTravelPlanStory(planId);
    setPlans((current) => current.filter((plan) => plan.id !== planId));
    setActivePlanId(null);
  };

  if (activePlan) {
    const activePlanBelongsToCurrentUser = activePlan.ownerId === (user?.id ?? "demo-user") || activePlan.ownerId === "demo-user";
    if (activePlanIsSample && !activePlanBelongsToCurrentUser) {
      return <PublicTravelPlanBook plan={activePlan} onBack={() => setActivePlanId(null)} />;
    }

    return (
      <TravelPlanDetail
        plan={activePlan}
        onBack={() => setActivePlanId(null)}
        onUpdate={(nextPlan) => {
          setPlans((current) => [nextPlan, ...current.filter((plan) => plan.id !== nextPlan.id)]);
          setActivePlanId(nextPlan.id);
        }}
        onDelete={removeTravelPlan}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] px-4 py-12 text-[#1A1A1A] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="mb-2 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#9E6B5C]">Personal itinerary shelf</p>
          <h1 className="m-0 font-[var(--font-display)] text-5xl font-semibold leading-none text-[#3A2A22] sm:text-6xl">Travel Plans</h1>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <p className="m-0 max-w-3xl font-[var(--font-body)] text-lg leading-8 text-[#5B4A40]">
              Multi-destination journeys created from Draw Route. Plan the order, document each visited stop, then unlock Album Maker when the full route is complete.
            </p>
            <button type="button" onClick={() => navigate("/maps")} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-[#C4713A] px-5 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#F5F0E8]">
              <MapPin size={15} /> Create with Draw Route
            </button>
          </div>
        </header>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#6B5A50" }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search plans, places, owners..."
              style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", backgroundColor: "#EFE7DC", border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.25rem", fontSize: "0.9rem", color: "#2C211C", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {planCategories.map((item) => {
              const isActive = category === item;
              const isAll = item === "All";
              return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className="category-pill"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  minHeight: 44,
                  borderRadius: 999,
                  border: "1px solid",
                  borderColor: isActive ? "#3A2A22" : "rgba(58,42,34,0.2)",
                  backgroundColor: isActive ? "#3A2A22" : "transparent",
                  color: isActive ? "#F5F0E8" : "#3A2A22",
                  padding: isAll ? "8px 24px" : "8px 16px",
                  fontFamily: "var(--font-ui)",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 600,
                  cursor: "pointer",
                  transition: "background-color 0.2s, border-color 0.2s, color 0.2s",
                  whiteSpace: "nowrap",
                }}
                aria-pressed={isActive}
              >
                <span>{item}</span>
              </button>
              );
            })}
          </div>
        </div>

        {filteredPlans.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => {
              const status = travelPlanStatus(plan);
              const completed = completedDestinationCount(plan);
              const total = plan.destinations.length;
              const cover = plan.coverImage || plan.destinations.find((destination) => destination.photos?.[0])?.photos?.[0];
              return (
                <article key={plan.id} onClick={() => setActivePlanId(plan.id)} className="overflow-hidden rounded-lg border border-[#3A2A22]/12 bg-[#EDEAE0] shadow-[0_14px_34px_rgba(58,42,34,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(58,42,34,0.12)]">
                  {cover ? <img src={cover} alt="" className="h-48 w-full object-cover" /> : <div className="grid h-48 place-items-center bg-gradient-to-br from-[#EFE7DC] to-[#D8D4C8]"><BookOpen size={32} className="text-[#9E6B5C]" /></div>}
                  <div className="p-5">
                    <span className={`inline-flex rounded-full border px-3 py-1 font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.08em] ${statusPillClass(status)}`}>{statusCopy(status)}</span>
                    <h2 className="mb-2 mt-3 font-[var(--font-display)] text-2xl font-semibold leading-tight text-[#3A2A22]">{plan.travelPlanName}</h2>
                    <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#9E6B5C]">By {plan.ownerName}</p>
                    <p className="min-h-12 text-sm leading-6 text-[#5B4A40]">{plan.description || `${total} ordered destinations saved as one route plan.`}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-[#FBF7F0] p-3"><p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#6B6B5A]">Stops</p><strong className="font-[var(--font-display)] text-2xl text-[#3A2A22]">{total}</strong></div>
                      <div className="rounded-lg bg-[#FBF7F0] p-3"><p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#6B6B5A]">Days</p><strong className="font-[var(--font-display)] text-2xl text-[#3A2A22]">{totalTravelDays(plan)}</strong></div>
                      <div className="rounded-lg bg-[#FBF7F0] p-3"><p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#6B6B5A]">Done</p><strong className="font-[var(--font-display)] text-2xl text-[#3A2A22]">{completed}/{total}</strong></div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 text-xs font-semibold text-[#6B6B5A]">{albumUnlocked(plan) ? "Album Maker unlocked" : "Private until every destination is completed"}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#3A2A22]/24 bg-[#EDEAE0] p-8 text-center">
            <BookOpen className="mx-auto mb-3 text-[#9E6B5C]" size={34} />
            <h2 className="m-0 font-[var(--font-display)] text-3xl font-semibold text-[#3A2A22]">No travel plans yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#5B4A40]">Open Maps, use Draw Route, place your destination points in order, then save them as one itinerary story.</p>
          </div>
        )}
      </div>
      <style>{`
        .category-pill:hover { background-color: rgba(58,42,34,0.08); border-color: #3A2A22; color: #3A2A22; }
        .category-pill[aria-pressed="true"]:hover { background-color: #3A2A22; border-color: #3A2A22; color: #F5F0E8; }
      `}</style>
    </div>
  );
}

export default function TravelPlanStoriesPage() {
  return (
    <GatedPage featureName="Travel Plan Stories">
      <TravelPlanStoriesContent />
    </GatedPage>
  );
}
