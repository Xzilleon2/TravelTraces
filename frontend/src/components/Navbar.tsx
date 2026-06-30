import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { Menu, X, MapPin, LogOut, User, ChevronDown, MessageSquare, Bookmark } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ChatPanel } from "./ChatPanel";
import { MusicBox } from "./MusicBox";

const memberLinks = [
  { to: "/explore", label: "Explore" },
  { to: "/stories", label: "Stories" },
  { to: "/maps", label: "Maps", featured: true },
  { to: "/community", label: "Community" },
  { to: "/events", label: "Events" },
];

const publicLinks = [
  { label: "Home", hash: "" },
  { label: "Platform Features", hash: "features" },
  { label: "Featured Stories", hash: "featured-stories" },
  { label: "How it Works", hash: "how-it-works" },
  { label: "Pricing", hash: "pricing-route" },
  { label: "Help", hash: "help-route" },
  { label: "Contact", hash: "contact-route" },
];

export function Navbar() {
  const { isAuthenticated, user, logout, openAuthModal } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();

  const handlePublicLinkClick = (hash: string) => {
    setMobileOpen(false);
    if (hash === "help-route") { navigate("/help"); return; }
    if (hash === "contact-route") { navigate("/contact"); return; }
    if (hash === "pricing-route") { navigate("/pricing"); return; }
    if (hash === "") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate("/");
      return;
    }
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleLogout = () => {
    void logout().finally(() => {
      setUserMenuOpen(false);
      navigate("/");
    });
  };

  const linkBaseStyle: React.CSSProperties = {
    padding: "0.35rem 0.55rem",
    borderRadius: "0.25rem",
    textDecoration: "none",
    color: "rgba(245,240,232,0.7)",
    backgroundColor: "transparent",
    fontSize: "0.74rem",
    fontWeight: 500,
    letterSpacing: "0.03em",
    fontFamily: "var(--font-label)",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    cursor: "pointer",
    border: "none",
    transition: "color 0.15s",
  };

  const mapsLinkStyle = (isActive = false): React.CSSProperties => ({
    ...linkBaseStyle,
    color: "#F5F0E8",
    backgroundColor: isActive ? "rgba(196,113,58,0.34)" : "rgba(196,113,58,0.2)",
    border: "1px solid rgba(196,113,58,0.55)",
    boxShadow: isActive ? "inset 0 -2px 0 #C4713A" : "none",
  });

  return (
    <nav style={{ backgroundColor: "#2D4A2D", fontFamily: "var(--font-ui)", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(0.85rem, 3vw, 1.5rem)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

          {/* Logo */}
          <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, backgroundColor: "#C4713A", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MapPin size={16} color="#F5F0E8" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.18rem, 4.8vw, 1.5rem)", fontWeight: 600, color: "#F5F0E8", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
              TravelTraces
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div style={{ alignItems: "center", gap: "0.18rem", flexWrap: "nowrap" }} className="hidden xl:flex">
            {isAuthenticated ? (
              memberLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  style={({ isActive }) => ({
                    ...(link.featured ? mapsLinkStyle(isActive) : linkBaseStyle),
                    color: isActive ? "#F5F0E8" : "rgba(245,240,232,0.7)",
                    backgroundColor: isActive ? "rgba(245,240,232,0.12)" : "transparent",
                    ...(link.featured ? mapsLinkStyle(isActive) : {}),
                  })}
                >
                  {link.label}
                </NavLink>
              ))
            ) : (
              publicLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handlePublicLinkClick(link.hash)}
                  style={linkBaseStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F0E8")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.7)")}
                >
                  {link.label}
                </button>
              ))
            )}
          </div>

          {/* Auth area */}
          <div style={{ alignItems: "center", gap: "0.75rem" }} className="hidden xl:flex">
            {isAuthenticated && user && (
              <button
                onClick={() => setChatOpen((v) => !v)}
                style={{ position: "relative", background: "rgba(245,240,232,0.1)", border: "1px solid rgba(245,240,232,0.2)", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#F5F0E8" }}
              >
                <MessageSquare size={17} />
                <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, backgroundColor: "#C4713A", borderRadius: "50%", border: "1.5px solid #2D4A2D" }} />
              </button>
            )}
            {isAuthenticated && user ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(245,240,232,0.1)", border: "1px solid rgba(245,240,232,0.2)", borderRadius: "2rem", padding: "0.35rem 0.75rem 0.35rem 0.35rem", cursor: "pointer", color: "#F5F0E8" }}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                  />
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{user.name.split(" ")[0]}</span>
                  <ChevronDown size={14} />
                </button>
                {userMenuOpen && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 0.5rem)", backgroundColor: "#EDEAE0", border: "1px solid rgba(45,74,45,0.15)", borderRadius: "0.5rem", minWidth: 160, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                    <NavLink to="/profile" onClick={() => setUserMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", color: "#1A1A1A", textDecoration: "none", fontSize: "0.875rem" }}>
                      <User size={15} /> My Profile
                    </NavLink>
                    <NavLink to="/saved-places" onClick={() => setUserMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", color: "#1A1A1A", textDecoration: "none", fontSize: "0.875rem" }}>
                      <Bookmark size={15} /> Saved Places
                    </NavLink>
                    <MusicBox variant="menu" />
                    <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", color: "#C0392B", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", width: "100%", textAlign: "left" }}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => openAuthModal("login")} style={{ background: "none", border: "1px solid rgba(245,240,232,0.35)", color: "#F5F0E8", padding: "0.4rem 0.85rem", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "var(--font-label)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  Sign In
                </button>
                <button onClick={() => openAuthModal("signup")} style={{ background: "#C4713A", border: "none", color: "#F5F0E8", padding: "0.4rem 0.85rem", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "var(--font-label)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  Join Free
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen((v) => !v)} style={{ background: "none", border: "none", color: "#F5F0E8", cursor: "pointer", padding: "0.25rem", minWidth: 44, minHeight: 44 }} className="xl:hidden">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ backgroundColor: "#234023", borderTop: "1px solid rgba(245,240,232,0.1)", padding: "1rem clamp(0.85rem, 3vw, 1.5rem)", maxHeight: "calc(100dvh - 64px)", overflowY: "auto" }} className="xl:hidden">
          {isAuthenticated ? (
            memberLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  display: "block", padding: "0.75rem 0",
                  color: isActive ? "#F5F0E8" : "rgba(245,240,232,0.7)",
                  textDecoration: "none", fontSize: "1rem",
                  fontFamily: "var(--font-label)", fontWeight: 500,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  borderBottom: "1px solid rgba(245,240,232,0.08)",
                  ...(link.featured
                    ? {
                        color: "#F5F0E8",
                        padding: "0.75rem 0.6rem",
                        marginBottom: "0.35rem",
                        border: "1px solid rgba(196,113,58,0.45)",
                        borderRadius: "0.25rem",
                        backgroundColor: isActive ? "rgba(196,113,58,0.34)" : "rgba(196,113,58,0.2)",
                      }
                    : {}),
                })}
              >
                {link.label}
              </NavLink>
            ))
          ) : (
            publicLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handlePublicLinkClick(link.hash)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "0.75rem 0", background: "none", border: "none",
                  borderBottom: "1px solid rgba(245,240,232,0.08)",
                  color: "rgba(245,240,232,0.7)", fontSize: "1rem",
                  fontFamily: "var(--font-label)", fontWeight: 500,
                  letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer",
                }}
              >
                {link.label}
              </button>
            ))
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", minHeight: 44, background: "rgba(245,240,232,0.1)", border: "1px solid rgba(245,240,232,0.2)", color: "#F5F0E8", padding: "0.6rem", borderRadius: "0.25rem", textDecoration: "none", fontFamily: "var(--font-label)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  <User size={15} /> My Profile
                </NavLink>
                <NavLink
                  to="/saved-places"
                  onClick={() => setMobileOpen(false)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", minHeight: 44, background: "rgba(245,240,232,0.1)", border: "1px solid rgba(245,240,232,0.2)", color: "#F5F0E8", padding: "0.6rem", borderRadius: "0.25rem", textDecoration: "none", fontFamily: "var(--font-label)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  <Bookmark size={15} /> Saved Places
                </NavLink>
                <button onClick={() => { void logout().finally(() => { setMobileOpen(false); navigate("/"); }); }} style={{ width: "100%", minHeight: 44, background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.3)", color: "#F5F0E8", padding: "0.6rem", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => { openAuthModal("login"); setMobileOpen(false); }} style={{ flex: 1, background: "none", border: "1px solid rgba(245,240,232,0.35)", color: "#F5F0E8", padding: "0.6rem", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Sign In
                </button>
                <button onClick={() => { openAuthModal("signup"); setMobileOpen(false); }} style={{ flex: 1, background: "#C4713A", border: "none", color: "#F5F0E8", padding: "0.6rem", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Join Free
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
