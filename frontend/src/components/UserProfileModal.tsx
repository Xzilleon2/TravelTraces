import React, { useState } from "react";
import { X, MapPin, BookOpen, Pin, Trophy, Users, Star, Heart, UserPlus, UserCheck, Zap } from "lucide-react";
import { GamifiedUser, BADGES, getLevelFromXp, getXpProgress } from "./gamification";

const RARITY_COLOR: Record<string, string> = {
  common:    "#9A9A8A",
  uncommon:  "#9E6B5C",
  rare:      "#5C8A9E",
  epic:      "#9B59B6",
  legendary: "#C4713A",
};

const RARITY_BG: Record<string, string> = {
  common:    "rgba(154,154,138,0.1)",
  uncommon:  "rgba(158,107,92,0.12)",
  rare:      "rgba(92,138,158,0.12)",
  epic:      "rgba(155,89,182,0.12)",
  legendary: "rgba(196,113,58,0.15)",
};

function XpBar({ xp }: { xp: number }) {
  const level = getLevelFromXp(xp);
  const progress = getXpProgress(xp);

  return (
    <div style={{ marginBottom: "0.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Zap size={13} color={level.color} fill={level.color} />
          <span style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 700, color: level.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Level {level.level} · {level.tagalog}
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#6B6B5A" }}>
          {progress.needed === 0 ? `${xp.toLocaleString()} XP · MAX` : `${progress.current.toLocaleString()} / ${progress.needed.toLocaleString()} XP`}
        </span>
      </div>
      <div style={{ height: 6, backgroundColor: "#D8D4C8", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${progress.pct}%`,
          background: `linear-gradient(90deg, ${level.color}99, ${level.color})`,
          borderRadius: "3px",
          transition: "width 0.6s ease-out",
        }} />
      </div>
      {progress.needed > 0 && (
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", color: "#9A9A8A", marginTop: "0.25rem" }}>
          {(progress.needed - progress.current).toLocaleString()} XP to Level {level.level + 1} · {getLevelFromXp(level.maxXp + 1)?.tagalog}
        </p>
      )}
    </div>
  );
}

function StatPill({ icon: Icon, value, label, color }: { icon: React.ElementType; value: number; label: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", padding: "0.75rem 0.5rem", backgroundColor: "#EDEAE0", borderRadius: "0.375rem", flex: 1, minWidth: 60 }}>
      <Icon size={16} color={color} />
      <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#1A1A1A", lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: "var(--font-label)", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A", textAlign: "center" }}>{label}</span>
    </div>
  );
}

export function UserProfileModal({ user, onClose }: { user: GamifiedUser; onClose: () => void }) {
  const [following, setFollowing] = useState(user.isFollowing ?? false);
  const level = getLevelFromXp(user.xp);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, backgroundColor: "rgba(26,26,26,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor: "#F5F0E8", borderRadius: "0.75rem", width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 28px 72px rgba(0,0,0,0.28)" }}>

        {/* Header band */}
        <div style={{ background: `linear-gradient(135deg, #2C211C 0%, ${level.color}55 100%)`, padding: "1.75rem 1.5rem 1.25rem", position: "relative", flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(245,240,232,0.12)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#F5F0E8" }}>
            <X size={15} />
          </button>

          <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem" }}>
            {/* Avatar + level badge */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={user.avatar} alt={user.name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${level.color}` }} />
              <div style={{
                position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
                backgroundColor: level.color, color: "#F5F0E8",
                fontFamily: "var(--font-label)", fontSize: "0.6rem", fontWeight: 800,
                letterSpacing: "0.06em", padding: "0.15rem 0.5rem", borderRadius: "2rem",
                whiteSpace: "nowrap", border: "2px solid #2C211C",
              }}>
                LVL {level.level}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, color: "#F5F0E8", margin: "0 0 0.15rem", lineHeight: 1.2 }}>{user.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                <Star size={12} color={level.color} fill={level.color} />
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", color: level.color, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{level.title}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <MapPin size={11} color="rgba(245,240,232,0.6)" />
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "rgba(245,240,232,0.75)" }}>{user.location}</span>
              </div>
            </div>

            <button
              onClick={() => setFollowing((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.5rem 1rem", borderRadius: "2rem", border: "none",
                backgroundColor: following ? "rgba(158,107,92,0.25)" : "#C4713A",
                color: following ? "#9E6B5C" : "#F5F0E8",
                cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.72rem",
                fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                flexShrink: 0, transition: "all 0.15s",
              }}
            >
              {following ? <><UserCheck size={13} />Following</> : <><UserPlus size={13} />Follow</>}
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1 }}>

          {/* XP bar */}
          <div style={{ padding: "1rem 1.5rem 0.75rem", borderBottom: "1px solid rgba(58,42,34,0.1)", backgroundColor: "#FAF7F0" }}>
            <XpBar xp={user.xp} />
          </div>

          <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Bio */}
            {user.bio && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.925rem", color: "#3A3A2A", lineHeight: 1.7, margin: 0 }}>{user.bio}</p>
            )}

            {/* Stats */}
            <div>
              <p style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.625rem" }}>Activity</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <StatPill icon={BookOpen}  value={user.storiesCount}         label="Stories"    color="#3A2A22" />
                <StatPill icon={Pin}       value={user.pinsCount}            label="Pins"       color="#5C8A9E" />
                <StatPill icon={Trophy}    value={user.challengesCompleted}  label="Challenges" color="#C4713A" />
                <StatPill icon={Users}     value={user.communitiesJoined}    label="Communities"color="#9E6B5C" />
              </div>
            </div>

            {/* Badges */}
            <div>
              <p style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.625rem" }}>
                Badges <span style={{ color: "#C4713A" }}>({user.badges.length})</span>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {user.badges.map((bid) => {
                  const badge = BADGES[bid];
                  return (
                    <div
                      key={bid}
                      title={`${badge.name} — ${badge.description} (+${badge.xp} XP)`}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        padding: "0.35rem 0.625rem",
                        backgroundColor: RARITY_BG[badge.rarity],
                        border: `1px solid ${RARITY_COLOR[badge.rarity]}40`,
                        borderRadius: "2rem",
                        cursor: "default",
                      }}
                    >
                      <span style={{ fontSize: "0.9rem", lineHeight: 1 }}>{badge.icon}</span>
                      <span style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", fontWeight: 600, color: RARITY_COLOR[badge.rarity], letterSpacing: "0.04em" }}>{badge.name}</span>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#9A9A8A", marginTop: "0.5rem" }}>
                Total badge XP: <strong style={{ color: "#3A3A2A" }}>{user.badges.reduce((acc, bid) => acc + BADGES[bid].xp, 0).toLocaleString()} XP</strong>
              </p>
            </div>

            {/* Recent stories */}
            {user.recentStories.length > 0 && (
              <div>
                <p style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.625rem" }}>Recent Stories</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {user.recentStories.map((s) => (
                    <div key={s.id} style={{ display: "flex", gap: "0.75rem", backgroundColor: "#EDEAE0", borderRadius: "0.375rem", overflow: "hidden" }}>
                      <img src={s.img} alt={s.title} style={{ width: 80, height: 64, objectFit: "cover", flexShrink: 0 }} />
                      <div style={{ padding: "0.625rem 0.75rem 0.625rem 0", display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.25rem", minWidth: 0 }}>
                        <p style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 600, color: "#3A2A22", lineHeight: 1.3, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{s.title}</p>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#6B6B5A", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <MapPin size={10} />{s.region}
                          </span>
                          <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#6B6B5A", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Heart size={10} />{s.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#9A9A8A", textAlign: "center" }}>Member since {user.joinedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
