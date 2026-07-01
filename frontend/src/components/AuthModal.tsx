import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PASSWORD_MIN_LENGTH = 12;

export function AuthModal() {
  const { authModalOpen, authMode, closeAuthModal, login, signup, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(""); setEmail(""); setPassword(""); setError("");
  }, [authMode, authModalOpen]);

  useEffect(() => {
    if (!authModalOpen) return undefined;
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (authMode === "signup") {
      if (!name) { setError("Please enter your name."); return; }
      const ok = await signup(name, email, password);
      if (ok) navigate("/maps");
      else setError("Sign up failed. Check your details and try again.");
    } else {
      const ok = await login(email, password);
      if (ok) navigate("/maps");
      else setError("Sign in failed. Check your credentials and try again.");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.8rem 1rem",
    backgroundColor: "#FBF7F0",
    border: "1px solid rgba(58,42,34,0.18)",
    borderRadius: "999px",
    fontSize: "0.95rem",
    color: "#1A1A1A",
    fontFamily: "var(--font-ui)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        backgroundColor: "rgba(44,33,28,0.62)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) closeAuthModal(); }}
    >
      <div
        style={{
          backgroundColor: "#FBF7F0",
          borderRadius: "0.75rem",
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #3A2A22 0%, #C4713A 110%)", padding: "1.75rem 2rem 1.5rem", position: "relative" }}>
          <button
            onClick={closeAuthModal}
            style={{
              position: "absolute", top: 1.25 * 16, right: 1.25 * 16,
              background: "rgba(251,247,240,0.12)", border: "1px solid rgba(251,247,240,0.2)", borderRadius: "50%",
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#F5F0E8",
            }}
          >
            <X size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#FBF7F0", letterSpacing: "0.12em", textTransform: "uppercase" }}>TravelTraces</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", color: "#FBF7F0", margin: 0, fontSize: "2rem", fontWeight: 500, lineHeight: 1 }}>
            {authMode === "login" ? "Welcome back" : "Begin your route"}
          </h2>
          <p style={{ color: "rgba(251,247,240,0.72)", margin: "0.55rem 0 0", fontSize: "0.9rem", fontFamily: "var(--font-ui)" }}>
            {authMode === "login"
              ? "Sign in to continue tracing Southeast Asia."
              : "Create your free account and start mapping your journeys."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "2rem" }}>
          {authMode === "signup" && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", fontFamily: "var(--font-label)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A" }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maria Santos"
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", fontFamily: "var(--font-label)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", fontFamily: "var(--font-label)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                minLength={PASSWORD_MIN_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B6B5A" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ color: "#C0392B", fontSize: "0.875rem", marginBottom: "1rem", fontFamily: "var(--font-ui)" }}>{error}</p>
          )}

          <button
            type="submit"
            style={{
              width: "100%", backgroundColor: "#3A2A22", color: "#FBF7F0",
              border: "none", borderRadius: "999px", padding: "0.9rem",
              cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.875rem",
              fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            {authMode === "login" ? "Sign In" : "Create Account"}
          </button>

          <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#6B6B5A", fontFamily: "var(--font-ui)" }}>
            {authMode === "login" ? "Don't have an account?" : "Already a member?"}{" "}
            <button
              type="button"
              onClick={() => openAuthModal(authMode === "login" ? "signup" : "login")}
              style={{ background: "none", border: "none", color: "#9E6B5C", cursor: "pointer", fontSize: "0.875rem", fontWeight: 700, fontFamily: "var(--font-ui)" }}
            >
              {authMode === "login" ? "Join free" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
