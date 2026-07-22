const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
import type { Pins } from "./chatpinApi";

export type ChatApiRole = "user" | "assistant" | "system";

export type ChatApiMessage = {
  id: string;
  role: ChatApiRole;
  content: string;
  created_at: string;
};

export type ChatContext = {
  display_name?: string;
  location?: string;
  interests: string[];
  pins?: Pins[];
};

export type ChatApiRequest = {
  route: "/chat";
  owner_id: string;
  conversation_id?: string;
  message: ChatApiMessage;
  history: ChatApiMessage[];
  context: ChatContext;
};

export type ChatApiResponse = {
  conversation_id: string;
  message: ChatApiMessage;
  model?: string | null;
};

export class ChatApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
  }
}

export async function requestTraceReply(payload: ChatApiRequest, signal?: AbortSignal): Promise<ChatApiResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ChatApiError("Trace could not reach the AI service. Please try again shortly.", 0);
  }

  const body = await response.json().catch(() => null) as { detail?: unknown } | ChatApiResponse | null;
  if (!response.ok) {
    const detail = body && "detail" in body && typeof body.detail === "string" ? body.detail : null;
    throw new ChatApiError(detail || `Trace could not complete the request (${response.status}).`, response.status);
  }

  if (!body || !("message" in body) || typeof body.message?.content !== "string" || !("conversation_id" in body)) {
    throw new ChatApiError("Trace received an invalid response from the AI service.", 502);
  }
  return body as ChatApiResponse;
}
