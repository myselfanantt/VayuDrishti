"use client";

interface MetricStatCardProps {
  label: string;
  value: string | number;
  delta: string;
  isPositiveGood?: boolean;
  subtext?: string;
  borderColor?: string;
}

export default function MetricStatCard({
  label,
  value,
  delta,
  isPositiveGood = true,
  subtext = "vs last period",
  borderColor = "#1A73E8",
}: MetricStatCardProps) {
  const isPositive = delta.startsWith("+") || delta.startsWith("▲");
  const deltaColor = isPositive
    ? isPositiveGood ? "#34A853" : "#EA4335"
    : isPositiveGood ? "#EA4335" : "#34A853";

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #DADCE0",
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 8,
        padding: "16px 20px",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, color: "#5F6368", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#202124", margin: "6px 0", fontFamily: "Roboto Mono, monospace" }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span style={{ color: deltaColor, fontWeight: 600, fontFamily: "Roboto Mono, monospace" }}>
          {delta}
        </span>
        <span style={{ color: "#9AA0A6" }}>{subtext}</span>
      </div>
    </div>
  );
}
