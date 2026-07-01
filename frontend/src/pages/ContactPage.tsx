import React, { useState } from "react";
import { Send, MapPin, Mail, Phone, Check } from "lucide-react";
import { PublicEditorialShell } from "../components/PublicEditorialShell";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSent(true);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <PublicEditorialShell
      eyebrow="Reach out"
      title="Contact"
      subtitle="Questions about Southeast Asia routes, story publishing, map pins, partnerships, or pricing? Send the TravelTraces team a note."
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem" }} className="contact-grid">

          {/* Contact form */}
          <div className="public-card" style={{ padding: "clamp(1.5rem, 4vw, 2.5rem)" }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "rgba(158,107,92,0.15)", color: "#9E6B5C", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                  <Check size={22} />
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 500, color: "#2C211C", marginBottom: "0.5rem", textTransform: "uppercase" }}>Message sent successfully</h3>
                <p className="public-muted" style={{ fontSize: "0.95rem", margin: 0 }}>
                  Thank you for writing to us. Our core team will respond to your email within 24 hours.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="public-button"
                  style={{ marginTop: "1.5rem" }}
                >
                  Write another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E6B5C", marginBottom: "0.4rem" }}>Full Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="public-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E6B5C", marginBottom: "0.4rem" }}>Email Address</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="public-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E6B5C", marginBottom: "0.4rem" }}>Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="public-input"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="billing">Subscription / Billing</option>
                    <option value="map">Suggesting Destination Pin</option>
                    <option value="abuse">Report User / Abuse</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E6B5C", marginBottom: "0.4rem" }}>How can we help you?</label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here…"
                    rows={4}
                    className="public-input"
                    style={{ fontFamily: "var(--font-body)", resize: "none", lineHeight: 1.6 }}
                  />
                </div>
                <button
                  type="submit"
                  className="public-button"
                >
                  <Send size={13} /> Send Message
                </button>
              </form>
            )}
          </div>

          {/* Info details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 500, color: "#2C211C", marginBottom: "1rem", textTransform: "uppercase" }}>Direct Contacts</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { icon: Mail, label: "Email", val: "guild@traveltraces.app" },
                  { icon: Phone, label: "Phone Support", val: "+63 (2) 8945 1205" },
                  { icon: MapPin, label: "Southeast Asia Desk", val: "Built in the Philippines, serving travellers across Southeast Asia" },
                ].map((item, i) => (
                  <div key={i} className="public-card" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "1rem" }}>
                    <item.icon size={15} color="#9E6B5C" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: "var(--font-label)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E6B5C" }}>{item.label}</div>
                      <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.9rem", fontWeight: 500, color: "#2C211C", lineHeight: 1.5 }}>{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="public-card-dark" style={{ padding: "1.5rem" }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 500, color: "#FBF7F0", marginBottom: "0.5rem", textTransform: "uppercase" }}>Emergency guidelines</h4>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "rgba(251,247,240,0.76)", lineHeight: 1.65, margin: 0 }}>
                If you are currently on a trail or island and require direct survival help, please prioritize government local rescue channels (NDRRMC helpline: 911) rather than dispatching a message to the TravelTraces board.
              </p>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
      `}</style>
    </PublicEditorialShell>
  );
}
