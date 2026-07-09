import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Award, BookOpen, CheckCircle2, Compass, Lock, MapPin, Mountain, Search, ShieldCheck, UserPlus, Users } from "lucide-react";
import { GatedPage } from "../components/GatedPage";
import { useAuth } from "../context/AuthContext";
import type { User } from "../context/AuthContext";
import type { ApiPin, TravelGroup } from "../services/mappingApi";
import { listLocalStories, readLocalTable } from "../services/localDb";

type Traveller = {
  id: number;
  profileKey: string;
  name: string;
  handle: string;
  location: string;
  avatar: string;
  pins: number;
  stories: number;
  followers: number;
  bio: string;
  islands: number;
  rank: number;
  level: number;
};

type Challenge = {
  id: number;
  title: string;
  desc: string;
  progress: number;
  total: number;
  participants: number;
  badge: string;
  completed?: boolean;
};

const CHALLENGES: Challenge[] = [];
const CHALLENGE_ICONS: Record<number, typeof Award> = {
  1: MapPin,
  2: Mountain,
  3: Compass,
  4: BookOpen,
};

const tabs = ["Travellers", "Rankings", "Challenges"];

function localUserAvatar(user: User) {
  if (user.avatar) return user.avatar;
  const initials = (user.name || user.email || "TT").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#EDEAE0"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#7A4B32">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function localUserLevel(input: { pins: number; stories: number; groups: number }) {
  const unlocked = [input.pins > 0, input.stories >= 3, input.groups > 0, input.pins + input.stories >= 10].filter(Boolean).length;
  return unlocked;
}

function emptyPanel(title: string, copy: string) {
  return (
    <div style={{ border: "1px dashed rgba(58, 42, 34, 0.2)", backgroundColor: "rgb(255, 249, 240)", borderRadius: "0.5rem", padding: "clamp(2rem, 5vw, 4rem)", textAlign: "center", boxShadow: "rgba(58, 42, 34, 0.06) 0px 18px 42px" }}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 2.7rem)", fontWeight: 600, lineHeight: 1.1, color: "#3A2A22" }}>{title}</h2>
      <p style={{ margin: "1rem auto 0", maxWidth: 560, fontFamily: "var(--font-body)", fontSize: "1.05rem", lineHeight: 1.8, color: "#5B4A40" }}>{copy}</p>
    </div>
  );
}

function TravellerCard({ t, onViewProfile }: { t: Traveller; onViewProfile: (profileKey: string) => void }) {
  const [following, setFollowing] = useState(false);
  return (
    <div style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", padding: "1.5rem", display: "flex", gap: "1.25rem" }}>
      <button type="button" onClick={() => onViewProfile(t.profileKey)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
        <img src={t.avatar} alt={t.name} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <button type="button" onClick={() => onViewProfile(t.profileKey)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.95rem", color: "#1A1A1A", textAlign: "left" }}>{t.name}</button>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "#9E6B5C" }}>{t.handle}</p>
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              setFollowing((v) => !v);
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              padding: "0.4rem 0.875rem", borderRadius: "0.25rem",
              border: "1px solid", borderColor: following ? "#9E6B5C" : "#3A2A22",
              backgroundColor: following ? "rgba(158,107,92,0.1)" : "#3A2A22",
              color: following ? "#9E6B5C" : "#F5F0E8",
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
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "#3A2A22" }}>{v}</div>
              <div style={{ fontFamily: "var(--font-label)", fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommunityContent() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Travellers");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const viewProfile = (profileKey: string) => {
    navigate(`/profile/${profileKey}`);
  };

  useEffect(() => {
    const refresh = () => {
      setUsers(readLocalTable<User>("users"));
      setRefreshKey((value) => value + 1);
    };
    refresh();
    window.addEventListener("traveltraces:local-db-updated", refresh);
    window.addEventListener("traveltraces:local-stories-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("traveltraces:local-db-updated", refresh);
      window.removeEventListener("traveltraces:local-stories-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const travellers = useMemo<Traveller[]>(() => {
    const stories = listLocalStories();
    const pins = readLocalTable<ApiPin>("pins");
    const groups = readLocalTable<TravelGroup>("travelGroups");
    const rows = users.map((user, index) => {
      const userStories = stories.filter((story) => story.ownerId === user.id || story.author === user.name);
      const userPins = pins.filter((pin) => pin.creator_id === user.id);
      const userGroups = groups.filter((group) => group.owner_id === user.id || group.members.some((member) => member.user_id === user.id));
      const level = localUserLevel({ pins: userPins.length, stories: userStories.length, groups: userGroups.length });
      return {
        id: index + 1,
        profileKey: user.id,
        name: user.name || user.email,
        handle: `@${(user.name || user.email.split("@")[0]).toLowerCase().replace(/[^a-z0-9]+/g, "")}`,
        location: user.location || "Location not set",
        avatar: localUserAvatar(user),
        pins: userPins.length,
        stories: userStories.length,
        followers: 0,
        bio: user.bio || "No bio added yet.",
        islands: userPins.length,
        rank: 0,
        level,
      };
    });
    return rows
      .sort((a, b) => b.level - a.level || b.stories - a.stories || b.pins - a.pins || a.name.localeCompare(b.name))
      .map((traveller, index) => ({ ...traveller, rank: index + 1 }));
  }, [refreshKey, users]);

  const filtered = travellers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.handle.toLowerCase().includes(search.toLowerCase())
  );
  const visibleTravellers = currentUser ? filtered.filter((traveller) => traveller.profileKey !== currentUser.id) : filtered;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F0E8", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header className="mb-10">
          <p className="mb-2 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#9E6B5C]">Traveller network</p>
          <h1 className="m-0 font-[var(--font-display)] text-5xl font-semibold leading-none text-[#3A2A22] sm:text-6xl">Community</h1>
          <p className="mt-4 max-w-3xl font-[var(--font-body)] text-lg leading-8 text-[#5B4A40]">Connect with fellow explorers, browse active travellers, and climb the TravelTraces rankings.</p>
        </header>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(58,42,34,0.15)", marginBottom: "2rem", gap: "0", overflowX: "auto" }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "0.75rem 1.25rem", border: "none", borderBottom: `2px solid ${activeTab === t ? "#3A2A22" : "transparent"}`, background: "none", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: activeTab === t ? "#3A2A22" : "#6B6B5A", whiteSpace: "nowrap", transition: "color 0.15s" }}>
              {t}
            </button>
          ))}
        </div>

        {activeTab === "Travellers" && (
          <>
            <div style={{ position: "relative", marginBottom: "1.5rem", maxWidth: 400 }}>
              <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#6B6B5A" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search travellers..." style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", backgroundColor: "#EDEAE0", border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.25rem", fontSize: "0.9rem", color: "#1A1A1A", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 400px), 1fr))", gap: "1rem" }}>
              {visibleTravellers.map((t) => <TravellerCard key={t.id} t={t} onViewProfile={viewProfile} />)}
            </div>
            {!visibleTravellers.length ? emptyPanel("No travellers here yet", "Registered TravelTraces users will appear here once they create a local account.") : null}
          </>
        )}

        {activeTab === "Rankings" && (
          travellers.length ? <div style={{ overflowX: "auto" }}>
            <div style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", overflow: "hidden", minWidth: 620 }}>
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(58,42,34,0.1)", display: "grid", gridTemplateColumns: "40px 1fr 80px 80px 80px", gap: "1rem", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A" }}>#</span>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A" }}>Traveller</span>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A", textAlign: "center" }}>Level</span>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A", textAlign: "center" }}>Stories</span>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A", textAlign: "center" }}>Pins</span>
              </div>
              {travellers.map((t) => (
                <div key={t.id} style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(58,42,34,0.06)", display: "grid", gridTemplateColumns: "40px 1fr 80px 80px 80px", gap: "1rem", alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: t.rank <= 3 ? "#C4713A" : "#D8D4C8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-label)", fontWeight: 700, fontSize: "0.8rem", color: t.rank <= 3 ? "#F5F0E8" : "#6B6B5A" }}>{t.rank}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button type="button" onClick={() => viewProfile(t.profileKey)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}>
                      <img src={t.avatar} alt={t.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    </button>
                    <div>
                      <button type="button" onClick={() => viewProfile(t.profileKey)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.875rem", color: "#1A1A1A", textAlign: "left" }}>{t.name}</button>
                      <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "#6B6B5A" }}>{t.location}</p>
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "#3A2A22", textAlign: "center" }}>{t.level}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "#3A2A22", textAlign: "center" }}>{t.stories}</div>
                  <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: "#4A4A3A", textAlign: "center" }}>{t.pins.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div> : emptyPanel("No rankings yet", "Rankings will appear after local users register and begin posting stories or creating pins.")
        )}

        {activeTab === "Challenges" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.25rem" }}>
            {CHALLENGES.map((c) => {
              const unlocked = Boolean(c.completed) || c.progress >= c.total;
              const Icon = CHALLENGE_ICONS[c.id] ?? ShieldCheck;
              return (
                <article key={c.id} className={`rounded-lg border p-4 transition ${unlocked ? "border-[#C4713A]/35 bg-[#FFF9F0]" : "border-[#3A2A22]/10 bg-[#EFE7DC]/70"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${unlocked ? "bg-[#C4713A] text-[#FFF9F0]" : "bg-[#D8D0C2] text-[#5E4B40]"}`}>
                      {unlocked ? <Icon size={18} /> : <Lock size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="m-0 font-[var(--font-display)] text-lg font-semibold leading-tight text-[#2C211C]">{c.title}</h3>
                        {unlocked ? <CheckCircle2 size={15} className="text-[#7A4B32]" aria-label="Unlocked" /> : null}
                      </div>
                      <p className="m-0 mt-1 text-sm leading-5 text-[#5E4B40]">{c.desc}</p>
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="font-[var(--font-label)] text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[#5E4B40]">Progress</span>
                          <span className="font-[var(--font-label)] text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[#2C211C]">{Math.min(c.progress, c.total)}/{c.total}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#D8D0C2]">
                          <div className="h-full rounded-full bg-[#C4713A]" style={{ width: `${Math.min((c.progress / c.total) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-[#5E4B40]">
                        <Users size={13} />
                        <span className="font-[var(--font-ui)] text-xs font-semibold">{c.participants.toLocaleString()} participants</span>
                      </div>
                      <p className={`m-0 mt-3 font-[var(--font-label)] text-[0.66rem] font-bold uppercase tracking-[0.1em] ${unlocked ? "text-[#7A4B32]" : "text-[#5E4B40]"}`}>
                        {unlocked ? "Unlocked" : "Locked"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
            {!CHALLENGES.length ? emptyPanel("No challenges here yet", "Challenges will appear once you add local achievement rules for the prototype.") : null}
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
