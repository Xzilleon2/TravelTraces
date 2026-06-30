import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchCurrentUser, loginWithBackend, logoutFromBackend, signupWithBackend, type AuthUser } from "../services/authApi";

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
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  authModalOpen: boolean;
  authMode: "login" | "signup";
  openAuthModal: (mode?: "login" | "signup") => void;
  closeAuthModal: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER: User = {
  id: "demo-user",
  name: "Maria Santos",
  email: "maria@traveltraces.app",
  avatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=80&h=80&fit=crop&auto=format",
  bio: "Island hopper · Storyteller · Palawan enthusiast.",
  location: "Quezon City, Metro Manila",
  joinedDate: "March 2023",
  pinsCount: 94,
  storiesCount: 18,
  followersCount: 1240,
  followingCount: 312,
  plan: "free",
  groupIds: ["traveltraces-circle"],
  friends: [
    {
      id: "ana",
      name: "Ana Villanueva",
      location: "Quezon City",
      avatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=80&h=80&fit=crop&auto=format",
      lat: 14.676,
      lon: 121.0437,
    },
    {
      id: "carlo",
      name: "Carlo Reyes",
      location: "Cebu City",
      avatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=80&h=80&fit=crop&auto=format",
      lat: 10.3157,
      lon: 123.8854,
    },
    {
      id: "leila",
      name: "Leila Marcos",
      location: "Davao City",
      avatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=80&h=80&fit=crop&auto=format",
      lat: 7.1907,
      lon: 125.4553,
    },
  ],
  followers: [
    {
      id: "ramon",
      name: "Ramon Dela Cruz",
      location: "Baguio City",
      avatar: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=80&h=80&fit=crop&auto=format",
      lat: 16.4023,
      lon: 120.596,
    },
    {
      id: "sofia",
      name: "Sofia Reyes",
      location: "Iloilo City",
      avatar: "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=80&h=80&fit=crop&auto=format",
      lat: 10.7202,
      lon: 122.5621,
    },
    {
      id: "marco",
      name: "Marco Buenaventura",
      location: "Manila",
      avatar: "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=80&h=80&fit=crop&auto=format",
      lat: 14.5995,
      lon: 120.9842,
    },
  ],
};

function userFromAuth(auth: AuthUser, fallbackName?: string): User {
  return {
    ...MOCK_USER,
    id: auth.user_id,
    email: auth.email,
    name: fallbackName ?? auth.email.split("@")[0],
    groupIds: auth.group_ids.length ? auth.group_ids : MOCK_USER.groupIds,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    void fetchCurrentUser()
      .then((auth) => {
        if (auth) setUser(userFromAuth(auth));
      })
      .finally(() => setAuthReady(true));
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const auth = await loginWithBackend(email, password);
      setUser(userFromAuth(auth));
      setAuthModalOpen(false);
      return true;
    } catch {
      setUser({ ...MOCK_USER, email });
      setAuthModalOpen(false);
      return true;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const auth = await signupWithBackend(name, email, password);
      setUser(userFromAuth(auth, name));
    } catch {
      setUser({ ...MOCK_USER, name, email, id: email.split("@")[0] || "demo-user" });
    }
    setAuthModalOpen(false);
    return true;
  };

  const logout = async () => {
    try {
      await logoutFromBackend();
    } catch {
      // ignore
    }
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  const openAuthModal = (mode: "login" | "signup" = "login") => {
    if (user) return;
    setAuthMode(mode);
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
