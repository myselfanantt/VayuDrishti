"use client";
import type { RegionDetail } from "@/lib/types";

interface RegionHeaderProps {
  detail: RegionDetail;
}

export default function RegionHeader({ detail }: RegionHeaderProps) {
  const getRiskStyle = (level: string) => {
    switch (level) {
      case "CRITICAL": return { color: "#EA4335", bg: "#FFF0EF" };
      case "HIGH": return { color: "#B07D00", bg: "#FFF8E1" };
      default: return { color: "#1A73E8", bg: "#E8F0FE" };
    }
  };

  const riskStyle = getRiskStyle(detail.current_risk_level);

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
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#202124" }}>
              {detail.name}
            </h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: riskStyle.color,
                background: riskStyle.bg,
                borderLeft: `3px solid ${riskStyle.color}`,
                padding: "3px 8px",
                borderRadius: 4,
              }}
            >
              [{detail.current_risk_level}] RISK
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#5F6368" }}>
            Risk Zone: <strong>{detail.zone}</strong> | Districts Covered: <strong>{detail.district_count}</strong>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#9AA0A6", fontWeight: 500 }}>
            5-YEAR BUST RATE
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#202124", fontFamily: "Roboto Mono, monospace" }}>
            {detail.bust_rate_5yr.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
