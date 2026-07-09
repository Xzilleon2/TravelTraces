import React from "react";
import { useAuth } from "../context/AuthContext";
import { ArrowRight } from "lucide-react";
import { localAvatarDataUrl } from "../utils/localAvatar";
const kayeenImg = "/creator-profiles/Kayeen.jpg";
const allenImg = "/creator-profiles/Allen.jpg";
const hersheyImg = "/creator-profiles/Hershey.jpg";

const HERO_IMG = "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=1400&h=600&fit=crop&auto=format";
const NATURE_IMG = "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=900&h=560&fit=crop&auto=format";

const TEAM = [
  {
    name: "Kayeen M. Campaña",
    role: "Chief Executive Officer",
    location: "Davao City",
    number: "01", 
    portrait: kayeenImg,
  },
  {
    name: "Allen Jhon Bautista",
    role: "Chief Geospatial Officer",
    location: "Davao City",
    number: "02",
    portrait: allenImg,
  },
  {
    name: "Hershey Nicolle Tabanao",
    role: "Cheif Marketing Officer",
    location: "Davao City",
    number: "03",
    portrait: hersheyImg,
  },

  {
    name: "Bern Francis Gutierrez",
    role: "Chief Creative Officer" ,
    location: "Davao City",
    number: "04",
    portrait: localAvatarDataUrl("Bern Francis Gutierrez"),
  },
  

];

export default function AboutPage() {
  const { openAuthModal } = useAuth();

  return (
    <div style={{ backgroundColor: "#FBF7F0" }}>

      {/* Hero */}
      <section style={{ position: "relative", minHeight: 430, overflow: "hidden", display: "grid", placeItems: "center", textAlign: "center" }}>
        <img src={HERO_IMG} alt="Southeast Asian island aerial view" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(72,42,20,0.34), rgba(44,33,28,0.68))" }} />
        <div style={{ position: "absolute", inset: "12%", border: "1px solid rgba(251,247,240,0.2)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "4rem 1.5rem" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,240,232,0.75)", marginBottom: "0.75rem" }}>
            Our Story
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.25rem, 6vw, 4rem)", fontWeight: 500, color: "#F5F0E8", lineHeight: 1.05, maxWidth: 700, textTransform: "uppercase" }}>
            Born from the love of<br />
            <em>Southeast Asian journeys.</em>
          </h1>
        </div>
      </section>

      {/* Mission / Vision / Goal */}
      <section style={{ backgroundColor: "#3A2A22", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "3rem" }} className="mvg-grid">
          {[
            {
              label: "Mission",
              body: "To empower travellers to document, share, and celebrate the beauty and diversity of Southeast Asia through authentic storytelling.",
            },
            {
              label: "Vision",
              body: "A world where every island, city, trail, market, and heritage street in Southeast Asia has a story told by the people who lived it.",
            },
            {
              label: "Goal",
              body: "Build a living community atlas of Southeast Asia with traveller-created stories, photos, routes, and pinned memories.",
            },
          ].map((item) => (
            <div key={item.label} style={{ borderTop: "2px solid rgba(196,113,58,0.6)", paddingTop: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, color: "#F5F0E8", marginBottom: "1rem" }}>{item.label}</h2>
              <p style={{ fontFamily: "var(--font-body)", color: "rgba(251,247,240,0.8)", lineHeight: 1.75, fontSize: "1rem" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why we built TravelTraces */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "5rem 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="why-grid">
          <div>
            <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#9E6B5C", marginBottom: "0.75rem" }}>
              Why we built TravelTraces
            </p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 500, color: "#2C211C", lineHeight: 1.2, marginBottom: "1.5rem", textTransform: "uppercase" }}>
              Southeast Asia deserves a permanent record.
            </h2>
            <div style={{ fontFamily: "var(--font-body)", color: "#3A3A2A", lineHeight: 1.8, fontSize: "1.025rem" }}>
              <p style={{ marginBottom: "1.25rem" }}>
                TravelTraces was born from a simple frustration: Southeast Asia is one of the most beautiful and diverse regions on Earth, yet many of its travel stories are scattered across old blogs, fleeting posts, and word-of-mouth recommendations that disappear with every algorithm change.
              </p>
              <p>
                We built TravelTraces to be a permanent, community-owned travel record: a platform where beaches, mountains, food places, heritage sites, and hidden gems are told with care, preserved with love, and shared freely with the next traveller who needs to discover them.
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
              Southeast Asia nature
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ backgroundColor: "#2C211C", padding: "6rem 1.5rem", overflow: "hidden", position: "relative" }}>
        {/* Background watermark */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          fontFamily: "var(--font-display)", fontSize: "clamp(8rem, 20vw, 18rem)", fontWeight: 700,
          color: "rgba(251,247,240,0.04)", whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none", lineHeight: 1,
        }}>
          TravelTraces
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4rem", borderBottom: "1px solid rgba(251,247,240,0.12)", paddingBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#CFA68A", marginBottom: "0.5rem" }}>
                Creator Profiles
              </p>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 500, color: "#FBF7F0", lineHeight: 1, textTransform: "uppercase" }}>
                The Creators
              </h2>
            </div>
            <p style={{ fontFamily: "var(--font-body)", color: "rgba(251,247,240,0.62)", fontSize: "0.95rem", maxWidth: 280, lineHeight: 1.65, textAlign: "right" }}>
              A Philippine-born team building a permanent home for Southeast Asian travel stories.
            </p>
          </div>

          {/* Member cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "2px" }} className="team-grid">
            {TEAM.map((member, i) => (
              <div
                key={member.name}
                style={{
                  position: "relative",
                  backgroundColor: i === 0 ? "#3A2A22" : i === 1 ? "#2C211C" : "#4B352A",
                  overflow: "hidden",
                }}
              >
                {/* Large index number */}
                <div style={{
                  position: "absolute", top: "1.25rem", right: "1.5rem",
                  fontFamily: "var(--font-display)", fontSize: "5rem", fontWeight: 700, lineHeight: 1,
                  color: "rgba(251,247,240,0.07)", pointerEvents: "none", userSelect: "none",
                }}>
                  {member.number}
                </div>

                {/* Portrait */}
                <div style={{ position: "relative", overflow: "hidden" }}>
                  <img
                    src={member.portrait}
                    alt={member.name}
                    onError={(e) => {
                      e.currentTarget.src = localAvatarDataUrl(member.name);
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
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: `linear-gradient(to bottom, transparent, ${i === 0 ? "#3A2A22" : i === 1 ? "#2C211C" : "#4B352A"})` }} />

                  {/* Role badge floating on image */}
                  <div style={{
                    position: "absolute", bottom: "1.25rem", left: "1.5rem",
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  }}>
                    <span style={{
                      padding: "0.3rem 0.75rem",
                      backgroundColor: "#C4713A",
                      color: "#FBF7F0",
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
                    color: "#FBF7F0",
                    lineHeight: 1.15,
                    marginBottom: "0.5rem",
                  }}>
                    {member.name}
                  </h3>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "1.25rem" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#CFA68A", flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#CFA68A" }}>
                      {member.location}
                    </span>
                  </div>

                  <blockquote style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.975rem",
                    color: "rgba(251,247,240,0.68)",
                    lineHeight: 1.75,
                    margin: 0,
                    borderLeft: "2px solid rgba(196,113,58,0.4)",
                    paddingLeft: "1rem",
                    fontStyle: "italic",
                  }}>
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: "#3A2A22", padding: "5rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 500, color: "#FBF7F0", lineHeight: 1.2, marginBottom: "1rem", textTransform: "uppercase" }}>
            Join our growing community
          </h2>
          <p style={{ fontFamily: "var(--font-body)", color: "rgba(251,247,240,0.8)", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "2.25rem" }}>
            Travellers are already documenting routes across Southeast Asia. Be part of the story.
          </p>
          <button
            onClick={() => openAuthModal("signup")}
            style={{
              backgroundColor: "#FBF7F0", color: "#3A2A22", border: "1px solid rgba(251,247,240,0.35)",
              padding: "1rem 2.5rem", borderRadius: "999px", cursor: "pointer",
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
