interface Props {
  title: string | null | undefined;
  content: string;
  titleEn?: string | null;
  contentEn?: string | null;
  lang?: "ID" | "EN";
  primaryColor?: string;
  bgColor?: string;
  textColor?: string;
  fontBody?: string;
}

export function AttentionSection({
  title,
  content,
  titleEn,
  contentEn,
  lang = "ID",
  primaryColor = "#b8860b",
  bgColor = "#fffdf7",
  textColor = "#3d3d3d",
  fontBody = "Lato",
}: Props) {
  const resolvedContent = lang === "EN" && contentEn ? contentEn : content;
  const resolvedTitle = lang === "EN" && titleEn ? titleEn : title;

  if (!resolvedContent) return null;

  const label = resolvedTitle?.trim() || "Attention";

  return (
    <section style={{ padding: "2.5rem 1.25rem", background: bgColor }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div
          style={{
            border: `1px solid ${primaryColor}35`,
            borderRadius: "16px",
            padding: "1.75rem 1.5rem",
            background: `${primaryColor}06`,
          }}
        >
          <p
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: primaryColor,
              fontFamily: "Georgia, serif",
              marginBottom: "1.25rem",
            }}
          >
            {label}
          </p>
          <div
            className="attention-content"
            style={{
              color: textColor,
              fontFamily: `'${fontBody}', sans-serif`,
              fontSize: "1rem",
              lineHeight: 1.8,
            }}
            dangerouslySetInnerHTML={{ __html: resolvedContent }}
          />
        </div>
      </div>
      <style>{`
        .attention-content p { margin-bottom: 0.85rem; }
        .attention-content p:last-child { margin-bottom: 0; }
        .attention-content strong { font-weight: 700; }
        .attention-content ul { list-style: none; padding: 0; margin: 0; }
        .attention-content li { margin-bottom: 0.85rem; }
        .attention-content li:last-child { margin-bottom: 0; }
      `}</style>
    </section>
  );
}
