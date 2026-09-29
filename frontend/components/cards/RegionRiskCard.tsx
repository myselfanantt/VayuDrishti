"use client";
import { RISK_COLORS, RISK_BG_COLORS, RISK_TEXT_COLORS } from "@/lib/constants";
import type { RegionRisk } from "@/lib/types";

export default function RegionRiskCard({ region }: { region: RegionRisk }) {
  const riskColor = RISK_COLORS[region.risk_level];
  const riskBg = RISK_BG_COLORS[region.risk_level];
  const riskText = RISK_TEXT_COLORS[region.risk_level];

  return (
    <div
      style={{
        padding: "12px 14px",
        borderLeft: `3px solid ${riskColor}`,
        borderRadius: 6,
        background: riskBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#202124" }}>
          {region.region_name}
        </div>
        <div style={{ fontSize: 11, color: "#5F6368", marginTop: 2 }}>
          {region.state} · Hit rate: {(region.historical_hit_rate * 100).toFixed(0)}%
        </div>
        {region.affected_lead_days.length > 0 && (
          <div style={{ fontSize: 11, color: "#5F6368", marginTop: 2 }}>
            Risk on Days: {region.affected_lead_days.slice(0, 5).join(", ")}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontFamily: "Roboto Mono, monospace",
            fontSize: 20,
            fontWeight: 700,
            color: riskColor,
          }}
        >
          {(region.bust_probability * 100).toFixed(0)}%
        </div>
        <div
          style={{
            marginTop: 3,
            padding: "2px 8px",
            background: "#fff",
            border: `1px solid ${riskColor}`,
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
            color: riskText,
          }}
        >
          {region.risk_level}
        </div>
      </div>
    </div>
  );
}
