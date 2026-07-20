import { useState } from "react";
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
    name: "Kayeen M. Campana",
    role: "Front-end Development",
    contribution: "Designs and builds the TravelTraces interface, shaping its visual system and everyday user experience.",
    location: "Davao City",
    number: "01", 
    portrait: kayeenImg,
  },
  {
    name: "Allen John Bautista",
    role: "Back-end & Geospatial",
    contribution: "Develops back-end services with a focus on maps, location data, routing, and geospatial workflows.",
    location: "Davao City",
    number: "02",
    portrait: allenImg,
  },
  {
    name: "Hershey Nicolle Tabanao",
    role: "Content & Social Media",
    contribution: "Creates and posts content that introduces TravelTraces, highlights its features, and keeps the community informed.",
    location: "Davao City",
    number: "03",
    portrait: hersheyImg,
  },

  {
    name: "Bern Francis Gutierrez",
    role: "Video & Creative",
    contribution: "Produces video edits and creative media that bring the platform's journeys, stories, and identity to life.",
    location: "Davao City",
    number: "04",
    portrait: localAvatarDataUrl("Bern Francis Gutierrez"),
  },
  {
    name: "Joseph Steward Mejos",
    role: "Back-end & AI Chat",
    contribution: "Builds the back-end integration for Trace, connecting the AI model with the platform's chat experience.",
    location: "Davao City",
    number: "05",
    portrait: localAvatarDataUrl("Joseph Steward Mejos"),
  },
];

export default function AboutPage() {
  const { openAuthModal } = useAuth();
  const [activeCreator, setActiveCreator] = useState(0);

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

          <div className="creator-showcase" aria-label="TravelTraces creators">
            {TEAM.map((member, i) => (
              <button
                type="button"
                key={member.name}
                className={`creator-panel ${activeCreator === i ? "creator-panel--active" : ""}`}
                aria-expanded={activeCreator === i}
                onMouseEnter={() => setActiveCreator(i)}
                onFocus={() => setActiveCreator(i)}
                onClick={() => setActiveCreator(i)}
              >
                <img
                  src={member.portrait}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.src = localAvatarDataUrl(member.name);
                  }}
                />
                <span className="creator-panel-shade" aria-hidden="true" />
                <span className="creator-panel-number" aria-hidden="true">{member.number}</span>
                <span className="creator-panel-summary">
                  <span className="creator-panel-role">{member.role}</span>
                  <strong>{member.name}</strong>
                  <span className="creator-panel-location">
                    <span aria-hidden="true" /> {member.location}
                  </span>
                  <q>{member.contribution}</q>
                </span>
                <span className="creator-panel-label">
                  <strong>{member.name}</strong>
                  <small>Creator profile</small>
                </span>
              </button>
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
        .creator-showcase {
          width: 100%;
          height: 34rem;
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
        }
        .creator-panel {
          position: relative;
          min-width: 0;
          height: 20rem;
          flex: 1 1 0;
          overflow: hidden;
          border: 1px solid rgba(251,247,240,0.14);
          border-radius: 0.5rem;
          background: #3A2A22;
          color: #FBF7F0;
          padding: 0;
          cursor: pointer;
          text-align: left;
          box-shadow: 0 1.25rem 2.75rem rgba(18,12,9,0.2);
          transition: flex-grow 520ms cubic-bezier(0.22,1,0.36,1), height 520ms cubic-bezier(0.22,1,0.36,1), border-color 250ms ease, box-shadow 250ms ease;
        }
        .creator-panel--active {
          height: 34rem;
          flex-grow: 3.6;
          border-color: rgba(207,166,138,0.55);
          box-shadow: 0 1.75rem 4rem rgba(18,12,9,0.34);
        }
        .creator-panel:focus-visible {
          outline: 3px solid #E8B38E;
          outline-offset: 3px;
        }
        .creator-panel img,
        .creator-panel-shade {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .creator-panel img {
          display: block;
          object-fit: cover;
          object-position: center top;
          filter: grayscale(28%) saturate(0.82);
          transform: scale(1.01);
          transition: filter 420ms ease, transform 620ms cubic-bezier(0.22,1,0.36,1);
        }
        .creator-panel--active img {
          filter: grayscale(0%) saturate(0.95);
          transform: scale(1.045);
        }
        .creator-panel-shade {
          background: linear-gradient(to top, rgba(31,21,16,0.98) 0%, rgba(44,33,28,0.72) 35%, rgba(44,33,28,0.08) 70%);
          pointer-events: none;
        }
        .creator-panel-number {
          position: absolute;
          top: 1rem;
          right: 1rem;
          color: rgba(251,247,240,0.62);
          font-family: var(--font-label);
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.12em;
        }
        .creator-panel-summary,
        .creator-panel-label {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2;
        }
        .creator-panel-summary {
          display: grid;
          gap: 0.6rem;
          padding: 2rem;
          opacity: 0;
          transform: translateY(1.25rem);
          pointer-events: none;
          transition: opacity 260ms ease, transform 420ms cubic-bezier(0.22,1,0.36,1);
        }
        .creator-panel--active .creator-panel-summary {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 140ms;
        }
        .creator-panel-role {
          width: fit-content;
          border: 1px solid rgba(251,247,240,0.28);
          border-radius: 999px;
          background: rgba(196,113,58,0.9);
          color: #FFF9F0;
          padding: 0.4rem 0.7rem;
          font-family: var(--font-label);
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .creator-panel-summary > strong {
          max-width: 18ch;
          color: #FFF9F0;
          font-family: var(--font-display);
          font-size: 2.3rem;
          font-weight: 600;
          line-height: 1.05;
        }
        .creator-panel-location {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: #F0C4A6;
          font-family: var(--font-label);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .creator-panel-location > span {
          width: 0.42rem;
          height: 0.42rem;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #E89A68;
        }
        .creator-panel-summary q {
          max-width: 43ch;
          border-left: 2px solid #C4713A;
          color: rgba(255,249,240,0.88);
          padding-left: 0.85rem;
          font-family: var(--font-body);
          font-size: 0.95rem;
          font-style: italic;
          line-height: 1.6;
        }
        .creator-panel-label {
          display: grid;
          gap: 0.15rem;
          padding: 1.15rem;
          opacity: 1;
          transition: opacity 180ms ease, transform 300ms ease;
        }
        .creator-panel--active .creator-panel-label {
          opacity: 0;
          transform: translateY(0.75rem);
        }
        .creator-panel-label strong {
          color: #FFF9F0;
          font-family: var(--font-display);
          font-size: 1.05rem;
          line-height: 1.15;
        }
        .creator-panel-label small {
          color: rgba(255,249,240,0.72);
          font-family: var(--font-label);
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @media (max-width: 768px) {
          .mvg-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .why-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .creator-showcase { height: auto; flex-direction: column; align-items: stretch; }
          .creator-panel { width: 100%; height: 7.5rem; flex: none; }
          .creator-panel--active { height: 30rem; flex-grow: 0; }
          .creator-panel-summary { padding: 1.4rem; }
          .creator-panel-summary > strong { font-size: 1.9rem; }
        }
        @media (max-width: 900px) and (min-width: 769px) {
          .creator-showcase { height: 30rem; gap: 0.5rem; }
          .creator-panel { height: 17rem; }
          .creator-panel--active { height: 30rem; flex-grow: 4; }
          .creator-panel-summary { padding: 1.35rem; }
          .creator-panel-summary > strong { font-size: 1.8rem; }
          .creator-panel-summary q { font-size: 0.85rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .creator-panel,
          .creator-panel img,
          .creator-panel-summary,
          .creator-panel-label { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
