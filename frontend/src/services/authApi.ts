const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export type AuthUser = {
  user_id: string;
  email: string;
  group_ids: string[];
  token_expires_at: number;
};

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
    const message = body?.detail ?? `Request failed with ${response.status}`;
    throw new Error(Array.isArray(message) ? message.map((item) => item.msg).join(", ") : String(message));
  }

  return response.json() as Promise<T>;
}

export async function loginWithBackend(email: string, password: string): Promise<AuthUser> {
  return requestJson<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signupWithBackend(name: string, email: string, password: string): Promise<AuthUser> {
  return requestJson<AuthUser>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function logoutFromBackend(): Promise<void> {
  await requestJson<{ status: string }>("/api/auth/logout", { method: "POST" });
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    return await requestJson<AuthUser>("/api/auth/me");
  } catch {
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
