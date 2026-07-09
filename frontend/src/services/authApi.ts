const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const AUTH_SESSION_STORAGE_KEY = "traveltraces.authSessionActive";
const LOCAL_AUTH_USER_KEY = "traveltraces.localAuthUserId";
const PASSWORD_MIN_LENGTH = 8;

export type AuthUser = {
  user_id: string;
  email: string;
  group_ids: string[];
  token_expires_at: number;
  created_at?: string;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

type LocalAuthAccount = {
  user_id: string;
  email: string;
  password: string;
  group_ids: string[];
  token_expires_at: number;
  created_at: string;
};

async function localDb() {
  return import("./localDb");
}

function authSessionIsMarkedActive() {
  return window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) === "true";
}

function markAuthSessionActive(userId?: string) {
  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, "true");
  if (userId) window.localStorage.setItem(LOCAL_AUTH_USER_KEY, userId);
}

function clearAuthSession() {
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(LOCAL_AUTH_USER_KEY);
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

  if (!API_BASE_URL) {
    const { readLocalTable } = await localDb();
    const account = readLocalTable<LocalAuthAccount>("authSessions").find((row) => row.email === normalizedEmail);
    if (!account) throw new ApiRequestError("No account found. Please create an account first.", 401);
    if (account.password !== normalizedPassword) throw new ApiRequestError("Incorrect password.", 401);
    const auth = { user_id: account.user_id, email: account.email, group_ids: account.group_ids, token_expires_at: Date.now() + 1000 * 60 * 60 * 24 * 30, created_at: account.created_at };
    markAuthSessionActive(auth.user_id);
    return auth;
  }

  const auth = await requestJson<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
  });
  markAuthSessionActive(auth.user_id);
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

  if (!API_BASE_URL) {
    const { readLocalTable, upsertLocalRow } = await localDb();
    const existing = readLocalTable<LocalAuthAccount>("authSessions").find((row) => row.email === normalizedEmail);
    if (existing) throw new ApiRequestError("Email already exists.", 409);
    const auth: AuthUser = {
      user_id: `local-user-${Date.now()}`,
      email: normalizedEmail,
      group_ids: [],
      token_expires_at: Date.now() + 1000 * 60 * 60 * 24 * 30,
      created_at: new Date().toISOString(),
    };
    upsertLocalRow<LocalAuthAccount>("authSessions", {
      ...auth,
      password: normalizedPassword,
      created_at: auth.created_at ?? new Date().toISOString(),
    }, (row) => row.user_id);
    markAuthSessionActive(auth.user_id);
    return auth;
  }

  const auth = await requestJson<AuthUser>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name: normalizedName, email: normalizedEmail, password: normalizedPassword }),
  });
  markAuthSessionActive(auth.user_id);
  return auth;
}

export async function logoutFromBackend(): Promise<void> {
  if (!API_BASE_URL) {
    clearAuthSession();
    return;
  }
  try {
    await requestJson<{ status: string }>("/api/auth/logout", { method: "POST" });
  } finally {
    clearAuthSession();
  }
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (!authSessionIsMarkedActive()) return null;
  if (!API_BASE_URL) {
    const activeUserId = window.localStorage.getItem(LOCAL_AUTH_USER_KEY);
    const { readLocalTable } = await localDb();
    const account = readLocalTable<LocalAuthAccount>("authSessions").find((row) => row.user_id === activeUserId);
    if (!account) {
      clearAuthSession();
      return null;
    }
    return { user_id: account.user_id, email: account.email, group_ids: account.group_ids, token_expires_at: account.token_expires_at, created_at: account.created_at };
  }
  try {
    return await requestJson<AuthUser>("/api/auth/me");
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) clearAuthSession();
    return null;
  }
}

export async function deleteAccount(password: string): Promise<{ status: "deleted"; deleted_counts: Record<string, number>; residual_access_removed: boolean }> {
  if (!API_BASE_URL) {
    const activeUserId = window.localStorage.getItem(LOCAL_AUTH_USER_KEY);
    const { deleteLocalRows } = await localDb();
    if (activeUserId) {
      deleteLocalRows<LocalAuthAccount>("authSessions", (row) => row.user_id === activeUserId && row.password === password);
    }
    clearAuthSession();
    return { status: "deleted", deleted_counts: {}, residual_access_removed: true };
  }
  return requestJson("/api/auth/account", {
    method: "DELETE",
    body: JSON.stringify({
      password,
      final_confirmation: "Delete My Account",
    }),
  });
}
