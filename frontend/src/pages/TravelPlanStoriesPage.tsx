import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router";
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, CalendarDays, CheckCircle2, FileText, LockKeyhole, MapPin, Plus, Search, Share2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { GatedPage } from "../components/GatedPage";
import type { MapScope } from "../services/mappingApi";
import {
  albumUnlocked,
  canPublishTravelPlan,
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
const albumTemplates = ["Field Journal", "Island Lookbook", "Route Chronicle"];
const sampleTravelPlans: TravelPlanStory[] = [
  {
    id: "sample-siargao-book",
    ownerId: "sample-mika-santos",
    ownerName: "Mika Santos",
    travelPlanName: "Three Days Around Siargao",
    coverImage: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=760&fit=crop&auto=format",
    description: "A completed island route from Cloud 9 to Sugba Lagoon, documented as a printable travel book by another TravelTraces explorer.",
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
          "The first stop started before sunrise. The boardwalk was quiet, the water was silver, and the surfers were already reading the waves like pages. This became the emotional opening of the route.",
        photos: ["https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=1100&h=720&fit=crop&auto=format"],
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
          "Point two became the route's pause. Local riders crossed slowly, kids jumped into the river below, and the sunset made the concrete bridge feel softer than expected.",
        photos: ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1100&h=720&fit=crop&auto=format"],
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
          "The final point was slower and brighter. Kayaks moved between mangroves, the water shifted from jade to blue, and the whole itinerary finally felt complete enough to become an album.",
        photos: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1100&h=720&fit=crop&auto=format"],
        dateVisited: "2026-04-19",
      },
    ],
  },
];

type VisitFormState = {
  visibility: MapScope;
  placeName: string;
  category: string;
  title: string;
  description: string;
  photos: string;
  dateVisited: string;
};

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

function showSeparateAddress(destination: TravelPlanDestination): boolean {
  const title = destination.title?.trim().toLowerCase();
  const place = destination.placeName.trim().toLowerCase();
  return Boolean(title && title !== place);
}

function ActionIconButton({
  label,
  children,
  onClick,
  tone = "neutral",
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  tone?: "neutral" | "primary" | "danger" | "locked";
  disabled?: boolean;
}) {
  const toneClass = {
    neutral: "border-[#3A2A22]/16 bg-[#FBF7F0] text-[#3A2A22] hover:border-[#3A2A22]/30 hover:bg-[#EFE7DC]",
    primary: "border-[#3A2A22] bg-[#3A2A22] text-[#FFF9F0] hover:bg-[#2C211C]",
    danger: "border-[#B23B2E]/25 bg-[#FBF7F0] text-[#8A2F25] hover:border-[#B23B2E]/45 hover:bg-[#B23B2E]/10",
    locked: "border-[#3A2A22]/10 bg-[#DDD4C8] text-[#6B5A50]",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-[#C4713A]/35 disabled:cursor-not-allowed ${toneClass}`}
    >
      {children}
    </button>
  );
}

function destinationToVisitForm(destination: TravelPlanDestination): VisitFormState {
  return {
    visibility: destination.visibility ?? "private",
    placeName: destination.placeName,
    category: destination.category ?? "Hidden Gems",
    title: destination.title ?? destination.placeName,
    description: destination.description ?? "",
    photos: destination.photos?.join("\n") ?? "",
    dateVisited: destination.dateVisited ?? todayDate(),
  };
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

function PublicTravelPlanBook({ plan, onBack }: { plan: TravelPlanStory; onBack: () => void }) {
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
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#9E6B5C]">Point {destination.order} of {pointCount}</p>
                  <h2 className="m-0 mt-2 font-[var(--font-display)] text-4xl font-semibold leading-tight text-[#3A2A22] sm:text-5xl">{destination.title}</h2>
                </div>
                <span className="rounded-full border border-[#3A2A22]/16 px-4 py-2 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#3A2A22]">
                  Day {destination.plannedDay}
                </span>
              </div>

              <div className="mb-7 flex flex-wrap gap-3 border-y border-[#3A2A22]/12 py-4 text-sm text-[#5B4A40]">
                <span className="inline-flex items-center gap-2"><MapPin size={14} /> {destination.placeName}</span>
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
  const [editingDestinationId, setEditingDestinationId] = useState<string | null>(null);
  const [visitDestinationId, setVisitDestinationId] = useState<string | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<{ kind: "plan" | "destination"; id: string; label: string } | null>(null);
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const [albumTemplate, setAlbumTemplate] = useState(albumTemplates[0]);
  const [visitForm, setVisitForm] = useState<VisitFormState>(() =>
    destinationToVisitForm(
      plan.destinations[0] ?? {
        id: "draft",
        order: 1,
        placeName: "Destination",
        coordinate: { lat: 0, lon: 0 },
        plannedDay: 1,
        status: "planned",
      },
    ),
  );

  const status = travelPlanStatus(plan);
  const completed = completedDestinationCount(plan);
  const total = plan.destinations.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const coverImage = plan.coverImage || plan.destinations.find((destination) => destination.photos?.[0])?.photos?.[0];
  const groupedDays = Array.from(new Set(plan.destinations.map((destination) => destination.plannedDay))).sort((a, b) => a - b);

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

  const moveDestination = (destinationId: string, direction: -1 | 1) => {
    const sorted = [...plan.destinations].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((destination) => destination.id === destinationId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    const [item] = sorted.splice(index, 1);
    if (!item) return;
    sorted.splice(target, 0, item);
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

  const startVisit = (destination: TravelPlanDestination) => {
    if (!canDocumentDestination(destination)) {
      setPlanNotice(documentLockMessage(destination));
      return;
    }
    setPlanNotice(null);
    setVisitDestinationId(destination.id);
    setVisitForm(destinationToVisitForm(destination));
  };

  const saveVisit = () => {
    if (!visitDestinationId || !visitForm.placeName.trim() || !visitForm.title.trim() || !visitForm.description.trim()) return;
    const destination = plan.destinations.find((item) => item.id === visitDestinationId);
    if (destination && !canDocumentDestination(destination)) {
      setPlanNotice(documentLockMessage(destination));
      return;
    }
    updateDestination(visitDestinationId, {
      placeName: visitForm.placeName.trim(),
      visibility: visitForm.visibility,
      category: visitForm.category,
      title: visitForm.title.trim(),
      description: visitForm.description.trim(),
      photos: visitForm.photos
        .split(/\n|,/)
        .map((photo) => photo.trim())
        .filter(Boolean),
      dateVisited: visitForm.dateVisited,
      status: "completed",
    });
    setVisitDestinationId(null);
  };

  const togglePublish = () => {
    if (!canPublishTravelPlan(plan)) return;
    commitPlan({ ...plan, published: !plan.published, visibility: plan.published ? "private" : "public" });
  };

  const viewDestinationOnMap = (destination: TravelPlanDestination) => {
    if (!destination.coordinate.lat && !destination.coordinate.lon) return;
    window.localStorage.setItem(
      "traveltraces.pendingStoryViewPin",
      JSON.stringify({
        title: destination.title ?? destination.placeName,
        place: destination.placeName,
        coordinate: destination.coordinate,
      }),
    );
    navigate("/maps");
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
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex min-h-10 items-center rounded-full border px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] ${statusPillClass(status)}`}>{statusCopy(status)}</span>
            <button type="button" disabled={!canPublishTravelPlan(plan)} onClick={togglePublish} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#3A2A22]/18 px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#3A2A22] disabled:opacity-55">
              {canPublishTravelPlan(plan) ? <Share2 size={14} /> : <LockKeyhole size={14} />}
              {plan.published ? "Unpublish" : "Publish"}
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
            <span className="inline-flex items-center gap-2"><BookOpen size={15} /> {total} destination{total === 1 ? "" : "s"}</span>
            <span className="inline-flex items-center gap-2"><CalendarDays size={15} /> {totalTravelDays(plan)} travel day{totalTravelDays(plan) === 1 ? "" : "s"}</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} /> {completed}/{total} completed</span>
            <span>{plan.published ? "Public after completion" : "Private itinerary"}</span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#EFE7DC]">
            <div className="h-full rounded-full bg-[#C4713A]" style={{ width: `${progress}%` }} />
          </div>
        </header>

        {coverImage ? (
          <figure className="mb-12 overflow-hidden rounded-lg">
            <img src={coverImage} alt="" className="h-[clamp(260px,48vw,560px)] w-full object-cover" />
          </figure>
        ) : (
          <div className="mb-12 grid min-h-[260px] place-items-center rounded-lg border border-[#3A2A22]/12 bg-[#EFE7DC] text-center">
            <div>
              <FileText className="mx-auto mb-3 text-[#9E6B5C]" size={30} />
              <p className="m-0 font-[var(--font-display)] text-2xl text-[#3A2A22]">The cover builds from your completed destination photos.</p>
            </div>
          </div>
        )}

        {total <= 1 ? (
          <div className="mb-8 rounded-xl border border-[#C4713A]/25 bg-[#C4713A]/10 p-4 text-sm leading-6 text-[#5B4A40]">
            Only one destination remains, so this is treated like a Drop Marker. Album Maker is disabled until this has multiple completed destinations.
          </div>
        ) : null}

        <section className="mx-auto max-w-4xl">
          <div className="mb-5 rounded-2xl border border-[#3A2A22]/12 bg-[#FFF9F0] p-5 shadow-[0_18px_44px_rgba(58,42,34,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="m-0 font-[var(--font-label)] text-[0.72rem] font-bold tracking-[0.08em] text-[#8A4B26]">Plan before travel</p>
                <h2 className="m-0 mt-1 font-[var(--font-display)] text-3xl font-semibold text-[#2C211C]">Ordered Itinerary</h2>
              </div>
              <button type="button" onClick={addDestination} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#3A2A22] px-5 text-sm font-bold text-[#FFF9F0] transition hover:bg-[#2C211C]">
                <Plus size={16} strokeWidth={2.2} /> Add Destination
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="m-0 text-sm font-semibold text-[#2C211C]">{completed} of {total} destinations documented</p>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#E5D9C9]" aria-label={`${progress}% itinerary completion`}>
                  <div className="h-full rounded-full bg-[#C4713A] transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <span className="rounded-full border border-[#3A2A22]/14 bg-[#F5F0E8] px-4 py-2 text-sm font-semibold text-[#4D4038]">
                Album progress {completed}/{total}
              </span>
            </div>
          </div>

          <div className="space-y-10">
            {groupedDays.map((day) => (
              <div key={day} className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-full bg-[#C4713A] px-4 py-2 font-[var(--font-label)] text-sm font-bold text-[#FFF9F0] shadow-[0_10px_24px_rgba(196,113,58,0.2)]">Day {day}</span>
                  <div className="h-px flex-1 bg-[#3A2A22]/14" />
                </div>
                <div className="space-y-4">
                  {plan.destinations.filter((destination) => destination.plannedDay === day).sort((a, b) => a.order - b.order).map((destination) => {
                    const isEditing = editingDestinationId === destination.id;
                    const isVisitOpen = visitDestinationId === destination.id;
                    const isPlanned = destination.status === "planned";
                    const documentReady = canDocumentDestination(destination);
                    const note = meaningfulStopNote(destination.notes);
                    const title = stopDisplayTitle(destination);
                    return (
                      <article key={destination.id} className="rounded-2xl border border-[#3A2A22]/12 bg-[#FFF9F0] p-5 shadow-[0_16px_38px_rgba(58,42,34,0.08)]">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex min-w-0 flex-1 gap-4">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#3A2A22] font-[var(--font-label)] text-sm font-bold text-[#FFF9F0]">{destination.order}</span>
                            <div className="min-w-0 flex-1">
                              {isEditing && isPlanned ? (
                                <div className="grid gap-3">
                                  <label className="grid gap-1">
                                    <span className="text-xs font-bold text-[#5B4A40]">Place name</span>
                                    <input value={destination.placeName} onChange={(event) => updateDestination(destination.id, { placeName: event.target.value })} className="min-h-11 rounded-xl border border-[#3A2A22]/14 bg-white px-3 text-sm outline-none focus:border-[#C4713A] focus:ring-2 focus:ring-[#C4713A]/20" />
                                  </label>
                                  <div className="grid gap-2 sm:grid-cols-3">
                                    <label className="grid gap-1">
                                      <span className="text-xs font-bold text-[#5B4A40]">Day</span>
                                      <input type="number" min={1} value={destination.plannedDay} onChange={(event) => updateDestination(destination.id, { plannedDay: Math.max(1, Number(event.target.value) || 1) })} className="min-h-11 rounded-xl border border-[#3A2A22]/14 bg-white px-3 text-sm outline-none focus:border-[#C4713A] focus:ring-2 focus:ring-[#C4713A]/20" />
                                    </label>
                                    <label className="grid gap-1">
                                      <span className="text-xs font-bold text-[#5B4A40]">Date</span>
                                      <input type="date" min={todayDate()} value={destination.plannedDate ?? ""} onChange={(event) => updateDestination(destination.id, { plannedDate: event.target.value })} className="min-h-11 rounded-xl border border-[#3A2A22]/14 bg-white px-3 text-sm outline-none focus:border-[#C4713A] focus:ring-2 focus:ring-[#C4713A]/20" />
                                    </label>
                                    <label className="grid gap-1">
                                      <span className="text-xs font-bold text-[#5B4A40]">Time</span>
                                      <input type="time" value={destination.plannedTime ?? ""} onChange={(event) => updateDestination(destination.id, { plannedTime: event.target.value })} className="min-h-11 rounded-xl border border-[#3A2A22]/14 bg-white px-3 text-sm outline-none focus:border-[#C4713A] focus:ring-2 focus:ring-[#C4713A]/20" />
                                    </label>
                                  </div>
                                  <label className="grid gap-1">
                                    <span className="text-xs font-bold text-[#5B4A40]">Stop note</span>
                                    <textarea value={meaningfulStopNote(destination.notes) ?? ""} onChange={(event) => updateDestination(destination.id, { notes: event.target.value })} rows={3} className="resize-none rounded-xl border border-[#3A2A22]/14 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-[#C4713A] focus:ring-2 focus:ring-[#C4713A]/20" placeholder="Add a note about this stop." />
                                  </label>
                                </div>
                              ) : (
                                <>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="m-0 font-[var(--font-display)] text-2xl font-semibold leading-tight text-[#2C211C]">{title}</h4>
                                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${isPlanned ? "border-[#6A584D]/25 bg-[#F5F0E8] text-[#4D4038]" : "border-[#5C8A9E]/30 bg-[#E8F0EF] text-[#315568]"}`}>
                                      {isPlanned ? "Planned" : "Completed"}
                                    </span>
                                  </div>
                                  {showSeparateAddress(destination) ? <p className="m-0 mt-2 text-sm font-semibold text-[#4D4038]">{destination.placeName}</p> : null}
                                  <p className="m-0 mt-2 text-sm leading-6 text-[#5B4A40]">{scheduleSummary(destination)}</p>
                                  <p className={`m-0 mt-2 text-sm leading-6 ${note ? "text-[#4D4038]" : "text-[#7A685E]"}`}>{note ?? "Add a note about this stop."}</p>
                                  {destination.description ? <p className="m-0 mt-4 border-l-2 border-[#C4713A]/35 pl-4 font-[var(--font-body)] text-base leading-7 text-[#1A1A1A]">{destination.description}</p> : null}
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            {isPlanned ? (
                              <>
                                <ActionIconButton label={isEditing ? "Finish editing plan" : "Edit this stop"} onClick={() => setEditingDestinationId(isEditing ? null : destination.id)}>
                                  <FileText size={16} strokeWidth={2.2} />
                                </ActionIconButton>
                                <ActionIconButton label="Move stop up" onClick={() => moveDestination(destination.id, -1)}>
                                  <ArrowUp size={16} strokeWidth={2.2} />
                                </ActionIconButton>
                                <ActionIconButton label="Move stop down" onClick={() => moveDestination(destination.id, 1)}>
                                  <ArrowDown size={16} strokeWidth={2.2} />
                                </ActionIconButton>
                                <ActionIconButton label="Delete this stop" tone="danger" onClick={() => setDeleteRequest({ kind: "destination", id: destination.id, label: stopDisplayTitle(destination) })}>
                                  <Trash2 size={16} strokeWidth={2.2} />
                                </ActionIconButton>
                              </>
                            ) : null}
                            {destination.coordinate.lat || destination.coordinate.lon ? (
                              <ActionIconButton label="View this pin on the map" onClick={() => viewDestinationOnMap(destination)}>
                                <MapPin size={16} strokeWidth={2.2} />
                              </ActionIconButton>
                            ) : null}
                          </div>
                        </div>

                        {destination.photos?.length ? (
                          <div className="mt-5 grid grid-cols-3 gap-2">
                            {destination.photos.slice(0, 3).map((photo) => <img key={photo} src={photo} alt="" className="h-24 w-full rounded-xl object-cover" />)}
                          </div>
                        ) : null}

                        {isVisitOpen ? (
                          <div className="mt-5 rounded-2xl border border-[#C4713A]/25 bg-[#FBF7F0] p-4">
                            <div className="grid gap-3">
                              <div className="grid gap-2 sm:grid-cols-3">
                                <select value={visitForm.visibility} onChange={(event) => setVisitForm((current) => ({ ...current, visibility: event.target.value as MapScope }))} className="min-h-11 rounded-xl border border-[#3A2A22]/14 bg-white px-3 text-sm">
                                  <option value="private">Private Map</option>
                                  <option value="public">Public Map</option>
                                  <option value="group">Group Map</option>
                                </select>
                                <select value={visitForm.category} onChange={(event) => setVisitForm((current) => ({ ...current, category: event.target.value }))} className="min-h-11 rounded-xl border border-[#3A2A22]/14 bg-white px-3 text-sm">
                                  {planCategories.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}
                                </select>
                                <input type="date" value={visitForm.dateVisited} onChange={(event) => setVisitForm((current) => ({ ...current, dateVisited: event.target.value }))} className="min-h-11 rounded-xl border border-[#3A2A22]/14 bg-white px-3 text-sm" />
                              </div>
                              <input value={visitForm.placeName} onChange={(event) => setVisitForm((current) => ({ ...current, placeName: event.target.value }))} className="min-h-11 rounded-xl border border-[#3A2A22]/14 bg-white px-3 text-sm" placeholder="Place name" />
                              <input value={visitForm.title} onChange={(event) => setVisitForm((current) => ({ ...current, title: event.target.value }))} className="min-h-11 rounded-xl border border-[#3A2A22]/14 bg-white px-3 text-sm" placeholder="Story title" />
                              <textarea value={visitForm.description} onChange={(event) => setVisitForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="resize-none rounded-xl border border-[#3A2A22]/14 bg-white px-3 py-2 text-sm leading-6" placeholder="Document what happened when you visited." />
                              <textarea value={visitForm.photos} onChange={(event) => setVisitForm((current) => ({ ...current, photos: event.target.value }))} rows={2} className="resize-none rounded-xl border border-[#3A2A22]/14 bg-white px-3 py-2 text-sm leading-6" placeholder="Photo URLs, separated by comma or line break." />
                              <div className="flex flex-wrap justify-end gap-2">
                                <button type="button" onClick={() => setVisitDestinationId(null)} className="min-h-10 rounded-full border border-[#3A2A22]/18 px-4 text-sm font-bold text-[#3A2A22]">Cancel</button>
                                <button type="button" onClick={saveVisit} className="min-h-10 rounded-full bg-[#C4713A] px-4 text-sm font-bold text-[#FFF9F0]">Mark Completed</button>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#3A2A22]/10 pt-4">
                          <div>
                            {isPlanned && !documentReady ? <p className="m-0 text-sm font-medium text-[#6F5749]">{documentLockMessage(destination)}</p> : <p className="m-0 text-sm font-medium text-[#4D4038]">{isPlanned ? "Ready to document once the scheduled time arrives." : "This stop is documented and can be edited."}</p>}
                          </div>
                          <button
                            type="button"
                            disabled={isPlanned && !documentReady}
                            onClick={() => startVisit(destination)}
                            title={isPlanned && !documentReady ? documentLockMessage(destination) : undefined}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#3A2A22] px-5 text-sm font-bold text-[#FFF9F0] transition hover:bg-[#2C211C] disabled:cursor-not-allowed disabled:bg-[#D9D0C2] disabled:text-[#66584F]"
                          >
                            {isPlanned && !documentReady ? <LockKeyhole size={16} strokeWidth={2.2} /> : <CheckCircle2 size={16} strokeWidth={2.2} />}
                            {isPlanned ? "Document Visit" : "Edit Visit"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl border border-[#C4713A]/25 bg-gradient-to-br from-[#3A2A22] via-[#4A352A] to-[#8A4B26] p-6 text-[#FFF9F0] shadow-[0_28px_70px_rgba(58,42,34,0.22)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="m-0 font-[var(--font-label)] text-[0.72rem] font-bold tracking-[0.12em] text-[#E8C7A9]">Album Maker</p>
              <h2 className="m-0 mt-1 font-[var(--font-display)] text-4xl font-semibold">Printable Journey Album</h2>
              <p className="m-0 mt-3 max-w-2xl text-sm leading-6 text-[#F5E7D6]">
                {albumUnlocked(plan) ? "All destinations are complete. Choose a template and preview the print-ready travel book." : `Locked until every destination is documented. ${completed} of ${total} destinations completed.`}
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#FFF9F0]/18 bg-[#FFF9F0]/10">
              {albumUnlocked(plan) ? <CheckCircle2 size={26} strokeWidth={2.2} /> : <LockKeyhole size={26} strokeWidth={2.2} />}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4 text-sm font-semibold text-[#F5E7D6]">
              <span>{completed} documented</span>
              <span>{total} total</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#FFF9F0]/18">
              <div className="h-full rounded-full bg-[#E9B17A]" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {albumUnlocked(plan) ? (
            <div className="mt-6 grid gap-4">
              <div className="flex flex-wrap gap-2">
                {albumTemplates.map((template) => (
                  <button key={template} type="button" onClick={() => setAlbumTemplate(template)} className={`min-h-10 rounded-full border px-4 text-sm font-bold transition ${albumTemplate === template ? "border-[#FFF9F0] bg-[#FFF9F0] text-[#3A2A22]" : "border-[#FFF9F0]/25 text-[#FFF9F0] hover:bg-[#FFF9F0]/10"}`}>
                    {template}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#FFF9F0]/14 bg-[#FFF9F0]/10 p-5">
                  <p className="font-[var(--font-label)] text-xs font-bold tracking-[0.12em] text-[#E8C7A9]">Cover</p>
                  <h3 className="font-[var(--font-display)] text-3xl font-semibold text-[#FFF9F0]">{plan.travelPlanName}</h3>
                  <p className="text-sm leading-6 text-[#F5E7D6]">{albumTemplate} / {totalTravelDays(plan)} travel days / {total} stops</p>
                </div>
                {plan.destinations.map((destination) => (
                  <div key={destination.id} className="rounded-2xl border border-[#FFF9F0]/14 bg-[#FFF9F0]/10 p-5">
                    <p className="font-[var(--font-label)] text-xs font-bold tracking-[0.12em] text-[#E8C7A9]">Page {destination.order}</p>
                    <h3 className="font-[var(--font-display)] text-2xl font-semibold text-[#FFF9F0]">{destination.title || destination.placeName}</h3>
                    <p className="text-sm leading-6 text-[#F5E7D6]">{destination.dateVisited} / Day {destination.plannedDay}</p>
                    <p className="text-sm leading-6 text-[#FFF9F0]">{destination.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
    </div>
  );
}

function TravelPlanStoriesContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<TravelPlanStory[]>(() => readTravelPlanStories());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activePlanId, setActivePlanId] = useState<string | null>(() => new URLSearchParams(location.search).get("plan"));
  const [pendingPlanDelete, setPendingPlanDelete] = useState<TravelPlanStory | null>(null);

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
    setPendingPlanDelete(null);
  };

  if (activePlan) {
    if (activePlanIsSample) {
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
          <p className="mt-4 max-w-3xl font-[var(--font-body)] text-lg leading-8 text-[#5B4A40]">
            Multi-destination journeys created from Draw Route. Plan the order, document each visited stop, then unlock Album Maker when the full route is complete.
          </p>
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

        <div className="mb-8 flex justify-end">
          <button type="button" onClick={() => navigate("/maps")} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#C4713A] px-5 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#F5F0E8]">
            <MapPin size={15} /> Create with Draw Route
          </button>
        </div>

        {filteredPlans.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => {
              const status = travelPlanStatus(plan);
              const completed = completedDestinationCount(plan);
              const total = plan.destinations.length;
              const progress = total ? Math.round((completed / total) * 100) : 0;
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
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#FBF7F0]">
                      <div className="h-full rounded-full bg-[#C4713A]" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 text-xs font-semibold text-[#6B6B5A]">{albumUnlocked(plan) ? "Album Maker unlocked" : "Private until every destination is completed"}</p>
                      {!sampleTravelPlans.some((sample) => sample.id === plan.id) ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPendingPlanDelete(plan);
                          }}
                          className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[#B23B2E]/25 px-3 text-xs font-bold text-[#8A2F25] hover:bg-[#B23B2E]/10"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      ) : null}
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
      <ConfirmDialog
        open={Boolean(pendingPlanDelete)}
        title={`Delete ${pendingPlanDelete?.travelPlanName ?? "this Travel Plan"}?`}
        description={`Are you sure you want to delete "${pendingPlanDelete?.travelPlanName ?? "this Travel Plan"}"? This removes the whole itinerary story immediately.`}
        confirmLabel="Delete Travel Plan"
        onConfirm={() => pendingPlanDelete && removeTravelPlan(pendingPlanDelete.id)}
        onCancel={() => setPendingPlanDelete(null)}
      />
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
