import { X, ArrowRight, Lock } from "lucide-react";
import { useNavigate } from "react-router";

type Props = {
  onClose: () => void;
  reason: "pins" | "stories" | "photos";
};

const REASON_COPY = {
  pins: {
    title: "You've reached your pin limit",
    body: "Free accounts can save up to 30 destination pins. Upgrade to Explorer or Pathfinder for unlimited pinning across all 7,641 islands.",
    limit: "30 pins on Free",
  },
  stories: {
    title: "Monthly story limit reached",
    body: "Free accounts can publish 3 stories per month. Upgrade to keep writing — your next journey deserves to be told.",
    limit: "3 stories/month on Free",
  },
  photos: {
    title: "Photo storage full",
    body: "You've used all 50 photos included in the Free plan. Upgrade for 500 or unlimited photo uploads.",
    limit: "50 photos on Free",
  },
};

const UPGRADE_PLANS = [
  { id: "explorer", name: "Explorer", price: "₱149/mo", color: "#3A2A22", highlight: "Unlimited pins, stories & 500 photos" },
  { id: "pathfinder", name: "Pathfinder", price: "₱349/mo", color: "#C4713A", highlight: "Unlimited everything + ad-free + priority" },
];

export function UpgradeModal({ onClose, reason }: Props) {
  const navigate = useNavigate();
  const copy = REASON_COPY[reason];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(26,26,26,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor: "#F5F0E8", borderRadius: "0.5rem", width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.22)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ backgroundColor: "#3A2A22", padding: "1.75rem 2rem", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(245,240,232,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#F5F0E8" }}>
            <X size={16} />
          </button>
          <div style={{ width: 44, height: 44, backgroundColor: "rgba(196,113,58,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <Lock size={20} color="#C4713A" />
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 600, color: "#F5F0E8", marginBottom: "0.5rem" }}>{copy.title}</h2>
          <p style={{ fontFamily: "var(--font-body)", color: "rgba(245,240,232,0.75)", fontSize: "0.9rem", lineHeight: 1.6 }}>{copy.body}</p>
        </div>

        {/* Plans */}
        <div style={{ padding: "1.5rem 2rem 2rem" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "1rem" }}>
            Upgrade to unlock
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {UPGRADE_PLANS.map((plan) => (
              <div
                key={plan.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", backgroundColor: "#EDEAE0", borderRadius: "0.25rem", borderLeft: `3px solid ${plan.color}` }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: plan.color }}>{plan.name}</span>
                    <span style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", fontWeight: 700, color: "#3A2A22" }}>{plan.price}</span>
                  </div>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "#4A4A3A" }}>{plan.highlight}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => { onClose(); navigate("/pricing"); }}
            style={{ width: "100%", padding: "0.875rem", backgroundColor: "#3A2A22", color: "#F5F0E8", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.75rem" }}
          >
            See all plans <ArrowRight size={14} />
          </button>
          <button
            onClick={onClose}
            style={{ width: "100%", padding: "0.75rem", backgroundColor: "transparent", color: "#6B6B5A", border: "none", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.8rem", letterSpacing: "0.06em" }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
