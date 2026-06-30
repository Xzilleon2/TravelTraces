import React, { useState } from "react";
import { Check, X, Zap, MapPin, Star, ArrowRight, HelpCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "Start documenting the Philippines",
    price: { monthly: 0, annual: 0 },
    color: "#7A9E6F",
    badge: null,
    cta: "Get Started Free",
    ctaStyle: "outline" as const,
    features: [
      { text: "Up to 30 destination pins", included: true },
      { text: "3 stories published per month", included: true },
      { text: "50 photo uploads", included: true },
      { text: "Public map visibility", included: true },
      { text: "Community access", included: true },
      { text: "Join events", included: true },
      { text: "Unlimited pins", included: false },
      { text: "Unlimited stories", included: false },
      { text: "Story analytics", included: false },
      { text: "Ad-free experience", included: false },
      { text: "Priority in search", included: false },
      { text: "Early feature access", included: false },
    ],
  },
  {
    id: "explorer",
    name: "Explorer",
    tagline: "For the serious Filipino traveller",
    price: { monthly: 149, annual: 119 },
    color: "#2D4A2D",
    badge: "Most Popular",
    cta: "Start Exploring",
    ctaStyle: "filled" as const,
    features: [
      { text: "Unlimited destination pins", included: true },
      { text: "Unlimited stories", included: true },
      { text: "500 photo uploads", included: true },
      { text: "Public + Private map control", included: true },
      { text: "Community access", included: true },
      { text: "Create & host events", included: true },
      { text: "Story views & reach analytics", included: true },
      { text: "Explorer profile badge", included: true },
      { text: "Ad-free experience", included: false },
      { text: "Priority in search", included: false },
      { text: "Early feature access", included: false },
      { text: "Dedicated support", included: false },
    ],
  },
  {
    id: "pathfinder",
    name: "Pathfinder",
    tagline: "For power explorers & content creators",
    price: { monthly: 349, annual: 279 },
    color: "#C4713A",
    badge: "Best Value",
    cta: "Become a Pathfinder",
    ctaStyle: "accent" as const,
    features: [
      { text: "Unlimited destination pins", included: true },
      { text: "Unlimited stories", included: true },
      { text: "Unlimited photo uploads", included: true },
      { text: "Full map visibility control", included: true },
      { text: "Community access", included: true },
      { text: "Create & host events", included: true },
      { text: "Full analytics dashboard", included: true },
      { text: "Pathfinder profile badge", included: true },
      { text: "Ad-free experience", included: true },
      { text: "Priority in search results", included: true },
      { text: "Early feature access", included: true },
      { text: "Dedicated support", included: true },
    ],
  },
];

const ADDONS = [
  {
    icon: MapPin,
    title: "Business Listing",
    who: "For guesthouses, tour operators & restaurants",
    price: "₱500–₱2,000 / month",
    desc: "Appear as a verified spot on the TravelTraces map near traveller pins. Reach active explorers at the moment they're planning.",
    color: "#5C8A9E",
  },
  {
    icon: Star,
    title: "Destination Spotlight",
    who: "For LGUs & Tourism Boards",
    price: "Custom pricing",
    desc: "Featured placement on the Explore page for your province or municipality. Reach 42,000+ active Filipino travellers.",
    color: "#2D4A2D",
  },
  {
    icon: Zap,
    title: "Event Hosting",
    who: "For organisers selling tickets",
    price: "5–10% platform fee",
    desc: "Sell tickets through TravelTraces Events. We handle discovery, RSVPs, and payment processing.",
    color: "#C4713A",
  },
];

const FAQS = [
  { q: "Can I upgrade or downgrade at any time?", a: "Yes. You can change your plan anytime from your profile settings. Upgrades take effect immediately; downgrades apply at the end of your billing period." },
  { q: "What happens when I hit my Free pin or story limit?", a: "You'll receive a prompt to upgrade. Your existing pins and stories are always preserved — you simply can't add new ones until you upgrade or the month resets." },
  { q: "Is there a student or group discount?", a: "Yes. Students with a valid school email get 30% off Explorer. Travel clubs and groups of 5+ get custom pricing — contact us at hello@traveltraces.app." },
  { q: "Do you offer refunds?", a: "We offer a 7-day money-back guarantee on all paid plans, no questions asked." },
  { q: "What payment methods do you accept?", a: "GCash, Maya, credit/debit cards (Visa, Mastercard), and bank transfer for annual plans." },
];

function PlanCard({ plan, annual }: { plan: typeof PLANS[0]; annual: boolean; key?: any }) {
  const { isAuthenticated, openAuthModal, user } = useAuth();
  const price = annual ? plan.price.annual : plan.price.monthly;
  const isCurrentPlan = user?.plan === plan.id;
  const isFree = plan.id === "free";

  const handleCta = () => {
    if (!isAuthenticated) { openAuthModal("signup"); return; }
    // In a real app, this would navigate to checkout
  };

  const bgColor = plan.badge === "Most Popular" ? "#2D4A2D" : "#EDEAE0";
  const textColor = plan.badge === "Most Popular" ? "#F5F0E8" : "#1A1A1A";
  const mutedColor = plan.badge === "Most Popular" ? "rgba(245,240,232,0.65)" : "#6B6B5A";
  const borderColor = plan.badge === "Most Popular" ? "transparent" : "rgba(45,74,45,0.12)";
  const checkColor = plan.badge === "Most Popular" ? "#7A9E6F" : "#2D4A2D";
  const crossColor = plan.badge === "Most Popular" ? "rgba(245,240,232,0.2)" : "#D8D4C8";

  return (
    <div
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "0.5rem",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.15)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Badge */}
      {plan.badge && (
        <div style={{
          position: "absolute", top: "1.25rem", right: "1.25rem",
          padding: "0.25rem 0.65rem",
          backgroundColor: plan.id === "pathfinder" ? "#C4713A" : "rgba(245,240,232,0.15)",
          color: "#F5F0E8",
          borderRadius: "2rem",
          fontFamily: "var(--font-label)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em",
        }}>
          {plan.badge}
        </div>
      )}

      {/* Plan name */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ width: 36, height: 4, backgroundColor: plan.color, borderRadius: "2px", marginBottom: "1rem" }} />
        <p style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: plan.color, marginBottom: "0.35rem" }}>
          {plan.name}
        </p>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, color: textColor, lineHeight: 1.2, marginBottom: "0.5rem" }}>
          {plan.tagline}
        </h3>
      </div>

      {/* Price */}
      <div style={{ marginBottom: "1.75rem", paddingBottom: "1.75rem", borderBottom: `1px solid ${plan.badge === "Most Popular" ? "rgba(245,240,232,0.12)" : "rgba(45,74,45,0.1)"}` }}>
        {isFree ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 700, color: textColor, lineHeight: 1 }}>Free</span>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
              <span style={{ fontFamily: "var(--font-label)", fontSize: "1rem", color: mutedColor }}>₱</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 700, color: textColor, lineHeight: 1 }}>{price}</span>
              <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: mutedColor }}>/month</span>
            </div>
            {annual && (
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: plan.color, marginTop: "0.35rem" }}>
                Save ₱{(plan.price.monthly - plan.price.annual) * 12}/year with annual billing
              </p>
            )}
          </>
        )}
      </div>

      {/* Features */}
      <ul style={{ listStyle: "none", margin: "0 0 2rem", padding: 0, flex: 1 }}>
        {plan.features.map((f) => (
          <li key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: f.included ? checkColor : "transparent", border: f.included ? "none" : `1.5px solid ${crossColor}`, display: "flex", alignItems: "center", justifycontent: "center", flexShrink: 0, marginTop: "1px" }}>
              {f.included
                ? <Check size={11} color="#F5F0E8" strokeWidth={3} />
                : <X size={10} color={crossColor} strokeWidth={2.5} />
              }
            </div>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: f.included ? textColor : mutedColor, lineHeight: 1.5 }}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={handleCta}
        disabled={isCurrentPlan}
        style={{
          width: "100%",
          padding: "0.875rem",
          borderRadius: "0.25rem",
          border: plan.ctaStyle === "outline" ? "1px solid rgba(45,74,45,0.35)" : "none",
          backgroundColor:
            isCurrentPlan ? "rgba(122,158,111,0.15)" :
            plan.ctaStyle === "filled" ? "rgba(245,240,232,0.12)" :
            plan.ctaStyle === "accent" ? "#C4713A" : "transparent",
          color:
            isCurrentPlan ? "#7A9E6F" :
            plan.ctaStyle === "outline" ? "#2D4A2D" : "#F5F0E8",
          cursor: isCurrentPlan ? "default" : "pointer",
          fontFamily: "var(--font-label)",
          fontSize: "0.85rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          transition: "opacity 0.15s",
        }}
      >
        {isCurrentPlan ? "Current Plan" : plan.cta}
        {!isCurrentPlan && <ArrowRight size={14} />}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { openAuthModal } = useAuth();

  return (
    <div style={{ backgroundColor: "#F5F0E8" }}>

      {/* Header */}
      <section style={{ backgroundColor: "#2D4A2D", padding: "5rem 1.5rem 4rem", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.75rem" }}>
            Simple, honest pricing
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 600, color: "#F5F0E8", lineHeight: 1.1, marginBottom: "1rem" }}>
            Choose your journey
          </h1>
          <p style={{ fontFamily: "var(--font-body)", color: "rgba(245,240,232,0.75)", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "2.25rem" }}>
            Start free. Upgrade when the islands call louder. Every plan keeps your memories safe forever.
          </p>

          {/* Billing toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.875rem", backgroundColor: "rgba(245,240,232,0.08)", border: "1px solid rgba(245,240,232,0.15)", borderRadius: "2rem", padding: "0.4rem 0.4rem 0.4rem 1rem" }}>
            <span style={{ fontFamily: "var(--font-label)", fontSize: "0.8rem", letterSpacing: "0.05em", color: !annual ? "#F5F0E8" : "rgba(245,240,232,0.5)" }}>Monthly</span>
            <button
              onClick={() => setAnnual((v) => !v)}
              style={{
                width: 44, height: 24, borderRadius: "12px",
                backgroundColor: annual ? "#C4713A" : "rgba(245,240,232,0.2)",
                border: "none", cursor: "pointer", position: "relative", transition: "background-color 0.2s", flexShrink: 0,
              }}
            >
              <div style={{ width: 18, height: 18, backgroundColor: "#F5F0E8", borderRadius: "50%", position: "absolute", top: 3, left: annual ? 23 : 3, transition: "left 0.2s" }} />
            </button>
            <span style={{ fontFamily: "var(--font-label)", fontSize: "0.8rem", letterSpacing: "0.05em", color: annual ? "#F5F0E8" : "rgba(245,240,232,0.5)" }}>Annual</span>
            {annual && (
              <span style={{ padding: "0.2rem 0.6rem", backgroundColor: "#C4713A", borderRadius: "2rem", fontFamily: "var(--font-label)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", color: "#F5F0E8" }}>
                SAVE 20%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section style={{ maxWidth: 1100, margin: "-2rem auto 0", padding: "0 1.5rem 5rem", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }} className="pricing-grid">
          {PLANS.map((plan) => <PlanCard key={plan.id} plan={plan} annual={annual} />)}
        </div>

        <p style={{ textAlign: "center", fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "#6B6B5A", marginTop: "1.5rem" }}>
          All plans include a 7-day money-back guarantee · Pay with GCash, Maya, or card · Cancel anytime
        </p>
      </section>

      {/* Feature comparison table */}
      <section style={{ backgroundColor: "#EDEAE0", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.5rem" }}>Full breakdown</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 600, color: "#2D4A2D" }}>Compare all features</h2>
          </div>

          <div style={{ overflowX: "auto" }}>
          <div style={{ backgroundColor: "#F5F0E8", borderRadius: "0.5rem", overflow: "hidden", border: "1px solid rgba(45,74,45,0.1)", minWidth: 640 }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "1rem 1.5rem", backgroundColor: "#2D4A2D" }}>
              <span style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,240,232,0.6)" }}>Feature</span>
              {["Free", "Explorer", "Pathfinder"].map((p) => (
                <span key={p} style={{ fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", color: "#F5F0E8", textAlign: "center" }}>{p}</span>
              ))}
            </div>

            {[
              ["Destination pins", "30", "Unlimited", "Unlimited"],
              ["Stories per month", "3", "Unlimited", "Unlimited"],
              ["Photo uploads", "50", "500", "Unlimited"],
              ["Map privacy control", "Public only", "Public + Private", "Full control"],
              ["Community & events", "✓", "✓", "✓"],
              ["Host your own events", "✗", "✓", "✓"],
              ["Story analytics", "✗", "Views & reach", "Full dashboard"],
              ["Profile badge", "—", "Explorer", "Pathfinder"],
              ["Ad-free experience", "✗", "✗", "✓"],
              ["Priority in search", "✗", "✗", "✓"],
              ["Early feature access", "✗", "✗", "✓"],
              ["Dedicated support", "✗", "✗", "✓"],
            ].map(([feature, free, explorer, pathfinder], i) => (
              <div
                key={feature}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  padding: "0.875rem 1.5rem",
                  backgroundColor: i % 2 === 0 ? "#F5F0E8" : "#EDEAE0",
                  borderBottom: "1px solid rgba(45,74,45,0.06)",
                }}
              >
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: "#1A1A1A" }}>{feature}</span>
                {[free, explorer, pathfinder].map((val, j) => (
                  <span
                    key={j}
                    style={{
                      fontFamily: val === "✓" || val === "✗" ? "var(--font-ui)" : "var(--font-label)",
                      fontSize: "0.85rem",
                      textAlign: "center",
                      color: val === "✓" ? "#2D4A2D" : val === "✗" ? "#D8D4C8" : "#1A1A1A",
                      fontWeight: val !== "✓" && val !== "✗" ? 600 : 400,
                    }}
                  >
                    {val}
                  </span>
                ))}
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* B2B Add-ons */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.5rem" }}>For businesses & government</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 600, color: "#2D4A2D", marginBottom: "0.75rem" }}>Partner with TravelTraces</h2>
          <p style={{ fontFamily: "var(--font-body)", color: "#6B6B5A", fontSize: "1rem", maxWidth: 480, margin: "0 auto" }}>
            Reach 42,000+ active Filipino travellers at exactly the moment they're planning their next trip.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }} className="addons-grid">
          {ADDONS.map((addon) => (
            <div
              key={addon.title}
              style={{ backgroundColor: "#EDEAE0", borderRadius: "0.5rem", padding: "2rem", borderTop: `3px solid ${addon.color}` }}
            >
              <div style={{ width: 44, height: 44, backgroundColor: addon.color, borderRadius: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                <addon.icon size={22} color="#F5F0E8" />
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 600, color: "#2D4A2D", marginBottom: "0.25rem" }}>{addon.title}</h3>
              <p style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.06em", textTransform: "uppercase", color: addon.color, marginBottom: "0.75rem" }}>{addon.who}</p>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: "#4A4A3A", lineHeight: 1.65, marginBottom: "1.25rem" }}>{addon.desc}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "#2D4A2D" }}>{addon.price}</span>
                <button
                  onClick={() => openAuthModal("signup")}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "none", border: `1px solid ${addon.color}`, color: addon.color, padding: "0.45rem 0.875rem", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
                >
                  Enquire <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: "#EDEAE0", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.5rem" }}>Got questions?</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 600, color: "#2D4A2D" }}>Frequently Asked</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{ backgroundColor: "#F5F0E8", borderRadius: "0.25rem", overflow: "hidden", border: "1px solid rgba(45,74,45,0.08)" }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "1.25rem 1.5rem", background: "none", border: "none", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "#2D4A2D", paddingRight: "1rem" }}>{faq.q}</span>
                  <HelpCircle size={18} color={openFaq === i ? "#C4713A" : "#7A9E6F"} style={{ flexShrink: 0, transition: "color 0.15s" }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 1.5rem 1.25rem" }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "#4A4A3A", lineHeight: 1.75 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ backgroundColor: "#2D4A2D", padding: "5rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4.5vw, 3.25rem)", fontWeight: 600, color: "#F5F0E8", lineHeight: 1.15, marginBottom: "1rem" }}>
            Your first footstep<br /><em>costs nothing.</em>
          </h2>
          <p style={{ fontFamily: "var(--font-body)", color: "rgba(245,240,232,0.75)", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "2rem" }}>
            Join free today. Upgrade when you're ready. Every memory you create is yours to keep, forever.
          </p>
          <button
            onClick={() => openAuthModal("signup")}
            style={{ backgroundColor: "#C4713A", color: "#F5F0E8", border: "none", padding: "1rem 2.5rem", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            Get Started Free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 420px; margin: 0 auto; }
          .addons-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .pricing-grid { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
