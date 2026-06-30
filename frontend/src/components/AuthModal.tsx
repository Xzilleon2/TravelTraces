import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, Eye, EyeOff, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (authMode === "signup") {
      if (!name) { setError("Please enter your name."); return; }
      const ok = await signup(name, email, password);
      if (ok) navigate("/maps");
    } else {
      const ok = await login(email, password);
      if (ok) navigate("/maps");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    backgroundColor: "#E8E4D8",
    border: "1px solid rgba(45,74,45,0.15)",
    borderRadius: "0.25rem",
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
        backgroundColor: "rgba(26,26,26,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) closeAuthModal(); }}
    >
      <div
        style={{
          backgroundColor: "#F5F0E8",
          borderRadius: "0.5rem",
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ backgroundColor: "#2D4A2D", padding: "1.75rem 2rem 1.5rem", position: "relative" }}>
          <button
            onClick={closeAuthModal}
            style={{
              position: "absolute", top: 1.25 * 16, right: 1.25 * 16,
              background: "rgba(245,240,232,0.1)", border: "none", borderRadius: "50%",
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#F5F0E8",
            }}
          >
            <X size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ width: 28, height: 28, backgroundColor: "#C4713A", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MapPin size={14} color="#F5F0E8" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#F5F0E8" }}>TravelTraces</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", color: "#F5F0E8", margin: 0, fontSize: "1.75rem", fontWeight: 500 }}>
            {authMode === "login" ? "Welcome back" : "Join the journey"}
          </h2>
          <p style={{ color: "rgba(245,240,232,0.7)", margin: "0.25rem 0 0", fontSize: "0.9rem", fontFamily: "var(--font-ui)" }}>
            {authMode === "login"
              ? "Sign in to continue exploring the archipelago"
              : "Create your free account and start pinning"}
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
              width: "100%", backgroundColor: "#2D4A2D", color: "#F5F0E8",
              border: "none", borderRadius: "0.25rem", padding: "0.85rem",
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
              style={{ background: "none", border: "none", color: "#C4713A", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, fontFamily: "var(--font-ui)" }}
            >
              {authMode === "login" ? "Join free" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
