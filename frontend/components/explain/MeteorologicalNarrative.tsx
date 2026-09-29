"use client";

interface MeteorologicalNarrativeProps {
  narrative: string;
}

export default function MeteorologicalNarrative({ narrative }: MeteorologicalNarrativeProps) {
  // Highlight meteorological key phrases with accent-indigo underline/text
  const keyTerms = [
    "vorticity anomaly",
    "850hPa vorticity",
    "monsoon depression",
    "high CAPE",
    "sea surface temperature",
    "30-day model bias",
    "low pressure",
    "bay of bengal",
    "cyclonic circulation",
    "easterly wind shear",
    "precipitable water anomaly",
  ];

  const renderNarrativeWithHighlights = (text: string) => {
    let parts: { text: string; isHighlight: boolean }[] = [{ text, isHighlight: false }];

    keyTerms.forEach((term) => {
      const nextParts: typeof parts = [];
      parts.forEach((part) => {
        if (part.isHighlight) {
          nextParts.push(part);
          return;
        }
        const regex = new RegExp(`(${term})`, "gi");
        const subParts = part.text.split(regex);
        subParts.forEach((sub) => {
          if (sub.toLowerCase() === term.toLowerCase()) {
            nextParts.push({ text: sub, isHighlight: true });
          } else if (sub) {
            nextParts.push({ text: sub, isHighlight: false });
          }
        });
      });
      parts = nextParts;
    });

    return parts.map((p, idx) =>
      p.isHighlight ? (
        <span
          key={idx}
          style={{
            color: "#7C4DFF",
            fontWeight: 600,
            textDecoration: "underline",
            textDecorationColor: "#7C4DFF",
            textUnderlineOffset: 3,
          }}
        >
          {p.text}
        </span>
      ) : (
        <span key={idx}>{p.text}</span>
      )
    );
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #DADCE0",
        borderRadius: 8,
        padding: "16px 20px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 700, color: "#202124" }}>
        Meteorological Narrative
      </h3>
      <div style={{ fontSize: 13, color: "#5F6368", lineHeight: 1.6, flex: 1 }}>
        {renderNarrativeWithHighlights(narrative)}
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px stroke #F1F3F4", fontSize: 11, color: "#9AA0A6" }}>
        Generated automatically from SHAP feature contributions & synoptic pattern matching.
      </div>
    </div>
  );
}
