import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Heart,
  Landmark,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Mountain,
  Search,
  Send,
  Share2,
  TreePine,
  Utensils,
  Waves,
  Gem,
} from "lucide-react";
import { GatedPage } from "../components/GatedPage";
import { DraggablePhotoFrame } from "../components/DraggablePhotoFrame";
import { useAuth, type User } from "../context/AuthContext";
import { localAvatarDataUrl } from "../utils/localAvatar";
import { readLocalTable } from "../services/localDb";
import {
  completedDestinationCount,
  readTravelPlanStories,
  totalTravelDays,
  travelPlanStatus,
  upsertTravelPlanStory,
  type TravelPlanDestination,
  type TravelPlanStory,
} from "../services/travelPlanStories";

const planCategories = ["All", "Hiking", "Food Place", "Hidden Gems", "Beaches", "Forest", "Culture", "More"];
const PLAN_CATEGORY_ICON: Record<string, typeof Compass> = {
  Hiking: Mountain,
  "Food Place": Utensils,
  "Hidden Gems": Gem,
  Beaches: Waves,
  Forest: TreePine,
  Culture: Landmark,
  More: Compass,
};

type TravelPlanComment = {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
};

const TRAVEL_PLAN_COMMENTS: Record<string, TravelPlanComment[]> = {};

function planCover(plan: TravelPlanStory): string | null {
  return plan.coverImage || null;
}

function PlanCoverFrame({ plan, height }: { plan: TravelPlanStory; height: number }) {
  const cover = planCover(plan);
  if (cover) {
    return <img src={cover} alt={plan.travelPlanName} style={{ width: "100%", height, objectFit: "cover", objectPosition: plan.coverPosition ?? "center center", display: "block" }} />;
  }
  return (
    <div style={{ width: "100%", height, display: "grid", placeItems: "center", background: "linear-gradient(135deg, #EFE7DC, #FBF7F0)", borderBottom: "1px solid rgba(58,42,34,0.1)", color: "#7A685E", fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
      Cover photo pending
    </div>
  );
}

function planSubtitle(plan: TravelPlanStory): string {
  return plan.subtitle || `${plan.destinations.length} ordered destinations saved as one route plan.`;
}

function planDescription(plan: TravelPlanStory): string {
  return plan.description || `${plan.destinations.length} ordered destinations saved as one route plan.`;
}

function planReadTime(plan: TravelPlanStory): string {
  return `${Math.max(3, plan.destinations.length * 3)} min`;
}

function planDate(plan: TravelPlanStory): string {
  const rawDate = plan.createdAt;
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? "Recently" : parsed.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function relativeTimeFrom(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "recently";
  const seconds = Math.max(1, Math.floor((Date.now() - parsed.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.floor(months / 12);
  return `${years} yr ago`;
}

function plannedMomentHasArrived(destination: TravelPlanDestination): boolean {
  if (destination.status !== "planned") return true;
  if (!destination.plannedDate || !destination.plannedTime) return false;
  const planned = new Date(`${destination.plannedDate}T${destination.plannedTime}`);
  return !Number.isNaN(planned.getTime()) && planned.getTime() <= Date.now();
}

function planCoordinates(plan: TravelPlanStory): string | null {
  const first = plan.destinations.find((destination) => Number.isFinite(destination.coordinate.lat) && Number.isFinite(destination.coordinate.lon));
  return first ? `${first.coordinate.lat.toFixed(4)}, ${first.coordinate.lon.toFixed(4)}` : null;
}

function isPublishedCompletedPlan(plan: TravelPlanStory): boolean {
  return plan.published && travelPlanStatus(plan) === "completed";
}

function travelPlanPopularity(plan: TravelPlanStory): number {
  return (plan.likesCount ?? 0) * 3 + (plan.savesCount ?? 0) * 2 + (plan.commentsCount ?? 0);
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
  window.localStorage.setItem("traveltraces.pendingTravelPlanRoute", JSON.stringify({ planId: plan.id, title: plan.travelPlanName, ownerName: plan.ownerName, points }));
  navigate("/maps");
}

export function TravelPlanArticleView({
  plan,
  onBack,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  editable = false,
  onPlanChange,
  backLabel = "Travel Plans",
}: {
  plan: TravelPlanStory;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  editable?: boolean;
  onPlanChange?: (plan: TravelPlanStory) => void;
  backLabel?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<TravelPlanComment[]>(TRAVEL_PLAN_COMMENTS[plan.id] ?? []);
  const [commentInput, setCommentInput] = useState("");
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [editingDestinationId, setEditingDestinationId] = useState<string | null>(null);
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [draggedDestinationId, setDraggedDestinationId] = useState<string | null>(null);

  const status = travelPlanStatus(plan);
  const coordinates = planCoordinates(plan);
  const sortedDestinations = [...plan.destinations].sort((a, b) => a.order - b.order);
  const socialAvailable = isPublishedCompletedPlan(plan);
  const commentsAvailable = socialAvailable;
  const ownerProfile = useMemo(() => readLocalTable<User>("users").find((row) => row.id === plan.ownerId) ?? null, [plan.ownerId]);
  const ownerAvatar = ownerProfile?.avatar || localAvatarDataUrl(plan.ownerName);
  const canAttemptPublish = editable && status === "completed" && !plan.published;
  const hasRequiredCover = Boolean(plan.coverImage?.trim());
  const canPublish = canAttemptPublish && hasRequiredCover;
  const visibleLikes = (plan.likesCount ?? 0) + (liked ? 1 : 0);

  useEffect(() => {
    setLiked(false);
    setSaved(false);
    setComments(TRAVEL_PLAN_COMMENTS[plan.id] ?? []);
    setCommentInput("");
    setLikedComments(new Set());
    setEditingDestinationId(null);
    setEditingDescriptionId(null);
    setDescriptionDraft("");
    setEditingNoteId(null);
    setNoteDraft("");
    setDraggedDestinationId(null);
  }, [plan.id]);

  const commitPlan = (nextPlan: TravelPlanStory) => {
    const savedPlan = upsertTravelPlanStory(nextPlan);
    onPlanChange?.(savedPlan);
  };

  const updateDestination = (destinationId: string, patch: Partial<TravelPlanDestination>) => {
    if (!editable) return;
    commitPlan({
      ...plan,
      destinations: plan.destinations.map((destination) => (destination.id === destinationId ? { ...destination, ...patch } : destination)),
    });
  };

  const reorderDestination = (sourceId: string, targetId: string) => {
    if (!editable || sourceId === targetId) return;
    const ordered = [...plan.destinations].sort((a, b) => a.order - b.order);
    const sourceIndex = ordered.findIndex((destination) => destination.id === sourceId);
    const targetIndex = ordered.findIndex((destination) => destination.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, moved);
    commitPlan({
      ...plan,
      destinations: ordered.map((destination, index) => ({ ...destination, order: index + 1 })),
    });
  };

  const updateDestinationOrder = (destinationId: string, nextOrderValue: number) => {
    if (!editable) return;
    const ordered = [...plan.destinations].sort((a, b) => a.order - b.order);
    const sourceIndex = ordered.findIndex((destination) => destination.id === destinationId);
    const targetIndex = Math.max(0, Math.min(ordered.length - 1, nextOrderValue - 1));
    if (sourceIndex < 0 || sourceIndex === targetIndex) return;
    const [moved] = ordered.splice(sourceIndex, 1);
    if (!moved) return;
    ordered.splice(targetIndex, 0, moved);
    commitPlan({
      ...plan,
      destinations: ordered.map((destination, index) => ({ ...destination, order: index + 1 })),
    });
  };

  const startDescriptionEdit = (destination: TravelPlanDestination) => {
    if (!editable) return;
    setEditingDescriptionId(destination.id);
    setDescriptionDraft(destination.description ?? "");
  };

  const confirmDescriptionEdit = (destinationId: string) => {
    updateDestination(destinationId, { description: descriptionDraft.trim() });
    setEditingDescriptionId(null);
    setDescriptionDraft("");
  };

  const startNoteEdit = (destination: TravelPlanDestination) => {
    if (!editable) return;
    setEditingNoteId(destination.id);
    setNoteDraft(destination.notes ?? "");
  };

  const confirmNoteEdit = (destinationId: string) => {
    updateDestination(destinationId, { notes: noteDraft.trim() });
    setEditingNoteId(null);
    setNoteDraft("");
  };

  const publishPlan = () => {
    if (!canPublish) return;
    commitPlan({ ...plan, visibility: "public", published: true });
  };

  const updateCoverImage = (coverImage: string) => {
    if (!editable) return;
    commitPlan({ ...plan, coverImage: coverImage.trim() || undefined });
  };

  const updateCoverPosition = (position: { x: number; y: number }) => {
    if (!editable) return;
    commitPlan({ ...plan, coverPosition: `${position.x}% ${position.y}%`, coverPositionX: position.x, coverPositionY: position.y });
  };

  const submitComment = () => {
    if (!commentInput.trim()) return;
    setComments((current) => [
      ...current,
      {
        id: Date.now(),
        author: user?.name ?? "You",
        avatar: user?.avatar || localAvatarDataUrl(user?.name ?? "You"),
        text: commentInput.trim(),
        time: "Just now",
        likes: 0,
      },
    ]);
    setCommentInput("");
  };

  return (
    <div className="travel-plan-article-shell" style={{ minHeight: "100vh", backgroundColor: "#FBF7F0", padding: "2rem clamp(1rem, 4vw, 2rem) 5rem" }}>
      <article style={{ width: "min(100%, 1120px)", margin: "0 auto", backgroundColor: "#FBF7F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
          <button
            onClick={onBack}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", border: "1px solid rgba(58,42,34,0.18)", background: "transparent", color: "#3A2A22", borderRadius: "999px", padding: "0.55rem 1rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            <ArrowLeft size={15} /> {backLabel}
          </button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {hasPrev && (
              <button aria-label="Previous travel plan" onClick={onPrev} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "1px solid rgba(58,42,34,0.18)", background: "transparent", color: "#3A2A22", borderRadius: "999px", padding: "0.55rem 0.9rem", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: "0.82rem", fontWeight: 700 }}>
                <ChevronLeft size={16} /> Previous
              </button>
            )}
            {hasNext && (
              <button aria-label="Next travel plan" onClick={onNext} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "1px solid rgba(58,42,34,0.18)", background: "transparent", color: "#3A2A22", borderRadius: "999px", padding: "0.55rem 0.9rem", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: "0.82rem", fontWeight: 700 }}>
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        <header style={{ width: "min(100%, 780px)", margin: "0 auto 2rem", textAlign: "left" }}>
          <span style={{ display: "inline-flex", padding: "0.28rem 0.75rem", backgroundColor: "rgba(196,113,58,0.1)", border: "1px solid rgba(196,113,58,0.25)", borderRadius: "999px", fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#C4713A", marginBottom: "1rem" }}>
            {socialAvailable ? "Completed Public Travel Plan" : editable ? "Private Travel Plan Draft" : "Travel Plan"}
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.45rem, 7vw, 5rem)", fontWeight: 600, color: "#1A1A1A", lineHeight: 0.98, letterSpacing: 0, marginBottom: "1rem" }}>{plan.travelPlanName}</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1.05rem, 2vw, 1.35rem)", lineHeight: 1.65, color: "#4A4A3A", margin: "0 0 1.35rem" }}>{planSubtitle(plan)}</p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", borderTop: "1px solid rgba(58,42,34,0.14)", borderBottom: "1px solid rgba(58,42,34,0.14)", padding: "1rem 0", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <img src={ownerAvatar} alt={`${plan.ownerName} profile`} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", display: "block", border: "1px solid rgba(58,42,34,0.14)" }} />
              <div>
                <span style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: "0.94rem", color: "#1A1A1A" }}>{plan.ownerName}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#6B5A50", flexWrap: "wrap", marginTop: "0.15rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.82rem", fontFamily: "var(--font-ui)" }}><BookOpen size={12} />{plan.destinations.length} points</span>
                  <span style={{ fontSize: "0.82rem", fontFamily: "var(--font-ui)" }}>Posted {planDate(plan)}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.82rem", fontFamily: "var(--font-ui)" }}><Clock size={12} />{relativeTimeFrom(plan.createdAt)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {canAttemptPublish ? (
                <button disabled={!canPublish} onClick={publishPlan} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.95rem", border: "1px solid #3A2A22", borderRadius: "999px", background: "#3A2A22", color: "#FBF7F0", cursor: canPublish ? "pointer" : "not-allowed", opacity: canPublish ? 1 : 0.55, fontSize: "0.8rem", fontFamily: "var(--font-label)", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {canPublish ? "Publish" : "Cover required"}
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <div style={{ width: "min(100%, 780px)", margin: "0 auto" }}>
          {canAttemptPublish ? (
            <section style={{ marginBottom: "2rem", border: "1px solid rgba(196,113,58,0.25)", backgroundColor: "#FFF4E8", borderRadius: "0.65rem", padding: "1rem" }}>
              <p style={{ margin: "0 0 0.35rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7A4B32" }}>Required cover photo</p>
              <p style={{ margin: "0 0 1rem", fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.7, color: "#5B4A40" }}>
                Choose the cover image for this Travel Plan card before publishing. This is no longer optional.
              </p>
              {plan.coverImage ? (
                <DraggablePhotoFrame
                  src={plan.coverImage}
                  alt={`${plan.travelPlanName} cover`}
                  x={plan.coverPositionX ?? 50}
                  y={plan.coverPositionY ?? 50}
                  onPositionChange={updateCoverPosition}
                  className="mb-4 h-64 w-full overflow-hidden rounded-[0.45rem]"
                  imageClassName="block h-full w-full object-cover"
                />
              ) : (
                <div style={{ display: "grid", placeItems: "center", height: "clamp(160px, 28vw, 260px)", border: "1px dashed rgba(58,42,34,0.26)", backgroundColor: "#FBF7F0", borderRadius: "0.45rem", marginBottom: "1rem", fontFamily: "var(--font-label)", fontSize: "0.76rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7A685E" }}>
                  Add cover photo here
                </div>
              )}
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <input
                  value={plan.coverImage ?? ""}
                  onChange={(event) => updateCoverImage(event.target.value)}
                  placeholder="Paste cover image URL"
                  style={{ width: "100%", boxSizing: "border-box", border: "1px solid rgba(58,42,34,0.18)", background: "#FBF7F0", borderRadius: "0.45rem", padding: "0.7rem 0.8rem", fontFamily: "var(--font-ui)", color: "#2C211C" }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") updateCoverImage(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }}
                  style={{ fontFamily: "var(--font-ui)", color: "#3A2A22" }}
                />
                {plan.coverImage ? <p style={{ margin: 0, fontFamily: "var(--font-ui)", fontSize: "0.82rem", lineHeight: 1.6, color: "#6B5A50" }}>Drag the cover image to choose what part appears on the card.</p> : null}
              </div>
            </section>
          ) : null}

          <div>
            <h3 style={{ fontFamily: "var(--font-label)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E6B5C", marginBottom: "0.9rem" }}>Description</h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1.05rem, 1.7vw, 1.2rem)", lineHeight: 1.85, color: "#1A1A1A", marginBottom: "2rem" }}>{planDescription(plan)}</p>
          </div>

          {socialAvailable ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.65rem", flexWrap: "wrap", borderTop: "1px solid rgba(58,42,34,0.12)", borderBottom: "1px solid rgba(58,42,34,0.12)", padding: "1rem 0", margin: "0.25rem 0 2rem" }}>
              <button onClick={() => setLiked((value) => !value)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.85rem", border: "1px solid", borderColor: liked ? "#C4713A" : "rgba(58,42,34,0.2)", borderRadius: "999px", background: liked ? "rgba(196,113,58,0.08)" : "none", color: liked ? "#C4713A" : "#6B5A50", cursor: "pointer", fontSize: "0.8rem", fontFamily: "var(--font-ui)", fontWeight: 700 }}>
                <Heart size={14} fill={liked ? "#C4713A" : "none"} /> {visibleLikes > 0 ? visibleLikes : "Like"}
              </button>
              <button onClick={() => setSaved((value) => !value)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.85rem", border: "1px solid", borderColor: saved ? "#3A2A22" : "rgba(58,42,34,0.2)", borderRadius: "999px", background: saved ? "rgba(58,42,34,0.08)" : "none", color: saved ? "#3A2A22" : "#6B5A50", cursor: "pointer", fontSize: "0.8rem", fontFamily: "var(--font-ui)", fontWeight: 700 }}>
                <Bookmark size={14} fill={saved ? "#3A2A22" : "none"} /> Save
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.85rem", border: "1px solid rgba(58,42,34,0.2)", borderRadius: "999px", background: "none", color: "#6B5A50", cursor: "pointer", fontSize: "0.8rem", fontFamily: "var(--font-ui)", fontWeight: 700 }}>
                <Share2 size={14} /> Share
              </button>
            </div>
          ) : null}

          <section style={{ display: "grid", gap: "3rem", marginBottom: "2.5rem" }}>
            {sortedDestinations.map((destination) => {
              const pointTitle = destination.title || destination.placeName || `Point ${destination.order}`;
              const date = destination.dateVisited || destination.plannedDate || "Date pending";
              const time = destination.plannedTime ? ` ${destination.plannedTime}` : "";
              const pointPhotos = (destination.photos ?? []).map((photo) => photo.trim()).filter(Boolean);
              const primaryPhoto = pointPhotos[0];
              const extraPhotos = pointPhotos.slice(1, 4);
              const isEditing = editingDestinationId === destination.id;
              const canWriteDestination = editable && plannedMomentHasArrived(destination);
              return (
                <article
                  key={destination.id}
                  draggable={editable}
                  onDragStart={() => setDraggedDestinationId(destination.id)}
                  onDragOver={(event) => {
                    if (editable) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedDestinationId) reorderDestination(draggedDestinationId, destination.id);
                  }}
                  title={editable ? "Double-click to edit. Drag this point onto another point to reorder." : undefined}
                  style={{ borderTop: "1px solid rgba(58,42,34,0.14)", paddingTop: "2rem", cursor: editable ? "grab" : "default" }}
                >
                  <p
                    onDoubleClick={() => {
                      if (editable) setEditingDestinationId(destination.id);
                    }}
                    style={{ margin: "0 0 0.8rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9E6B5C" }}
                  >
                    Point {destination.order} of {sortedDestinations.length}
                  </p>
                  <div
                    onDoubleClick={() => {
                      if (editable) setEditingDestinationId(destination.id);
                    }}
                    style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}
                  >
                    <h2 style={{ margin: 0, flex: "1 1 20rem", fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.4rem)", fontWeight: 600, lineHeight: 1.05, color: "#3A2A22" }}>{pointTitle}</h2>
                    <span style={{ flexShrink: 0, border: "1px solid rgba(58,42,34,0.16)", borderRadius: "999px", padding: "0.55rem 1rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A2A22" }}>
                      Day {destination.plannedDay}
                    </span>
                  </div>
                  <div
                    onDoubleClick={() => {
                      if (editable) setEditingDestinationId(destination.id);
                    }}
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", borderTop: "1px solid rgba(58,42,34,0.12)", borderBottom: "1px solid rgba(58,42,34,0.12)", padding: "0.9rem 0", marginBottom: "1.5rem", fontFamily: "var(--font-ui)", fontSize: "0.86rem", color: "#5B4A40" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}><MapPin size={14} />{destination.placeName}</span>
                    <span>{destination.coordinate.lat.toFixed(4)}, {destination.coordinate.lon.toFixed(4)}</span>
                    {destination.category ? <span>{destination.category}</span> : null}
                    <span>{date}{time}</span>
                  </div>

                  {isEditing ? (
                    <div
                      onDoubleClick={(event) => event.stopPropagation()}
                      style={{ marginBottom: "1.5rem", border: "1px solid rgba(196,113,58,0.24)", backgroundColor: "#EFE7DC", borderRadius: "0.65rem", padding: "1rem", display: "grid", gap: "0.85rem" }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                        <label style={{ display: "grid", gap: "0.35rem", fontFamily: "var(--font-ui)", fontSize: "0.78rem", fontWeight: 700, color: "#5B4A40" }}>
                          Point number
                          <input type="number" min={1} max={sortedDestinations.length} value={destination.order} onChange={(event) => updateDestinationOrder(destination.id, Math.max(1, Number(event.target.value) || destination.order))} style={{ border: "1px solid rgba(58,42,34,0.18)", background: "#FBF7F0", borderRadius: "0.45rem", padding: "0.65rem 0.75rem", fontFamily: "var(--font-ui)", color: "#2C211C" }} />
                        </label>
                        <label style={{ display: "grid", gap: "0.35rem", fontFamily: "var(--font-ui)", fontSize: "0.78rem", fontWeight: 700, color: "#5B4A40" }}>
                          Place name
                          <input value={destination.placeName} onChange={(event) => updateDestination(destination.id, { placeName: event.target.value })} placeholder="Place name" style={{ border: "1px solid rgba(58,42,34,0.18)", background: "#FBF7F0", borderRadius: "0.45rem", padding: "0.65rem 0.75rem", fontFamily: "var(--font-ui)", color: "#2C211C" }} />
                        </label>
                        <label style={{ display: "grid", gap: "0.35rem", fontFamily: "var(--font-ui)", fontSize: "0.78rem", fontWeight: 700, color: "#5B4A40" }}>
                          Category
                          <select value={destination.category ?? ""} onChange={(event) => updateDestination(destination.id, { category: event.target.value })} style={{ border: "1px solid rgba(58,42,34,0.18)", background: "#FBF7F0", borderRadius: "0.45rem", padding: "0.65rem 0.75rem", fontFamily: "var(--font-ui)", color: "#2C211C" }}>
                            <option value="">Choose category</option>
                            {planCategories.filter((item) => item !== "All").map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </label>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
                        <label style={{ display: "grid", gap: "0.35rem", fontFamily: "var(--font-ui)", fontSize: "0.78rem", fontWeight: 700, color: "#5B4A40" }}>
                          Day
                          <input type="number" min={1} value={destination.plannedDay} onChange={(event) => updateDestination(destination.id, { plannedDay: Math.max(1, Number(event.target.value) || 1) })} style={{ border: "1px solid rgba(58,42,34,0.18)", background: "#FBF7F0", borderRadius: "0.45rem", padding: "0.65rem 0.75rem", fontFamily: "var(--font-ui)", color: "#2C211C" }} />
                        </label>
                        <label style={{ display: "grid", gap: "0.35rem", fontFamily: "var(--font-ui)", fontSize: "0.78rem", fontWeight: 700, color: "#5B4A40" }}>
                          Planned date
                          <input type="date" value={destination.plannedDate ?? ""} onChange={(event) => updateDestination(destination.id, { plannedDate: event.target.value })} style={{ border: "1px solid rgba(58,42,34,0.18)", background: "#FBF7F0", borderRadius: "0.45rem", padding: "0.65rem 0.75rem", fontFamily: "var(--font-ui)", color: "#2C211C" }} />
                        </label>
                        <label style={{ display: "grid", gap: "0.35rem", fontFamily: "var(--font-ui)", fontSize: "0.78rem", fontWeight: 700, color: "#5B4A40" }}>
                          Planned time
                          <input type="time" value={destination.plannedTime ?? ""} onChange={(event) => updateDestination(destination.id, { plannedTime: event.target.value })} style={{ border: "1px solid rgba(58,42,34,0.18)", background: "#FBF7F0", borderRadius: "0.45rem", padding: "0.65rem 0.75rem", fontFamily: "var(--font-ui)", color: "#2C211C" }} />
                        </label>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="button" onClick={() => setEditingDestinationId(null)} style={{ border: "1px solid #3A2A22", backgroundColor: "#3A2A22", color: "#FBF7F0", borderRadius: "999px", padding: "0.62rem 1rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                          Done editing
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {primaryPhoto ? (
                    <img src={primaryPhoto} alt={pointTitle} style={{ width: "100%", height: "clamp(240px, 42vw, 440px)", objectFit: "cover", display: "block", borderRadius: "0.35rem", marginBottom: "1rem" }} />
                  ) : (
                    <div style={{ display: "grid", placeItems: "center", height: "clamp(220px, 36vw, 360px)", backgroundColor: "#EFE7DC", border: "1px dashed rgba(58,42,34,0.24)", borderRadius: "0.35rem", marginBottom: "1rem", fontFamily: "var(--font-label)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7A685E" }}>
                      Add photo here
                    </div>
                  )}
                  {extraPhotos.length ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1.25rem" }}>
                      {extraPhotos.map((photo) => <img key={photo} src={photo} alt="" style={{ width: "100%", height: 112, objectFit: "cover", borderRadius: "0.35rem" }} />)}
                    </div>
                  ) : null}

                  {editingDescriptionId === destination.id ? (
                    <div onDoubleClick={(event) => event.stopPropagation()} style={{ marginBottom: "1.25rem" }}>
                      <textarea
                        value={descriptionDraft}
                        onChange={(event) => setDescriptionDraft(event.target.value)}
                        rows={7}
                        autoFocus
                        placeholder="Type here"
                        style={{ width: "100%", boxSizing: "border-box", border: "none", borderBottom: "1px solid rgba(58,42,34,0.18)", background: "transparent", outline: "none", resize: "vertical", padding: "0 0 0.75rem", fontFamily: "var(--font-body)", fontSize: "clamp(1.05rem, 1.7vw, 1.2rem)", lineHeight: 1.85, color: "#1A1A1A" }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
                        <button type="button" onClick={() => confirmDescriptionEdit(destination.id)} style={{ border: "1px solid #3A2A22", backgroundColor: "#3A2A22", color: "#FBF7F0", borderRadius: "999px", padding: "0.55rem 0.95rem", fontFamily: "var(--font-label)", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                          Confirm
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDoubleClick={(event) => {
                        event.stopPropagation();
                        if (canWriteDestination) startDescriptionEdit(destination);
                      }}
                      title={canWriteDestination ? "Double-click to write this description." : "This can be written once the scheduled date and time arrives."}
                    >
                      {(destination.description || "TYPE HERE").split("\n\n").map((paragraph) => (
                        <p key={paragraph} style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1.05rem, 1.7vw, 1.2rem)", lineHeight: 1.85, color: destination.description ? "#1A1A1A" : "#7A685E", marginBottom: "1.25rem" }}>{paragraph}</p>
                      ))}
                    </div>
                  )}

                  <div
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      startNoteEdit(destination);
                    }}
                    title={editable ? "Double-click to write this route note." : undefined}
                    style={{ marginTop: "1.5rem", border: "1px solid rgba(196,113,58,0.2)", backgroundColor: "#EFE7DC", borderRadius: "0.45rem", padding: "1.25rem" }}
                  >
                    <p style={{ margin: "0 0 0.45rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E6B5C" }}>Route note</p>
                    {editingNoteId === destination.id ? (
                      <div onDoubleClick={(event) => event.stopPropagation()}>
                        <textarea
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          rows={3}
                          autoFocus
                          placeholder="Add a note about this stop."
                          style={{ width: "100%", boxSizing: "border-box", border: "none", borderBottom: "1px solid rgba(58,42,34,0.18)", background: "transparent", outline: "none", resize: "vertical", padding: "0 0 0.5rem", fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.7, color: "#5B4A40" }}
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
                          <button type="button" onClick={() => confirmNoteEdit(destination.id)} style={{ border: "1px solid #3A2A22", backgroundColor: "#3A2A22", color: "#FBF7F0", borderRadius: "999px", padding: "0.5rem 0.85rem", fontFamily: "var(--font-label)", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                            Confirm
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.7, color: destination.notes ? "#5B4A40" : "#7A685E" }}>{destination.notes || "ROUTE NOTE"}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          <section aria-labelledby="route-overview-title" style={{ borderTop: "1px solid rgba(58,42,34,0.12)", paddingTop: "1.75rem", margin: "0.5rem 0 1.75rem" }}>
            <div style={{ backgroundColor: "#EFE7DC", border: "1px solid rgba(58,42,34,0.14)", borderRadius: "0.9rem", padding: "clamp(2rem, 5vw, 2.5rem)", textAlign: "center" }}>
              <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div aria-hidden="true" style={{ width: 58, height: 58, borderRadius: "50%", display: "grid", placeItems: "center", backgroundColor: "rgba(196,113,58,0.12)", boxShadow: "0 0 0 9px rgba(196,113,58,0.06)", color: "#9E4F27", marginBottom: "1.05rem" }}>
                  <MapPin size={24} strokeWidth={1.8} />
                </div>
                <p style={{ margin: 0, fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9E4F27" }}>Route overview</p>
                <h3 id="route-overview-title" style={{ margin: "0.75rem auto 0", maxWidth: "32ch", fontFamily: "var(--font-display)", fontSize: "clamp(1.65rem, 4vw, 2.35rem)", fontWeight: 600, color: "#3A2A22", lineHeight: 1.08 }}>Want to explore this full route on your map?</h3>
                <p style={{ margin: "0.85rem auto 0", maxWidth: "40ch", fontFamily: "var(--font-body)", color: "#5B4A40", fontSize: "1rem", lineHeight: 1.7 }}>
                  Open {plan.destinations.length} points across {totalTravelDays(plan)} travel day{totalTravelDays(plan) === 1 ? "" : "s"} as one general journey route.
                </p>
                <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", marginTop: "1.15rem", borderRadius: "999px", border: "1px solid rgba(58,42,34,0.12)", backgroundColor: "rgba(251,247,240,0.72)", color: "#3A2A22", padding: "0.58rem 0.85rem", fontFamily: "var(--font-ui)", fontSize: "0.86rem", fontWeight: 750, lineHeight: 1.25 }}>
                  <LockKeyhole size={14} strokeWidth={2} />
                  <span>Route points are shown as general story locations, not live coordinates</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", marginTop: "1.45rem" }}>
                <button type="button" onClick={() => openTravelPlanRouteInMap(plan, navigate)} style={{ display: "inline-flex", minHeight: 46, minWidth: 188, alignItems: "center", justifyContent: "center", gap: "0.45rem", borderRadius: "999px", border: "1px solid #3A2A22", backgroundColor: "transparent", color: "#3A2A22", padding: "0.72rem 1.15rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                  <MapPin size={14} /> View This Route in the Map
                </button>
                <button type="button" onClick={() => openTravelPlanRouteInMap(plan, navigate)} style={{ display: "inline-flex", minHeight: 46, minWidth: 188, alignItems: "center", justifyContent: "center", gap: "0.45rem", borderRadius: "999px", border: "1px solid #3A2A22", backgroundColor: "#3A2A22", color: "#FBF7F0", padding: "0.72rem 1.15rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                  <MapPin size={14} /> Pin This Route
                </button>
              </div>
            </div>
          </section>

          {commentsAvailable ? (
          <div style={{ borderTop: "2px solid rgba(58,42,34,0.1)", paddingTop: "1.75rem", marginTop: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <MessageCircle size={18} color="#3A2A22" />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#3A2A22", margin: 0 }}>
                {comments.length} Comment{comments.length !== 1 ? "s" : ""}
              </h3>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.75rem" }}>
              <img src={user?.avatar || localAvatarDataUrl(user?.name ?? "You")} alt="You" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: "0.25rem" }} />
              <div style={{ flex: 1 }}>
                <textarea
                  value={commentInput}
                  onChange={(event) => setCommentInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) submitComment();
                  }}
                  placeholder="Share your thoughts on this travel plan..."
                  rows={2}
                  style={{ width: "100%", padding: "0.625rem 0.875rem", backgroundColor: "#EDEAE0", border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.5rem", fontSize: "0.9rem", color: "#1A1A1A", fontFamily: "var(--font-body)", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button onClick={submitComment} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 1rem", backgroundColor: commentInput.trim() ? "#3A2A22" : "#D8D4C8", color: "#F5F0E8", border: "none", borderRadius: "0.25rem", cursor: commentInput.trim() ? "pointer" : "default", fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", transition: "background 0.15s" }}>
                    <Send size={13} /> Post
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {comments.map((comment) => (
                <div key={comment.id} style={{ display: "flex", gap: "0.75rem" }}>
                  <img src={comment.avatar || localAvatarDataUrl(comment.author)} alt={comment.author} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ backgroundColor: "#EDEAE0", borderRadius: "0 0.75rem 0.75rem 0.75rem", padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <span style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.875rem", color: "#1A1A1A" }}>{comment.author}</span>
                        <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#9A9A8A" }}>{comment.time}</span>
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#1A1A1A", lineHeight: 1.65, margin: 0 }}>{comment.text}</p>
                    </div>
                    <button
                      onClick={() =>
                        setLikedComments((current) => {
                          const next = new Set(current);
                          next.has(comment.id) ? next.delete(comment.id) : next.add(comment.id);
                          return next;
                        })
                      }
                      style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: "none", cursor: "pointer", color: likedComments.has(comment.id) ? "#C4713A" : "#6B6B5A", fontFamily: "var(--font-ui)", fontSize: "0.78rem", padding: "0.3rem 0.25rem", marginTop: "0.25rem" }}
                    >
                      <Heart size={13} fill={likedComments.has(comment.id) ? "#C4713A" : "none"} />
                      {comment.likes + (likedComments.has(comment.id) ? 1 : 0)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          ) : null}
        </div>
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

  const allPlans = useMemo(() => plans, [plans]);

  const publicPlans = useMemo(() => allPlans.filter(isPublishedCompletedPlan).sort((a, b) => travelPlanPopularity(b) - travelPlanPopularity(a)), [allPlans]);

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();
    return publicPlans.filter((plan) => {
      const searchable = [plan.travelPlanName, plan.ownerName, plan.description ?? "", ...plan.destinations.map((destination) => destination.placeName)].join(" ").toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesCategory = category === "All" || plan.destinations.some((destination) => destination.category === category);
      return matchesSearch && matchesCategory;
    });
  }, [category, publicPlans, search]);

  const activeIndex = activePlanId ? filteredPlans.findIndex((plan) => plan.id === activePlanId) : -1;
  const activePlan = activeIndex >= 0 ? filteredPlans[activeIndex] : null;
  const activePlanIsListed = activeIndex >= 0;

  if (activePlan) {
    return (
      <TravelPlanArticleView
        plan={activePlan}
        onBack={() => setActivePlanId(null)}
        onPrev={() => setActivePlanId(filteredPlans[activeIndex - 1].id)}
        onNext={() => setActivePlanId(filteredPlans[activeIndex + 1].id)}
        hasPrev={activePlanIsListed && activeIndex > 0}
        hasNext={activePlanIsListed && activeIndex < filteredPlans.length - 1}
        editable={false}
        onPlanChange={(updatedPlan) => setPlans((current) => [updatedPlan, ...current.filter((plan) => plan.id !== updatedPlan.id)])}
      />
    );
  }

  return (
    <div className="travel-plan-index-shell" style={{ minHeight: "100vh", backgroundColor: "#F5F0E8", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header className="mb-10 travel-plan-page-heading">
          <p className="mb-2 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#9E6B5C]">Travel plan narratives</p>
          <h1 className="m-0 font-[var(--font-display)] text-5xl font-semibold leading-none text-[#3A2A22] sm:text-6xl">Travel Plans</h1>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <p className="mt-4 max-w-3xl font-[var(--font-body)] text-lg leading-8 text-[#5B4A40]">Multi-destination journeys from TravelTraces routes, saved as one readable itinerary story.</p>
            <button type="button" onClick={() => navigate("/maps")} style={{ display: "inline-flex", minHeight: 44, alignItems: "center", justifyContent: "center", gap: "0.45rem", borderRadius: "999px", border: "1px solid #3A2A22", backgroundColor: "#3A2A22", color: "#FBF7F0", padding: "0.65rem 1rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 10px 24px rgba(58,42,34,0.16)" }}>
              <MapPin size={14} /> Create with Draw Route
            </button>
          </div>
        </header>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#6B5A50" }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search travel plans, owners, places..."
              style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", backgroundColor: "#EFE7DC", border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.25rem", fontSize: "0.9rem", color: "#2C211C", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {planCategories.map((item) => {
              const Icon = PLAN_CATEGORY_ICON[item] ?? Compass;
              const isActive = category === item;
              const isAll = item === "All";
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className="travel-plan-category-pill"
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
                  {!isAll && <Icon size={14} color={isActive ? "#F5F0E8" : "#9E6B5C"} style={{ flexShrink: 0 }} />}
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredPlans.length > 0 && (
          <article
            onClick={() => setActivePlanId(filteredPlans[0].id)}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderRadius: "0.25rem", overflow: "hidden", backgroundColor: "#EDEAE0", marginBottom: "2rem", cursor: "pointer" }}
            className="featured-travel-plan-grid"
          >
            <PlanCoverFrame plan={filteredPlans[0]} height={380} />
            <div style={{ padding: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, color: "#3A2A22", lineHeight: 1.3, marginBottom: "1rem" }}>{filteredPlans[0].travelPlanName}</h2>
              <p style={{ fontFamily: "var(--font-body)", color: "#4A4A3A", lineHeight: 1.7, fontSize: "0.95rem", marginBottom: "1.5rem" }}>{planSubtitle(filteredPlans[0])}</p>
              <div>
                <p style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.875rem", color: "#1A1A1A" }}>{filteredPlans[0].ownerName}</p>
                <div style={{ display: "flex", gap: "0.75rem", color: "#6B6B5A", marginTop: "0.2rem", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><BookOpen size={11} />{filteredPlans[0].destinations.length} points</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><Clock size={11} />{planReadTime(filteredPlans[0])}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><Heart size={11} />{filteredPlans[0].likesCount ?? 0}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)", fontWeight: 700 }}><Compass size={11} />{completedDestinationCount(filteredPlans[0])}/{filteredPlans[0].destinations.length} complete</span>
                </div>
              </div>
            </div>
          </article>
        )}

        {filteredPlans.length === 0 ? (
          <div
            role="status"
            style={{
              border: "1px dashed rgba(58,42,34,0.2)",
              backgroundColor: "#FFF9F0",
              borderRadius: "0.5rem",
              padding: "clamp(2rem, 5vw, 4rem)",
              textAlign: "center",
              boxShadow: "0 18px 42px rgba(58,42,34,0.06)",
            }}
          >
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 600, lineHeight: 1.05, color: "#3A2A22" }}>
              No TravelPlan here yet
            </h2>
            <p style={{ margin: "1rem auto 0", maxWidth: 560, fontFamily: "var(--font-body)", fontSize: "1.05rem", lineHeight: 1.8, color: "#5B4A40" }}>
              Try another search term or category to find more public travel stories.
            </p>
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "1.5rem" }}>
          {filteredPlans.slice(1).map((plan) => (
            <article
              key={plan.id}
              onClick={() => setActivePlanId(plan.id)}
              className="travel-plan-card"
              style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform = "translateY(-2px)";
                event.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = "";
                event.currentTarget.style.boxShadow = "";
              }}
            >
              <PlanCoverFrame plan={plan} height={180} />
              <div style={{ padding: "1.25rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 600, color: "#3A2A22", lineHeight: 1.35, margin: "0 0 0.75rem" }}>{plan.travelPlanName}</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#4A4A3A", lineHeight: 1.6, marginBottom: "1rem" }}>{planSubtitle(plan).slice(0, 120)}...</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", fontWeight: 600, color: "#1A1A1A" }}>{plan.ownerName}</p>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "#6B6B5A" }}>{planDate(plan)}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#6B6B5A" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><Heart size={12} /> {plan.likesCount ?? 0}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><BookOpen size={12} /> {plan.destinations.length} points</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><Clock size={12} /> {planReadTime(plan)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .travel-plan-category-pill:hover { background-color: rgba(58,42,34,0.08); border-color: #3A2A22; color: #3A2A22; }
        .travel-plan-category-pill[aria-pressed="true"]:hover { background-color: #3A2A22; border-color: #3A2A22; color: #F5F0E8; }
        @media (max-width: 640px) {
          .featured-travel-plan-grid { grid-template-columns: 1fr !important; }
        }
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


