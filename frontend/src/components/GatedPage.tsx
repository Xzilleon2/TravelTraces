import { Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ReactNode } from "react";

export function GatedPage({ children, featureName }: { children: ReactNode; featureName: string }) {
  const { isAuthenticated, authReady, openAuthModal } = useAuth();

  if (isAuthenticated) return <>{children}</>;
  if (!authReady) {
    return (
      <div style={{ minHeight: "80vh", display: "grid", placeItems: "center", padding: "3rem 1.5rem", color: "#6B5A50", fontFamily: "var(--font-ui)" }}>
        Checking your TravelTraces session...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, backgroundColor: "#3A2A22", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", boxShadow: "0 18px 40px rgba(58,42,34,0.12)" }}>
        <Lock size={28} color="#FBF7F0" />
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", color: "#2C211C", marginBottom: "0.75rem" }}>
        Members only
      </h2>
      <p style={{ fontFamily: "var(--font-body)", color: "#6B5A50", fontSize: "1.1rem", maxWidth: 420, lineHeight: 1.7, marginBottom: "2rem" }}>
        {featureName} is available to TravelTraces members. Join for free to unlock the full map, stories, and community features.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => openAuthModal("signup")}
          style={{
            backgroundColor: "#3A2A22", color: "#FBF7F0", border: "none",
            padding: "0.8rem 2rem", borderRadius: "0.25rem", cursor: "pointer",
            fontFamily: "var(--font-label)", fontSize: "0.875rem", fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}
        >
          Join Free
        </button>
        <button
          onClick={() => openAuthModal("login")}
          style={{
            backgroundColor: "transparent", color: "#3A2A22",
            border: "1px solid rgba(58,42,34,0.35)",
            padding: "0.8rem 2rem", borderRadius: "0.25rem", cursor: "pointer",
            fontFamily: "var(--font-label)", fontSize: "0.875rem", fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
