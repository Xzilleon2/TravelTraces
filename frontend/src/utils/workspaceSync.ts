import type { ApiPin, ApiRoute } from "../services/mappingApi";

export type WorkspaceSyncEvent =
  | { type: "pin.created"; pin: ApiPin }
  | { type: "route.updated"; route: ApiRoute };

const CHANNEL_NAME = "travelplaces-map-workspace";
const STORAGE_KEY = "travelplaces:last-map-event";

export function publishWorkspaceEvent(event: WorkspaceSyncEvent) {
  const payload = JSON.stringify({ ...event, sentAt: Date.now() });
  try {
    localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // Storage can be unavailable in private browsing contexts.
  }

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(event);
    channel.close();
  }
}

export function subscribeWorkspaceEvents(onEvent: (event: WorkspaceSyncEvent) => void) {
  let channel: BroadcastChannel | null = null;

  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (message) => {
      onEvent(message.data as WorkspaceSyncEvent);
    };
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as WorkspaceSyncEvent;
      onEvent(parsed);
    } catch {
      // Ignore malformed cross-tab payloads.
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    channel?.close();
    window.removeEventListener("storage", handleStorage);
  };
}
