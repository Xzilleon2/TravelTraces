import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { Menu, X, LogOut, User, ChevronDown, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ChatPanel } from "./ChatPanel";
import { MusicBox } from "./MusicBox";
import { readLocalTable } from "../services/localDb";

const memberLinks = [
  { to: "/explore", label: "Explore" },
  { to: "/stories", label: "Stories" },
  { to: "/travel-plan-stories", label: "Travel Plans" },
  { to: "/chat", label: "AI Chat" },
  { to: "/maps", label: "Maps" },
  { to: "/community", label: "Community" },
  { to: "/events", label: "Events" },
];

const publicLinks = [
  { label: "Home", hash: "" },
  { label: "Platform Features", hash: "features" },
  { label: "Featured Stories", hash: "featured-stories" },
  { label: "How it Works", hash: "how-it-works" },
  { label: "Pricing", hash: "pricing-route" },
  { label: "About", hash: "about-route" },
];

export function Navbar() {
  const { isAuthenticated, user, logout, openAuthModal } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [hasUnreadChats, setHasUnreadChats] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const navigate = useNavigate();
  const isPublicHeader = true;

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 12);

      if (currentScrollY < 24) {
        setIsHidden(false);
      } else if (currentScrollY > lastScrollY + 4) {
        setIsHidden(true);
      } else if (currentScrollY < lastScrollY - 4) {
        setIsHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const refreshUnread = () => {
      if (!user?.id) {
        setHasUnreadChats(false);
        return;
      }
      setHasUnreadChats(readLocalTable<{ ownerId?: string; unread?: boolean }>("conversations").some((conversation) => conversation.ownerId === user.id && conversation.unread));
    };
    refreshUnread();
    window.addEventListener("traveltraces:local-db-updated", refreshUnread);
    window.addEventListener("storage", refreshUnread);
    return () => {
      window.removeEventListener("traveltraces:local-db-updated", refreshUnread);
      window.removeEventListener("storage", refreshUnread);
    };
  }, [user?.id]);

  const handlePublicLinkClick = (hash: string) => {
    setMobileOpen(false);
    if (hash === "pricing-route") { navigate("/pricing"); return; }
    if (hash === "about-route") { navigate("/about"); return; }
    if (hash === "") {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 30);
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
    padding: isPublicHeader ? "0.45rem 0.85rem" : "0.35rem 0.55rem",
    borderRadius: "0.25rem",
    textDecoration: "none",
    color: isPublicHeader ? "#3A2A22" : "rgba(245,240,232,0.7)",
    backgroundColor: "transparent",
    fontSize: isPublicHeader ? "0.7rem" : "0.74rem",
    fontWeight: 500,
    letterSpacing: isPublicHeader ? "0.08em" : "0.03em",
    fontFamily: "var(--font-label)",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    cursor: "pointer",
    border: "none",
    transition: "color 0.15s",
  };

  return (
    <nav
      className="site-header"
      style={{
        backgroundColor: isScrolled ? "rgba(251,247,240,0.96)" : "rgba(251,247,240,0.9)",
        borderBottom: "1px solid rgba(58,42,34,0.12)",
        fontFamily: "var(--font-ui)",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 80,
        transform: isHidden ? "translateY(-105%)" : "translateY(0)",
        boxShadow: isScrolled ? "0 14px 36px rgba(58,42,34,0.12)" : "none",
        backdropFilter: isScrolled ? "blur(18px)" : "blur(8px)",
        transition: "transform 0.28s var(--motion-ease), background-color 0.28s ease, box-shadow 0.28s ease, backdrop-filter 0.28s ease",
      }}
    >
      <div style={{ maxWidth: isPublicHeader ? 1280 : 1200, margin: "0 auto", padding: "0 clamp(0.85rem, 3vw, 1.5rem)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

          {/* Logo */}
          <NavLink to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.18rem, 4.8vw, 1.5rem)", fontWeight: 600, color: isPublicHeader ? "#3A2A22" : "#F5F0E8", letterSpacing: isPublicHeader ? "0.18em" : "0.02em", whiteSpace: "nowrap", textTransform: isPublicHeader ? "uppercase" : "none" }}>
              TravelTraces
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div style={{ alignItems: "center", gap: isPublicHeader ? "0.4rem" : "0.18rem", flexWrap: "nowrap" }} className="hidden xl:flex">
            {isAuthenticated ? (
              memberLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  style={({ isActive }) => ({
                    ...linkBaseStyle,
                    color: isActive ? "#C4713A" : "#3A2A22",
                    backgroundColor: "transparent",
                    borderBottom: isActive ? "1.5px solid #C4713A" : "1.5px solid transparent",
                    borderRadius: 0,
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
                  onMouseEnter={(e) => (e.currentTarget.style.color = isPublicHeader ? "#C4713A" : "#F5F0E8")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = isPublicHeader ? "#3A2A22" : "rgba(245,240,232,0.7)")}
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
                style={{ position: "relative", background: "rgba(196,113,58,0.1)", border: "1px solid rgba(58,42,34,0.16)", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#3A2A22" }}
              >
                <MessageSquare size={17} />
                {hasUnreadChats ? <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, backgroundColor: "#C4713A", borderRadius: "50%", border: "1.5px solid #FBF7F0" }} /> : null}
              </button>
            )}
            {isAuthenticated && user ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(196,113,58,0.1)", border: "1px solid rgba(58,42,34,0.16)", borderRadius: "2rem", padding: "0.35rem 0.75rem 0.35rem 0.35rem", cursor: "pointer", color: "#3A2A22" }}
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
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 0.5rem)", backgroundColor: "#EFE7DC", border: "1px solid rgba(58,42,34,0.14)", borderRadius: "0.5rem", minWidth: 160, boxShadow: "0 18px 40px rgba(44,33,28,0.16)", overflow: "hidden", animation: "cardRise 0.3s var(--motion-ease) both" }}>
                    <NavLink to="/profile" onClick={() => setUserMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", color: "#1A1A1A", textDecoration: "none", fontSize: "0.875rem" }}>
                      <User size={15} /> My Profile
                    </NavLink>
                    <MusicBox variant="menu" />
                    <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", color: "#C0392B", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", width: "100%", textAlign: "left" }}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => openAuthModal("signup")} style={{ background: "#3A2A22", border: "1px solid rgba(58,42,34,0.32)", color: "#FBF7F0", padding: "0.55rem 1.15rem", borderRadius: "999px", cursor: "pointer", fontSize: "0.74rem", fontFamily: "var(--font-label)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Sign in / Join free
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen((v) => !v)} style={{ background: "none", border: "none", color: isPublicHeader ? "#3A2A22" : "#F5F0E8", cursor: "pointer", padding: "0.25rem", minWidth: 44, minHeight: 44 }} className="xl:hidden">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ backgroundColor: "#FBF7F0", borderTop: "1px solid rgba(58,42,34,0.12)", padding: "1rem clamp(0.85rem, 3vw, 1.5rem)", maxHeight: "calc(100dvh - 64px)", overflowY: "auto", animation: "cardRise 0.35s var(--motion-ease) both" }} className="xl:hidden">
          {isAuthenticated ? (
            memberLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  display: "block", padding: "0.75rem 0",
                  color: isActive ? "#9E6B5C" : "#3A2A22",
                  textDecoration: "none", fontSize: "1rem",
                  fontFamily: "var(--font-label)", fontWeight: 500,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  borderBottom: "1px solid rgba(58,42,34,0.1)",
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
                  borderBottom: isPublicHeader ? "1px solid rgba(58,42,34,0.1)" : "1px solid rgba(245,240,232,0.08)",
                  color: isPublicHeader ? "#3A2A22" : "rgba(245,240,232,0.7)", fontSize: "1rem",
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
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", minHeight: 44, background: "rgba(196,113,58,0.1)", border: "1px solid rgba(58,42,34,0.16)", color: "#3A2A22", padding: "0.6rem", borderRadius: "999px", textDecoration: "none", fontFamily: "var(--font-label)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  <User size={15} /> My Profile
                </NavLink>
                <button onClick={() => { void logout().finally(() => { setMobileOpen(false); navigate("/"); }); }} style={{ width: "100%", minHeight: 44, background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.25)", color: "#9E3B2F", padding: "0.6rem", borderRadius: "999px", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <button onClick={() => { openAuthModal("signup"); setMobileOpen(false); }} style={{ width: "100%", background: "#C4713A", border: "none", color: "#FBF7F0", padding: "0.75rem", borderRadius: "999px", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Sign in / Join free
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
