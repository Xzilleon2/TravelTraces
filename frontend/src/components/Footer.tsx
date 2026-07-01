import { NavLink } from "react-router";

export function Footer() {
  return (
    <footer style={{ position: "relative", overflow: "hidden", backgroundColor: "#2C211C", color: "rgba(251,247,240,0.72)", fontFamily: "var(--font-ui)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "4.5rem 1.5rem 2rem", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1.35fr) repeat(3, minmax(150px, 0.7fr))", gap: "clamp(1.75rem, 4vw, 3.5rem)", marginBottom: "3rem" }} className="footer-grid">
          <div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2.1rem)", fontWeight: 600, color: "#FBF7F0", letterSpacing: "0.16em", textTransform: "uppercase" }}>TravelTraces</span>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.75, maxWidth: 320, marginTop: "1.1rem" }}>
              Trace Southeast Asia one journey at a time, from island towns and heritage streets to mountain routes and food trails.
            </p>
          </div>

          <div>
            <h4 style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#CFA68A", marginBottom: "1rem" }}>Platform</h4>
            {["/explore", "/stories", "/map", "/community", "/events"].map((to, i) => (
              <NavLink key={to} to={to} style={{ display: "block", color: "rgba(251,247,240,0.68)", textDecoration: "none", fontSize: "0.9rem", marginBottom: "0.65rem" }}>
                {["Explore", "Stories", "Map", "Community", "Events"][i]}
              </NavLink>
            ))}
          </div>

          <div>
            <h4 style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#CFA68A", marginBottom: "1rem" }}>Company</h4>
            {["/about", "/contact", "/help"].map((to, i) => (
              <NavLink key={to} to={to} style={{ display: "block", color: "rgba(251,247,240,0.68)", textDecoration: "none", fontSize: "0.9rem", marginBottom: "0.65rem" }}>
                {["About TravelTraces", "Contact", "Help Centre"][i]}
              </NavLink>
            ))}
          </div>

          <div>
            <h4 style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#CFA68A", marginBottom: "1rem" }}>Legal</h4>
            {["/privacy", "/terms"].map((to, i) => (
              <NavLink key={to} to={to} style={{ display: "block", color: "rgba(251,247,240,0.68)", textDecoration: "none", fontSize: "0.9rem", marginBottom: "0.65rem" }}>
                {["Privacy Policy", "Terms of Service"][i]}
              </NavLink>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(251,247,240,0.12)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.8rem" }}>2026 TravelTraces. Built with love for the Travelers.</p>
          <p style={{ fontSize: "0.8rem", fontFamily: "var(--font-label)", letterSpacing: "0.05em" }}>Made in the Philippines</p>
        </div>
      </div>
      <style>{`
        @media (max-width: 820px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
