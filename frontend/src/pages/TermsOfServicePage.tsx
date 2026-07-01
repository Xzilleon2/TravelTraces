import { PublicEditorialShell } from "../components/PublicEditorialShell";

export default function TermsOfServicePage() {
  return (
    <PublicEditorialShell
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="The shared rules that keep TravelTraces useful, respectful, and safe for travellers."
    >
      <div className="public-legal-card">
        <p style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#9E6B5C", margin: "0 0 2rem" }}>Last Updated: June 9, 2026</p>

        <div>
          <p style={{ marginBottom: "1.25rem" }}>
            Welcome to TravelTraces. By accessing our platform, coordinates, databases, and companion matches, you agree to comply with these terms.
          </p>

          <h3>1. Account Registration</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            You must provide accurate credentials when creating an account. You are solely responsible for keeping your password secret and managing actions taken under your explorer profile.
          </p>

          <h3>2. Code of Honor</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            TravelTraces is built on slow, honorable travel. You are forbidden from: dropping malicious fake pins design, abusing match partners, plagiarizing others' stories, or posting commercial links to vacation resorts without clearance coordinates. We maintain administrative triggers to deactivate reports violating safety codes.
          </p>

          <h3>3. Intellectual Rights</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            All paragraphs, photos, and albums you submit are yours to keep. By submitting diaries to TravelTraces public lists, you grant us an open license to display them to other members.
          </p>
        </div>
      </div>
    </PublicEditorialShell>
  );
}
