import React, { useMemo, useState } from "react";
import { Calendar, MapPin, Users, Clock, ArrowRight, X, CheckCircle2, Tag, Plus } from "lucide-react";
import { GatedPage } from "../components/GatedPage";
import { HostTourMeetupForm, type HostTourPlace } from "../components/HostTourMeetupForm";
import { UserProfileModal } from "../components/UserProfileModal";
import { GAMIFIED_USERS, GamifiedUser } from "../components/gamification";
import { listHostedTourMeetups, type HostedTourMeetupRecord } from "../services/eventsApi";

const ORGANISER_KEY: Record<string, string> = {
  "Carlo Reyes": "carlo",
  "Ana Villanueva": "ana",
  "Ramon Dela Cruz": "ramon",
  "Leila Marcos": "leila",
  "Marco Buenaventura": "marco",
  "Sofia Reyes": "sofia",
};

const PARTICIPANT_POOL = [
  { name: "Maria Santos", avatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=48&h=48&fit=crop&auto=format", location: "Quezon City" },
  { name: "Ana Villanueva", avatar: "https://images.unsplash.com/photo-1672933278668-5be5957a8681?w=48&h=48&fit=crop&auto=format", location: "Makati City" },
  { name: "Ramon Dela Cruz", avatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=48&h=48&fit=crop&auto=format", location: "Baguio City" },
  { name: "Leila Marcos", avatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=48&h=48&fit=crop&auto=format", location: "Cebu City" },
  { name: "Marco Buenaventura", avatar: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=48&h=48&fit=crop&auto=format", location: "Angeles, Pampanga" },
  { name: "Sofia Reyes", avatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=48&h=48&fit=crop&auto=format", location: "Davao City" },
  { name: "Jomar Bautista", avatar: "https://images.unsplash.com/photo-1532074205216-d0e1f4b87368?w=48&h=48&fit=crop&auto=format", location: "Iloilo City" },
  { name: "Kristine Lim", avatar: "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=48&h=48&fit=crop&auto=format", location: "Cagayan de Oro" },
  { name: "Renz Pascual", avatar: "https://images.unsplash.com/photo-1559893088-c0787ebfc084?w=48&h=48&fit=crop&auto=format", location: "Tagaytay" },
  { name: "Danielle Cruz", avatar: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=48&h=48&fit=crop&auto=format", location: "Vigan, Ilocos Sur" },
];

const EVENTS = [
  {
    id: 1,
    title: "Palawan Island-Hopping Weekend",
    type: "Adventure",
    date: "14–16 June 2025",
    time: "7:00 AM departure",
    location: "El Nido, Palawan",
    organiser: "Carlo Reyes",
    organiserAvatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=48&h=48&fit=crop&auto=format",
    participants: 24,
    maxParticipants: 30,
    img: "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=800&h=450&fit=crop&auto=format",
    desc: "Three days exploring the hidden lagoons, beaches, and karst cliffs of northern Palawan. Tours A, B, C, and the secret coves beyond.",
    longDesc: "Join us for three incredible days exploring the UNESCO-listed Bacuit Archipelago. We'll be doing Tours C and D (the less crowded routes), stopping at hidden lagoons, limestone cliffs, white sand beaches, and snorkelling spots that the big tour groups miss.\n\nDays 1–2 are spent island-hopping with a private boat. Day 3 is free exploration — kayaking through mangroves, visiting the Nacpan twin beaches, or simply relaxing at the beachfront. All skill levels welcome.",
    tags: ["Island hopping", "Snorkelling", "Photography"],
    fee: "Free to join (self-funded accommodation)",
    color: "#3A2A22",
    schedule: ["Day 1: Arrive El Nido, group dinner at Las Cabañas", "Day 2: Tour C — hidden lagoons and Helicopter Island", "Day 3: Tour D — Cadlao Lagoon + Nacpan Beach"],
    meetingPoint: "El Nido Port Main Gate",
    joinedParticipants: PARTICIPANT_POOL.slice(0, 8),
  },
  {
    id: 2,
    title: "Batanes Photography Walk",
    type: "Photography",
    date: "21–23 June 2025",
    time: "5:30 AM (golden hour)",
    location: "Basco, Batanes",
    organiser: "Ana Villanueva",
    organiserAvatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=48&h=48&fit=crop&auto=format",
    participants: 12,
    maxParticipants: 15,
    img: "https://images.unsplash.com/photo-1768639400843-d604ccce9c3e?w=800&h=450&fit=crop&auto=format",
    desc: "Golden hour walks through Batan Island's most photogenic landscapes — rolling hills, stone lighthouses, Ivatan stone houses, and Valugan boulder beach.",
    longDesc: "A photography-first walkabout across Batan Island with an expert local guide. We'll hit the best vantage points for sunrise and sunset, including Naidi Hills Lighthouse, Valugan Boulder Beach, the rolling hills near Chamantad-Tinyan Viewpoint, and the stone houses of Chavayan village on Sabtang Island.\n\nAll camera types welcome — from mobile phones to DSLRs. The guide will share shooting tips specific to Batanes' unique light and landscape.",
    tags: ["Photography", "Culture", "Landscapes"],
    fee: "₱500 guide fee",
    color: "#5C8A9E",
    schedule: ["Day 1: Naidi Hills sunrise, Basco heritage walk", "Day 2: Sabtang Island day trip — Chavayan and Morong Beach", "Day 3: Valugan Boulder Beach golden hour send-off"],
    meetingPoint: "Basco Airport Arrival Area",
    joinedParticipants: PARTICIPANT_POOL.slice(2, 7),
  },
  {
    id: 3,
    title: "Banaue to Batad Trek",
    type: "Trekking",
    date: "5–7 July 2025",
    time: "6:00 AM trailhead",
    location: "Banaue, Ifugao",
    organiser: "Ramon Dela Cruz",
    organiserAvatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=48&h=48&fit=crop&auto=format",
    participants: 8,
    maxParticipants: 12,
    img: "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=800&h=450&fit=crop&auto=format",
    desc: "Guided two-day trek through the Ifugao rice terraces from Banaue to the Batad amphitheatre. Overnight homestay with an Ifugao family included.",
    longDesc: "A two-day guided trek through one of the world's great agricultural landscapes. Starting from Banaue, we'll walk through active rice terraces maintained by the Ifugao for over 2,000 years, descending into the Batad amphitheatre — a UNESCO-listed bowl of stacked terraces unlike anywhere else on Earth.\n\nOvernight stay is with a local Ifugao family in Batad village. Simple but authentic — home-cooked meals, incredible stars, and a real sense of how this community lives. Moderate fitness level required.",
    tags: ["Trekking", "Culture", "UNESCO"],
    fee: "₱1,200 (includes guide and homestay)",
    color: "#C4713A",
    schedule: ["Day 1: Banaue orientation, trailhead briefing, 4-hour trek to Batad", "Day 2: Bangaan Falls swim, terrace photography, trek out to Banaue"],
    meetingPoint: "Banaue Hotel Lobby",
    joinedParticipants: PARTICIPANT_POOL.slice(1, 5),
  },
  {
    id: 4,
    title: "Siargao Surf & Social",
    type: "Social",
    date: "28 June 2025",
    time: "6:00 AM surf session",
    location: "Cloud 9, Siargao",
    organiser: "Leila Marcos",
    organiserAvatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=48&h=48&fit=crop&auto=format",
    participants: 34,
    maxParticipants: 50,
    img: "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=800&h=450&fit=crop&auto=format",
    desc: "Morning surf session at Cloud 9 followed by a community brunch in General Luna. All levels welcome — board rentals available, lessons for beginners.",
    longDesc: "The TravelTraces Siargao social is a laid-back morning meetup at the legendary Cloud 9 break, followed by a community brunch at a local warung in General Luna.\n\nThe surf session is fully optional — beginners can watch from the famous boardwalk while the surfers paddle out. Board rentals and lessons from local instructors are available at extra cost. Brunch is the main event: good food, good people, and sharing travel stories from the community.",
    tags: ["Surfing", "Social", "Beginners welcome"],
    fee: "Free (board rental not included)",
    color: "#9E6B5C",
    schedule: ["6:00 AM: Meet at Cloud 9 boardwalk", "6:30–9:00 AM: Surf session / boardwalk watching", "9:30 AM: Community brunch at Kermit Siargao"],
    meetingPoint: "Cloud 9 Boardwalk Entrance",
    joinedParticipants: PARTICIPANT_POOL.slice(0, 10),
  },
  {
    id: 5,
    title: "Vigan Heritage Walk & Food Tour",
    type: "Cultural",
    date: "12 July 2025",
    time: "8:00 AM",
    location: "Calle Crisologo, Vigan",
    organiser: "Marco Buenaventura",
    organiserAvatar: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=48&h=48&fit=crop&auto=format",
    participants: 16,
    maxParticipants: 20,
    img: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=800&h=450&fit=crop&auto=format",
    desc: "Walking tour through Vigan's UNESCO heritage zone — Spanish colonial architecture, Ilocano weaving, and an afternoon eating our way through the city's best longganisa, bagnet, and pinakbet.",
    longDesc: "A full-day slow walk through the UNESCO-listed Calle Crisologo and the surrounding heritage zone of Vigan City. Our guide is a local historian who will share the layered colonial and indigenous history of the city.\n\nThe afternoon is a structured food crawl — we'll visit the best local producers of Ilocos longganisa, try the crunchiest bagnet in the city, and finish with a bowl of proper pinakbet before calesa rides back to the plaza.",
    tags: ["Heritage", "Food", "Architecture"],
    fee: "₱350 (includes food stops)",
    color: "#9E6B5C",
    schedule: ["8:00 AM: Calle Crisologo heritage walk with local guide", "11:00 AM: Ilocano weaving demonstration", "1:00 PM: Food tour — longganisa, bagnet, pinakbet", "4:00 PM: Calesa ride and free exploration"],
    meetingPoint: "Plaza Salcedo, Vigan City",
    joinedParticipants: PARTICIPANT_POOL.slice(3, 9),
  },
  {
    id: 6,
    title: "Hundred Islands Overnight Camp",
    type: "Adventure",
    date: "19–20 July 2025",
    time: "8:00 AM Lucap Wharf",
    location: "Alaminos, Pangasinan",
    organiser: "Sofia Reyes",
    organiserAvatar: "https://images.unsplash.com/photo-1672933278668-5be5957a8681?w=48&h=48&fit=crop&auto=format",
    participants: 28,
    maxParticipants: 40,
    img: "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=800&h=450&fit=crop&auto=format",
    desc: "Overnight camping on one of the 123 islands of Hundred Islands National Park. Kayaking, snorkelling, and stargazing well away from the lights of Luzon.",
    longDesc: "A two-day overnight camping adventure at Hundred Islands National Park — one of the most underrated parks in the Philippines. We'll take a private boat from Lucap Wharf and set up camp on Quezon Island for two days of kayaking, snorkelling, cliff jumping, and some of the best stargazing you'll find in Luzon.\n\nCamping gear is provided. The group is capped at 40 to keep it intimate. Bring your own food or join the group grocery run the evening before departure.",
    tags: ["Camping", "Kayaking", "Snorkelling"],
    fee: "₱800 (camping permit + boat)",
    color: "#3A2A22",
    schedule: ["Day 1: Lucap Wharf departure, island setup, kayaking and snorkelling", "Evening: Campfire, stargazing", "Day 2: Morning swim, island exploration, return by noon"],
    meetingPoint: "Lucap Wharf Main Terminal, Alaminos",
    joinedParticipants: PARTICIPANT_POOL.slice(0, 7),
  },
];

const types = ["All", "Adventure", "Photography", "Trekking", "Social", "Cultural"];
type EventItem = typeof EVENTS[number];

function formatStoredDate(value: string) {
  if (!value) return "Date TBD";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function formatStoredTime(value: string) {
  if (!value) return "Time TBD";
  const [hour, minute] = value.split(":");
  const date = new Date();
  date.setHours(Number(hour) || 0, Number(minute) || 0, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function hostedRecordToEvent(record: HostedTourMeetupRecord): EventItem {
  const fee = record.isPaid ? `PHP ${record.price.toLocaleString()} guided tour` : "Free to join";
  return {
    id: record.eventId,
    title: record.title,
    type: "Adventure",
    date: formatStoredDate(record.date),
    time: formatStoredTime(record.time),
    location: `${record.destinationTitle}, ${record.province}`,
    organiser: record.organizerName,
    organiserAvatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=48&h=48&fit=crop&auto=format",
    participants: 1,
    maxParticipants: 20,
    img: record.imageUrl,
    desc: record.description,
    longDesc: record.description,
    tags: ["Hosted Tour", record.isPaid ? "Ticketed" : "Meetup"],
    fee,
    color: "#12212E",
    schedule: record.description.split("\n").map((line) => line.trim()).filter(Boolean),
    meetingPoint: record.meetingPoint,
    joinedParticipants: [],
  };
}

function EventDetailModal({ event, joined, onToggleJoin, onClose }: {
  event: typeof EVENTS[0];
  joined: boolean;
  onToggleJoin: () => void;
  onClose: () => void;
}) {
  const [viewingProfile, setViewingProfile] = useState<GamifiedUser | null>(null);
  const spotsLeft = event.maxParticipants - event.participants;
  const pct = (event.participants / event.maxParticipants) * 100;
  const displayParticipants = joined
    ? [...event.joinedParticipants, { name: "You", avatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=48&h=48&fit=crop&auto=format", location: "Your location" }]
    : event.joinedParticipants;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(26,26,26,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor: "#F5F0E8", borderRadius: "0.5rem", width: "100%", maxWidth: 820, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>

        {/* Hero */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={event.img} alt={event.title} style={{ width: "100%", height: 260, objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(26,26,26,0.72) 100%)" }} />
          <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(26,26,26,0.5)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#F5F0E8" }}>
            <X size={18} />
          </button>
          <div style={{ position: "absolute", bottom: "1.25rem", left: "1.5rem" }}>
            <span style={{ padding: "0.2rem 0.6rem", backgroundColor: event.color, borderRadius: "0.2rem", fontSize: "0.7rem", fontFamily: "var(--font-label)", color: "#F5F0E8", letterSpacing: "0.08em", textTransform: "uppercase" }}>{event.type}</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 600, color: "#F5F0E8", lineHeight: 1.25, marginTop: "0.5rem", marginBottom: 0, maxWidth: 580 }}>{event.title}</h2>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ overflow: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "0" }} className="event-detail-grid">

            {/* Left column */}
            <div style={{ padding: "1.75rem 2rem", borderRight: "1px solid rgba(58,42,34,0.1)" }}>
              {/* Meta row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "1.5rem" }}>
                {[
                  [Calendar, event.date],
                  [Clock, event.time],
                  [MapPin, event.location],
                  [Tag, event.fee],
                ].map(([Icon, text], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <Icon size={14} color="#9E6B5C" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "#3A3A2A", lineHeight: 1.4 }}>{String(text)}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 600, color: "#3A2A22", marginBottom: "0.75rem" }}>About this event</h3>
                {event.longDesc.split("\n\n").map((p, i) => (
                  <p key={i} style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "#3A3A2A", lineHeight: 1.75, marginBottom: "0.875rem" }}>{p}</p>
                ))}
              </div>

              {/* Schedule */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 600, color: "#3A2A22", marginBottom: "0.875rem" }}>Schedule</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {event.schedule.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "rgba(58,42,34,0.1)", border: "2px solid #9E6B5C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <span style={{ fontFamily: "var(--font-label)", fontSize: "0.6rem", fontWeight: 700, color: "#3A2A22" }}>{i + 1}</span>
                      </div>
                      <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "#3A3A2A", lineHeight: 1.55, margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meeting point */}
              <div style={{ backgroundColor: "rgba(158,107,92,0.1)", border: "1px solid rgba(158,107,92,0.25)", borderRadius: "0.375rem", padding: "0.875rem 1rem", display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
                <MapPin size={15} color="#9E6B5C" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#9E6B5C", margin: "0 0 0.2rem" }}>Meeting Point</p>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: "#3A2A22", fontWeight: 500, margin: 0 }}>{event.meetingPoint}</p>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Organiser */}
              <div>
                <p style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.625rem" }}>Organised by</p>
                <button onClick={() => { const k = ORGANISER_KEY[event.organiser]; if (k) setViewingProfile(GAMIFIED_USERS[k]); }} style={{ display: "flex", alignItems: "center", gap: "0.625rem", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
                  <img src={event.organiserAvatar} alt={event.organiser} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <p style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.875rem", color: "#1A1A1A", margin: 0 }}>{event.organiser}</p>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "#9E6B5C", margin: 0 }}>Event Host · tap to view profile</p>
                  </div>
                </button>
              </div>

              {/* Capacity */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Users size={13} color="#6B6B5A" />
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "#4A4A3A" }}>
                      {event.participants + (joined ? 1 : 0)} / {event.maxParticipants} joined
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", color: spotsLeft <= 5 ? "#C4713A" : "#6B6B5A", fontWeight: spotsLeft <= 5 ? 600 : 400 }}>
                    {Math.max(0, spotsLeft - (joined ? 1 : 0))} spots left
                  </span>
                </div>
                <div style={{ height: 5, backgroundColor: "#D8D4C8", borderRadius: "3px" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, pct + (joined ? 3 : 0))}%`, backgroundColor: pct >= 90 ? "#C4713A" : "#9E6B5C", borderRadius: "3px", transition: "width 0.3s" }} />
                </div>
              </div>

              {/* Join button */}
              <button
                onClick={onToggleJoin}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  padding: "0.75rem", borderRadius: "0.25rem", border: "none",
                  backgroundColor: joined ? "rgba(158,107,92,0.15)" : "#3A2A22",
                  color: joined ? "#9E6B5C" : "#F5F0E8",
                  cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.85rem",
                  fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                  transition: "all 0.15s",
                }}
              >
                {joined ? <><CheckCircle2 size={16} /> Joined</> : <>Join Event <ArrowRight size={15} /></>}
              </button>

              {/* Tags */}
              <div>
                <p style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.5rem" }}>Tags</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {event.tags.map((t) => (
                    <span key={t} style={{ padding: "0.2rem 0.625rem", backgroundColor: "rgba(58,42,34,0.08)", borderRadius: "2rem", fontSize: "0.72rem", fontFamily: "var(--font-label)", color: "#3A2A22" }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Participants */}
              <div>
                <p style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.75rem" }}>
                  Who's going ({displayParticipants.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", maxHeight: 240, overflowY: "auto" }}>
                  {displayParticipants.map((p, i) => {
                    const gKey = ORGANISER_KEY[p.name];
                    return (
                      <button key={i} onClick={() => { if (gKey) setViewingProfile(GAMIFIED_USERS[gKey]); }} style={{ display: "flex", alignItems: "center", gap: "0.625rem", background: "none", border: "none", cursor: gKey ? "pointer" : "default", padding: "0.25rem", borderRadius: "0.375rem", textAlign: "left", transition: "background 0.1s" }} onMouseEnter={(e) => { if (gKey) e.currentTarget.style.backgroundColor = "#EDEAE0"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <img src={p.avatar} alt={p.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontFamily: "var(--font-ui)", fontWeight: p.name === "You" ? 700 : 500, fontSize: "0.82rem", color: p.name === "You" ? "#C4713A" : "#1A1A1A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                          <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#6B6B5A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.location}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewingProfile && <UserProfileModal user={viewingProfile} onClose={() => setViewingProfile(null)} />}

      <style>{`
        @media (max-width: 640px) {
          .event-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function EventCard({ e, joined, onToggleJoin, onClick }: {
  e: typeof EVENTS[0];
  joined: boolean;
  onToggleJoin: (id: number) => void;
  onClick: () => void;
  key?: any;
}) {
  const spotsLeft = e.maxParticipants - e.participants;
  const pct = (e.participants / e.maxParticipants) * 100;

  return (
    <article
      onClick={onClick}
      style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
      onMouseEnter={(el) => { el.currentTarget.style.transform = "translateY(-2px)"; el.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
      onMouseLeave={(el) => { el.currentTarget.style.transform = ""; el.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ position: "relative" }}>
        <img src={e.img} alt={e.title} style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "0.2rem", backgroundColor: e.color, color: "#F5F0E8", fontSize: "0.7rem", fontFamily: "var(--font-label)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {e.type}
        </div>
        {/* Participant avatars stack */}
        <div style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem", display: "flex" }}>
          {e.joinedParticipants.slice(0, 4).map((p, i) => (
            <img key={i} src={p.avatar} alt={p.name} title={p.name} style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", border: "2px solid #EDEAE0", marginLeft: i > 0 ? -8 : 0 }} />
          ))}
          {e.joinedParticipants.length > 4 && (
            <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: "#3A2A22", border: "2px solid #EDEAE0", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: -8 }}>
              <span style={{ fontFamily: "var(--font-label)", fontSize: "0.55rem", color: "#F5F0E8", fontWeight: 700 }}>+{e.joinedParticipants.length - 4}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600, color: "#3A2A22", lineHeight: 1.35, marginBottom: "0.75rem" }}>{e.title}</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.875rem" }}>
          {[
            [Calendar, e.date],
            [Clock, e.time],
            [MapPin, e.location],
          ].map(([Icon, text], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Icon size={13} color="#9E6B5C" />
              <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "#4A4A3A" }}>{String(text)}</span>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: "#6B6B5A", lineHeight: 1.6, marginBottom: "1rem", flex: 1 }}>{e.desc}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1rem" }}>
          {e.tags.map((t) => (
            <span key={t} style={{ padding: "0.15rem 0.5rem", backgroundColor: "rgba(58,42,34,0.08)", borderRadius: "2rem", fontSize: "0.7rem", fontFamily: "var(--font-label)", color: "#3A2A22", letterSpacing: "0.04em" }}>{t}</span>
          ))}
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Users size={13} color="#6B6B5A" />
              <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "#4A4A3A" }}>{e.participants} / {e.maxParticipants} joined</span>
            </div>
            <span style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", color: spotsLeft <= 5 ? "#C4713A" : "#6B6B5A", fontWeight: spotsLeft <= 5 ? 600 : 400 }}>
              {spotsLeft} spots left
            </span>
          </div>
          <div style={{ height: 4, backgroundColor: "#D8D4C8", borderRadius: "2px" }}>
            <div style={{ height: "100%", width: `${pct}%`, backgroundColor: pct >= 90 ? "#C4713A" : "#9E6B5C", borderRadius: "2px" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "#6B6B5A" }}>By {e.organiser} · </span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "#3A2A22", fontWeight: 500 }}>{e.fee}</span>
          </div>
          <button
            onClick={(ev) => { ev.stopPropagation(); onToggleJoin(e.id); }}
            style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              padding: "0.5rem 1rem", borderRadius: "0.25rem", border: "none",
              backgroundColor: joined ? "rgba(158,107,92,0.15)" : "#3A2A22",
              color: joined ? "#9E6B5C" : "#F5F0E8",
              cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.78rem",
              fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
            }}
          >
            {joined ? "Joined ✓" : "Join"}
          </button>
        </div>
      </div>
    </article>
  );
}

function EventsContent() {
  const [activeType, setActiveType] = useState("All");
  const [joined, setJoined] = useState<number[]>([]);
  const [hostFormOpen, setHostFormOpen] = useState(false);
  const [events, setEvents] = useState<EventItem[]>(() => [...listHostedTourMeetups().map(hostedRecordToEvent), ...EVENTS]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const filtered = activeType === "All" ? events : events.filter((e) => e.type === activeType);
  const hostTourPlaces = useMemo<HostTourPlace[]>(() => {
    const seen = new Set<string>();
    return events.reduce<HostTourPlace[]>((places, event) => {
      const key = event.location.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        places.push({
          location_id: event.id,
          title: event.location.split(",")[0]?.trim() || event.location,
          province: event.location.split(",").slice(1).join(",").trim() || event.location,
          imageUrl: event.img,
        });
      }
      return places;
    }, []);
  }, [events]);

  const handleJoin = (id: number) => {
    setJoined((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleHostedTourCreated = (record: HostedTourMeetupRecord) => {
    const created = hostedRecordToEvent(record);
    setEvents((current) => [created, ...current.filter((event) => event.id !== created.id)]);
    setSelectedEvent(created);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F0E8", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#9E6B5C", marginBottom: "0.5rem" }}>Meetups & adventures</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#3A2A22", marginBottom: "0.5rem" }}>Events</h1>
          <p style={{ fontFamily: "var(--font-body)", color: "#6B6B5A", fontSize: "1rem" }}>Photography walks, island-hopping trips, cultural tours, and community meetups across the archipelago.</p>
          <button
            type="button"
            onClick={() => setHostFormOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", minHeight: 44, marginTop: "1.25rem", border: "none", borderRadius: "0.25rem", backgroundColor: "#12212E", color: "#ECE7DC", padding: "0.75rem 1rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            <Plus size={16} />
            Host Tour Meetup
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          {types.map((t) => (
            <button key={t} onClick={() => setActiveType(t)} style={{ padding: "0.6rem 1rem", borderRadius: "0.25rem", border: "1px solid", borderColor: activeType === t ? "#3A2A22" : "rgba(58,42,34,0.2)", backgroundColor: activeType === t ? "#3A2A22" : "transparent", color: activeType === t ? "#F5F0E8" : "#3A2A22", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 500, letterSpacing: "0.05em" }}>
              {t}
            </button>
          ))}
        </div>

        {joined.length > 0 && (
          <div style={{ backgroundColor: "rgba(158,107,92,0.12)", border: "1px solid rgba(158,107,92,0.3)", borderRadius: "0.25rem", padding: "0.75rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Calendar size={16} color="#9E6B5C" />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: "#3A2A22" }}>You've joined {joined.length} event{joined.length > 1 ? "s" : ""}. Check your profile for details.</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: "1.5rem" }}>
          {filtered.map((e) => (
            <EventCard
              key={e.id}
              e={e}
              joined={joined.includes(e.id)}
              onToggleJoin={handleJoin}
              onClick={() => setSelectedEvent(e)}
            />
          ))}
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          joined={joined.includes(selectedEvent.id)}
          onToggleJoin={() => handleJoin(selectedEvent.id)}
          onClose={() => setSelectedEvent(null)}
        />
      )}
      {hostFormOpen && <HostTourMeetupForm places={hostTourPlaces} onClose={() => setHostFormOpen(false)} onCreated={handleHostedTourCreated} />}
    </div>
  );
}

export default function EventsPage() {
  return (
    <GatedPage featureName="Events and meetups">
      <EventsContent />
    </GatedPage>
  );
}
