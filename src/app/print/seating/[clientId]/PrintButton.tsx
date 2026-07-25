"use client";

export function PrintButton() {
  return (
    <div className="print:hidden" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
      <button
        onClick={() => window.print()}
        style={{
          background: "#1c1917",
          color: "#fff",
          border: "none",
          borderRadius: "9999px",
          padding: "0.65rem 1.5rem",
          fontSize: "0.85rem",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
