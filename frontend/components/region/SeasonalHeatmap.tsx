"use client";
import type { SeasonalPatternCell } from "@/lib/types";

interface SeasonalHeatmapProps {
  data: SeasonalPatternCell[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function SeasonalHeatmap({ data }: SeasonalHeatmapProps) {
  if (!data || data.length === 0) return null;

  // Build 10 rows (lead day 1..10) x 12 cols (months 1..12) lookup table
  const matrix: Record<string, number> = {};
  data.forEach((cell) => {
    matrix[`${cell.lead_day}-${cell.month}`] = cell.avg_bust_prob;
  });

  const getColor = (prob: number) => {
    if (prob >= 0.4) return "#EA4335"; // critical high bust risk
    if (prob >= 0.25) return "#FBBC04"; // moderate risk
    if (prob >= 0.15) return "#1A73E8"; // low risk
    return "#F1F3F4"; // normal
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #DADCE0",
        borderRadius: 8,
        padding: "16px 20px",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#202124" }}>
          Seasonal Bust Pattern
        </h3>
        <div style={{ display: "flex", gap: 8, fontSize: 10 }}>
          <span style={{ color: "#5F6368" }}>Low</span>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: "#F1F3F4" }} />
          <div style={{ width: 12, height: 12, borderRadius: 2, background: "#1A73E8" }} />
          <div style={{ width: 12, height: 12, borderRadius: 2, background: "#FBBC04" }} />
          <div style={{ width: 12, height: 12, borderRadius: 2, background: "#EA4335" }} />
          <span style={{ color: "#5F6368" }}>High Risk</span>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 320 }}>
          {/* Header Row: Months */}
          <div style={{ display: "grid", gridTemplateColumns: "50px repeat(12, 1fr)", gap: 3, marginBottom: 4 }}>
            <div />
            {MONTHS.map((m) => (
              <div key={m} style={{ fontSize: 10, fontWeight: 600, color: "#5F6368", textAlign: "center" }}>
                {m}
              </div>
            ))}
          </div>

          {/* Grid Rows: Lead Days 1 to 10 */}
          {Array.from({ length: 10 }, (_, i) => i + 1).map((leadDay) => (
            <div
              key={leadDay}
              style={{ display: "grid", gridTemplateColumns: "50px repeat(12, 1fr)", gap: 3, marginBottom: 3 }}
            >
              <div style={{ fontSize: 10, color: "#9AA0A6", display: "flex", alignItems: "center" }}>
                D{leadDay}
              </div>
              {Array.from({ length: 12 }, (_, j) => j + 1).map((month) => {
                const prob = matrix[`${leadDay}-${month}`] ?? 0.1;
                const color = getColor(prob);
                return (
                  <div
                    key={month}
                    title={`Day ${leadDay}, ${MONTHS[month - 1]}: Avg Bust Prob ${(prob * 100).toFixed(0)}%`}
                    style={{
                      height: 18,
                      background: color,
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
