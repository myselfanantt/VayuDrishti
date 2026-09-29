"use client";
import type { ExplainabilityResult } from "@/lib/types";

interface BustConfidenceHeaderProps {
  data: ExplainabilityResult;
}

export default function BustConfidenceHeader({ data }: BustConfidenceHeaderProps) {
  const probPercent = Math.round((data?.bust_probability ?? 0) * 100);
  const confPercent = Math.round((data?.confidence_score ?? 0) * 100);
  const regionName = data?.region ?? (data as any)?.region_name ?? "Odisha Coast";
  const tags = data?.synoptic_tags ?? ["Monsoon Depression", "Bay of Bengal"];
  const uncLow = Math.round((data?.uncertainty_low ?? 0.78) * 100);
  const uncHigh = Math.round((data?.uncertainty_high ?? 0.94) * 100);

  const formattedDate = data?.init_time
    ? (() => {
        try {
          return new Date(data.init_time).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        } catch {
          return "Latest";
        }
      })()
    : "Latest";

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #DADCE0",
        borderRadius: 8,
        padding: "16px 20px",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#202124" }}>
              {regionName}
            </h1>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#1A73E8",
                background: "#E8F0FE",
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              Lead: Day {data?.lead_day ?? 4}
            </span>
            <span style={{ fontSize: 12, color: "#5F6368" }}>
              Init: {formattedDate}
            </span>
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#7C4DFF",
                  background: "#F3E8FF",
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                [{tag}]
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* Bust Probability */}
          <div>
            <div style={{ fontSize: 11, color: "#5F6368", fontWeight: 500, marginBottom: 4 }}>
              BUST PROBABILITY
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: probPercent >= 75 ? "#EA4335" : probPercent >= 50 ? "#FBBC04" : "#34A853", fontFamily: "Roboto Mono, monospace" }}>
                {probPercent}%
              </span>
              <div style={{ width: 100, height: 8, background: "#F1F3F4", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, probPercent))}%`,
                    height: "100%",
                    background: probPercent >= 75 ? "#EA4335" : probPercent >= 50 ? "#FBBC04" : "#34A853",
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Model Confidence */}
          <div>
            <div style={{ fontSize: 11, color: "#5F6368", fontWeight: 500, marginBottom: 4 }}>
              MODEL CONFIDENCE
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#1A73E8", fontFamily: "Roboto Mono, monospace" }}>
                {confPercent}%
              </span>
              <span style={{ fontSize: 11, color: "#9AA0A6" }}>
                ({uncLow}% – {uncHigh}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
