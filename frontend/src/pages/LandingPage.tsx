import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Clock, Heart, HelpCircle, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const HERO_IMG = "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=1600&h=900&fit=crop&auto=format";
const PRIVATE_IMG = "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1000&h=800&fit=crop&auto=format";
const SUPPORT_IMG = "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=900&h=650&fit=crop&auto=format";
const TESTIMONIAL_IMG = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&h=900&fit=crop&auto=format";
const CONTACT_IMG = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=900&fit=crop&auto=format";
const STORY1 = "https://images.unsplash.com/photo-1632307918787-8cb52566dd35?w=650&h=430&fit=crop&auto=format";
const STORY2 = "https://images.unsplash.com/photo-1768639400843-d604ccce9c3e?w=650&h=430&fit=crop&auto=format";
const STORY3 = "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=650&h=430&fit=crop&auto=format";
const STORY4 = "https://images.unsplash.com/photo-1616382093586-84ed7932c216?w=650&h=430&fit=crop&auto=format";

const features = [
  { label: "Explore", desc: "Browse Southeast Asia by region, terrain, culture, and traveller activity.", detail: "Discover coastal towns, mountain routes, megacities, islands, and community-rated local gems." },
  { label: "Stories", desc: "Read and publish long-form travel narratives from across Southeast Asia.", detail: "Personal, unfiltered accounts from people who have walked the routes themselves." },
  { label: "Map", desc: "Pin every place you've visited across Southeast Asia on an interactive map.", detail: "Build a travel history that spans borders, islands, cities, and overland routes." },
  { label: "Community", desc: "Follow travellers, find companions, join challenges, and share plans.", detail: "Meet people exploring the same Southeast Asian routes." },
  { label: "Events", desc: "Discover photography walks, food crawls, island trips, and local meetups.", detail: "Find what is happening across the region." },
  { label: "Profile", desc: "Your travel identity, albums, pins, badges, and achievements.", detail: "Keep a polished record of your Southeast Asia story." },
];

const featuredStories = [
  { img: STORY1, title: "48 Hours in Luang Prabang: Temples, Rivers, and Slow Mornings", author: "Carlo Reyes", region: "Laos", category: "Culture", readTime: "8 min", date: "12 May 2025", likes: 418, excerpt: "A slow route through temple bells, Mekong mornings, night markets, and the rituals that make Luang Prabang feel timeless." },
  { img: STORY2, title: "The Road to Ha Giang: Mountain Passes Above the Clouds", author: "Ana Villanueva", region: "Vietnam", category: "Hiking", readTime: "12 min", date: "3 May 2025", likes: 632, excerpt: "Switchbacks, limestone peaks, homestays, and the mountain weather that rewrites every plan in the best possible way." },
  { img: STORY3, title: "Three Weeks Through Northern Thailand: Markets, Trails, and Slow Time", author: "Ramon Dela Cruz", region: "Thailand", category: "Food Place", readTime: "15 min", date: "28 Apr 2025", likes: 521, excerpt: "Food markets, forest paths, train rides, and the quiet shape of travelling without rushing the story." },
  { img: STORY4, title: "Bali Beyond the Crowd: Notes on Return and Resilience", author: "Leila Marcos", region: "Indonesia", category: "Beaches", readTime: "10 min", date: "20 Apr 2025", likes: 893, excerpt: "A return to hidden coves, village roads, surf mornings, and the local voices behind a place everyone thinks they already knows." },
];

const howItWorks = [
  {
    title: "Pin your destinations",
    body: "Drop real pinpoints across Southeast Asia, from island towns and heritage streets to border crossings and mountain viewpoints."
  },
  {
    title: "Write your story",
    body: "Compose detailed, beautiful diaries of your travel adventures with rich text, local snapshots, and curated scenery."
  },
  {
    title: "Connect with travellers",
    body: "Coordinate excursions with companions and discover practical midpoint hubs for shared routes."
  }
];

const plans = [
  { name: "Free", price: "PHP 0", features: ["30 destination pins", "3 stories/month", "50 photos", "Community access"] },
  { name: "Explorer", price: "PHP 149/mo", features: ["Unlimited pins & stories", "500 photos", "Analytics", "Host events"], featured: true },
  { name: "Pathfinder", price: "PHP 349/mo", features: ["Everything in Explorer", "Ad-free", "Priority search", "Early features"] },
];

export default function LandingPage() {
  const { openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const scrollToSection = (target: string) => {
    const element = document.getElementById(target);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="landing-sample" style={{ background: "#FBF7F0", color: "#2C211C", overflow: "hidden" }}>
      <div className="landing-scroller" aria-label="Back to top">
        <button type="button" onClick={() => scrollToSection("home")} aria-label="Scroll to top">↑</button>
      </div>

      <section className="sample-hero" id="home">
        <img src={HERO_IMG} alt="Aerial view of islands and limestone cliffs" />
        <div className="hero-warmth" />
        <div className="sample-lines" />
        <div className="sample-hero-copy">
          <p>Community travel - Southeast Asia</p>
          <h1>Trace Southeast Asia</h1>
          <h2>one journey at a time.</h2>
          <span>TravelTraces is where Southeast Asia travellers pin destinations, write honest stories, and find companions for their next island, city, or overland adventure.</span>
          <button onClick={() => openAuthModal("signup")}>Discover <ArrowRight size={14} /></button>
        </div>
      </section>

      <section id="features" className="support-section">
        <div className="map-lines" />
        <p className="section-kicker">Platform features</p>
        <h2>Explore, map, share, connect</h2>
        <div className="support-timeline">
          {features.map((feature, index) => (
            <article key={feature.label} className={`support-step ${index % 2 === 0 ? "left" : "right"}`} style={{ animationDelay: `${index * 0.08}s` }}>
              <div className="timeline-node">{String(index + 1).padStart(2, "0")}</div>
              <div className="support-card">
                <img src={index % 2 === 0 ? SUPPORT_IMG : PRIVATE_IMG} alt="" />
                <h3>{feature.label}</h3>
                <p className="typing-line">{feature.desc}</p>
                <span className="typing-line delay">{feature.detail}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="featured-stories" className="stories-section">
        <div className="section-row">
          <div>
            <p className="section-kicker">Featured stories</p>
            <h2>Real journeys, honest accounts</h2>
          </div>
          <button onClick={() => openAuthModal("signup")}>All stories <ArrowRight size={14} /></button>
        </div>

        <div className="story-grid">
          {featuredStories.map((story) => (
            <article key={story.title} className="story-card" onClick={() => openAuthModal("signup")}>
              <img src={story.img} alt={story.title} />
              <div>
                <p>{story.category}</p>
                <h3>{story.title}</h3>
                <span>{story.excerpt.slice(0, 120)}...</span>
                <footer>
                  <strong>{story.author}</strong>
                  <small><Heart size={12} /> {story.likes}</small>
                  <small><Clock size={12} /> {story.readTime}</small>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="experience-section">
        <div className="experience-bg">
          <img src={TESTIMONIAL_IMG} alt="Layered mountains at sunset" />
        </div>
        <div className="experience-panel">
          <p className="section-kicker">How it works</p>
          <h2>Experience your route before you arrive</h2>
          <div className="step-tabs">
            {howItWorks.map((step, index) => (
              <button key={step.title} className={activeStep === index ? "active" : ""} onClick={() => setActiveStep(index)}>
                {index + 1}
              </button>
            ))}
          </div>
          <h3>{howItWorks[activeStep].title}</h3>
          <p>{howItWorks[activeStep].body}</p>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <p className="section-kicker">Pricing</p>
        <h2>Start free. Upgrade when ready.</h2>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={plan.featured ? "featured" : ""}>
              <h3>{plan.name}</h3>
              <p>{plan.price}</p>
              <ul>
                {plan.features.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <button onClick={() => openAuthModal("signup")}>Select plan</button>
            </article>
          ))}
        </div>
        <button className="compare-button" onClick={() => navigate("/pricing")}>Compare all features <ArrowRight size={14} /></button>
      </section>

      <section id="contact-section" className="contact-section">
        <img src={CONTACT_IMG} alt="Warm shoreline reflection" />
        <div className="contact-card">
          <div>
            <p className="section-kicker">Help</p>
            <h2>Need guidance before your next route?</h2>
            <p>Browse account, mapping, story, pricing, and safety guides for TravelTraces members.</p>
            <button onClick={() => navigate("/help")}><HelpCircle size={15} /> Help centre</button>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); navigate("/contact"); }}>
            <p className="section-kicker">Contact</p>
            <input placeholder="Name" />
            <input placeholder="Email" />
            <textarea placeholder="Message / your preferences" rows={4} />
            <button type="submit"><Send size={15} /> Send request</button>
          </form>
        </div>
      </section>

      <style>{`
        .landing-sample * { box-sizing: border-box; }
        .sample-hero { position: relative; min-height: calc(100vh - 64px); overflow: hidden; display: grid; place-items: center; text-align: center; padding: 4rem 1.5rem; }
        .sample-hero > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: slowZoom 18s ease-out both; }
        .hero-warmth { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(72,42,20,0.34), rgba(44,33,28,0.62)); }
        .sample-lines { position: absolute; inset: 7%; border: 1px solid rgba(251,247,240,0.18); background-image: linear-gradient(90deg, rgba(251,247,240,0.13) 1px, transparent 1px), linear-gradient(rgba(251,247,240,0.1) 1px, transparent 1px); background-size: 24.8% 100%, 100% 50%; }
        .sample-hero-copy { position: relative; z-index: 1; width: min(100%, 760px); color: #FBF7F0; animation: heroRise 0.9s ease both; }
        .sample-hero-copy p, .section-kicker { font-family: var(--font-label); font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; }
        .sample-hero-copy h1, .sample-hero-copy h2, .support-section h2, .stories-section h2, .experience-panel h2, .pricing-section h2, .contact-card h2 { font-family: var(--font-display); font-weight: 500; letter-spacing: 0; }
        .sample-hero-copy h1 { font-size: clamp(2.8rem, 7vw, 5.4rem); line-height: 0.98; margin: 1.1rem 0 0; text-transform: uppercase; }
        .sample-hero-copy h2 { font-size: clamp(2.2rem, 6vw, 4.6rem); font-style: italic; line-height: 1; margin: 0 0 1.4rem; }
        .sample-hero-copy span { display: block; font-family: var(--font-body); font-size: 1.05rem; line-height: 1.65; color: rgba(251,247,240,0.86); margin: 0 auto 1.8rem; max-width: 620px; }
        .sample-hero-copy button, .section-row button, .pricing-section button, .contact-card button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem; border-radius: 999px; border: 1px solid currentColor; background: #FBF7F0; color: #3A2A22; padding: 0.72rem 1.35rem; font-family: var(--font-label); font-size: 0.73rem; letter-spacing: 0.11em; text-transform: uppercase; cursor: pointer; }
        .support-section, .stories-section, .pricing-section { position: relative; padding: 6.5rem 1.5rem; max-width: 1200px; margin: 0 auto; }
        .map-lines { position: absolute; inset: 0 1.5rem auto; height: 440px; opacity: 0.45; pointer-events: none; background-image: linear-gradient(90deg, rgba(58,42,34,0.1) 1px, transparent 1px), linear-gradient(rgba(58,42,34,0.08) 1px, transparent 1px), radial-gradient(circle at 12% 30%, transparent 9px, rgba(58,42,34,0.12) 10px, transparent 11px); background-size: 25% 100%, 100% 52%, 180px 140px; }
        .section-kicker { color: #9E6B5C; margin: 0 0 0.75rem; }
        .support-section > h2, .stories-section h2, .pricing-section > h2 { position: relative; z-index: 1; font-size: clamp(2.6rem, 6vw, 5rem); line-height: 0.95; text-transform: uppercase; color: #2C211C; margin: 0 0 2.25rem; }
        .support-timeline { position: relative; z-index: 1; padding: 1rem 0 0; }
        .support-timeline::before { content: ""; position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; background: linear-gradient(to bottom, rgba(158,107,92,0), rgba(158,107,92,0.8), rgba(158,107,92,0)); }
        .support-step { position: relative; min-height: 320px; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 4rem; margin: -0.5rem 0 2rem; animation: cardRise 0.7s ease both; }
        .support-step.right .support-card { grid-column: 2; }
        .support-step.right::after, .support-step.left::after { content: ""; position: absolute; top: 50%; width: calc(50% - 1.75rem); height: 1px; background: rgba(158,107,92,0.35); }
        .support-step.left::after { left: 50%; }
        .support-step.right::after { right: 50%; }
        .timeline-node { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2; width: 46px; height: 46px; border-radius: 50%; background: #3A2A22; color: #FBF7F0; display: flex; align-items: center; justify-content: center; font-family: var(--font-label); font-size: 0.72rem; letter-spacing: 0.1em; box-shadow: 0 0 0 10px #FBF7F0; }
        .support-card { min-height: 300px; background: rgba(251,247,240,0.88); border: 1px solid rgba(58,42,34,0.12); overflow: hidden; box-shadow: 0 18px 50px rgba(44,33,28,0.08); }
        .support-card img { width: 100%; height: 118px; object-fit: cover; display: block; filter: sepia(0.18) saturate(0.9); }
        .support-card h3, .support-card p, .support-card span { margin-left: 1.25rem; margin-right: 1.25rem; }
        .support-card h3 { font-family: var(--font-display); font-size: 1.45rem; line-height: 1.05; margin-top: 1.25rem; margin-bottom: 0.65rem; text-transform: uppercase; }
        .support-card p, .support-card span, .story-feature span, .story-card span, .experience-panel p, .contact-card p { font-family: var(--font-body); line-height: 1.65; color: #5B4A40; }
        .support-card p { margin: 0 1.25rem 0.6rem; }
        .support-card span { display: block; font-size: 0.9rem; margin-bottom: 1.25rem; }
        .typing-line { display: block; overflow: hidden; width: calc(100% - 2.5rem); max-width: calc(100% - 2.5rem); animation: typeReveal 1.3s steps(42, end) both; }
        .typing-line.delay { animation-delay: 0.22s; }
        .section-row { display: flex; justify-content: space-between; align-items: end; gap: 1rem; margin-bottom: 2rem; }
        .section-row h2 { margin: 0; font-size: clamp(2.3rem, 5vw, 4.1rem); line-height: 1; }
        .story-feature { display: grid; grid-template-columns: 1fr 1fr; background: #EFE7DC; cursor: pointer; margin-bottom: 1.4rem; }
        .story-feature img { width: 100%; height: 390px; object-fit: cover; display: block; }
        .story-feature > div { padding: clamp(1.5rem, 4vw, 2.8rem); display: flex; flex-direction: column; justify-content: center; }
        .story-feature p, .story-card p { font-family: var(--font-label); font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: #9E6B5C; margin: 0 0 0.7rem; }
        .story-feature h3, .story-card h3 { font-family: var(--font-display); color: #2C211C; line-height: 1.15; margin: 0 0 0.9rem; }
        .story-feature h3 { font-size: clamp(1.8rem, 4vw, 3rem); }
        .story-meta, .story-card footer { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 1.2rem; font-family: var(--font-ui); color: #5B4A40; }
        .story-meta small, .story-card small { display: inline-flex; align-items: center; gap: 0.25rem; }
        .story-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .story-card { background: #EFE7DC; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .story-card:hover, .story-feature:hover, .pricing-grid article:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(44,33,28,0.14); }
        .story-card img { width: 100%; height: 190px; object-fit: cover; display: block; }
        .story-card div { padding: 1.2rem; }
        .story-card h3 { font-size: 1.28rem; }
        .experience-section { position: relative; min-height: 680px; display: grid; place-items: center; padding: 6rem 1.5rem; overflow: hidden; }
        .experience-bg { position: absolute; inset: 0; }
        .experience-bg img { width: 100%; height: 100%; object-fit: cover; filter: sepia(0.18); }
        .experience-bg::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(44,33,28,0.74), rgba(44,33,28,0.54)); }
        .experience-panel { position: relative; z-index: 1; width: min(100%, 720px); text-align: center; color: #FBF7F0; background: rgba(44,33,28,0.34); border: 1px solid rgba(251,247,240,0.2); padding: clamp(1.5rem, 4vw, 2.5rem); backdrop-filter: blur(6px); }
        .experience-panel h2 { font-size: clamp(2.4rem, 6vw, 4.8rem); line-height: 0.95; margin: 0 0 1.2rem; text-transform: uppercase; }
        .experience-panel h3 { font-family: var(--font-display); font-size: 1.75rem; margin: 1.3rem 0 0.6rem; }
        .step-tabs { display: flex; gap: 0.75rem; justify-content: center; margin: 1.7rem 0 0; }
        .experience-panel p { color: rgba(251,247,240,0.84); }
        .step-tabs button { width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(251,247,240,0.45); background: transparent; color: #FBF7F0; cursor: pointer; }
        .step-tabs button.active { background: #FBF7F0; color: #3A2A22; }
        .pricing-section { text-align: center; }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; margin-top: 2rem; text-align: left; }
        .pricing-grid article { background: #EFE7DC; border: 1px solid rgba(58,42,34,0.12); padding: 1.8rem; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .pricing-grid article.featured { background: #3A2A22; color: #FBF7F0; }
        .pricing-grid h3 { font-family: var(--font-display); font-size: 1.7rem; margin: 0 0 0.2rem; text-transform: uppercase; }
        .pricing-grid p { font-family: var(--font-display); font-size: 2rem; margin: 0 0 1rem; color: #9E6B5C; }
        .pricing-grid li { font-family: var(--font-ui); margin-bottom: 0.6rem; }
        .pricing-grid button, .compare-button { width: 100%; margin-top: 1rem; background: transparent; color: inherit; }
        .compare-button { width: auto; color: #2C211C; }
        .contact-section { position: relative; min-height: 780px; padding: 6rem 1.5rem; display: grid; align-items: start; }
        .contact-section > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: sepia(0.12); }
        .contact-card { position: relative; z-index: 1; width: min(100%, 980px); margin: 0 auto; display: grid; grid-template-columns: 1fr 1.3fr; background: #FBF7F0; box-shadow: 0 20px 70px rgba(44,33,28,0.24); }
        .contact-card > div, .contact-card form { padding: clamp(1.4rem, 4vw, 2.5rem); }
        .contact-card form { background: #3A2A22; display: flex; flex-direction: column; gap: 0.9rem; }
        .contact-card input, .contact-card textarea { border: none; border-bottom: 1px solid rgba(251,247,240,0.4); background: transparent; color: #FBF7F0; padding: 0.7rem 0; font-family: var(--font-ui); outline: none; }
        .contact-card textarea { resize: none; }
        .contact-card form .section-kicker { color: #CFA68A; }
        .contact-card form button { color: #3A2A22; align-self: flex-start; margin-top: 0.6rem; }
        @keyframes slowZoom { from { transform: scale(1.08); } to { transform: scale(1); } }
        @keyframes heroRise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cardRise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typeReveal { from { clip-path: inset(0 100% 0 0); opacity: 0.2; } to { clip-path: inset(0 0 0 0); opacity: 1; } }
        @media (max-width: 980px) {
          .support-timeline::before { left: 23px; }
          .support-step, .story-feature, .story-grid, .pricing-grid, .contact-card { grid-template-columns: 1fr !important; }
          .support-step { padding-left: 4.5rem; gap: 0; min-height: auto; }
          .support-step.right .support-card { grid-column: 1; }
          .support-step.left::after, .support-step.right::after { left: 23px; right: auto; width: 3rem; }
          .timeline-node { left: 23px; }
          .story-feature img { height: 300px; }
        }
        @media (max-width: 640px) {
          .sample-hero { min-height: 720px; }
          .sample-lines { inset: 5%; }
          .support-section, .stories-section, .pricing-section { padding: 4.5rem 1rem; }
          .experience-section { min-height: 620px; }
          .contact-section { padding: 4rem 1rem; }
        }
      `}</style>
    </div>
  );
}
