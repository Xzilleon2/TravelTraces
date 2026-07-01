import { useState } from "react";
import { Search, HelpCircle, Compass, ShieldAlert, Award } from "lucide-react";
import { PublicEditorialShell } from "../components/PublicEditorialShell";

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
    <PublicEditorialShell
      eyebrow="Support centre"
      title="Help Centre"
      subtitle="Find answers about pins, levels, stories, subscriptions, and travelling across Southeast Asia with TravelTraces."
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ position: "relative", maxWidth: 560, margin: "0 auto 3.5rem" }}>
            <Search size={16} color="#9E6B5C" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guides, answers, categories…"
              className="public-input"
              style={{ paddingLeft: "2.65rem" }}
            />
          </div>

        {/* Guides List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {filtered.map((topicBlock) => (
            <div key={topicBlock.topic}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", borderBottom: "1px solid rgba(58,42,34,0.14)", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
                <topicBlock.icon size={16} color="#9E6B5C" />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", fontWeight: 500, color: "#2C211C", margin: 0, textTransform: "uppercase" }}>{topicBlock.topic}</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {topicBlock.items.map((item, id) => (
                  <div key={id} className="public-card" style={{ padding: "1.35rem" }}>
                    <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.08rem", fontWeight: 500, color: "#2C211C", margin: "0 0 0.5rem", display: "flex", gap: "0.55rem", lineHeight: 1.25 }}>
                      <HelpCircle size={15} color="#9E6B5C" style={{ marginTop: 2, flexShrink: 0 }} /> {item.q}
                    </h4>
                    <p className="public-muted" style={{ fontSize: "0.95rem", margin: 0, paddingLeft: "1.5rem" }}>{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <p className="public-muted" style={{ fontSize: "1rem" }}>No help guides found matching your query.</p>
            </div>
          )}
        </div>
      </div>
    </PublicEditorialShell>
  );
}
