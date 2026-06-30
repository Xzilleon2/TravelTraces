export default function TermsOfServicePage() {
  return (
    <div style={{ backgroundColor: "#F5F0E8", minHeight: "100vh", padding: "4rem 1.5rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 600, color: "#2D4A2D", marginBottom: "1.5rem" }}>Terms of Service</h1>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "#6B6B5A", marginBottom: "2rem" }}>Last Updated: June 9, 2026</p>

        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "#3A3A2A", lineHeight: 1.8 }}>
          <p style={{ marginBottom: "1.25rem" }}>
            Welcome to TravelTraces. By accessing our platform, coordinates, databases, and companion matches, you agree to comply with these terms.
          </p>

          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#2D4A2D", marginTop: "2rem", marginBottom: "0.75rem" }}>1. Account Registration</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            You must provide accurate credentials when creating an account. You are solely responsible for keeping your password secret and managing actions taken under your explorer profile.
          </p>

          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#2D4A2D", marginTop: "2rem", marginBottom: "0.75rem" }}>2. Code of Honor</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            TravelTraces is built on slow, honorable travel. You are forbidden from: dropping malicious fake pins design, abusing match partners, plagiarizing others' stories, or posting commercial links to vacation resorts without clearance coordinates. We maintain administrative triggers to deactivate reports violating safety codes.
          </p>

          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#2D4A2D", marginTop: "2rem", marginBottom: "0.75rem" }}>3. Intellectual Rights</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            All paragraphs, photos, and albums you submit are yours to keep. By submitting diaries to TravelTraces public lists, you grant us an open license to display them to other members.
          </p>
        </div>
      </div>
    </div>
  );
}
