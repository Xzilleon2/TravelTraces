import React from "react";
import { useAuth } from "../context/AuthContext";
import { ArrowRight } from "lucide-react";
const kayeenImg = "/imports/Kayeen.jpg";
const allenImg = "/imports/Allen.jpg";
const hersheyImg = "/imports/Hershey.jpg";

const HERO_IMG = "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=1400&h=600&fit=crop&auto=format";
const NATURE_IMG = "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=900&h=560&fit=crop&auto=format";

const TEAM = [
  {
    name: "Kayeen M. Campaña",
    role: "Founder & CEO",
    location: "Davao City",
    number: "01",
    quote: "Every Filipino deserves to see their hometown on a map — not through a tourist's eyes, but through their own.",
    portrait: kayeenImg,
  },
  {
    name: "Allen Jhon Bautista",
    role: "Chief Technology Officer",
    location: "Davao City",
    number: "02",
    quote: "Good technology should disappear. What remains is the story — and the person who had the courage to share it.",
    portrait: allenImg,
  },
  {
    name: "Hershey Nicolle Tabanao",
    role: "Marketing Strategy",
    location: "Davao City",
    number: "03",
    quote: "Every journey becomes more meaningful when travelers connect with local communities, cultures, and stories.",
    portrait: hersheyImg,
  },
];

export default function AboutPage() {
  const { openAuthModal } = useAuth();

  return (
    <div style={{ backgroundColor: "#F5F0E8" }}>

      {/* Hero */}
      <div style={{ position: "relative", height: 440, overflow: "hidden" }}>
        <img src={HERO_IMG} alt="Philippine archipelago aerial view" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(26,26,26,0.35) 0%, rgba(26,26,26,0.65) 100%)" }} />
        <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 1000, margin: "0 auto", padding: "0 1.5rem" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,240,232,0.75)", marginBottom: "0.75rem" }}>
            Our Story
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.25rem, 6vw, 4rem)", fontWeight: 600, color: "#F5F0E8", lineHeight: 1.15, maxWidth: 640 }}>
            Born from the love of<br />
            <em>Filipino wandering.</em>
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "1.1rem", color: "rgba(245,240,232,0.85)", marginTop: "1rem", maxWidth: 480 }}>
            "TravelTraces" means footstep in Filipino. Every footstep is a story. Every story is an invitation.
          </p>
        </div>
      </div>

      {/* Mission / Vision / Goal */}
      <section style={{ backgroundColor: "#2D4A2D", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "3rem" }} className="mvg-grid">
          {[
            {
              label: "Mission",
              body: "To empower every Filipino traveler to document, share, and celebrate the beauty and diversity of the Philippine archipelago through authentic storytelling.",
            },
            {
              label: "Vision",
              body: "A world where every province of the Philippines has a story — told by the people who lived it, not just the guidebooks.",
            },
            {
              label: "Goal",
              body: "Cover all 81 provinces, 1,634 municipalities, and 7,641 islands with traveler-created stories, photos, and pinned memories by 2030.",
            },
          ].map((item) => (
            <div key={item.label} style={{ borderTop: "2px solid rgba(196,113,58,0.6)", paddingTop: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, color: "#F5F0E8", marginBottom: "1rem" }}>{item.label}</h2>
              <p style={{ fontFamily: "var(--font-body)", color: "rgba(245,240,232,0.8)", lineHeight: 1.75, fontSize: "1rem" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why we built TravelTraces */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "5rem 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="why-grid">
          <div>
            <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.75rem" }}>
              Why we built TravelTraces
            </p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 600, color: "#2D4A2D", lineHeight: 1.2, marginBottom: "1.5rem" }}>
              The Philippines deserves a permanent record.
            </h2>
            <div style={{ fontFamily: "var(--font-body)", color: "#3A3A2A", lineHeight: 1.8, fontSize: "1.025rem" }}>
              <p style={{ marginBottom: "1.25rem" }}>
                TravelTraces was born from a simple frustration: the Philippines is one of the most beautiful and diverse countries on Earth, yet its stories were scattered — buried in old blogs, fleeting Instagram posts, and word-of-mouth recommendations that disappeared with every algorithm change.
              </p>
              <p>
                We built TravelTraces to be the permanent, community-owned record of Filipino travel — a platform where the story of every barangay, beach, mountain, and heritage site is told with care, preserved with love, and shared freely with the next traveler who needs to discover it.
              </p>
            </div>
          </div>
          <div style={{ borderRadius: "0.25rem", overflow: "hidden" }}>
            <img
              src={NATURE_IMG}
              alt="Philippine rice terraces and mountains"
              style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }}
            />
            <p style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A", marginTop: "0.5rem", textAlign: "right" }}>
              Philippines nature
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ backgroundColor: "#1A2E1A", padding: "6rem 1.5rem", overflow: "hidden", position: "relative" }}>
        {/* Background watermark */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          fontFamily: "var(--font-display)", fontSize: "clamp(8rem, 20vw, 18rem)", fontWeight: 700,
          color: "rgba(245,240,232,0.03)", whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none", lineHeight: 1,
        }}>
          TravelTraces
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4rem", borderBottom: "1px solid rgba(245,240,232,0.1)", paddingBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.5rem" }}>
                The people behind TravelTraces
              </p>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 600, color: "#F5F0E8", lineHeight: 1 }}>
                The Team
              </h2>
            </div>
            <p style={{ fontFamily: "var(--font-body)", color: "rgba(245,240,232,0.5)", fontSize: "0.95rem", maxWidth: 280, lineHeight: 1.65, textAlign: "right" }}>
              Two builders who believe Filipino stories deserve a permanent home.
            </p>
          </div>

          {/* Member cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px" }} className="team-grid">
            {TEAM.map((member, i) => (
              <div
                key={member.name}
                style={{
                  position: "relative",
                  backgroundColor: i === 0 ? "#243824" : i === 1 ? "#1A2E1A" : "#21351F",
                  overflow: "hidden",
                }}
              >
                {/* Large index number */}
                <div style={{
                  position: "absolute", top: "1.25rem", right: "1.5rem",
                  fontFamily: "var(--font-display)", fontSize: "5rem", fontWeight: 700, lineHeight: 1,
                  color: "rgba(245,240,232,0.06)", pointerEvents: "none", userSelect: "none",
                }}>
                  {member.number}
                </div>

                {/* Portrait */}
                <div style={{ position: "relative", overflow: "hidden" }}>
                  <img
                    src={member.portrait}
                    alt={member.name}
                    onError={(e) => {
                      // Fallback support if empty placeholder is used
                      const fallbacks: Record<string, string> = {
                        "Kayeen M. Campaña": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=600&fit=crop&auto=format",
                        "Allen Jhon Bautista": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=600&fit=crop&auto=format",
                        "Hershey Nicolle Tabanao": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=500&h=600&fit=crop&auto=format"
                      };
                      e.currentTarget.src = fallbacks[member.name] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=600&fit=crop&auto=format";
                    }}
                    style={{
                      width: "100%",
                      height: "clamp(340px, 45vw, 520px)",
                      objectFit: "cover",
                      objectPosition: "center top",
                      display: "block",
                      filter: "grayscale(15%)",
                      transition: "transform 0.5s, filter 0.4s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.filter = "grayscale(0%)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.filter = "grayscale(15%)"; }}
                  />
                  {/* Gradient overlay at base of image */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: `linear-gradient(to bottom, transparent, ${i === 0 ? "#243824" : i === 1 ? "#1A2E1A" : "#21351F"})` }} />

                  {/* Role badge floating on image */}
                  <div style={{
                    position: "absolute", bottom: "1.25rem", left: "1.5rem",
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  }}>
                    <span style={{
                      padding: "0.3rem 0.75rem",
                      backgroundColor: "#C4713A",
                      color: "#F5F0E8",
                      fontFamily: "var(--font-label)",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}>
                      {member.role}
                    </span>
                  </div>
                </div>

                {/* Text content */}
                <div style={{ padding: "1.75rem 1.75rem 2.25rem" }}>
                  {/* Thin rule */}
                  <div style={{ width: 40, height: 1, backgroundColor: "#C4713A", marginBottom: "1.25rem" }} />

                  <h3 style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                    fontWeight: 600,
                    color: "#F5F0E8",
                    lineHeight: 1.15,
                    marginBottom: "0.5rem",
                  }}>
                    {member.name}
                  </h3>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "1.25rem" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#7A9E6F", flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#7A9E6F" }}>
                      {member.location}
                    </span>
                  </div>

                  <blockquote style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.975rem",
                    color: "rgba(245,240,232,0.65)",
                    lineHeight: 1.75,
                    margin: 0,
                    borderLeft: "2px solid rgba(196,113,58,0.4)",
                    paddingLeft: "1rem",
                    fontStyle: "italic",
                  }}>
                    "{member.quote}"
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: "#2D4A2D", padding: "5rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#F5F0E8", lineHeight: 1.2, marginBottom: "1rem" }}>
            Join our growing community
          </h2>
          <p style={{ fontFamily: "var(--font-body)", color: "rgba(245,240,232,0.8)", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "2.25rem" }}>
            34,000+ travelers are already documenting the Philippines. Be part of the story.
          </p>
          <button
            onClick={() => openAuthModal("signup")}
            style={{
              backgroundColor: "#C4713A", color: "#F5F0E8", border: "none",
              padding: "1rem 2.5rem", borderRadius: "0.25rem", cursor: "pointer",
              fontFamily: "var(--font-label)", fontSize: "0.875rem", fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase",
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
            }}
          >
            Get Started Free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .mvg-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .why-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .team-grid { grid-template-columns: 1fr !important; gap: 2px !important; }
        }
        @media (max-width: 900px) and (min-width: 769px) {
          .team-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
