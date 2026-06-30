import { NavLink } from "react-router";
import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer style={{ backgroundColor: "#1A2E1A", color: "rgba(245,240,232,0.7)", fontFamily: "var(--font-ui)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 1.5rem 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "2rem", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <div style={{ width: 28, height: 28, backgroundColor: "#C4713A", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={14} color="#F5F0E8" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#F5F0E8" }}>TravelTraces</span>
            </div>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.6, maxWidth: 200 }}>
              Document the Philippines, one footstep at a time. 7,641 islands · Endless stories.
            </p>
          </div>

          <div>
            <h4 style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#F5F0E8", marginBottom: "1rem" }}>Platform</h4>
            {["/explore", "/stories", "/map", "/community", "/events"].map((to, i) => (
              <NavLink key={to} to={to} style={{ display: "block", color: "rgba(245,240,232,0.65)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                {["Explore", "Stories", "Map", "Community", "Events"][i]}
              </NavLink>
            ))}
          </div>

          <div>
            <h4 style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#F5F0E8", marginBottom: "1rem" }}>Company</h4>
            {["/about", "/contact", "/help"].map((to, i) => (
              <NavLink key={to} to={to} style={{ display: "block", color: "rgba(245,240,232,0.65)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                {["About TravelTraces", "Contact", "Help Centre"][i]}
              </NavLink>
            ))}
          </div>

          <div>
            <h4 style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#F5F0E8", marginBottom: "1rem" }}>Legal</h4>
            {["/privacy", "/terms"].map((to, i) => (
              <NavLink key={to} to={to} style={{ display: "block", color: "rgba(245,240,232,0.65)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                {["Privacy Policy", "Terms of Service"][i]}
              </NavLink>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(245,240,232,0.1)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.8rem" }}>© 2025 TravelTraces. Built with love for the Filipino traveller.</p>
          <p style={{ fontSize: "0.8rem", fontFamily: "var(--font-label)", letterSpacing: "0.05em" }}>🇵🇭 Made in the Philippines</p>
        </div>
      </div>
    </footer>
  );
}
