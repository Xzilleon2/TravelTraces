import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { MapPin, BookOpen, Map, Users, Calendar, User, ChevronDown, ChevronUp, ArrowRight, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const HERO_IMG = "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=1600&h=900&fit=crop&auto=format";
const IMG2 = "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&h=600&fit=crop&auto=format";
const IMG3 = "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=800&h=600&fit=crop&auto=format";
const IMG4 = "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=800&h=600&fit=crop&auto=format";
const IMG5 = "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=800&h=600&fit=crop&auto=format";
const IMG6 = "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=800&h=600&fit=crop&auto=format";
const STORY1 = "https://images.unsplash.com/photo-1632307918787-8cb52566dd35?w=600&h=400&fit=crop&auto=format";
const STORY2 = "https://images.unsplash.com/photo-1768639400843-d604ccce9c3e?w=600&h=400&fit=crop&auto=format";
const STORY3 = "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=600&h=400&fit=crop&auto=format";
const STORY4 = "https://images.unsplash.com/photo-1616382093586-84ed7932c216?w=600&h=400&fit=crop&auto=format";

const features = [
  { icon: MapPin, label: "Explore", color: "#2D4A2D", desc: "Browse Southeast Asia by region, terrain, culture, and traveller activity. Discover coastal towns, mountain routes, megacities, islands, and community-rated local gems." },
  { icon: BookOpen, label: "Stories", color: "#C4713A", desc: "Read and publish long-form travel narratives from across Southeast Asia. Personal, unfiltered accounts from people who have walked the routes themselves." },
  { icon: Map, label: "Map", color: "#7A9E6F", desc: "Pin every place you've visited across Southeast Asia on an interactive map. Build a travel history that spans borders, islands, cities, and overland routes." },
  { icon: Users, label: "Community", color: "#5C8A9E", desc: "Follow travellers, find companions, join challenges, and share plans with people exploring the same Southeast Asian routes." },
  { icon: Calendar, label: "Events", color: "#9E6B5C", desc: "Discover photography walks, food crawls, island trips, cultural tours, and local meetups happening across the region." },
  { icon: User, label: "Profile", color: "#2D4A2D", desc: "Your travel identity - albums, pins, badges, and achievements that tell your unique Southeast Asia story." },
];

const featuredStories = [
  { img: STORY1, title: "48 Hours in Luang Prabang: Temples, Rivers, and Slow Mornings", author: "Carlo Reyes", region: "Laos", readTime: "8 min", date: "12 May 2025" },
  { img: STORY2, title: "The Road to Ha Giang: Mountain Passes Above the Clouds", author: "Ana Villanueva", region: "Vietnam", readTime: "12 min", date: "3 May 2025" },
  { img: STORY3, title: "Three Weeks Through Northern Thailand: Markets, Trails, and Slow Time", author: "Ramon Dela Cruz", region: "Thailand", readTime: "15 min", date: "28 Apr 2025" },
  { img: STORY4, title: "Bali Beyond the Crowd: Notes on Return and Resilience", author: "Leila Marcos", region: "Indonesia", readTime: "10 min", date: "20 Apr 2025" },
];

const howItWorks = [
  {
    title: "Pin your destinations",
    body: "Drop real pinpoints across Southeast Asia, from island towns and heritage streets to border crossings and mountain viewpoints. Map out your path and switch between a private map for personal planning and a public community map for inspiring other travellers."
  },
  {
    title: "Write your story",
    body: "Compose detailed, beautiful diaries of your travel adventures. Format word-by-word with our custom selection-based sandbox featuring rich text formatting, lists, alignments, and blockquotes. Bring experiences to life by uploading local offline snapshots or picking curated sceneries."
  },
  {
    title: "Connect with travellers",
    body: "Coordinate excursions with a companion seamlessly. Input both of your locations into the map, and TravelTraces computes a practical midpoint, recommending neutral hubs such as Bangkok, Singapore, Kuala Lumpur, Da Nang, or Bali to meet."
  }
];

const stats = [
  { value: "11", label: "Countries covered" },
  { value: "42,000+", label: "Active members" },
  { value: "18,500+", label: "Stories published" },
  { value: "320+", label: "Regional events" },
];

export default function LandingPage() {
  const { openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [activeHow, setActiveHow] = useState(0);

  return (
    <div style={{ backgroundColor: "#F5F0E8" }}>
      {/* Hero */}
      <section style={{ position: "relative", height: "92vh", minHeight: 560, overflow: "hidden" }}>
        <img
          src={HERO_IMG}
          alt="Aerial view of a Southeast Asian island surrounded by turquoise water"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(26,26,26,0.2) 0%, rgba(26,26,26,0.55) 60%, rgba(26,26,26,0.75) 100%)" }} />
        <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ maxWidth: 720, textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-label)", fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,240,232,0.8)", marginBottom: "1rem" }}>
              Community travel - Southeast Asia
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 7vw, 5rem)", fontWeight: 600, color: "#F5F0E8", lineHeight: 1.1, marginBottom: "1.25rem" }}>
              Trace Southeast Asia,<br />
              <em>one journey at a time.</em>
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "1.125rem", color: "rgba(245,240,232,0.85)", lineHeight: 1.7, marginBottom: "2rem" }}>
              TravelTraces is where Southeast Asia travellers pin destinations, write honest stories, and find companions for their next island, city, or overland adventure.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={() => openAuthModal("signup")}
                style={{
                  backgroundColor: "#C4713A", color: "#F5F0E8", border: "none",
                  padding: "0.9rem 2.25rem", borderRadius: "0.25rem", cursor: "pointer",
                  fontFamily: "var(--font-label)", fontSize: "0.875rem", fontWeight: 600,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                }}
              >
                Start your journey
              </button>
              <button
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                style={{
                  backgroundColor: "rgba(245,240,232,0.12)", color: "#F5F0E8",
                  border: "1px solid rgba(245,240,232,0.35)",
                  padding: "0.9rem 2.25rem", borderRadius: "0.25rem", cursor: "pointer",
                  fontFamily: "var(--font-label)", fontSize: "0.875rem", fontWeight: 500,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  backdropFilter: "blur(4px)",
                }}
              >
                How it works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{ backgroundColor: "#2D4A2D" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: "1rem" }}>
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: "center", padding: "0.5rem" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 600, color: "#F5F0E8" }}>{s.value}</div>
              <div style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,240,232,0.6)", marginTop: "0.25rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* What is TravelTraces */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "6rem 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }} className="grid-cols-landing">
          <div>
            <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.75rem" }}>About the platform</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#2D4A2D", lineHeight: 1.2, marginBottom: "1.5rem" }}>
              Built for people who genuinely love Southeast Asia
            </h2>
            <div style={{ fontFamily: "var(--font-body)", color: "#3A3A2A", lineHeight: 1.8, fontSize: "1.05rem" }}>
              <p style={{ marginBottom: "1.25rem" }}>
                TravelTraces is a community-driven platform centred on the whole of Southeast Asia. It's not a booking engine, not a highlights reel. It's a living record of real journeys across coastlines, cities, villages, mountains, and islands.
              </p>
              <p style={{ marginBottom: "2rem" }}>
                From Vietnam's mountain loops to Indonesia's island chains, Thailand's markets, Malaysia's rainforests, and Cambodia's temple towns, every route has a story worth telling. TravelTraces gives travellers the tools to document those stories and the community to share them with.
              </p>
              <button
                onClick={() => navigate("/about")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  background: "none", border: "1px solid rgba(45,74,45,0.35)",
                  color: "#2D4A2D", padding: "0.7rem 1.5rem", borderRadius: "0.25rem",
                  cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.8rem",
                  fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                }}
              >
                Learn more about us <ArrowRight size={14} />
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <img src={IMG2} alt="Turquoise lagoon between mountains" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: "0.25rem", gridColumn: "span 2" }} />
            <img src={IMG4} alt="Traditional bancas moored at shore" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "0.25rem" }} />
            <img src={IMG6} alt="Travellers on a Southeast Asian beach" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "0.25rem" }} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ backgroundColor: "#EDEAE0", padding: "6rem 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.75rem" }}>Platform features</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#2D4A2D" }}>
              Everything you need to explore Southeast Asia
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "1.5rem" }}>
            {features.map((f) => (
              <div
                key={f.label}
                style={{
                  backgroundColor: "#F5F0E8",
                  borderRadius: "0.25rem",
                  padding: "2rem",
                  border: "1px solid rgba(45,74,45,0.08)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: 44, height: 44, backgroundColor: f.color, borderRadius: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <f.icon size={22} color="#F5F0E8" />
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", fontWeight: 600, color: "#2D4A2D", margin: 0 }}>{f.label}</h3>
                </div>
                <p style={{ fontFamily: "var(--font-ui)", color: "#6B6B5A", lineHeight: 1.7, fontSize: "0.95rem" }}>{f.desc}</p>
                {/* Blurred lock overlay for non-members */}
                <div
                  style={{
                    position: "absolute", inset: 0,
                    backdropFilter: "blur(0px)",
                    background: "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section id="featured-stories" style={{ maxWidth: 1200, margin: "0 auto", padding: "6rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.5rem" }}>Featured stories</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#2D4A2D" }}>
              Real journeys, honest accounts
            </h2>
          </div>
          <button
            onClick={() => openAuthModal("signup")}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "none", border: "1px solid rgba(45,74,45,0.3)", color: "#2D4A2D",
              padding: "0.6rem 1.25rem", borderRadius: "0.25rem", cursor: "pointer",
              fontFamily: "var(--font-label)", fontSize: "0.8rem", fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}
          >
            All stories <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "1.5rem" }}>
          {featuredStories.map((s) => (
            <article
              key={s.title}
              onClick={() => openAuthModal("signup")}
              style={{
                backgroundColor: "#EDEAE0",
                borderRadius: "0.25rem",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <div style={{ position: "relative", overflow: "hidden" }}>
                <img src={s.img} alt={s.title} style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", backgroundColor: "rgba(45,74,45,0.85)", color: "#F5F0E8", padding: "0.2rem 0.5rem", borderRadius: "0.2rem", fontSize: "0.7rem", fontFamily: "var(--font-label)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {s.region}
                </div>
              </div>
              <div style={{ padding: "1.25rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600, color: "#2D4A2D", lineHeight: 1.35, marginBottom: "0.75rem" }}>
                  {s.title}
                </h3>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "#1A1A1A", fontWeight: 500 }}>{s.author}</p>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "#6B6B5A" }}>{s.date}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#6B6B5A" }}>
                    <Star size={12} />
                    <span style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem" }}>{s.readTime}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ backgroundColor: "#2D4A2D", padding: "6rem 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.75rem" }}>How it works</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#F5F0E8" }}>
              Start exploring in three simple steps
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "2rem" }}>
            {howItWorks.map((step, i) => (
              <div
                key={step.title}
                style={{
                  backgroundColor: "rgba(245,240,232,0.05)",
                  borderRadius: "0.375rem",
                  padding: "2.25rem 2rem",
                  border: "1px solid rgba(245,240,232,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  transition: "transform 0.2s, background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.backgroundColor = "rgba(245,240,232,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.backgroundColor = "rgba(245,240,232,0.05)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: 44, height: 44, backgroundColor: "#C4713A", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-label)", fontWeight: 700, color: "#F5F0E8", fontSize: "1.1rem" }}>{i + 1}</span>
                    </div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 600, color: "#F5F0E8", margin: 0 }}>
                      {step.title}
                    </h3>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.686rem", color: "rgba(245,240,232,0.4)", letterSpacing: "0.1em" }}></span>
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-body)", color: "rgba(245,240,232,0.8)", lineHeight: 1.7, fontSize: "0.95rem", margin: 0 }}>
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section style={{ backgroundColor: "#F5F0E8", padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.75rem" }}>Simple, honest pricing</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#2D4A2D", marginBottom: "0.75rem" }}>Start free. Upgrade when ready.</h2>
            <p style={{ fontFamily: "var(--font-body)", color: "#6B6B5A", fontSize: "1rem", maxWidth: 440, margin: "0 auto" }}>Every memory you create is yours to keep, forever.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }} className="pricing-teaser-grid">
            {[
              { name: "Free", price: "₱0", color: "#7A9E6F", features: ["30 destination pins", "3 stories/month", "50 photos", "Community access"], cta: "Get started" },
              { name: "Explorer", price: "₱149/mo", color: "#2D4A2D", features: ["Unlimited pins & stories", "500 photos", "Analytics", "Host events"], cta: "Start exploring", popular: true },
              { name: "Pathfinder", price: "₱349/mo", color: "#C4713A", features: ["Everything in Explorer", "Ad-free", "Priority search", "Early features"], cta: "Go all-in" },
            ].map((plan) => (
              <div key={plan.name} style={{ backgroundColor: plan.popular ? "#2D4A2D" : "#EDEAE0", borderRadius: "0.5rem", padding: "2rem", position: "relative", border: plan.popular ? "none" : "1px solid rgba(45,74,45,0.1)" }}>
                {plan.popular && <div style={{ position: "absolute", top: "-0.75rem", left: "50%", transform: "translateX(-50%)", backgroundColor: "#C4713A", color: "#F5F0E8", padding: "0.2rem 0.875rem", borderRadius: "2rem", fontFamily: "var(--font-label)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>MOST POPULAR</div>}
                <div style={{ width: 32, height: 3, backgroundColor: plan.color, borderRadius: "2px", marginBottom: "1rem" }} />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, color: plan.popular ? "#F5F0E8" : "#2D4A2D", marginBottom: "0.25rem" }}>{plan.name}</h3>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, color: plan.color, marginBottom: "1.25rem" }}>{plan.price}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: plan.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: plan.popular ? "rgba(245,240,232,0.8)" : "#4A4A3A" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => openAuthModal("signup")} style={{ width: "100%", padding: "0.75rem", backgroundColor: plan.popular ? "rgba(245,240,232,0.12)" : plan.color === "#7A9E6F" ? "transparent" : plan.color, border: plan.popular ? "none" : plan.color === "#7A9E6F" ? "1px solid rgba(45,74,45,0.3)" : "none", color: plan.popular ? "#F5F0E8" : plan.color === "#7A9E6F" ? "#2D4A2D" : "#F5F0E8", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p style={{ textalign: "center", marginTop: "1.5rem" }}>
            <button onClick={() => navigate("/pricing")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#7A9E6F", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              Compare all features <ArrowRight size={13} />
            </button>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "6rem 1.5rem", textAlign: "center", backgroundColor: "#EDEAE0" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.75rem" }}>Free to join</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.25rem, 5vw, 3.75rem)", fontWeight: 600, color: "#2D4A2D", lineHeight: 1.15, marginBottom: "1.25rem" }}>
            11 countries.<br />Your story starts here.
          </h2>
          <p style={{ fontFamily: "var(--font-body)", color: "#6B6B5A", fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "2.5rem" }}>
            Join over 42,000 travellers documenting journeys across Southeast Asia. No subscription required - free forever.
          </p>
          <button
            onClick={() => openAuthModal("signup")}
            style={{
              backgroundColor: "#2D4A2D", color: "#F5F0E8", border: "none",
              padding: "1rem 3rem", borderRadius: "0.25rem", cursor: "pointer",
              fontFamily: "var(--font-label)", fontSize: "0.9rem", fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase",
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
            }}
          >
            Create free account <ArrowRight size={16} />
          </button>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "#6B6B5A", marginTop: "1rem" }}>No credit card required · Instant access</p>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .grid-cols-landing { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .pricing-teaser-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
