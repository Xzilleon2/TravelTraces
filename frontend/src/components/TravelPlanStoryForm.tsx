import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, ImagePlus, MapPin, Plus, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import type { ApiLocation } from "../services/mappingApi";
import { fileToDataUrl } from "../utils/photoPinHelpers";

type PlannedStop = ApiLocation & {
  plannedDay?: number;
  plannedDate?: string;
  plannedTime?: string;
  category?: string;
  notes?: string;
};

type Props = {
  open: boolean;
  stops: ApiLocation[];
  routeGeometry?: [number, number][];
  busy?: boolean;
  onClose: () => void;
  onConvertToMarker: (location: ApiLocation) => void;
  onSave: (input: {
    travelPlanName: string;
    subtitle?: string;
    coverImage?: string;
    description?: string;
    stops: PlannedStop[];
  }) => void;
};

const emptyLocation = (index: number): PlannedStop => ({
  coordinate: [0, 0],
  label: `Destination ${index + 1}`,
  provider: "manual",
  confidence: 1,
  plannedDay: 1,
  plannedDate: addDaysKey(new Date(), index),
  category: "Hidden Gems",
});

function addDaysKey(startDate: Date, days: number): string {
  const next = new Date(startDate);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

const todayDate = () => new Date().toISOString().slice(0, 10);
const stopCategories = ["Hiking", "Food Place", "Hidden Gems", "Beaches", "Forest", "Culture", "More"];

function travelPlanConflictMessage(stops: PlannedStop[]): string | null {
  const today = todayDate();
  if (stops.some((stop) => !stop.plannedDate || !stop.plannedTime)) return "Each destination needs a planned date and time before saving.";
  if (stops.some((stop) => stop.plannedDate && stop.plannedDate < today)) return "Travel Plan dates must be today or a future date.";
  const scheduleKeys = new Set<string>();
  for (const stop of stops) {
    const key = `${stop.plannedDate}-${stop.plannedTime}`;
    if (scheduleKeys.has(key)) return "Two destinations cannot share the same planned date and time.";
    scheduleKeys.add(key);
  }
  return null;
}

function reorderStops(stops: PlannedStop[], from: number, to: number): PlannedStop[] {
  if (to < 0 || to >= stops.length) return stops;
  const next = [...stops];
  const [item] = next.splice(from, 1);
  if (!item) return stops;
  next.splice(to, 0, item);
  return next;
}

export function TravelPlanStoryForm({ open, stops, routeGeometry, busy, onClose, onConvertToMarker, onSave }: Props) {
  const [travelPlanName, setTravelPlanName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [description, setDescription] = useState("");
  const [plannedStops, setPlannedStops] = useState<PlannedStop[]>([]);
  const [pendingStopDelete, setPendingStopDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setTravelPlanName("");
    setSubtitle("");
    setCoverImage("");
    setDescription("");
    setPendingStopDelete(null);
    const today = new Date();
    setPlannedStops(
      stops.map((stop, index) => ({
        ...stop,
        label: stop.label || `Destination ${index + 1}`,
        plannedDay: index === 0 ? 1 : Math.min(index + 1, 3),
        plannedDate: addDaysKey(today, index),
        plannedTime: "",
        category: "Hidden Gems",
        notes: "",
      })),
    );
  }, [open, stops]);

  if (!open) return null;

  const updateStop = (index: number, patch: Partial<PlannedStop>) => {
    setPlannedStops((current) => current.map((stop, stopIndex) => (stopIndex === index ? { ...stop, ...patch } : stop)));
  };

  const handleCoverFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setCoverImage(dataUrl);
  };

  const saveLabel = plannedStops.length <= 1 ? "Convert to Drop Marker" : "Save Travel Plan Story";
  const validationMessage = plannedStops.length > 1 ? travelPlanConflictMessage(plannedStops) : null;
  const canSave = plannedStops.length > 0 && !validationMessage && (plannedStops.length === 1 || travelPlanName.trim().length > 0);
  const pendingStopLabel = pendingStopDelete !== null ? plannedStops[pendingStopDelete]?.label ?? "this destination" : "this destination";

  return (
    <>
    <div className="absolute inset-x-3 bottom-28 top-20 z-40 overflow-y-auto rounded-[1.35rem] border border-[#3A2A22]/14 bg-[#FBF7F0] text-[#1A1A1A] shadow-[0_24px_70px_rgba(58,42,34,0.24)] ring-1 ring-white/60 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:max-h-[calc(100%-7rem)] sm:w-[min(28rem,calc(100%-2rem))]">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#3A2A22]/10 bg-[#3A2A22] px-5 py-4 text-[#F5F0E8]">
        <div>
          <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.14em] text-[#F5F0E8]/75">Draw Route</p>
          <h3 className="m-0 mt-1 font-[var(--font-display)] text-2xl font-semibold">Travel Plan Story</h3>
          <p className="m-0 mt-2 max-w-sm text-sm leading-5 text-[#F5F0E8]/75">
            Turn this ordered route into a private journey plan before you travel.
          </p>
        </div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F5F0E8]/10 text-[#F5F0E8]" aria-label="Close travel plan form">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5 p-5">
        <div className="rounded-xl border border-[#C4713A]/20 bg-[#C4713A]/10 p-3 text-sm leading-6 text-[#5B4A40]">
          <span className="block font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.1em] text-[#9E4F27]">Route Summary</span>
          {plannedStops.length} destination{plannedStops.length === 1 ? "" : "s"} in order
          {routeGeometry?.length ? ` / ${routeGeometry.length} snapped route points` : ""}. Plans stay private until every destination is completed.
        </div>

        <label className="grid gap-2">
          <span className="font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#3A2A22]">Travel Plan Name</span>
          <input
            value={travelPlanName}
            onChange={(event) => setTravelPlanName(event.target.value)}
            className="min-h-11 rounded-lg border border-[#3A2A22]/15 bg-white px-3 text-sm outline-none focus:border-[#C4713A] focus:ring-2 focus:ring-[#C4713A]/20"
            placeholder="Weekend Trip to Siargao"
          />
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#3A2A22]">Subtitle</span>
          <input
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            className="min-h-11 rounded-lg border border-[#3A2A22]/15 bg-white px-3 text-sm outline-none focus:border-[#C4713A] focus:ring-2 focus:ring-[#C4713A]/20"
            placeholder="A short line that explains the whole route"
          />
        </label>

        <div className="grid gap-2">
          <span className="font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#3A2A22]">Cover Image</span>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              value={coverImage.startsWith("data:") ? "Uploaded cover image" : coverImage}
              onChange={(event) => setCoverImage(event.target.value)}
              className="min-h-11 rounded-lg border border-[#3A2A22]/15 bg-white px-3 text-sm outline-none focus:border-[#C4713A] focus:ring-2 focus:ring-[#C4713A]/20"
              placeholder="Optional image URL"
              disabled={coverImage.startsWith("data:")}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#5C8A9E] px-3 text-[#F5F0E8]"
              aria-label="Upload cover image"
            >
              <ImagePlus size={17} />
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void handleCoverFile(event.target.files)} />
          {coverImage ? <img src={coverImage} alt="" className="h-28 w-full rounded-lg object-cover" /> : null}
        </div>

        <label className="grid gap-2">
          <span className="font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#3A2A22]">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="resize-none rounded-lg border border-[#3A2A22]/15 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-[#C4713A] focus:ring-2 focus:ring-[#C4713A]/20"
            placeholder="What kind of journey are you planning?"
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#3A2A22]">Destinations</span>
            <button
              type="button"
              onClick={() => setPlannedStops((current) => [...current, emptyLocation(current.length)])}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#3A2A22]/15 px-3 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#3A2A22]"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {plannedStops.map((stop, index) => (
            <div key={`${stop.coordinate.join(",")}-${index}`} className="rounded-xl border border-[#3A2A22]/12 bg-[#EFE7DC] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#3A2A22] px-2 font-[var(--font-label)] text-xs font-bold text-[#F5F0E8]">
                  {index + 1}
                </span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setPlannedStops((current) => reorderStops(current, index, index - 1))} className="grid h-8 w-8 place-items-center rounded-full border border-[#3A2A22]/15 bg-white text-[#3A2A22]" aria-label="Move destination up">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => setPlannedStops((current) => reorderStops(current, index, index + 1))} className="grid h-8 w-8 place-items-center rounded-full border border-[#3A2A22]/15 bg-white text-[#3A2A22]" aria-label="Move destination down">
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" onClick={() => setPendingStopDelete(index)} className="grid h-8 w-8 place-items-center rounded-full border border-[#C4713A]/25 bg-white text-[#9E4F27]" aria-label="Delete destination">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-[#5B4A40]">Place name</span>
                  <input value={stop.label} onChange={(event) => updateStop(index, { label: event.target.value })} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm outline-none focus:border-[#C4713A]" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-[#5B4A40]">Planned day</span>
                    <input type="number" min={1} value={stop.plannedDay ?? 1} onChange={(event) => updateStop(index, { plannedDay: Math.max(1, Number(event.target.value) || 1) })} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm outline-none focus:border-[#C4713A]" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-[#5B4A40]">Planned date</span>
                    <input type="date" min={todayDate()} value={stop.plannedDate ?? ""} onChange={(event) => updateStop(index, { plannedDate: event.target.value < todayDate() ? todayDate() : event.target.value })} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm outline-none focus:border-[#C4713A]" />
                  </label>
                </div>
                <div className="grid gap-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-[#5B4A40]">Planned time</span>
                    <input type="time" required value={stop.plannedTime ?? ""} onChange={(event) => updateStop(index, { plannedTime: event.target.value })} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm outline-none focus:border-[#C4713A]" />
                  </label>
                </div>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-[#5B4A40]">Category</span>
                  <select value={stop.category ?? "Hidden Gems"} onChange={(event) => updateStop(index, { category: event.target.value })} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm outline-none focus:border-[#C4713A]">
                    {stopCategories.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-[#5B4A40]">Notes</span>
                  <textarea value={stop.notes ?? ""} onChange={(event) => updateStop(index, { notes: event.target.value })} rows={2} className="resize-none rounded-lg border border-[#3A2A22]/12 bg-white px-3 py-2 text-sm outline-none focus:border-[#C4713A]" placeholder="Tickets, route notes, timing, reminders..." />
                </label>
              </div>
            </div>
          ))}
        </div>

        {plannedStops.length === 1 ? (
          <div className="rounded-xl border border-[#C4713A]/25 bg-[#C4713A]/10 p-3 text-sm leading-6 text-[#5B4A40]">
            Only one destination remains, so this will become a Drop Marker. Story mode and Album Maker are disabled for single-place posts.
          </div>
        ) : null}

        {validationMessage ? (
          <div className="rounded-xl border border-[#B23B2E]/25 bg-[#B23B2E]/10 p-3 text-sm font-semibold leading-6 text-[#8A2F25]">
            {validationMessage}
          </div>
        ) : null}

        <button
          type="button"
          disabled={busy || !canSave}
          onClick={() => {
            if (plannedStops.length === 1) {
              onConvertToMarker(plannedStops[0]);
              return;
            }
            onSave({
              travelPlanName: travelPlanName.trim(),
              subtitle: subtitle.trim() || undefined,
              coverImage: coverImage.trim() || undefined,
              description: description.trim() || undefined,
              stops: plannedStops.map((stop) => ({ ...stop, label: stop.label.trim() || "Destination" })),
            });
          }}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#C4713A] px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#F5F0E8] transition hover:bg-[#A85E2F] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {plannedStops.length <= 1 ? <MapPin size={16} /> : <BookOpen size={16} />}
          {saveLabel}
        </button>
      </div>
    </div>
    <ConfirmDialog
      open={pendingStopDelete !== null}
      title={`Delete ${pendingStopLabel}?`}
      description={`Are you sure you want to delete "${pendingStopLabel}" from this Travel Plan draft?`}
      confirmLabel="Delete Destination"
      onConfirm={() => {
        if (pendingStopDelete === null) return;
        setPlannedStops((current) => current.filter((_, stopIndex) => stopIndex !== pendingStopDelete));
        setPendingStopDelete(null);
      }}
      onCancel={() => setPendingStopDelete(null)}
    />
    </>
  );
}
