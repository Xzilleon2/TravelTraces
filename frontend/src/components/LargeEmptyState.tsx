type LargeEmptyStateProps = {
  title: string;
  copy: string;
};

export function LargeEmptyState({ title, copy }: LargeEmptyStateProps) {
  return (
    <div
      role="status"
      style={{
        border: "1px dashed rgba(58, 42, 34, 0.2)",
        backgroundColor: "rgb(255, 249, 240)",
        borderRadius: "0.5rem",
        padding: "clamp(2rem, 5vw, 4rem)",
        textAlign: "center",
        boxShadow: "rgba(58, 42, 34, 0.06) 0px 18px 42px",
      }}
    >
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 600, lineHeight: 1.05, color: "#3A2A22" }}>{title}</h2>
      <p style={{ margin: "1rem auto 0", maxWidth: 560, fontFamily: "var(--font-body)", fontSize: "1.05rem", lineHeight: 1.8, color: "#5B4A40" }}>{copy}</p>
    </div>
  );
}