import { useState } from "react";
import { Search, HelpCircle, ChevronRight, BookOpen, Compass, ShieldAlert, Award } from "lucide-react";

const HELPS = [
  {
    topic: "Account & XP",
    icon: Award,
    items: [
      { q: "How do I earn experience points (XP)?", a: "You earn XP through basic platform activities: writing a detailed travel narrative (+500 XP), dropping a pin (+200 XP), adding matches with companion routes (+150 XP), or responding on discussions (+50 XP)." },
      { q: "What do the explorer titles mean?", a: "Titles symbolize your total experience. Levels 1-4 are 'Scouts', 5-8 are 'Veterans', 9-12 are 'Sentinels', and 13+ represent 'Archipelago Guardians'." },
    ],
  },
  {
    topic: "Mapping Travels",
    icon: Compass,
    items: [
      { q: "Is there a limit to how many pins I can drop?", a: "On the Free plan, you can pin up to 30 destinations. Upgrading to Explorer or Pathfinder removes this ceiling entirely, letting you catalog all 7,641 islands." },
      { q: "Can I make joint maps with other explorers?", a: "You can compare your pins by visiting any user's profile card or viewing companion matches directly on the map sidebar." },
    ],
  },
  {
    topic: "Subscriptions",
    icon: ShieldAlert,
    items: [
      { q: "How are fees billed?", a: "Subscriptions are billed on a monthly cycle. You can change plans or cancel recurring charges anytime through your profile panel easily." },
      { q: "Can I get a refund?", a: "If you made an accidental subscription purchase, you are eligible for a full refund within 7 days. Drop us a message on the Contact page." },
    ],
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");

  const filtered = HELPS.map((hObj) => {
    const matchedItems = hObj.items.filter((item) => item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase()));
    return { ...hObj, items: matchedItems };
  }).filter((hObj) => hObj.items.length > 0);

  return (
    <div style={{ backgroundColor: "#F5F0E8", minHeight: "100vh", padding: "4rem 1.5rem" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.75rem" }}>Support centre</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 600, color: "#2D4A2D", marginBottom: "1rem" }}>Help & Guides</h1>
          <p style={{ fontFamily: "var(--font-body)", color: "#6B6B5A", fontSize: "1.05rem", maxWidth: 540, margin: "0 auto", lineHeight: 1.7 }}>
            Find answers to frequently asked questions about pins, levels, and subscriptions.
          </p>

          {/* Search bar */}
          <div style={{ position: "relative", maxWidth: 500, margin: "2.5rem auto 0" }}>
            <Search size={16} color="#6B6B5A" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guides, answers, categories…"
              style={{ width: "100%", padding: "0.85rem 1rem 0.85rem 2.6rem", backgroundColor: "#EDEAE0", border: "1px solid rgba(45,74,45,0.15)", borderRadius: "0.375rem", fontSize: "0.95rem", color: "#1A1A1A", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Guides List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {filtered.map((topicBlock) => (
            <div key={topicBlock.topic}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1.5px solid rgba(45,74,45,0.1)", paddingBottom: "0.5rem", marginBottom: "1.25rem" }}>
                <topicBlock.icon size={16} color="#2D4A2D" />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 600, color: "#2D4A2D", margin: 0 }}>{topicBlock.topic}</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {topicBlock.items.map((item, id) => (
                  <div key={id} style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", padding: "1.25rem" }}>
                    <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 600, color: "#1A1A1A", margin: "0 0 0.5rem", display: "flex", gap: "0.5rem" }}>
                      <HelpCircle size={15} color="#7A9E6F" style={{ marginTop: 2, flexShrink: 0 }} /> {item.q}
                    </h4>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.925rem", color: "#6B6B5A", lineHeight: 1.65, margin: 0, paddingLeft: "1.5rem" }}>{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "1rem", color: "#6B6B5A" }}>No help guides found matching your query.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
