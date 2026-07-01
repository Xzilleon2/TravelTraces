import { PublicEditorialShell } from "../components/PublicEditorialShell";

export default function PrivacyPolicyPage() {
  return (
    <PublicEditorialShell
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How TravelTraces protects account, map, profile, story, and travel data across the platform."
    >
      <div className="public-legal-card">
        <p style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#9E6B5C", margin: "0 0 2rem" }}>Last Updated: June 9, 2026</p>

        <div className="legal-content">
          <p style={{ marginBottom: "1.25rem" }}>
            At TravelTraces under TravelTraces Travel Co., we take your personal data privacy very seriously. This documentation outlines how we collect, store, and process your coordinates, user profiles, maps, and travel accounts.
          </p>

          <h3>1. Information We Collect</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            We collect standard credential variables needed for managing accounts (name, email, password hashes), and geographic coordinates for destination pins you explicitly drop. We do not extract cellular triangulation or automatic GPS streams without clear click permissions.
          </p>

          <h3>2. Storage & Encryption</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            All passwords are encrypted with industry-standard hashing before cloud replication. Travel map databases and custom photos added on folders are protected under encryption parameters.
          </p>

          <h3>3. Data Deletion</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            You maintain absolute rights over your travel diaries. You can click 'Delete Account' at any time inside settings, which will instantly purge all pins, custom maps, photos, and messages from our servers.
          </p>
        </div>
      </div>
    </PublicEditorialShell>
  );
}
