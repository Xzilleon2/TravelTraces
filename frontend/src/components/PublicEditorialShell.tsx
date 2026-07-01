import { ReactNode } from "react";

const HERO_IMG = "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=1600&h=720&fit=crop&auto=format";

export function PublicEditorialShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="public-editorial-shell" style={{ backgroundColor: "#FBF7F0", minHeight: "100vh", color: "#2C211C" }}>
      <section className="public-hero" style={{ position: "relative", minHeight: 420, display: "grid", placeItems: "center", textAlign: "center", overflow: "hidden", padding: "4.5rem 1.5rem" }}>
        <img src={HERO_IMG} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(72,42,20,0.32), rgba(44,33,28,0.66))" }} />
        <div style={{ position: "absolute", inset: "12%", border: "1px solid rgba(251,247,240,0.2)" }} />
        <div style={{ position: "relative", zIndex: 1, width: "min(100%, 760px)", color: "#FBF7F0" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "1rem" }}>{eyebrow}</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.6rem, 7vw, 5rem)", fontWeight: 500, lineHeight: 0.98, textTransform: "uppercase", margin: 0 }}>{title}</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "1.05rem", lineHeight: 1.65, color: "rgba(251,247,240,0.84)", maxWidth: 620, margin: "1.25rem auto 0" }}>{subtitle}</p>
        </div>
      </section>
      <div className="public-page-body" style={{ maxWidth: 1120, margin: "0 auto", padding: "5rem 1.5rem" }}>
        {children}
      </div>
      <style>{`
        .public-editorial-shell * { box-sizing: border-box; }
        .public-hero img { filter: sepia(0.12) saturate(0.92); }
        .public-page-kicker {
          margin: 0 0 0.75rem;
          font-family: var(--font-label);
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #9E6B5C;
        }
        .public-page-title {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 4rem);
          line-height: 0.98;
          font-weight: 500;
          letter-spacing: 0;
          text-transform: uppercase;
          color: #2C211C;
        }
        .public-card {
          background: #EFE7DC;
          border: 1px solid rgba(58,42,34,0.12);
          box-shadow: 0 18px 50px rgba(44,33,28,0.08);
        }
        .public-card-dark {
          background: #3A2A22;
          color: #FBF7F0;
          border: 1px solid rgba(251,247,240,0.12);
          box-shadow: 0 18px 50px rgba(44,33,28,0.16);
        }
        .public-input {
          width: 100%;
          min-height: 46px;
          padding: 0.85rem 1rem;
          background: #FBF7F0;
          border: 1px solid rgba(58,42,34,0.16);
          border-radius: 0;
          color: #2C211C;
          font-family: var(--font-ui);
          font-size: 0.94rem;
          outline: none;
        }
        .public-input:focus {
          border-color: rgba(158,107,92,0.75);
          box-shadow: 0 0 0 3px rgba(158,107,92,0.1);
        }
        .public-button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          border-radius: 999px;
          border: 1px solid currentColor;
          background: #3A2A22;
          color: #FBF7F0;
          padding: 0.72rem 1.35rem;
          font-family: var(--font-label);
          font-size: 0.73rem;
          font-weight: 700;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .public-button.secondary {
          background: transparent;
          color: #3A2A22;
        }
        .public-muted {
          font-family: var(--font-body);
          color: #5B4A40;
          line-height: 1.7;
        }
        .public-legal-card {
          max-width: 760px;
          margin: 0 auto;
          padding: clamp(1.5rem, 4vw, 2.5rem);
          background: #EFE7DC;
          border: 1px solid rgba(58,42,34,0.12);
          box-shadow: 0 18px 50px rgba(44,33,28,0.08);
        }
        .public-legal-card h3 {
          margin: 2rem 0 0.75rem;
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 500;
          line-height: 1.1;
          color: #2C211C;
          text-transform: uppercase;
        }
        .public-legal-card p {
          font-family: var(--font-body);
          color: #5B4A40;
          font-size: 0.98rem;
          line-height: 1.8;
        }
        @media (max-width: 720px) {
          .public-page-body { padding: 3.5rem 1rem !important; }
          .public-hero { min-height: 360px !important; }
        }
      `}</style>
    </div>
  );
}
