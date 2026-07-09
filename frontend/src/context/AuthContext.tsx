import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchCurrentUser, loginWithBackend, logoutFromBackend, signupWithBackend, type AuthUser } from "../services/authApi";
import { readLocalTable, upsertLocalRow } from "../services/localDb";

export type Plan = "free" | "explorer" | "pathfinder";

export type ConnectionProfile = {
  id: string;
  name: string;
  location: string;
  avatar: string;
  lat?: number;
  lon?: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  nationality: string;
  location: string;
  joinedDate: string;
  pinsCount: number;
  storiesCount: number;
  followersCount: number;
  followingCount: number;
  plan: Plan;
  groupIds: string[];
  friends: ConnectionProfile[];
  followers: ConnectionProfile[];
  following?: ConnectionProfile[];
  interests?: string[];
  travelStyle?: string;
};

export const PLAN_LIMITS: Record<Plan, { pins: number; stories: number; photos: number }> = {
  free: { pins: 30, stories: 3, photos: 50 },
  explorer: { pins: Infinity, stories: Infinity, photos: 500 },
  pathfinder: { pins: Infinity, stories: Infinity, photos: Infinity },
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  authReady: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  authModalOpen: boolean;
  authMode: "login" | "signup";
  openAuthModal: (mode?: "login" | "signup") => void;
  closeAuthModal: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const EMPTY_USER_TEMPLATE: User = {
  id: "",
  name: "",
  email: "",
  avatar: "",
  bio: "",
  nationality: "",
  location: "",
  joinedDate: "",
  pinsCount: 0,
  storiesCount: 0,
  followersCount: 0,
  followingCount: 0,
  plan: "free",
  groupIds: [],
  friends: [],
  followers: [],
  following: [],
  interests: [],
  travelStyle: "",
};

function userFromAuth(auth: AuthUser, fallbackName?: string): User {
  const joinedDate = auth.created_at
    ? new Date(auth.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  return {
    ...EMPTY_USER_TEMPLATE,
    id: auth.user_id,
    email: auth.email,
    name: fallbackName ?? auth.email.split("@")[0],
    joinedDate,
    groupIds: auth.group_ids,
  };
}

function readStoredUser(userId: string): User | null {
  return readLocalTable<User>("users").find((row) => row.id === userId) ?? null;
}

function mergeStoredUser(authUser: User, storedUser: User | null): User {
  if (!storedUser) return authUser;
  const legacyAvatar = storedUser.avatar.includes("images.unsplash.com/photo-1601632650940-3903583a835d");
  return {
    ...authUser,
    ...storedUser,
    id: authUser.id,
    email: storedUser.email || authUser.email,
    avatar: legacyAvatar ? "" : storedUser.avatar,
    bio: storedUser.bio === "Island hopper - Storyteller - Palawan enthusiast." ? "" : storedUser.bio,
    nationality: storedUser.nationality === "Filipino" ? "" : storedUser.nationality,
    location: storedUser.location === "Quezon City, Metro Manila" ? "" : storedUser.location,
    joinedDate: storedUser.joinedDate === "March 2023" ? authUser.joinedDate : storedUser.joinedDate || authUser.joinedDate,
    pinsCount: 0,
    storiesCount: 0,
    followersCount: 0,
    followingCount: 0,
    groupIds: authUser.groupIds,
    friends: storedUser.friends ?? [],
    followers: storedUser.followers ?? [],
    following: storedUser.following ?? [],
    interests: storedUser.interests ?? [],
    travelStyle: storedUser.travelStyle ?? "",
  };
}

function persistStoredUser(user: User): User {
  return upsertLocalRow<User>("users", user, (row) => row.id);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    void fetchCurrentUser()
      .then((auth) => {
        if (auth) {
          const authUser = userFromAuth(auth);
          const storedUser = readStoredUser(authUser.id);
          const nextUser = persistStoredUser(mergeStoredUser(authUser, storedUser));
          setUser(nextUser);
        }
      })
      .finally(() => setAuthReady(true));
  }, []);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      setAuthError(null);
      const auth = await loginWithBackend(email, password);
      const authUser = userFromAuth(auth);
      const storedUser = readStoredUser(authUser.id);
      setUser(persistStoredUser(mergeStoredUser(authUser, storedUser)));
      setAuthModalOpen(false);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed. Check your credentials and try again.";
      setAuthError(message);
      return { ok: false, error: message };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      setAuthError(null);
      const auth = await signupWithBackend(name, email, password);
      setUser(persistStoredUser(userFromAuth(auth, name)));
      setAuthModalOpen(false);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign up failed. Check your details and try again.";
      setAuthError(message);
      return { ok: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await logoutFromBackend();
    } catch {
      // ignore
    }
    setUser(null);
    setAuthError(null);
  };

  const updateUser = (updated: User) => {
    setUser(persistStoredUser(updated));
  };

  const openAuthModal = (mode: "login" | "signup" = "login") => {
    if (user) return;
    setAuthMode(mode);
    setAuthError(null);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        authReady,
        authError,
        login,
        signup,
        logout,
        updateUser,
        authModalOpen,
        authMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
