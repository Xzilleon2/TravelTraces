import React, { useState } from "react";
import { ArrowRight, Check, HelpCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PRICING_HERO = "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=1600&h=720&fit=crop&auto=format";

const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "Start documenting Southeast Asia",
    price: { monthly: 0, annual: 0 },
    badge: null,
    cta: "Get Started Free",
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
    tagline: "For the serious Southeast Asia traveller",
    price: { monthly: 149, annual: 119 },
    badge: "Most Popular",
    cta: "Start Exploring",
    features: [
      { text: "Unlimited destination pins", included: true },
      { text: "Unlimited stories", included: true },
      { text: "500 photo uploads", included: true },
      { text: "Public + private map control", included: true },
      { text: "Community access", included: true },
      { text: "Create and host events", included: true },
      { text: "Story views and reach analytics", included: true },
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
    tagline: "For power explorers and creators",
    price: { monthly: 349, annual: 279 },
    badge: "Best Value",
    cta: "Become a Pathfinder",
    features: [
      { text: "Unlimited destination pins", included: true },
      { text: "Unlimited stories", included: true },
      { text: "Unlimited photo uploads", included: true },
      { text: "Full map visibility control", included: true },
      { text: "Community access", included: true },
      { text: "Create and host events", included: true },
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
    title: "Business Listing",
    who: "For guesthouses, tour operators, and restaurants",
    price: "PHP 500 - PHP 2,000 / month",
    desc: "Appear as a verified spot on the TravelTraces map near traveller pins. Reach active explorers at the moment they are planning.",
  },
  {
    title: "Destination Spotlight",
    who: "For destinations, cities, and tourism teams",
    price: "Custom pricing",
    desc: "Featured placement on the Explore page for your destination, province, or city. Reach 42,000+ active Southeast Asia travellers.",
  },
  {
    title: "Event Hosting",
    who: "For organisers selling tickets",
    price: "5-10% platform fee",
    desc: "Sell tickets through TravelTraces Events. We handle discovery, RSVPs, and payment processing.",
  },
];

const FAQS = [
  { q: "Can I upgrade or downgrade at any time?", a: "Yes. You can change your plan anytime from your profile settings. Upgrades take effect immediately; downgrades apply at the end of your billing period." },
  { q: "What happens when I hit my Free pin or story limit?", a: "You will receive a prompt to upgrade. Your existing pins and stories are always preserved; you simply cannot add new ones until you upgrade or the month resets." },
  { q: "Is there a student or group discount?", a: "Yes. Students with a valid school email get 30% off Explorer. Travel clubs and groups of 5+ can contact us for custom pricing." },
  { q: "Do you offer refunds?", a: "We offer a 7-day money-back guarantee on all paid plans." },
  { q: "What payment methods do you accept?", a: "GCash, Maya, credit/debit cards, and bank transfer for annual plans." },
];

function PlanCard({ plan, annual }: { plan: typeof PLANS[0]; annual: boolean; key?: string }) {
  const { isAuthenticated, openAuthModal, user } = useAuth();
  const price = annual ? plan.price.annual : plan.price.monthly;
  const isCurrentPlan = user?.plan === plan.id;
  const isFeatured = plan.badge === "Most Popular";

  const handleCta = () => {
    if (!isAuthenticated) openAuthModal("signup");
  };

  return (
    <article className={`pricing-card ${isFeatured ? "featured" : ""}`}>
      {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
      <p className="pricing-kicker">{plan.name}</p>
      <h3>{plan.tagline}</h3>
      <div className="pricing-price">
        {price === 0 ? "Free" : <>PHP {price}<span>/month</span></>}
      </div>
      {annual && price > 0 && <p className="pricing-save">Save PHP {(plan.price.monthly - plan.price.annual) * 12}/year with annual billing</p>}
      <ul>
        {plan.features.map((feature) => (
          <li key={feature.text} className={feature.included ? "" : "muted"}>
            {feature.included ? <Check size={13} /> : <X size={13} />}
            {feature.text}
          </li>
        ))}
      </ul>
      <button onClick={handleCta} disabled={isCurrentPlan}>
        {isCurrentPlan ? "Current Plan" : plan.cta} {!isCurrentPlan && <ArrowRight size={14} />}
      </button>
    </article>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { openAuthModal } = useAuth();

  return (
    <div className="pricing-page">
      <section className="pricing-hero">
        <img src={PRICING_HERO} alt="" />
        <div className="pricing-hero-warmth" />
        <div className="pricing-frame" />
        <div className="pricing-hero-copy">
          <p>Simple, honest pricing</p>
          <h1>Choose your journey</h1>
          <span>Start free. Upgrade when Southeast Asia calls louder. Every plan keeps your memories safe forever.</span>
          <div className="billing-toggle">
            <span className={!annual ? "active" : ""}>Monthly</span>
            <button onClick={() => setAnnual((value) => !value)} aria-label="Toggle annual billing">
              <i className={annual ? "annual" : ""} />
            </button>
            <span className={annual ? "active" : ""}>Annual</span>
            {annual && <strong>Save 20%</strong>}
          </div>
        </div>
      </section>

      <section className="pricing-plans">
        <div className="pricing-grid">
          {PLANS.map((plan) => <PlanCard key={plan.id} plan={plan} annual={annual} />)}
        </div>
        <p className="pricing-note">All plans include a 7-day money-back guarantee. Pay with GCash, Maya, card, or annual bank transfer.</p>
      </section>

      <section className="pricing-compare">
        <p className="section-kicker">Full breakdown</p>
        <h2>Compare all features</h2>
        <div className="compare-table">
          {[
            ["Destination pins", "30", "Unlimited", "Unlimited"],
            ["Stories per month", "3", "Unlimited", "Unlimited"],
            ["Photo uploads", "50", "500", "Unlimited"],
            ["Map privacy control", "Public only", "Public + private", "Full control"],
            ["Community and events", "Yes", "Yes", "Yes"],
            ["Host your own events", "No", "Yes", "Yes"],
            ["Story analytics", "No", "Views and reach", "Full dashboard"],
            ["Profile badge", "-", "Explorer", "Pathfinder"],
            ["Ad-free experience", "No", "No", "Yes"],
            ["Priority in search", "No", "No", "Yes"],
          ].map(([feature, free, explorer, pathfinder]) => (
            <div key={feature}>
              <strong>{feature}</strong>
              <span>{free}</span>
              <span>{explorer}</span>
              <span>{pathfinder}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pricing-addons">
        <div>
          <p className="section-kicker">Partners</p>
          <h2>Bring your place into the map</h2>
          <p>Reach active Southeast Asia travellers at exactly the moment they are planning their next trip.</p>
        </div>
        <div className="addon-grid">
          {ADDONS.map((addon) => (
            <article key={addon.title}>
              <p>{addon.who}</p>
              <h3>{addon.title}</h3>
              <span>{addon.desc}</span>
              <strong>{addon.price}</strong>
              <button onClick={() => openAuthModal("signup")}>Enquire <ArrowRight size={13} /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing-faq">
        <p className="section-kicker">Got questions?</p>
        <h2>Frequently asked</h2>
        <div>
          {FAQS.map((faq, index) => (
            <article key={faq.q}>
              <button onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                <span>{faq.q}</span>
                <HelpCircle size={18} />
              </button>
              {openFaq === index && <p>{faq.a}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="pricing-final">
        <p className="section-kicker">Free to begin</p>
        <h2>Your first footstep costs nothing.</h2>
        <button onClick={() => openAuthModal("signup")}>Get Started Free <ArrowRight size={16} /></button>
      </section>

      <style>{`
        .pricing-page { background: #FBF7F0; color: #2C211C; overflow: hidden; }
        .pricing-page * { box-sizing: border-box; }
        .pricing-hero { position: relative; min-height: 520px; display: grid; place-items: center; text-align: center; overflow: hidden; padding: 5rem 1.5rem; }
        .pricing-hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: sepia(0.12) saturate(0.92); }
        .pricing-hero-warmth { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(72,42,20,0.34), rgba(44,33,28,0.68)); }
        .pricing-frame { position: absolute; inset: 10%; border: 1px solid rgba(251,247,240,0.2); background-image: linear-gradient(90deg, rgba(251,247,240,0.12) 1px, transparent 1px), linear-gradient(rgba(251,247,240,0.1) 1px, transparent 1px); background-size: 25% 100%, 100% 50%; }
        .pricing-hero-copy { position: relative; z-index: 1; max-width: 760px; color: #FBF7F0; }
        .pricing-hero-copy p, .section-kicker, .pricing-kicker { margin: 0 0 0.75rem; font-family: var(--font-label); font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: #CFA68A; }
        .pricing-hero-copy h1, .pricing-compare h2, .pricing-addons h2, .pricing-faq h2, .pricing-final h2 { margin: 0; font-family: var(--font-display); font-weight: 500; letter-spacing: 0; text-transform: uppercase; line-height: 0.98; }
        .pricing-hero-copy h1 { font-size: clamp(2.8rem, 7vw, 5.3rem); color: #FBF7F0; }
        .pricing-hero-copy span { display: block; max-width: 620px; margin: 1.25rem auto 2rem; font-family: var(--font-body); line-height: 1.65; color: rgba(251,247,240,0.84); }
        .billing-toggle { display: inline-flex; align-items: center; gap: 0.75rem; padding: 0.45rem 0.45rem 0.45rem 1rem; border: 1px solid rgba(251,247,240,0.2); border-radius: 999px; background: rgba(251,247,240,0.08); font-family: var(--font-label); font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; }
        .billing-toggle span { margin: 0; color: rgba(251,247,240,0.55); font-family: inherit; line-height: 1; }
        .billing-toggle span.active { color: #FBF7F0; }
        .billing-toggle button { position: relative; width: 46px; height: 26px; border: none; border-radius: 999px; background: rgba(251,247,240,0.22); cursor: pointer; }
        .billing-toggle i { position: absolute; width: 18px; height: 18px; top: 4px; left: 4px; border-radius: 50%; background: #FBF7F0; transition: left 0.18s ease; }
        .billing-toggle i.annual { left: 24px; }
        .billing-toggle strong { padding: 0.28rem 0.7rem; border-radius: 999px; background: #9E6B5C; color: #FBF7F0; }
        .pricing-plans, .pricing-compare, .pricing-addons, .pricing-faq, .pricing-final { max-width: 1120px; margin: 0 auto; padding: 5.5rem 1.5rem; }
        .pricing-plans { margin-top: -3rem; position: relative; z-index: 2; padding-top: 0; }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .pricing-card { position: relative; display: flex; flex-direction: column; min-height: 100%; padding: 1.75rem; background: #EFE7DC; border: 1px solid rgba(58,42,34,0.12); box-shadow: 0 18px 50px rgba(44,33,28,0.08); }
        .pricing-card.featured { background: #3A2A22; color: #FBF7F0; transform: translateY(-1rem); }
        .pricing-badge { position: absolute; top: 1rem; right: 1rem; padding: 0.28rem 0.65rem; border-radius: 999px; background: #9E6B5C; color: #FBF7F0; font-family: var(--font-label); font-size: 0.64rem; letter-spacing: 0.1em; text-transform: uppercase; }
        .pricing-card h3 { margin: 0 0 1.3rem; font-family: var(--font-display); font-size: 1.55rem; font-weight: 500; line-height: 1.1; text-transform: uppercase; }
        .pricing-price { font-family: var(--font-display); font-size: 2.35rem; line-height: 1; color: #9E6B5C; margin-bottom: 0.6rem; }
        .pricing-card.featured .pricing-price { color: #CFA68A; }
        .pricing-price span { font-family: var(--font-ui); font-size: 0.85rem; color: inherit; opacity: 0.75; }
        .pricing-save, .pricing-note { font-family: var(--font-ui); font-size: 0.82rem; color: #5B4A40; }
        .pricing-card.featured .pricing-save { color: rgba(251,247,240,0.72); }
        .pricing-card ul { list-style: none; padding: 1.4rem 0 0; margin: 1.4rem 0 1.5rem; border-top: 1px solid rgba(58,42,34,0.12); flex: 1; }
        .pricing-card.featured ul { border-top-color: rgba(251,247,240,0.14); }
        .pricing-card li { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.7rem; font-family: var(--font-ui); font-size: 0.9rem; color: inherit; }
        .pricing-card li svg { color: #9E6B5C; flex: 0 0 auto; }
        .pricing-card li.muted { opacity: 0.45; }
        .pricing-card button, .addon-grid button, .pricing-final button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem; border-radius: 999px; border: 1px solid currentColor; background: #3A2A22; color: #FBF7F0; padding: 0.72rem 1.2rem; font-family: var(--font-label); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.11em; text-transform: uppercase; cursor: pointer; }
        .pricing-card.featured button { background: #FBF7F0; color: #3A2A22; }
        .pricing-note { text-align: center; margin-top: 1.4rem; }
        .pricing-compare h2, .pricing-addons h2, .pricing-faq h2, .pricing-final h2 { font-size: clamp(2.2rem, 5vw, 4rem); color: #2C211C; margin-bottom: 2rem; }
        .compare-table { background: #EFE7DC; border: 1px solid rgba(58,42,34,0.12); box-shadow: 0 18px 50px rgba(44,33,28,0.08); overflow-x: auto; }
        .compare-table div { min-width: 680px; display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid rgba(58,42,34,0.1); font-family: var(--font-ui); }
        .compare-table div:first-child { background: #3A2A22; color: #FBF7F0; }
        .compare-table strong { color: inherit; }
        .compare-table span { text-align: center; }
        .pricing-addons { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 2rem; align-items: start; }
        .pricing-addons > div > p:not(.section-kicker), .pricing-final { font-family: var(--font-body); color: #5B4A40; line-height: 1.7; }
        .addon-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
        .addon-grid article { padding: 1.5rem; background: #EFE7DC; border: 1px solid rgba(58,42,34,0.12); box-shadow: 0 18px 50px rgba(44,33,28,0.08); }
        .addon-grid p { margin: 0 0 0.35rem; font-family: var(--font-label); font-size: 0.68rem; letter-spacing: 0.13em; text-transform: uppercase; color: #9E6B5C; }
        .addon-grid h3 { margin: 0 0 0.7rem; font-family: var(--font-display); font-weight: 500; font-size: 1.45rem; text-transform: uppercase; }
        .addon-grid span { display: block; font-family: var(--font-body); color: #5B4A40; line-height: 1.65; }
        .addon-grid strong { display: block; margin: 1rem 0; font-family: var(--font-display); font-size: 1.25rem; color: #2C211C; }
        .addon-grid button { background: transparent; color: #3A2A22; }
        .pricing-faq > div { display: grid; gap: 0.75rem; }
        .pricing-faq article { background: #EFE7DC; border: 1px solid rgba(58,42,34,0.12); }
        .pricing-faq article > button { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1.2rem 1.35rem; border: none; background: transparent; color: #2C211C; cursor: pointer; text-align: left; font-family: var(--font-display); font-size: 1.1rem; }
        .pricing-faq p { margin: 0; padding: 0 1.35rem 1.2rem; font-family: var(--font-body); line-height: 1.7; color: #5B4A40; }
        .pricing-final { text-align: center; padding-bottom: 6rem; }
        @media (max-width: 900px) {
          .pricing-grid, .pricing-addons, .addon-grid { grid-template-columns: 1fr; }
          .pricing-card.featured { transform: none; }
          .pricing-hero { min-height: 600px; }
        }
      `}</style>
    </div>
  );
}
