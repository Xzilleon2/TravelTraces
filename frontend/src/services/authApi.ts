const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const AUTH_SESSION_STORAGE_KEY = "traveltraces.authSessionActive";
const PASSWORD_MIN_LENGTH = 12;

export type AuthUser = {
  user_id: string;
  email: string;
  group_ids: string[];
  token_expires_at: number;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

function authSessionIsMarkedActive() {
  return window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) === "true";
}

function markAuthSessionActive() {
  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, "true");
}

function clearAuthSession() {
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

function validationMessageFromDetail(detail: unknown, fallback: string) {
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) return String(item.msg);
        return String(item);
      })
      .filter(Boolean)
      .join(", ");
  }
  return typeof detail === "string" && detail.trim() ? detail : fallback;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = validationMessageFromDetail(body?.detail, `Request failed with ${response.status}`);
    if (response.status === 401) clearAuthSession();
    throw new ApiRequestError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function loginWithBackend(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();
  if (!normalizedEmail) throw new ApiRequestError("Email is required.", 422);
  if (!normalizedEmail.includes("@")) throw new ApiRequestError("Enter a valid email address.", 422);
  if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
    throw new ApiRequestError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`, 422);
  }

  const auth = await requestJson<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
  });
  markAuthSessionActive();
  return auth;
}

export async function signupWithBackend(name: string, email: string, password: string): Promise<AuthUser> {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();
  if (!normalizedName) throw new ApiRequestError("Full name is required.", 422);
  if (!normalizedEmail) throw new ApiRequestError("Email is required.", 422);
  if (!normalizedEmail.includes("@")) throw new ApiRequestError("Enter a valid email address.", 422);
  if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
    throw new ApiRequestError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`, 422);
  }

  const auth = await requestJson<AuthUser>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name: normalizedName, email: normalizedEmail, password: normalizedPassword }),
  });
  markAuthSessionActive();
  return auth;
}

export async function logoutFromBackend(): Promise<void> {
  try {
    await requestJson<{ status: string }>("/api/auth/logout", { method: "POST" });
  } finally {
    clearAuthSession();
  }
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (!authSessionIsMarkedActive()) return null;
  try {
    return await requestJson<AuthUser>("/api/auth/me");
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) clearAuthSession();
    return null;
  }
}

export async function deleteAccount(password: string): Promise<{ status: "deleted"; deleted_counts: Record<string, number>; residual_access_removed: boolean }> {
  return requestJson("/api/auth/account", {
    method: "DELETE",
    body: JSON.stringify({
      password,
      final_confirmation: "Delete My Account",
    }),
  });
}
