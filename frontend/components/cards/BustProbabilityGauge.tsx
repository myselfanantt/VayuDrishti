"use client";
import React from "react";

interface BustProbabilityGaugeProps {
  probability: number; // 0.0 to 1.0
  confidenceInterval?: [number, number]; // [lower, upper] e.g. [0.65, 0.88]
  size?: number; // width & height in px
}

export default function BustProbabilityGauge({
  probability,
  confidenceInterval,
  size = 180,
}: BustProbabilityGaugeProps) {
  const clampedProb = Math.min(1, Math.max(0, probability));
  const percent = Math.round(clampedProb * 100);

  // SVG Gauge calculations
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle gauge
  const strokeDashoffset = circumference - (clampedProb * circumference);

  // Color dynamic logic
  let color = "#34A853"; // Green (Low)
  let statusText = "LOW RISK";
  if (percent >= 75) {
    color = "#EA4335"; // Red (High)
    statusText = "HIGH RISK";
  } else if (percent >= 45) {
    color = "#FF6D00"; // Orange (Moderate)
    statusText = "MODERATE RISK";
  } else if (percent >= 25) {
    color = "#FBBC04"; // Yellow (Elevated)
    statusText = "ELEVATED RISK";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: size }}>
      <div style={{ position: "relative", width: size, height: size / 2 + 10 }}>
        <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
          {/* Background Arc */}
          <path
            d={`M ${strokeWidth / 2}, ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#E8EAED"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active Arc */}
          <path
            d={`M ${strokeWidth / 2}, ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease-in-out, stroke 0.3s ease" }}
          />
        </svg>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "Roboto Mono", color: "#202124", lineHeight: 1 }}>
            {percent}%
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 0.8, marginTop: 4 }}>
            {statusText}
          </div>
        </div>
      </div>

      {confidenceInterval && (
        <div style={{ fontSize: 11, color: "#5F6368", marginTop: 8, fontFamily: "Roboto Mono" }}>
          90% CI: {Math.round(confidenceInterval[0] * 100)}% – {Math.round(confidenceInterval[1] * 100)}%
        </div>
      )}
    </div>
  );
}
