"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RISK_COLORS, RISK_BG_COLORS, RISK_TEXT_COLORS } from "@/lib/constants";
import SynopticTagBadge from "./SynopticTagBadge";
import type { BustDetection } from "@/lib/types";

interface BustEventCardProps {
  bust: BustDetection;
  index?: number;
}

export default function BustEventCard({ bust, index = 0 }: BustEventCardProps) {
  const router = useRouter();
  const riskColor = RISK_COLORS[bust.severity] ?? "#FBBC04";
  const riskBg = RISK_BG_COLORS[bust.severity] ?? "#FEF9E7";
  const riskText = RISK_TEXT_COLORS[bust.severity] ?? "#8A6914";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      onClick={() => router.push(`/explain/${bust.id}`)}
      style={{
        background: "#fff",
        border: "1px solid #DADCE0",
        borderLeft: `3px solid ${riskColor}`,
        borderRadius: 6,
        padding: "12px 14px",
        cursor: "pointer",
        transition: "box-shadow 0.15s",
      }}
      whileHover={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#202124" }}>
              {bust.region_name}
            </span>
            <span
              className="risk-badge"
              style={{
                background: riskBg,
                borderLeftColor: riskColor,
                color: riskText,
              }}
            >
              {bust.severity}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#5F6368", marginTop: 4 }}>
            Day {bust.lead_day} forecast · {bust.lat.toFixed(1)}°N, {bust.lon.toFixed(1)}°E
          </div>
          {bust.synoptic_regime && (
            <div style={{ marginTop: 6 }}>
              <SynopticTagBadge regime={bust.synoptic_regime} size="sm" />
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "Roboto Mono, monospace",
              fontSize: 22,
              fontWeight: 700,
              color: riskColor,
              lineHeight: 1,
            }}
          >
            {(bust.bust_probability * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: 10, color: "#9AA0A6", marginTop: 2 }}>bust prob.</div>
          <div style={{ fontSize: 11, color: "#5F6368", marginTop: 4, fontFamily: "Roboto Mono, monospace" }}>
            CI: {((bust.uncertainty_low ?? bust.bust_probability * 0.9) * 100).toFixed(0)}–
            {((bust.uncertainty_high ?? bust.bust_probability * 1.05) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: "1px solid #F1F3F4",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#9AA0A6" }}>Confidence:</span>
          <div
            style={{
              width: 60,
              height: 4,
              borderRadius: 2,
              background: "#F1F3F4",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${bust.confidence_score * 100}%`,
                height: "100%",
                background: "#1A73E8",
                borderRadius: 2,
              }}
            />
          </div>
          <span
            style={{ fontSize: 11, fontFamily: "Roboto Mono, monospace", color: "#1A73E8" }}
          >
            {(bust.confidence_score * 100).toFixed(0)}%
          </span>
        </div>
        <span style={{ fontSize: 11, color: "#1A73E8", fontWeight: 500 }}>
          Explain →
        </span>
      </div>
    </motion.div>
  );
}
