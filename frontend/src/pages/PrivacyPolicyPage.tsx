export default function PrivacyPolicyPage() {
  return (
    <div style={{ backgroundColor: "#F5F0E8", minHeight: "100vh", padding: "4rem 1.5rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 600, color: "#2D4A2D", marginBottom: "1.5rem" }}>Privacy Policy</h1>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "#6B6B5A", marginBottom: "2rem" }}>Last Updated: June 9, 2026</p>

        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "#3A3A2A", lineHeight: 1.8 }} className="legal-content">
          <p style={{ marginBottom: "1.25rem" }}>
            At TravelTraces under TravelTraces Travel Co., we take your personal data privacy very seriously. This documentation outlines how we collect, store, and process your coordinates, user profiles, maps, and travel accounts.
          </p>

          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#2D4A2D", marginTop: "2rem", marginBottom: "0.75rem" }}>1. Information We Collect</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            We collect standard credential variables needed for managing accounts (name, email, password hashes), and geographic coordinates for destination pins you explicitly drop. We do not extract cellular triangulation or automatic GPS streams without clear click permissions.
          </p>

          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#2D4A2D", marginTop: "2rem", marginBottom: "0.75rem" }}>2. Storage & Encryption</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            All passwords are encrypted with industry-standard hashing before cloud replication. Travel map databases and custom photos added on folders are protected under encryption parameters.
          </p>

          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#2D4A2D", marginTop: "2rem", marginBottom: "0.75rem" }}>3. Data Deletion</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            You maintain absolute rights over your travel diaries. You can click 'Delete Account' at any time inside settings, which will instantly purge all pins, custom maps, photos, and messages from our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
