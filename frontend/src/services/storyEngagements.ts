import { readLocalTable, writeLocalTable } from "./localDb";

export type StoryReaction = {
  id: string;
  storyId: string;
  userId: string;
  type: "like";
  createdAt: string;
};

export type StoryComment = {
  id: string;
  storyId: string;
  userId: string;
  author: string;
  avatar?: string;
  text: string;
  createdAt: string;
  likes: number;
};

export type StoryEngagement = {
  reactions: StoryReaction[];
  comments: StoryComment[];
};

const CHANNEL_NAME = "traveltraces:story-engagements";
let channel: BroadcastChannel | null = null;
let fallbackCommentCounter = 0;

function uniqueStoryCommentId(storyId: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `story-comment-${crypto.randomUUID()}`;
  }
  fallbackCommentCounter += 1;
  return `story-comment-${storyId}-${Date.now()}-${fallbackCommentCounter}`;
}

function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  channel ??= new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

function broadcast(storyId: string) {
  getChannel()?.postMessage({ type: "story-engagement-updated", storyId });
  window.dispatchEvent(new CustomEvent("traveltraces:story-engagement-updated", { detail: { storyId } }));
}

function allReactions() {
  return readLocalTable<StoryReaction>("storyLikes");
}

function allComments() {
  const rows = readLocalTable<StoryComment>("storyComments");
  const seen = new Set<string>();
  let changed = false;
  const uniqueRows = rows.map((comment) => {
    if (comment.id && !seen.has(comment.id)) {
      seen.add(comment.id);
      return comment;
    }
    changed = true;
    const nextComment = { ...comment, id: uniqueStoryCommentId(comment.storyId) };
    seen.add(nextComment.id);
    return nextComment;
  });
  if (changed) writeLocalTable<StoryComment>("storyComments", uniqueRows);
  return uniqueRows;
}

export function readStoryEngagement(storyId: string | number): StoryEngagement {
  const id = String(storyId);
  return {
    reactions: allReactions().filter((row) => row.storyId === id),
    comments: allComments().filter((row) => row.storyId === id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  };
}

export function toggleStoryReaction(storyId: string | number, userId: string) {
  const id = String(storyId);
  const rows = allReactions();
  const existing = rows.find((row) => row.storyId === id && row.userId === userId && row.type === "like");
  const next = existing
    ? rows.filter((row) => row.id !== existing.id)
    : [...rows, { id: `story-like-${id}-${userId}-${Date.now()}`, storyId: id, userId, type: "like" as const, createdAt: new Date().toISOString() }];
  writeLocalTable<StoryReaction>("storyLikes", next);
  broadcast(id);
  return readStoryEngagement(id);
}

export function addStoryComment(storyId: string | number, input: Omit<StoryComment, "id" | "storyId" | "createdAt" | "likes">) {
  const id = String(storyId);
  const comment: StoryComment = { ...input, id: uniqueStoryCommentId(id), storyId: id, createdAt: new Date().toISOString(), likes: 0 };
  writeLocalTable<StoryComment>("storyComments", [...allComments(), comment]);
  broadcast(id);
  return comment;
}

export function subscribeStoryEngagements(storyId: string | number, callback: (engagement: StoryEngagement) => void) {
  const id = String(storyId);
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ storyId?: string }>).detail;
    if (!detail?.storyId || detail.storyId === id) callback(readStoryEngagement(id));
  };
  const storageHandler = (event: StorageEvent) => {
    if (event.key?.includes("story")) callback(readStoryEngagement(id));
  };
  const channelHandler = (event: MessageEvent<{ storyId?: string }>) => {
    if (!event.data?.storyId || event.data.storyId === id) callback(readStoryEngagement(id));
  };
  window.addEventListener("traveltraces:story-engagement-updated", handler);
  window.addEventListener("storage", storageHandler);
  getChannel()?.addEventListener("message", channelHandler);
  return () => {
    window.removeEventListener("traveltraces:story-engagement-updated", handler);
    window.removeEventListener("storage", storageHandler);
    getChannel()?.removeEventListener("message", channelHandler);
  };
}
