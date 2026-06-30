import React, { useState } from "react";
import { MapPin, Users, Trophy, Search, UserPlus, MessageCircle } from "lucide-react";
import { GatedPage } from "../components/GatedPage";

const TRAVELLERS = [
  { id: 1, name: "Carlo Reyes", handle: "@carloreyes", location: "Cebu City", avatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=80&h=80&fit=crop&auto=format", pins: 142, stories: 24, followers: 3210, bio: "Freediving instructor and island hopper. Palawan-based, born in Leyte.", islands: 142, rank: 1 },
  { id: 2, name: "Ana Villanueva", handle: "@anavillanueva", location: "Quezon City", avatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=80&h=80&fit=crop&auto=format", pins: 98, stories: 18, followers: 2140, bio: "Travel writer and photographer. Batanes is my second home.", islands: 98, rank: 2 },
  { id: 3, name: "Ramon Dela Cruz", handle: "@ramondelacruz", location: "Baguio City", avatar: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=80&h=80&fit=crop&auto=format", pins: 87, stories: 31, followers: 1890, bio: "Cultural explorer and long-form writer. Cordillera born.", islands: 87, rank: 3 },
  { id: 4, name: "Leila Marcos", handle: "@leilamarcos", location: "Davao City", avatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=80&h=80&fit=crop&auto=format", pins: 76, stories: 14, followers: 1640, bio: "Mindanao advocate and surf coach based in Siargao.", islands: 76, rank: 4 },
  { id: 5, name: "Marco Buenaventura", handle: "@marcobuen", location: "Manila", avatar: "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=80&h=80&fit=crop&auto=format", pins: 63, stories: 22, followers: 1320, bio: "Food and travel. Pampanga to Mindanao, one meal at a time.", islands: 63, rank: 5 },
  { id: 6, name: "Sofia Reyes", handle: "@sofiareyes", location: "Iloilo City", avatar: "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=80&h=80&fit=crop&auto=format", pins: 54, stories: 9, followers: 980, bio: "Hidden gems specialist. Visayas-based, always planning the next escape.", islands: 54, rank: 6 },
];

const CHALLENGES = [
  { id: 1, title: "Island Hopper 100", desc: "Visit 100 unique islands across the Philippine archipelago.", progress: 94, total: 100, participants: 3240, badge: "🏝️" },
  { id: 2, title: "Cordillera Circuit", desc: "Complete the full Cordillera mountain province loop.", progress: 6, total: 8, participants: 840, badge: "⛰️" },
  { id: 3, title: "7 Island Groups", desc: "Visit at least one island in each of the 7 major island groups.", progress: 5, total: 7, participants: 2100, badge: "🗺️" },
  { id: 4, title: "Story Teller", desc: "Publish 10 long-form travel narratives.", progress: 18, total: 10, participants: 1560, badge: "✍️", completed: true },
];

const COMPANION_DESTINATIONS = [
  { name: "Puerto Galera", region: "Oriental Mindoro", desc: "Midpoint between Manila and Cebu — great diving, accessible by bus and ferry." },
  { name: "Dumaguete", region: "Negros Oriental", desc: "Halfway point between Luzon and Mindanao travellers, with whale sharks at Oslob." },
  { name: "Cagayan de Oro", region: "Northern Mindanao", desc: "Natural meeting point for Mindanao explorers, with whitewater rafting on the Cagayan River." },
];

const tabs = ["Travellers", "Rankings", "Challenges", "Find Companions"];

function TravellerCard({ t }: { t: typeof TRAVELLERS[0]; key?: any }) {
  const [following, setFollowing] = useState(false);
  return (
    <div style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", padding: "1.5rem", display: "flex", gap: "1.25rem" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <img src={t.avatar} alt={t.name} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, backgroundColor: "#2D4A2D", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #EDEAE0" }}>
          <span style={{ fontFamily: "var(--font-label)", fontSize: "0.6rem", color: "#F5F0E8", fontWeight: 700 }}>{t.rank}</span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.95rem", color: "#1A1A1A" }}>{t.name}</p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "#7A9E6F" }}>{t.handle}</p>
          </div>
          <button
            onClick={() => setFollowing((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              padding: "0.4rem 0.875rem", borderRadius: "0.25rem",
              border: "1px solid", borderColor: following ? "#7A9E6F" : "#2D4A2D",
              backgroundColor: following ? "rgba(122,158,111,0.1)" : "#2D4A2D",
              color: following ? "#7A9E6F" : "#F5F0E8",
              cursor: "pointer", fontSize: "0.78rem", fontFamily: "var(--font-label)", letterSpacing: "0.05em",
            }}
          >
            <UserPlus size={13} />
            {following ? "Following" : "Follow"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: "0.35rem 0" }}>
          <MapPin size={11} color="#6B6B5A" />
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "#6B6B5A" }}>{t.location}</span>
        </div>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "#4A4A3A", lineHeight: 1.5, marginBottom: "0.75rem" }}>{t.bio}</p>
        <div style={{ display: "flex", gap: "1.25rem" }}>
          {[["islands", t.pins, "Islands"], ["stories", t.stories, "Stories"], ["followers", t.followers.toLocaleString(), "Followers"]].map(([k, v, l]) => (
            <div key={String(k)}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "#2D4A2D" }}>{v}</div>
              <div style={{ fontFamily: "var(--font-label)", fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommunityContent() {
  const [activeTab, setActiveTab] = useState("Travellers");
  const [search, setSearch] = useState("");
  const [myLocation, setMyLocation] = useState("");
  const [companionLocation, setCompanionLocation] = useState("");

  const filtered = TRAVELLERS.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.handle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F0E8", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.5rem" }}>Traveller network</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#2D4A2D", marginBottom: "0.5rem" }}>Community</h1>
          <p style={{ fontFamily: "var(--font-body)", color: "#6B6B5A", fontSize: "1rem" }}>Connect with fellow explorers, climb the rankings, and find your next travel companion.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(45,74,45,0.15)", marginBottom: "2rem", gap: "0", overflowX: "auto" }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "0.75rem 1.25rem", border: "none", borderBottom: `2px solid ${activeTab === t ? "#2D4A2D" : "transparent"}`, background: "none", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: activeTab === t ? "#2D4A2D" : "#6B6B5A", whiteSpace: "nowrap", transition: "color 0.15s" }}>
              {t}
            </button>
          ))}
        </div>

        {activeTab === "Travellers" && (
          <>
            <div style={{ position: "relative", marginBottom: "1.5rem", maxWidth: 400 }}>
              <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#6B6B5A" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search travellers…" style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", backgroundColor: "#EDEAE0", border: "1px solid rgba(45,74,45,0.15)", borderRadius: "0.25rem", fontSize: "0.9rem", color: "#1A1A1A", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 400px), 1fr))", gap: "1rem" }}>
              {filtered.map((t) => <TravellerCard key={t.id} t={t} />)}
            </div>
          </>
        )}

        {activeTab === "Rankings" && (
          <div style={{ overflowX: "auto" }}>
            <div style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", overflow: "hidden", minWidth: 620 }}>
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(45,74,45,0.1)", display: "grid", gridTemplateColumns: "40px 1fr 80px 80px 80px", gap: "1rem", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A" }}>#</span>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A" }}>Traveller</span>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A", textAlign: "center" }}>Islands</span>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A", textAlign: "center" }}>Stories</span>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A", textAlign: "center" }}>Followers</span>
              </div>
              {TRAVELLERS.map((t) => (
                <div key={t.id} style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(45,74,45,0.06)", display: "grid", gridTemplateColumns: "40px 1fr 80px 80px 80px", gap: "1rem", alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: t.rank <= 3 ? "#C4713A" : "#D8D4C8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-label)", fontWeight: 700, fontSize: "0.8rem", color: t.rank <= 3 ? "#F5F0E8" : "#6B6B5A" }}>{t.rank}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <img src={t.avatar} alt={t.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    <div>
                      <p style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.875rem", color: "#1A1A1A" }}>{t.name}</p>
                      <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "#6B6B5A" }}>{t.location}</p>
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "#2D4A2D", textAlign: "center" }}>{t.islands}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "#2D4A2D", textAlign: "center" }}>{t.stories}</div>
                  <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: "#4A4A3A", textAlign: "center" }}>{t.followers.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Challenges" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.25rem" }}>
            {CHALLENGES.map((c) => (
              <div key={c.id} style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "2rem" }}>{c.badge}</span>
                  {c.completed && <span style={{ padding: "0.2rem 0.6rem", backgroundColor: "rgba(122,158,111,0.15)", color: "#2D4A2D", borderRadius: "2rem", fontSize: "0.7rem", fontFamily: "var(--font-label)", letterSpacing: "0.06em" }}>COMPLETED</span>}
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#2D4A2D", marginBottom: "0.5rem" }}>{c.title}</h3>
                <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: "#6B6B5A", lineHeight: 1.6, marginBottom: "1rem" }}>{c.desc}</p>
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", color: "#6B6B5A" }}>Progress</span>
                    <span style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", color: "#2D4A2D", fontWeight: 600 }}>{Math.min(c.progress, c.total)}/{c.total}</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: "#D8D4C8", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min((c.progress / c.total) * 100, 100)}%`, backgroundColor: c.completed ? "#7A9E6F" : "#2D4A2D", borderRadius: "3px", transition: "width 0.3s" }} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#6B6B5A" }}>
                  <Users size={13} />
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem" }}>{c.participants.toLocaleString()} participants</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Find Companions" && (
          <div>
            <div style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", padding: "2rem", marginBottom: "2rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, color: "#2D4A2D", marginBottom: "0.5rem" }}>Find your midpoint</h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "#6B6B5A", marginBottom: "1.5rem" }}>Enter your location and a companion's location — TravelTraces calculates the midpoint and suggests destinations.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                {[["Your location", myLocation, setMyLocation, "e.g. Quezon City"], ["Companion's location", companionLocation, setCompanionLocation, "e.g. Cebu City"]].map(([label, val, setter, placeholder]) => (
                  <div key={String(label)}>
                    <label style={{ display: "block", marginBottom: "0.4rem", fontFamily: "var(--font-label)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A" }}>{String(label)}</label>
                    <input value={String(val)} onChange={(e) => (setter as (v: string) => void)(e.target.value)} placeholder={String(placeholder)} style={{ width: "100%", padding: "0.75rem 1rem", backgroundColor: "#F5F0E8", border: "1px solid rgba(45,74,45,0.15)", borderRadius: "0.25rem", fontSize: "0.9rem", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box", color: "#1A1A1A" }} />
                  </div>
                ))}
              </div>
              <button style={{ padding: "0.75rem 2rem", backgroundColor: "#2D4A2D", color: "#F5F0E8", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.875rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
                Find midpoints
              </button>
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 600, color: "#2D4A2D", marginBottom: "1rem" }}>Suggested meeting destinations</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
              {COMPANION_DESTINATIONS.map((d) => (
                <div key={d.name} style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", padding: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <MapPin size={14} color="#7A9E6F" />
                    <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#7A9E6F" }}>{d.region}</span>
                  </div>
                  <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#2D4A2D", marginBottom: "0.5rem" }}>{d.name}</h4>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: "#4A4A3A", lineHeight: 1.6 }}>{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <GatedPage featureName="The community hub">
      <CommunityContent />
    </GatedPage>
  );
}
