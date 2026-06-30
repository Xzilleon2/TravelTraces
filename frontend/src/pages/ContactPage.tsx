import React, { useState } from "react";
import { Send, MapPin, Mail, Phone, Check } from "lucide-react";

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
    <div style={{ backgroundColor: "#F5F0E8", minHeight: "100vh", padding: "4rem 1.5rem" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.75rem" }}>Reach out</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 600, color: "#2D4A2D", marginBottom: "1rem" }}>Contact us</h1>
          <p style={{ fontFamily: "var(--font-body)", color: "#6B6B5A", fontSize: "1.05rem", maxWidth: 540, margin: "0 auto", lineHeight: 1.7 }}>
            Have a question about guilds, suggestions for an island map, or need support on pricing? Drop us a line.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "3rem" }} className="contact-grid">

          {/* Contact form */}
          <div style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", padding: "2.5rem 2rem" }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "rgba(122,158,111,0.15)", color: "#7A9E6F", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                  <Check size={22} />
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 600, color: "#2D4A2D", marginBottom: "0.5rem" }}>Message sent successfully</h3>
                <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.9rem", color: "#6B6B5A", margin: 0 }}>
                  Thank you for writing to us. Our core team will respond to your email within 24 hours.
                </p>
                <button
                  onClick={() => setSent(false)}
                  style={{
                    backgroundColor: "#2D4A2D", color: "#F5F0E8", border: "none",
                    padding: "0.6rem 1.5rem", borderRadius: "0.25rem", cursor: "pointer",
                    fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 600,
                    letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "1.5rem",
                  }}
                >
                  Write another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.4rem" }}>Full Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#F5F0E8", border: "1px solid rgba(45,74,45,0.15)", borderRadius: "0.25rem", color: "#1A1A1A", fontSize: "0.9rem", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.4rem" }}>Email Address</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#F5F0E8", border: "1px solid rgba(45,74,45,0.15)", borderRadius: "0.25rem", color: "#1A1A1A", fontSize: "0.9rem", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.4rem" }}>Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#F5F0E8", border: "1px solid rgba(45,74,45,0.15)", borderRadius: "0.25rem", color: "#1A1A1A", fontSize: "0.9rem", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="general">General Inquiry</option>
                    <option value="billing">Subscription / Billing</option>
                    <option value="map">Suggesting Destination Pin</option>
                    <option value="abuse">Report User / Abuse</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.4rem" }}>How can we help you?</label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here…"
                    rows={4}
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#F5F0E8", border: "1px solid rgba(45,74,45,0.15)", borderRadius: "0.25rem", color: "#1A1A1A", fontSize: "0.9rem", fontFamily: "var(--font-body)", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#2D4A2D", color: "#F5F0E8", border: "none",
                    padding: "0.85rem", borderRadius: "0.25rem", cursor: "pointer",
                    fontFamily: "var(--font-label)", fontSize: "0.80rem", fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  }}
                >
                  <Send size={13} /> Send Message
                </button>
              </form>
            )}
          </div>

          {/* Info details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#2D4A2D", marginBottom: "1rem" }}>Direct Contacts</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { icon: Mail, label: "Email", val: "guild@traveltraces.app" },
                  { icon: Phone, label: "Phone Support", val: "+63 (2) 8945 1205" },
                  { icon: MapPin, label: "Registry Headquarters", val: "A. Bonifacio Dr, Ermita, Manila, 1000 Metro Manila" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <item.icon size={15} color="#7A9E6F" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: "var(--font-label)", fontSize: "0.6rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "#9A9A8A" }}>{item.label}</div>
                      <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", fontWeight: 500, color: "#1A1A1A", lineHeight: 1.5 }}>{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", padding: "1.5rem" }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: "#2D4A2D", marginBottom: "0.5rem" }}>Emergency guidelines</h4>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#6B6B5A", lineHeight: 1.6, margin: 0 }}>
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
    </div>
  );
}
