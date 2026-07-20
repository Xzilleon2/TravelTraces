import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Search, MapPin, Clock, Heart, Bookmark, Share2, ArrowLeft, ChevronLeft, ChevronRight, Send, MessageCircle, Compass, Mountain, Utensils, Gem, Waves, TreePine, Landmark, BookOpen, CalendarDays, CheckCircle2, FileText, LockKeyhole, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LargeEmptyState } from "../components/LargeEmptyState";
import { GatedPage } from "../components/GatedPage";
import { useAuth } from "../context/AuthContext";
import {
  albumUnlocked,
  canPublishTravelPlan,
  completedDestinationCount,
  readTravelPlanStories,
  totalTravelDays,
  travelPlanStatus,
  upsertTravelPlanStory,
  type TravelPlanDestination,
  type TravelPlanStory,
} from "../services/travelPlanStories";
import { deletePin, listPins, type ApiPin, type MapScope } from "../services/mappingApi";
import { publishWorkspaceEvent } from "../utils/workspaceSync";
import { deleteLocalStoryCascade, listLocalStories, placeholderImage, readLocalTable, writeLocalStories as writeLocalDbStories, writeLocalTable, type LocalStoryRecord } from "../services/localDb";
import { addStoryComment, readStoryEngagement, subscribeStoryEngagements, toggleStoryReaction, type StoryComment } from "../services/storyEngagements";
import { localAvatarDataUrl } from "../utils/localAvatar";

type StoryPhotoFrame = string | {
  preview_url?: string;
  thumbnail_url?: string;
  data_url?: string;
  object_position?: string;
};

export const SAVED_STORIES_KEY = "traveltraces.savedStories";
export const STORY_COLLECTIONS_KEY = "traveltraces.storyCollections";
export const DELETED_STORY_PIN_IDS_KEY = "traveltraces.deletedStoryPinIds";

const AUTHOR_KEY: Record<string, string> = {
  "Carlo Reyes": "carlo",
  "Ana Villanueva": "ana",
  "Ramon Dela Cruz": "ramon",
  "Leila Marcos": "leila",
  "Marco Buenaventura": "marco",
  "Sofia Reyes": "sofia",
};

const STORY_COMMENTS: Record<number, { id: number; author: string; avatar: string; text: string; time: string; likes: number }[]> = {};

export const STORY_PHOTOS: Record<number, string[]> = {};

export const STORIES: TravelStory[] = [];

const categories = ["All", "Hiking", "Food Place", "Hidden Gems", "Beaches", "Forest", "Culture", "More"];
const storyScopes = [
  { key: "public", label: "Public Stories", helper: "Stories shared with everyone" },
  { key: "mine", label: "My Stories", helper: "Stories you posted" },
  { key: "group", label: "Collab Stories", helper: "Stories shared with your groups" },
] as const;
type StoryScopeFilter = (typeof storyScopes)[number]["key"];

const STORY_CATEGORY_ICON: Record<string, typeof Compass> = {
  Hiking: Mountain,
  "Food Place": Utensils,
  "Hidden Gems": Gem,
  Beaches: Waves,
  Forest: TreePine,
  Culture: Landmark,
  More: Compass,
};
export type TravelStory = LocalStoryRecord;

function readLocalStories(): TravelStory[] {
  return listLocalStories() as TravelStory[];
}

function writeLocalStories(stories: TravelStory[]) {
  writeLocalDbStories(stories);
}

function rememberDeletedStoryPin(storyId: number) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DELETED_STORY_PIN_IDS_KEY) ?? "[]") as number[];
    const current = Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
    window.localStorage.setItem(DELETED_STORY_PIN_IDS_KEY, JSON.stringify(Array.from(new Set([storyId, ...current]))));
  } catch {
    window.localStorage.setItem(DELETED_STORY_PIN_IDS_KEY, JSON.stringify([storyId]));
  }
  window.dispatchEvent(new CustomEvent("traveltraces:story-pin-deleted", { detail: { storyId } }));
}

function readSavedStoryIds(): number[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_STORIES_KEY) ?? "[]") as number[];
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

function writeSavedStoryIds(ids: number[]) {
  window.localStorage.setItem(SAVED_STORIES_KEY, JSON.stringify(Array.from(new Set(ids))));
  window.dispatchEvent(new CustomEvent("traveltraces:saved-stories-updated"));
}

export const STORY_MAP_POINTS: Record<number, { place: string; coordinate: { lat: number; lon: number } }> = {
  1: { place: "El Nido, Palawan", coordinate: { lat: 11.1956, lon: 119.4075 } },
  2: { place: "Basco, Batanes", coordinate: { lat: 20.4487, lon: 121.9702 } },
  3: { place: "Banaue Rice Terraces, Ifugao", coordinate: { lat: 16.919, lon: 121.0593 } },
  4: { place: "General Luna, Siargao", coordinate: { lat: 9.7843, lon: 126.1589 } },
  5: { place: "Angeles, Pampanga", coordinate: { lat: 15.146, lon: 120.5887 } },
  6: { place: "Hundred Islands, Pangasinan", coordinate: { lat: 16.2076, lon: 119.9706 } },
};

function formatStoryCoordinates(point?: { coordinate: { lat: number; lon: number } }): string {
  return point ? `${point.coordinate.lat.toFixed(4)}, ${point.coordinate.lon.toFixed(4)}` : "";
}

function estimateStoryReadTime(story: Pick<TravelStory, "body" | "excerpt" | "readTime">): string {
  const existing = String(story.readTime ?? "").trim();
  if (existing && !/draft/i.test(existing)) return existing.replace(/\s*read$/i, "");
  const source = `${story.body ?? ""} ${story.excerpt ?? ""}`.trim();
  const words = source ? source.split(/\s+/).filter(Boolean).length : 0;
  return `${Math.max(1, Math.ceil(words / 180))} min`;
}

function storyPostedDate(story: TravelStory): string {
  const parsed = new Date(story.createdAt ?? story.date);
  if (Number.isNaN(parsed.getTime())) return story.date || "Recently";
  return parsed.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function storyRelativeTime(story: TravelStory): string {
  const parsed = new Date(story.createdAt ?? story.date);
  if (Number.isNaN(parsed.getTime())) return story.date || "recently";
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

function isSensitiveStory(story: Pick<TravelStory, "title" | "category" | "excerpt" | "body" | "region">): boolean {
  const text = [story.title, story.category, story.excerpt, story.body, story.region].join(" ").toLowerCase();
  return /\b(wildlife|endangered|protected|habitat|sanctuary|nesting|conservation|eagle|tarsier|turtle|marine reserve|coral reef|reef sanctuary)\b/.test(text);
}

function cleanLocationParts(value?: string): string[] {
  const rawParts = String(value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const streetLevelPattern = /\b(purok|road|rd\.?|street|st\.?|avenue|ave\.?|barangay|brgy\.?|blk|block|lot|phase|subdivision|sitio|zone|proper|drive|dr\.?)\b/i;
  return rawParts.filter((part) => {
    const normalized = part.replace(/\s+/g, " ").toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    if (/^\d{4,6}$/.test(normalized)) return false;
    return !streetLevelPattern.test(normalized);
  });
}

function generalizeStoryLocation(story: Pick<TravelStory, "title" | "category" | "excerpt" | "body" | "region" | "storyPoint">): string {
  const sensitive = isSensitiveStory(story);
  const source = story.storyPoint?.place ?? story.region;
  const parts = cleanLocationParts(source);
  const withoutCountry = parts.filter((part) => part.toLowerCase() !== "philippines");
  const usable = withoutCountry.length ? withoutCountry : parts;
  if (!usable.length) return sensitive ? "Protected location" : "Location shared privately";
  if (sensitive) return usable.slice(-2).join(", ") || "Protected location";
  return usable.slice(0, 2).join(", ");
}

function shouldHidePreciseLocation(story: Pick<TravelStory, "title" | "category" | "excerpt" | "body" | "region">): boolean {
  return isSensitiveStory(story);
}

function preferenceScore(category: string, interests: string[] = []): number {
  const normalizedCategory = category.toLowerCase();
  return interests.some((interest) => normalizedCategory.includes(interest.toLowerCase()) || interest.toLowerCase().includes(normalizedCategory)) ? 1 : 0;
}

function storyPhotoUrl(photo: StoryPhotoFrame | undefined, fallback = ""): string {
  if (!photo) return fallback;
  if (typeof photo === "string") return photo.trim() || fallback;
  return String(photo.data_url ?? photo.preview_url ?? photo.thumbnail_url ?? fallback);
}

function safeStoryImageUrl(src: string | undefined, label: string): string {
  const value = String(src ?? "").trim();
  return value || placeholderImage(label);
}

function linkedPinStoryId(pin: ApiPin): number | null {
  const media = pin.media as { storyId?: unknown; storyDraftId?: unknown } | null;
  const linkedId = Number(media?.storyId ?? media?.storyDraftId);
  if (Number.isFinite(linkedId)) return linkedId;
  const generated = String(pin.pin_id).match(/^(story-|local-marker-)(\d+)$/);
  return generated ? Number(generated[2]) : null;
}

function storyPhotoPosition(photo: StoryPhotoFrame | undefined, fallback = "center center"): string {
  if (!photo || typeof photo === "string") return fallback;
  return typeof photo.object_position === "string" && photo.object_position.trim() ? photo.object_position : fallback;
}

export function StoryArticleView({ story, onBack, onPrev, onNext, hasPrev, hasNext, onDelete, onVisibilityChange, onEditStory }: {
  story: TravelStory;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onDelete?: (story: TravelStory) => void;
  onVisibilityChange?: (story: TravelStory, scope: MapScope) => void;
  onEditStory?: (story: TravelStory) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<StoryComment[]>(() => readStoryEngagement(story.id).comments);
  const [reactionCount, setReactionCount] = useState(() => readStoryEngagement(story.id).reactions.length);
  const [commentInput, setCommentInput] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [photoIndex, setPhotoIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draftStory, setDraftStory] = useState(() => ({
    title: story.title,
    excerpt: story.excerpt,
    category: story.category,
    body: story.body,
  }));

  const localPhotos = Array.isArray(story.photos) && story.photos.length ? story.photos : null;
  const photos = localPhotos ?? STORY_PHOTOS[story.id] ?? [story.img];
  const activePhoto = photos[photoIndex] ?? photos[0];
  const activePhotoUrl = safeStoryImageUrl(storyPhotoUrl(activePhoto, story.img), story.title);
  const activePhotoPosition = storyPhotoPosition(activePhoto, story.imagePosition ?? "center center");
  const hasMultiplePhotos = photos.length > 1;
  const storyPoint = story.storyPoint ?? STORY_MAP_POINTS[story.id];
  const storyLocation = generalizeStoryLocation(story);
  const storyReadTime = estimateStoryReadTime(story);
  const preciseLocationHidden = shouldHidePreciseLocation(story);
  const isOwner = Boolean(user && (story.ownerId === user.id || story.author === user.name));
  const visibleLikes = Math.max(story.likes ?? 0, reactionCount);
  const actionButtonStyle = (active = false): React.CSSProperties => ({
    display: "inline-flex",
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: "0.42rem",
    padding: "0.5rem 0.85rem",
    border: "1px solid",
    borderColor: active ? "#C4713A" : "rgba(58,42,34,0.22)",
    borderRadius: "999px",
    background: active ? "rgba(196,113,58,0.1)" : "#FBF7F0",
    color: active ? "#9E4F27" : "#4A3A32",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontFamily: "var(--font-ui)",
    fontWeight: 700,
    lineHeight: 1,
  });

  useEffect(() => {
    const engagement = readStoryEngagement(story.id);
    setLiked(Boolean(user && engagement.reactions.some((reaction) => reaction.userId === user.id)));
    setSaved(readSavedStoryIds().includes(story.id));
    setComments(engagement.comments);
    setReactionCount(engagement.reactions.length);
    setCommentInput("");
    setLikedComments(new Set());
    setPhotoIndex(0);
    setEditing(false);
    setDraftStory({ title: story.title, excerpt: story.excerpt, category: story.category, body: story.body });
    return subscribeStoryEngagements(story.id, (next) => {
      setComments(next.comments);
      setReactionCount(next.reactions.length);
      setLiked(Boolean(user && next.reactions.some((reaction) => reaction.userId === user.id)));
    });
  }, [story, user]);

  const submitComment = () => {
    if (!commentInput.trim()) return;
    const newComment = addStoryComment(story.id, {
      userId: user?.id ?? "guest",
      author: user?.name ?? "You",
      avatar: user?.avatar || localAvatarDataUrl(user?.name ?? "You"),
      text: commentInput.trim(),
    });
    setComments((prev) => [...prev, newComment]);
    setCommentInput("");
  };

  const handleLikeStory = () => {
    if (!user) return;
    const next = toggleStoryReaction(story.id, user.id);
    setLiked(next.reactions.some((reaction) => reaction.userId === user.id));
    setReactionCount(next.reactions.length);
  };

  const handleSaveStory = () => {
    const savedIds = readSavedStoryIds();
    const nextSaved = !saved;
    writeSavedStoryIds(nextSaved ? [story.id, ...savedIds] : savedIds.filter((id) => id !== story.id));
    setSaved(nextSaved);
  };

  const handlePinStoryLocation = () => {
    if (storyPoint) {
      window.localStorage.setItem(
        "traveltraces.pendingStoryPin",
        JSON.stringify({
          storyId: story.id,
          title: story.title,
          place: storyPoint.place,
          coordinate: storyPoint.coordinate,
        }),
      );
    }
    navigate("/maps");
  };

  const handleViewStoryPin = () => {
    if (storyPoint) {
      window.localStorage.setItem(
        "traveltraces.pendingStoryViewPin",
        JSON.stringify({
          storyId: story.id,
          title: story.title,
          place: storyPoint.place,
          coordinate: storyPoint.coordinate,
        }),
      );
    }
    navigate("/maps");
  };

  const viewProfile = (name: string) => {
    const key = AUTHOR_KEY[name];
    if (key) navigate(`/profile/${key}`);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FBF7F0", padding: "2rem clamp(1rem, 4vw, 2rem) 5rem" }}>
      <article style={{ width: "min(100%, 1120px)", margin: "0 auto", backgroundColor: "#FBF7F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
          <button
            onClick={onBack}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", border: "1px solid rgba(58,42,34,0.18)", background: "transparent", color: "#3A2A22", borderRadius: "999px", padding: "0.55rem 1rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            <ArrowLeft size={15} /> Stories
          </button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {hasPrev && (
              <button aria-label="Previous story" onClick={onPrev} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "1px solid rgba(58,42,34,0.18)", background: "transparent", color: "#3A2A22", borderRadius: "999px", padding: "0.55rem 0.9rem", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: "0.82rem", fontWeight: 700 }}>
                <ChevronLeft size={16} /> Previous
              </button>
            )}
            {hasNext && (
              <button aria-label="Next story" onClick={onNext} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "1px solid rgba(58,42,34,0.18)", background: "transparent", color: "#3A2A22", borderRadius: "999px", padding: "0.55rem 0.9rem", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: "0.82rem", fontWeight: 700 }}>
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        <header style={{ width: "min(100%, 780px)", margin: "0 auto 2rem", textAlign: "left" }}>
          <span style={{ display: "inline-flex", padding: "0.28rem 0.75rem", backgroundColor: "rgba(196,113,58,0.1)", border: "1px solid rgba(196,113,58,0.25)", borderRadius: "999px", fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#C4713A", marginBottom: "1rem" }}>
            {story.category}
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.45rem, 7vw, 5rem)", fontWeight: 600, color: "#1A1A1A", lineHeight: 0.98, letterSpacing: 0, marginBottom: "1rem" }}>{story.title}</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1.05rem, 2vw, 1.35rem)", lineHeight: 1.65, color: "#4A4A3A", margin: "0 0 1.35rem" }}>{story.excerpt}</p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", borderTop: "1px solid rgba(58,42,34,0.14)", borderBottom: "1px solid rgba(58,42,34,0.14)", padding: "1rem 0", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flex: "1 1 22rem", minWidth: 0 }}>
              <button onClick={() => viewProfile(story.author)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <img src={story.authorAvatar || localAvatarDataUrl(story.author)} alt={story.author} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", display: "block" }} />
              </button>
              <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                <button onClick={() => viewProfile(story.author)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: "0.96rem", color: "#1A1A1A" }}>{story.author}</button>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#5B4A40", flexWrap: "wrap", marginTop: "0.22rem", fontFamily: "var(--font-ui)", fontSize: "0.8rem", minWidth: 0, overflow: "visible" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.28rem", color: "#5B4A40", whiteSpace: "nowrap", flex: "0 0 auto" }}><Clock size={13} strokeWidth={2} />Posted {storyPostedDate(story)}</span>
                  <span aria-hidden="true" style={{ color: "#9E8E7D" }}>•</span>
                  <span style={{ color: "#5B4A40", whiteSpace: "nowrap", flex: "0 0 auto" }}>{storyRelativeTime(story)}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {story.local && isOwner && editing ? (
          <section style={{ width: "min(100%, 780px)", margin: "0 auto 2rem", border: "1px solid rgba(58,42,34,0.14)", borderRadius: "0.75rem", background: "#EFE7DC", padding: "1rem", display: "grid", gap: "0.85rem" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-label)", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E4F27" }}>Edit Story</p>
            <input value={draftStory.title} onChange={(event) => setDraftStory((current) => ({ ...current, title: event.target.value }))} placeholder="Story title" style={{ minHeight: 44, border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.5rem", background: "#FBF7F0", padding: "0 0.75rem", fontFamily: "var(--font-ui)", color: "#2C211C" }} />
            <input value={draftStory.excerpt} onChange={(event) => setDraftStory((current) => ({ ...current, excerpt: event.target.value }))} placeholder="Subtitle or short intro" style={{ minHeight: 44, border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.5rem", background: "#FBF7F0", padding: "0 0.75rem", fontFamily: "var(--font-ui)", color: "#2C211C" }} />
            <select value={draftStory.category} onChange={(event) => setDraftStory((current) => ({ ...current, category: event.target.value }))} style={{ minHeight: 44, border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.5rem", background: "#FBF7F0", padding: "0 0.75rem", fontFamily: "var(--font-ui)", color: "#2C211C" }}>
              {categories.filter((item) => item !== "All").map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <textarea value={draftStory.body} onChange={(event) => setDraftStory((current) => ({ ...current, body: event.target.value }))} rows={8} placeholder="Story body" style={{ resize: "vertical", border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.5rem", background: "#FBF7F0", padding: "0.75rem", fontFamily: "var(--font-body)", lineHeight: 1.7, color: "#2C211C" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setEditing(false)} style={{ minHeight: 40, border: "1px solid rgba(58,42,34,0.18)", borderRadius: 999, background: "transparent", padding: "0 1rem", fontWeight: 800, color: "#3A2A22" }}>Cancel</button>
              <button
                type="button"
                onClick={() => {
                  if (!draftStory.title.trim() || !draftStory.body.trim()) return;
                  onEditStory?.({ ...story, ...draftStory, title: draftStory.title.trim(), body: draftStory.body.trim(), excerpt: draftStory.excerpt.trim(), updatedAt: new Date().toISOString() });
                  setEditing(false);
                }}
                style={{ minHeight: 40, border: "1px solid #3A2A22", borderRadius: 999, background: "#3A2A22", padding: "0 1rem", fontWeight: 800, color: "#FBF7F0" }}
              >
                Save Story
              </button>
            </div>
          </section>
        ) : null}

        {/* Photo carousel */}
        <figure style={{ position: "relative", margin: "0 0 2.5rem" }}>
          <img src={activePhotoUrl} alt={`${story.title} photo ${photoIndex + 1}`} style={{ width: "100%", height: "clamp(300px, 58vw, 620px)", objectFit: "cover", objectPosition: activePhotoPosition, display: "block", borderRadius: "0.35rem" }} />
          {hasMultiplePhotos && (
            <>
              <button
                aria-label="Previous photo"
                onClick={() => setPhotoIndex((current) => (current - 1 + photos.length) % photos.length)}
                style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(58,42,34,0.5)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#FBF7F0" }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                aria-label="Next photo"
                onClick={() => setPhotoIndex((current) => (current + 1) % photos.length)}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(58,42,34,0.5)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#FBF7F0" }}
              >
                <ChevronRight size={20} />
              </button>
              <div style={{ position: "absolute", bottom: "1.1rem", right: "1.5rem", display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(26,26,26,0.45)", borderRadius: "999px", padding: "0.35rem 0.55rem" }}>
                {photos.map((_, index) => (
                  <button
                    key={index}
                    aria-label={`Show photo ${index + 1}`}
                    onClick={() => setPhotoIndex(index)}
                    style={{ width: index === photoIndex ? 18 : 7, height: 7, borderRadius: "999px", border: "none", backgroundColor: index === photoIndex ? "#FBF7F0" : "rgba(251,247,240,0.45)", padding: 0, cursor: "pointer" }}
                  />
                ))}
              </div>
            </>
          )}
          <figcaption style={{ width: "min(100%, 780px)", margin: "0.75rem auto 0", fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "#5B4A40" }}>
            Photo {photoIndex + 1} of {photos.length} from {storyLocation}.
          </figcaption>
        </figure>

        {/* Content */}
        <div style={{ width: "min(100%, 780px)", margin: "0 auto" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-label)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E6B5C", marginBottom: "0.9rem" }}>Description</h3>
            {story.body.split("\n\n").map((para, i) => (
              <p key={i} style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1.05rem, 1.7vw, 1.2rem)", lineHeight: 1.85, color: "#1A1A1A", marginBottom: "1.45rem" }}>{para}</p>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.65rem", flexWrap: "wrap", borderTop: "1px solid rgba(58,42,34,0.12)", borderBottom: "1px solid rgba(58,42,34,0.12)", padding: "1rem 0", margin: "0.25rem 0 2rem" }}>
            <button onClick={handleLikeStory} style={actionButtonStyle(liked)} aria-label={liked ? "Unlike story" : "Like story"}>
              <Heart size={15} strokeWidth={2} fill={liked ? "#C4713A" : "none"} /> {visibleLikes > 0 ? visibleLikes : "Like"}
            </button>
            <button onClick={handleSaveStory} style={actionButtonStyle(saved)} aria-label={saved ? "Remove saved story" : "Save story"}>
              <Bookmark size={15} strokeWidth={2} fill={saved ? "#C4713A" : "none"} /> Save
            </button>
            <button style={actionButtonStyle()} aria-label="Share story">
              <Share2 size={15} strokeWidth={2} /> Share
            </button>
            {story.local && isOwner && onEditStory ? (
              <button onClick={() => setEditing((value) => !value)} style={actionButtonStyle(editing)} aria-label={`Edit ${story.title}`}>
                <FileText size={15} strokeWidth={2} /> Edit
              </button>
            ) : null}
            {story.local && isOwner && onVisibilityChange ? (
              <label style={{ display: "inline-flex", minHeight: 40, alignItems: "center", gap: "0.5rem", border: "1px solid rgba(58,42,34,0.22)", borderRadius: 999, background: "#FBF7F0", padding: "0.35rem 0.7rem", color: "#4A3A32", fontFamily: "var(--font-ui)", fontSize: "0.8rem", fontWeight: 700 }}>
                Visibility
                <select
                  value={story.scope ?? "private"}
                  onChange={(event) => onVisibilityChange(story, event.target.value as MapScope)}
                  style={{ border: "none", background: "transparent", color: "#3A2A22", font: "inherit", outline: "none" }}
                  aria-label="Change story visibility"
                >
                  <option value="public">Public</option>
                  <option value="group">Friends Only</option>
                  <option value="private">Private</option>
                </select>
              </label>
            ) : null}
            {story.local && isOwner && onDelete ? (
              <button onClick={() => onDelete(story)} style={{ ...actionButtonStyle(), borderColor: "rgba(138,47,37,0.42)", background: "#FBF7F0", color: "#7F2F25" }} aria-label={`Delete ${story.title}`}>
                <Trash2 size={15} strokeWidth={2} /> Delete
              </button>
            ) : null}
          </div>

          {storyPoint ? (
            <section aria-labelledby="share-trace-title" style={{ borderTop: "1px solid rgba(58,42,34,0.12)", paddingTop: "1.75rem", margin: "0.5rem 0 1.75rem" }}>
              <div style={{ backgroundColor: "#EFE7DC", border: "1px solid rgba(58,42,34,0.14)", borderRadius: "0.9rem", padding: "clamp(2rem, 5vw, 2.5rem)", textAlign: "center" }}>
                <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div aria-hidden="true" style={{ width: 58, height: 58, borderRadius: "50%", display: "grid", placeItems: "center", backgroundColor: "rgba(196,113,58,0.12)", boxShadow: "0 0 0 9px rgba(196,113,58,0.06)", color: "#9E4F27", marginBottom: "1.05rem" }}>
                    <MapPin size={24} strokeWidth={1.8} />
                  </div>
                  <p style={{ margin: 0, fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9E4F27" }}>Share your own trace</p>
                  <h3 id="share-trace-title" style={{ margin: "0.75rem auto 0", maxWidth: "32ch", fontFamily: "var(--font-display)", fontSize: "clamp(1.65rem, 4vw, 2.35rem)", fontWeight: 600, color: "#3A2A22", lineHeight: 1.08 }}>Want to share your own story of this location?</h3>
                  <p style={{ margin: "0.85rem auto 0", maxWidth: "40ch", fontFamily: "var(--font-body)", color: "#5B4A40", fontSize: "1rem", lineHeight: 1.7 }}>Pin {storyLocation} on your map and write what happened there.</p>
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", marginTop: "1.15rem", borderRadius: "999px", border: "1px solid rgba(58,42,34,0.12)", backgroundColor: "rgba(251,247,240,0.72)", color: "#3A2A22", padding: "0.58rem 0.85rem", fontFamily: "var(--font-ui)", fontSize: "0.86rem", fontWeight: 750, lineHeight: 1.25 }}>
                    <LockKeyhole size={14} strokeWidth={2} />
                    <span>Exact coordinates are protected for this story</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", marginTop: "1.45rem" }}>
                  <button
                    type="button"
                    onClick={handleViewStoryPin}
                    style={{ display: "inline-flex", minHeight: 46, minWidth: 188, alignItems: "center", justifyContent: "center", gap: "0.45rem", borderRadius: "999px", border: "1px solid #3A2A22", backgroundColor: "transparent", color: "#3A2A22", padding: "0.72rem 1.15rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}
                  >
                    <MapPin size={14} /> View This Pin in the Map
                  </button>
                  <button
                    type="button"
                    onClick={handlePinStoryLocation}
                    style={{ display: "inline-flex", minHeight: 46, minWidth: 188, alignItems: "center", justifyContent: "center", gap: "0.45rem", borderRadius: "999px", border: "1px solid #3A2A22", backgroundColor: "#3A2A22", color: "#FBF7F0", padding: "0.72rem 1.15rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}
                  >
                    <MapPin size={14} /> Pin This
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {/* Comments */}
          <div style={{ borderTop: "2px solid rgba(58,42,34,0.1)", paddingTop: "1.75rem", marginTop: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <MessageCircle size={18} color="#3A2A22" />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#3A2A22", margin: 0 }}>
                {comments.length} Comment{comments.length !== 1 ? "s" : ""}
              </h3>
            </div>

            {/* Comment input */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.75rem" }}>
              <img
                src={user?.avatar || localAvatarDataUrl(user?.name ?? "You")}
                alt="You"
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: "0.25rem" }}
              />
              <div style={{ flex: 1 }}>
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitComment(); }}
                  placeholder="Share your thoughts on this story…"
                  rows={2}
                  style={{ width: "100%", padding: "0.625rem 0.875rem", backgroundColor: "#EDEAE0", border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.5rem", fontSize: "0.9rem", color: "#1A1A1A", fontFamily: "var(--font-body)", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    onClick={submitComment}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 1rem", backgroundColor: commentInput.trim() ? "#3A2A22" : "#D8D4C8", color: "#F5F0E8", border: "none", borderRadius: "0.25rem", cursor: commentInput.trim() ? "pointer" : "default", fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", transition: "background 0.15s" }}
                  >
                    <Send size={13} /> Post
                  </button>
                </div>
              </div>
            </div>

            {/* Comment list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {comments.map((c) => (
                <div key={c.id} style={{ display: "flex", gap: "0.75rem" }}>
                  <img src={c.avatar || localAvatarDataUrl(c.author)} alt={c.author} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ backgroundColor: "#EDEAE0", borderRadius: "0 0.75rem 0.75rem 0.75rem", padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <button onClick={() => viewProfile(c.author)} style={{ background: "none", border: "none", cursor: AUTHOR_KEY[c.author] ? "pointer" : "default", padding: 0, fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.875rem", color: "#1A1A1A" }}>{c.author}</button>
                        <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#9A9A8A" }}>{storyRelativeTime({ ...story, createdAt: c.createdAt })}</span>
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#1A1A1A", lineHeight: 1.65, margin: 0 }}>{c.text}</p>
                    </div>
                    <button
                      onClick={() => setLikedComments((prev) => {
                        const next = new Set(prev);
                        next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                        return next;
                      })}
                      style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: "none", cursor: "pointer", color: likedComments.has(c.id) ? "#C4713A" : "#6B6B5A", fontFamily: "var(--font-ui)", fontSize: "0.78rem", padding: "0.3rem 0.25rem", marginTop: "0.25rem" }}
                    >
                      <Heart size={13} fill={likedComments.has(c.id) ? "#C4713A" : "none"} />
                      {c.likes + (likedComments.has(c.id) ? 1 : 0)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

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

function statusCopy(status: ReturnType<typeof travelPlanStatus>): string {
  if (status === "planning") return "Planning";
  if (status === "ongoing") return "Ongoing";
  return "Completed";
}

function statusClass(status: ReturnType<typeof travelPlanStatus>): string {
  if (status === "completed") return "border-[#5C8A9E]/30 bg-[#5C8A9E]/12 text-[#315568]";
  if (status === "ongoing") return "border-[#C4713A]/30 bg-[#C4713A]/12 text-[#8A4B26]";
  return "border-[#3A2A22]/15 bg-[#EFE7DC] text-[#3A2A22]";
}

function TravelPlanStoryView({ plan, onBack, onUpdate }: { plan: TravelPlanStory; onBack: () => void; onUpdate: (plan: TravelPlanStory) => void }) {
  const navigate = useNavigate();
  const [editingDestinationId, setEditingDestinationId] = useState<string | null>(null);
  const [visitDestinationId, setVisitDestinationId] = useState<string | null>(null);
  const [pendingDestinationDelete, setPendingDestinationDelete] = useState<TravelPlanDestination | null>(null);
  const [visitForm, setVisitForm] = useState<VisitFormState>(() => destinationToVisitForm(plan.destinations[0] ?? {
    id: "draft",
    order: 1,
    placeName: "Destination",
    coordinate: { lat: 0, lon: 0 },
    plannedDay: 1,
    status: "planned",
  }));
  const [albumTemplate, setAlbumTemplate] = useState("Field Journal");

  const status = travelPlanStatus(plan);
  const completed = completedDestinationCount(plan);
  const total = plan.destinations.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const groupedDays = Array.from(new Set(plan.destinations.map((destination) => destination.plannedDay))).sort((a, b) => a - b);
  const coverImage = plan.coverImage || plan.destinations.find((destination) => destination.photos?.[0])?.photos?.[0];

  const commitPlan = (next: TravelPlanStory) => {
    const saved = upsertTravelPlanStory(next);
    onUpdate(saved);
  };

  const updateDestination = (destinationId: string, patch: Partial<TravelPlanDestination>) => {
    commitPlan({
      ...plan,
      destinations: plan.destinations.map((destination) => (destination.id === destinationId ? { ...destination, ...patch } : destination)),
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
    setPendingDestinationDelete(null);
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
          status: "planned",
          notes: "",
        },
      ],
    });
  };

  const startVisit = (destination: TravelPlanDestination) => {
    setVisitDestinationId(destination.id);
    setVisitForm(destinationToVisitForm(destination));
  };

  const saveVisit = () => {
    if (!visitDestinationId || !visitForm.title.trim() || !visitForm.description.trim()) return;
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

  return (
    <div className="min-h-screen bg-[#FBF7F0] px-4 py-8 text-[#1A1A1A] sm:px-6 lg:px-8">
      <article className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#3A2A22]/18 px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#3A2A22]">
            <ArrowLeft size={15} /> Stories
          </button>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex min-h-10 items-center rounded-full border px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] ${statusClass(status)}`}>
              {statusCopy(status)}
            </span>
            <button
              type="button"
              disabled={!canPublishTravelPlan(plan)}
              onClick={togglePublish}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#3A2A22]/18 px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#3A2A22] disabled:opacity-55"
            >
              {canPublishTravelPlan(plan) ? <Share2 size={14} /> : <LockKeyhole size={14} />}
              {plan.published ? "Unpublish" : "Publish"}
            </button>
          </div>
        </div>

        <header className="mx-auto mb-10 max-w-3xl">
          <p className="mb-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#9E6B5C]">Travel Plan Story</p>
          <h1 className="m-0 font-[var(--font-display)] text-5xl font-semibold leading-[0.98] text-[#1A1A1A] sm:text-7xl">{plan.travelPlanName}</h1>
          {plan.description ? <p className="mt-6 font-[var(--font-body)] text-lg leading-8 text-[#4A4A3A]">{plan.description}</p> : null}
          <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-[#3A2A22]/14 py-4 font-[var(--font-ui)] text-sm text-[#5B4A40]">
            <span className="inline-flex items-center gap-2"><BookOpen size={15} /> {total} destinations</span>
            <span className="inline-flex items-center gap-2"><CalendarDays size={15} /> {totalTravelDays(plan)} travel day{totalTravelDays(plan) === 1 ? "" : "s"}</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} /> {completed}/{total} completed</span>
            <span>Owner: {plan.ownerName}</span>
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
              <p className="m-0 font-[var(--font-display)] text-2xl text-[#3A2A22]">Cover will appear after you add trip photos.</p>
            </div>
          </div>
        )}

        {total === 1 ? (
          <div className="mb-8 rounded-xl border border-[#C4713A]/25 bg-[#C4713A]/10 p-4 text-sm leading-6 text-[#5B4A40]">
            This plan only has one destination left. Treat it as a Drop Marker story; Album Maker and multi-stop Story mode are locked until another destination is added.
          </div>
        ) : null}

        <section className="mx-auto max-w-4xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.14em] text-[#9E6B5C]">Itinerary</p>
              <h2 className="m-0 mt-1 font-[var(--font-display)] text-3xl font-semibold text-[#3A2A22]">Route Order</h2>
            </div>
            <button type="button" onClick={addDestination} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#3A2A22] px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#F5F0E8]">
              <Plus size={15} /> Add Destination
            </button>
          </div>

          <div className="space-y-8">
            {groupedDays.map((day) => (
              <div key={day}>
                <h3 className="mb-3 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.14em] text-[#3A2A22]">Day {day}</h3>
                <div className="space-y-3">
                  {plan.destinations.filter((destination) => destination.plannedDay === day).sort((a, b) => a.order - b.order).map((destination) => {
                    const isEditing = editingDestinationId === destination.id;
                    const isVisitOpen = visitDestinationId === destination.id;
                    const isPlanned = destination.status === "planned";
                    return (
                      <div key={destination.id} className="rounded-xl border border-[#3A2A22]/12 bg-[#EFE7DC] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 gap-3">
                            <span className="mt-1 inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#3A2A22] px-2 font-[var(--font-label)] text-xs font-bold text-[#F5F0E8]">{destination.order}</span>
                            <div className="min-w-0">
                              {isEditing && isPlanned ? (
                                <div className="grid gap-2">
                                  <input value={destination.placeName} onChange={(event) => updateDestination(destination.id, { placeName: event.target.value })} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm outline-none focus:border-[#C4713A]" />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input type="number" min={1} value={destination.plannedDay} onChange={(event) => updateDestination(destination.id, { plannedDay: Math.max(1, Number(event.target.value) || 1) })} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm outline-none focus:border-[#C4713A]" />
                                    <input type="time" value={destination.plannedTime ?? ""} onChange={(event) => updateDestination(destination.id, { plannedTime: event.target.value })} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm outline-none focus:border-[#C4713A]" />
                                  </div>
                                  <textarea value={destination.notes ?? ""} onChange={(event) => updateDestination(destination.id, { notes: event.target.value })} rows={2} className="resize-none rounded-lg border border-[#3A2A22]/12 bg-white px-3 py-2 text-sm outline-none focus:border-[#C4713A]" />
                                </div>
                              ) : (
                                <>
                                  <h4 className="m-0 font-[var(--font-display)] text-2xl font-semibold text-[#3A2A22]">{destination.title ?? destination.placeName}</h4>
                                  <p className="m-0 mt-1 text-sm leading-6 text-[#5B4A40]">
                                    {destination.placeName}
                                    {destination.plannedTime ? ` / ${destination.plannedTime}` : ""}
                                  </p>
                                  {destination.notes ? <p className="m-0 mt-2 text-sm leading-6 text-[#5B4A40]">{destination.notes}</p> : null}
                                  {destination.description ? <p className="m-0 mt-3 font-[var(--font-body)] text-base leading-7 text-[#1A1A1A]">{destination.description}</p> : null}
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`rounded-full border px-3 py-1 font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.08em] ${isPlanned ? "border-[#3A2A22]/15 text-[#5B4A40]" : "border-[#5C8A9E]/30 bg-[#5C8A9E]/12 text-[#315568]"}`}>
                            {isPlanned ? "Planned" : "Completed"}
                          </span>
                        </div>

                        {destination.photos?.length ? (
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            {destination.photos.slice(0, 3).map((photo) => (
                              <img key={photo} src={photo} alt="" className="h-24 w-full rounded-lg object-cover" />
                            ))}
                          </div>
                        ) : null}

                        {isVisitOpen ? (
                          <div className="mt-4 rounded-lg border border-[#C4713A]/20 bg-[#FBF7F0] p-4">
                            <div className="grid gap-3">
                              <div className="grid gap-2 sm:grid-cols-3">
                                <select value={visitForm.visibility} onChange={(event) => setVisitForm((current) => ({ ...current, visibility: event.target.value as MapScope }))} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm">
                                  <option value="private">Private</option>
                                  <option value="public">Public</option>
                                  <option value="group">Group</option>
                                </select>
                                <select value={visitForm.category} onChange={(event) => setVisitForm((current) => ({ ...current, category: event.target.value }))} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm">
                                  {categories.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}
                                </select>
                                <input type="date" value={visitForm.dateVisited} onChange={(event) => setVisitForm((current) => ({ ...current, dateVisited: event.target.value }))} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm" />
                              </div>
                              <input value={visitForm.placeName} onChange={(event) => setVisitForm((current) => ({ ...current, placeName: event.target.value }))} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm" placeholder="Place name" />
                              <input value={visitForm.title} onChange={(event) => setVisitForm((current) => ({ ...current, title: event.target.value }))} className="min-h-10 rounded-lg border border-[#3A2A22]/12 bg-white px-3 text-sm" placeholder="Story title" />
                              <textarea value={visitForm.description} onChange={(event) => setVisitForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="resize-none rounded-lg border border-[#3A2A22]/12 bg-white px-3 py-2 text-sm leading-6" placeholder="What happened when you visited?" />
                              <textarea value={visitForm.photos} onChange={(event) => setVisitForm((current) => ({ ...current, photos: event.target.value }))} rows={2} className="resize-none rounded-lg border border-[#3A2A22]/12 bg-white px-3 py-2 text-sm leading-6" placeholder="Photo URLs, separated by comma or line break" />
                              <div className="flex flex-wrap justify-end gap-2">
                                <button type="button" onClick={() => setVisitDestinationId(null)} className="min-h-10 rounded-full border border-[#3A2A22]/18 px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#3A2A22]">Cancel</button>
                                <button type="button" onClick={saveVisit} className="min-h-10 rounded-full bg-[#C4713A] px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] text-[#F5F0E8]">Mark Completed</button>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {isPlanned ? (
                            <>
                              <button type="button" onClick={() => setEditingDestinationId(isEditing ? null : destination.id)} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#3A2A22]/16 px-3 text-xs font-bold text-[#3A2A22]">{isEditing ? "Done" : "Edit Plan"}</button>
                              <button type="button" onClick={() => moveDestination(destination.id, -1)} className="grid h-9 w-9 place-items-center rounded-full border border-[#3A2A22]/16 text-[#3A2A22]" aria-label="Move up"><ArrowUp size={14} /></button>
                              <button type="button" onClick={() => moveDestination(destination.id, 1)} className="grid h-9 w-9 place-items-center rounded-full border border-[#3A2A22]/16 text-[#3A2A22]" aria-label="Move down"><ArrowDown size={14} /></button>
                              <button type="button" onClick={() => setPendingDestinationDelete(destination)} className="grid h-9 w-9 place-items-center rounded-full border border-[#C4713A]/24 text-[#9E4F27]" aria-label="Delete destination"><Trash2 size={14} /></button>
                            </>
                          ) : null}
                          <button type="button" onClick={() => startVisit(destination)} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#3A2A22] px-3 text-xs font-bold text-[#F5F0E8]">
                            <CheckCircle2 size={14} /> {isPlanned ? "Document Visit" : "Edit Visit"}
                          </button>
                          {destination.coordinate.lat || destination.coordinate.lon ? (
                            <button type="button" onClick={() => viewDestinationOnMap(destination)} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#3A2A22]/16 px-3 text-xs font-bold text-[#3A2A22]">
                              <MapPin size={14} /> View Pin
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-4xl rounded-xl border border-[#3A2A22]/12 bg-[#EFE7DC] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.14em] text-[#9E6B5C]">Album Maker</p>
              <h2 className="m-0 mt-1 font-[var(--font-display)] text-3xl font-semibold text-[#3A2A22]">Printable Journey Album</h2>
              <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[#5B4A40]">
                {albumUnlocked(plan) ? "All destinations are complete. Choose a template and preview the print-ready story album." : `Locked until every destination is documented. ${completed}/${total} destinations completed.`}
              </p>
            </div>
            {!albumUnlocked(plan) ? <LockKeyhole className="text-[#9E6B5C]" size={28} /> : null}
          </div>

          {albumUnlocked(plan) ? (
            <div className="mt-5 grid gap-4">
              <div className="flex flex-wrap gap-2">
                {["Field Journal", "Island Lookbook", "Route Chronicle"].map((template) => (
                  <button key={template} type="button" onClick={() => setAlbumTemplate(template)} className={`min-h-10 rounded-full border px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.06em] ${albumTemplate === template ? "border-[#3A2A22] bg-[#3A2A22] text-[#F5F0E8]" : "border-[#3A2A22]/18 text-[#3A2A22]"}`}>
                    {template}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-[#FBF7F0] p-5">
                  <p className="font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[#9E6B5C]">Cover</p>
                  <h3 className="font-[var(--font-display)] text-3xl font-semibold text-[#3A2A22]">{plan.travelPlanName}</h3>
                  <p className="text-sm leading-6 text-[#5B4A40]">{albumTemplate} / {totalTravelDays(plan)} travel days / {total} stops</p>
                </div>
                {plan.destinations.map((destination) => (
                  <div key={destination.id} className="rounded-lg bg-[#FBF7F0] p-5">
                    <p className="font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[#9E6B5C]">Page {destination.order}</p>
                    <h3 className="font-[var(--font-display)] text-2xl font-semibold text-[#3A2A22]">{destination.title}</h3>
                    <p className="text-sm leading-6 text-[#5B4A40]">{destination.dateVisited} / Day {destination.plannedDay}</p>
                    <p className="text-sm leading-6 text-[#1A1A1A]">{destination.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
        <ConfirmDialog
          open={Boolean(pendingDestinationDelete)}
          title={`Delete ${pendingDestinationDelete?.title ?? pendingDestinationDelete?.placeName ?? "this destination"}?`}
          description={`Are you sure you want to delete "${pendingDestinationDelete?.title ?? pendingDestinationDelete?.placeName ?? "this destination"}" from this itinerary?`}
          confirmLabel="Delete Destination"
          onConfirm={() => pendingDestinationDelete && deleteDestination(pendingDestinationDelete.id)}
          onCancel={() => setPendingDestinationDelete(null)}
        />
      </article>
    </div>
  );
}

function StoriesContent() {
  const location = useLocation();
  const { user } = useAuth();
  const [localStories, setLocalStories] = useState<TravelStory[]>(() => readLocalStories());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [scopeFilter, setScopeFilter] = useState<StoryScopeFilter>("public");
  const [pendingStoryDelete, setPendingStoryDelete] = useState<TravelStory | null>(null);
  const [activeStory, setActiveStory] = useState<number | null>(() => {
    const params = new URLSearchParams(location.search);
    const requestedStory = Number(params.get("story") ?? params.get("localStory"));
    return Number.isFinite(requestedStory) && requestedStory > 0 ? requestedStory : null;
  });
  const allStories: TravelStory[] = useMemo(
    () =>
      [...localStories, ...STORIES].sort((a, b) => {
        const preferenceDelta = preferenceScore(b.category, user?.interests) - preferenceScore(a.category, user?.interests);
        return preferenceDelta || b.likes - a.likes;
      }),
    [localStories, user?.interests],
  );

  const isOwnStory = (story: TravelStory) => {
    if (!story.local) return false;
    return story.ownerId === user?.id || story.author === user?.name || story.author === "You";
  };

  const isVisibleGroupStory = (story: TravelStory) => {
    if ((story.scope ?? "public") !== "group") return false;
    if (!story.groupIds?.length) return true;
    return story.groupIds.some((groupId) => user?.groupIds?.includes(groupId));
  };

  useEffect(() => {
    setLocalStories(readLocalStories());
    const params = new URLSearchParams(location.search);
    const requestedStory = Number(params.get("story") ?? params.get("localStory"));
    if (Number.isFinite(requestedStory) && requestedStory > 0) {
      setActiveStory(requestedStory);
    }
  }, [location.search]);

  const filtered = allStories.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.author.toLowerCase().includes(search.toLowerCase()) || s.region.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || s.category === category;
    const storyScope = s.scope ?? "public";
    const matchScope =
      scopeFilter === "public"
        ? storyScope === "public"
        : scopeFilter === "mine"
          ? isOwnStory(s)
          : isVisibleGroupStory(s);
    return matchSearch && matchCat && matchScope;
  });

  useEffect(() => {
    if (activeStory === null) return;
    const story = allStories.find((item) => item.id === activeStory);
    if (!story) return;
    const storyScope = story.scope ?? "public";
    const nextScope: StoryScopeFilter = storyScope === "group" ? "group" : storyScope === "private" || isOwnStory(story) ? "mine" : "public";
    setScopeFilter((current) => (current === nextScope ? current : nextScope));
  }, [activeStory, allStories, user?.id, user?.name]);

  const scopeCounts = {
    public: allStories.filter((story) => (story.scope ?? "public") === "public").length,
    mine: allStories.filter(isOwnStory).length,
    group: allStories.filter(isVisibleGroupStory).length,
  };

  const activeIndex = activeStory !== null ? filtered.findIndex((s) => s.id === activeStory) : -1;

  const deletePostedStory = async (story: TravelStory) => {
    if (!story.local) return;
    if (!isOwnStory(story)) return;
    const nextLocalStories = readLocalStories().filter((item) => item.id !== story.id);
    deleteLocalStoryCascade(story.id);
    writeLocalStories(nextLocalStories);
    rememberDeletedStoryPin(story.id);
    publishWorkspaceEvent({ type: "pin.deleted", pinId: `story-${story.id}`, storyId: story.id });
    publishWorkspaceEvent({ type: "pin.deleted", pinId: `local-marker-${story.id}`, storyId: story.id });
    setLocalStories(nextLocalStories);
    writeSavedStoryIds(readSavedStoryIds().filter((id) => id !== story.id));
    try {
      const collections = JSON.parse(window.localStorage.getItem(STORY_COLLECTIONS_KEY) ?? "[]") as Array<{ id: string; name: string; storyIds: number[] }>;
      if (Array.isArray(collections)) {
        window.localStorage.setItem(
          STORY_COLLECTIONS_KEY,
          JSON.stringify(collections.map((collection) => ({ ...collection, storyIds: collection.storyIds.filter((id) => id !== story.id) }))),
        );
      }
    } catch {
      window.localStorage.setItem(STORY_COLLECTIONS_KEY, "[]");
    }
    if (user) {
      try {
        const pins = await listPins(user.id, user.groupIds ?? []);
        const matchingPins = pins.filter((pin) => {
          const media = pin.media as { storyDraftId?: unknown; storyId?: unknown } | null;
          const linkedStoryId = Number(media?.storyId ?? media?.storyDraftId);
          return (
            linkedStoryId === story.id ||
            pin.pin_id === `story-${story.id}` ||
            pin.pin_id === `local-marker-${story.id}` ||
            pin.post_id === `story-${story.id}`
          );
        });
        await Promise.all(matchingPins.map((pin) => deletePin(pin.pin_id, user.id)));
      } catch {
        // Local prototype stories are still removed immediately; backend pin cleanup is best-effort.
      }
    }
    setActiveStory(null);
    setPendingStoryDelete(null);
  };

  const updateStoryVisibility = (story: TravelStory, nextScope: MapScope) => {
    if (!isOwnStory(story)) return;
    const nextVisibility: TravelStory["visibility"] = nextScope === "group" ? "friends" : nextScope;
    const updatedStory: TravelStory = { ...story, scope: nextScope, visibility: nextVisibility, updatedAt: new Date().toISOString() };
    const nextLocalStories = readLocalStories().map((item) => (item.id === story.id ? updatedStory : item));
    const nextPins = readLocalTable<ApiPin>("pins").reduce<ApiPin[]>((rows, pin) => {
      if (linkedPinStoryId(pin) !== story.id) return [...rows, pin];
      if (rows.some((row) => linkedPinStoryId(row) === story.id)) return rows;
      return [
        ...rows,
        {
          ...pin,
          scope: nextScope,
          group_ids: nextScope === "group" ? (story.groupIds ?? user?.groupIds ?? []) : [],
          updated_at: new Date().toISOString(),
        },
      ];
    }, []);
    writeLocalStories(nextLocalStories);
    writeLocalTable<ApiPin>("pins", nextPins);
    nextPins.filter((pin) => linkedPinStoryId(pin) === story.id).forEach((pin) => publishWorkspaceEvent({ type: "pin.created", pin }));
    setLocalStories(nextLocalStories);
    setScopeFilter(nextScope === "group" ? "group" : nextScope === "private" ? "mine" : "public");
  };

  const updatePostedStory = (updatedStory: TravelStory) => {
    if (!isOwnStory(updatedStory)) return;
    const nextLocalStories = readLocalStories().map((item) => (item.id === updatedStory.id ? updatedStory : item));
    writeLocalStories(nextLocalStories);
    setLocalStories(nextLocalStories);
  };

  if (activeStory !== null && activeIndex >= 0) {
    return (
      <>
        <StoryArticleView
          story={filtered[activeIndex]}
          onBack={() => setActiveStory(null)}
          onPrev={() => setActiveStory(filtered[activeIndex - 1].id)}
          onNext={() => setActiveStory(filtered[activeIndex + 1].id)}
          hasPrev={activeIndex > 0}
          hasNext={activeIndex < filtered.length - 1}
          onDelete={(story) => setPendingStoryDelete(story)}
          onVisibilityChange={updateStoryVisibility}
          onEditStory={updatePostedStory}
        />
        <ConfirmDialog
          open={Boolean(pendingStoryDelete)}
          title={`Delete ${pendingStoryDelete?.title ?? "this story"}?`}
          description={`Are you sure you want to delete "${pendingStoryDelete?.title ?? "this story"}"? This will also remove its map pin when one is connected.`}
          confirmLabel="Delete Story"
          onConfirm={() => pendingStoryDelete && void deletePostedStory(pendingStoryDelete)}
          onCancel={() => setPendingStoryDelete(null)}
        />
      </>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F0E8", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header className="mb-10 stories-page-heading">
          <p className="mb-2 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#9E6B5C]">Travel narratives</p>
          <h1 className="m-0 font-[var(--font-display)] text-5xl font-semibold leading-none text-[#3A2A22] sm:text-6xl">Stories</h1>
          <p className="mt-4 max-w-3xl font-[var(--font-body)] text-lg leading-8 text-[#5B4A40]">Long-form travel narratives from the TravelTraces community — honest, personal, and unhighlighted.</p>
        </header>

        <div className="story-scope-tabs" aria-label="Story visibility filters">
          {storyScopes.map((item) => {
            const selected = scopeFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setScopeFilter(item.key)}
                className="story-scope-tab"
                aria-pressed={selected}
              >
                <span>{item.label}</span>
                <small>{scopeCounts[item.key]} {scopeCounts[item.key] === 1 ? "story" : "stories"}</small>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#6B5A50" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stories, authors, regions…"
              style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", backgroundColor: "#EFE7DC", border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.25rem", fontSize: "0.9rem", color: "#2C211C", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {categories.map((c) => {
              const Icon = STORY_CATEGORY_ICON[c] ?? Compass;
              const isActive = category === c;
              const isAll = c === "All";
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
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
                  {!isAll && <Icon size={14} color={isActive ? "#F5F0E8" : "#9E6B5C"} style={{ flexShrink: 0 }} />}
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <LargeEmptyState
            title="No stories here yet"
            copy={
              scopeFilter === "mine"
                ? "Your posted stories will appear here after you drop a marker and save it as a story."
                : scopeFilter === "group"
                  ? "Collab stories will appear here when a story is shared to one of your travel groups."
                  : "Try another search term or category to find more public travel stories."
            }
          />
        ) : null}

        {/* Featured story */}
        {filtered.length > 0 && (
          <article
            onClick={() => setActiveStory(filtered[0].id)}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderRadius: "0.25rem", overflow: "hidden", backgroundColor: "#EDEAE0", marginBottom: "2rem", cursor: "pointer" }}
            className="featured-story-grid"
          >
            <img src={safeStoryImageUrl(filtered[0].img, filtered[0].title)} alt={filtered[0].title} style={{ width: "100%", height: 380, objectFit: "cover", objectPosition: filtered[0].imagePosition ?? "center center", display: "block" }} />
            <div style={{ padding: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C4713A", marginBottom: "0.75rem" }}>{filtered[0].category}</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, color: "#3A2A22", lineHeight: 1.3, marginBottom: "1rem" }}>{filtered[0].title}</h2>
              <p style={{ fontFamily: "var(--font-body)", color: "#4A4A3A", lineHeight: 1.7, fontSize: "0.95rem", marginBottom: "1.5rem" }}>{filtered[0].excerpt}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.875rem", color: "#1A1A1A" }}>{filtered[0].author}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#5B4A40", marginTop: "0.2rem", flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><MapPin size={12} strokeWidth={2} />{generalizeStoryLocation(filtered[0])}</span>
                    <span aria-hidden="true" style={{ color: "#9E8E7D" }}>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><Clock size={12} strokeWidth={2} />{estimateStoryReadTime(filtered[0])}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "1.5rem" }}>
          {filtered.slice(1).map((s) => (
            <article
              key={s.id}
              onClick={() => setActiveStory(s.id)}
              style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <img src={safeStoryImageUrl(s.img, s.title)} alt={s.title} style={{ width: "100%", height: 180, objectFit: "cover", objectPosition: s.imagePosition ?? "center center", display: "block" }} />
              <div style={{ padding: "1.25rem" }}>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#C4713A" }}>{s.category}</span>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 600, color: "#3A2A22", lineHeight: 1.35, margin: "0.4rem 0 0.75rem" }}>{s.title}</h3>
                <p style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: "0 0 0.75rem", fontFamily: "var(--font-ui)", fontSize: "0.76rem", color: "#5B4A40", fontWeight: 700 }}>
                  <MapPin size={13} strokeWidth={2} color="#9E6B5C" /> {generalizeStoryLocation(s)}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#4A4A3A", lineHeight: 1.6, marginBottom: "1rem" }}>{s.excerpt.slice(0, 120)}…</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", fontWeight: 600, color: "#1A1A1A" }}>{s.author}</p>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "#6B6B5A" }}>{s.date}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#6B6B5A" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><Heart size={12} strokeWidth={2} /> {s.likes > 0 ? s.likes : "New"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><Clock size={12} strokeWidth={2} /> {estimateStoryReadTime(s)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .story-scope-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin: -0.5rem 0 1.5rem;
        }

        .story-scope-tab {
          min-height: 4.15rem;
          min-width: min(100%, 12rem);
          flex: 1 1 12rem;
          border: 1px solid rgba(58,42,34,0.16);
          border-radius: 0.45rem;
          background: #FBF7F0;
          color: #3A2A22;
          padding: 0.85rem 1rem;
          text-align: left;
          cursor: pointer;
          box-shadow: 0 12px 26px rgba(58,42,34,0.06);
          transition: transform 0.18s ease, background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .story-scope-tab span {
          display: block;
          font-family: var(--font-label);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .story-scope-tab small {
          display: block;
          margin-top: 0.35rem;
          font-family: var(--font-ui);
          font-size: 0.82rem;
          color: #6B5A50;
          font-weight: 700;
        }

        .story-scope-tab:hover {
          transform: translateY(-1px);
          border-color: rgba(58,42,34,0.34);
          box-shadow: 0 16px 34px rgba(58,42,34,0.1);
        }

        .story-scope-tab[aria-pressed="true"] {
          background: #3A2A22;
          border-color: #3A2A22;
          color: #F5F0E8;
          box-shadow: 0 18px 38px rgba(58,42,34,0.18);
        }

        .story-scope-tab[aria-pressed="true"] small {
          color: rgba(245,240,232,0.72);
        }

        .story-empty-state {
          display: grid;
          justify-items: center;
          gap: 0.65rem;
          margin: 2rem 0;
          border: 1px dashed rgba(58, 42, 34, 0.2);
          border-radius: 0.5rem;
          background: rgb(255, 249, 240);
          padding: clamp(2rem, 5vw, 4rem);
          text-align: center;
          color: #3A2A22;
          box-shadow: rgba(58, 42, 34, 0.06) 0px 18px 42px;
        }

        .story-empty-state h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 600;
          line-height: 1.05;
        }

        .story-empty-state p {
          margin: 1rem auto 0;
          max-width: 35rem;
          font-family: var(--font-body);
          font-size: 1.05rem;
          line-height: 1.8;
          color: #5B4A40;
        }

        .category-pill:hover { background-color: rgba(58,42,34,0.08); border-color: #3A2A22; color: #3A2A22; }
        .category-pill[aria-pressed="true"]:hover { background-color: #3A2A22; border-color: #3A2A22; color: #F5F0E8; }
        @media (max-width: 640px) {
          .featured-story-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default function StoriesPage() {
  return (
    <GatedPage featureName="Stories">
      <StoriesContent />
    </GatedPage>
  );
}
