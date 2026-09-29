"use client";
import { RISK_COLORS } from "@/lib/constants";

interface BustProbabilityGaugeProps {
  probability: number;
  confidence: number;
  region: string;
  size?: number;
}

export default function BustProbabilityGauge({
  probability, confidence, region, size = 120,
}: BustProbabilityGaugeProps) {
  const severity = probability >= 0.75 ? "CRITICAL" : probability >= 0.55 ? "HIGH" : probability >= 0.3 ? "MODERATE" : "LOW";
  const color = RISK_COLORS[severity];
  const angle = -135 + probability * 270;
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleDeg: number) {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: centerX + radius * Math.cos(angleRad), y: centerY + radius * Math.sin(angleRad) };
  }

  function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const large = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
  }

  const needleTip = polarToCartesian(cx, cy, r - 8, angle);

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size}>
        {/* Background arc */}
        <path d={arcPath(cx, cy, r, -135, 135)} stroke="#F1F3F4" strokeWidth={10} fill="none" strokeLinecap="round" />
        {/* Value arc */}
        <path d={arcPath(cx, cy, r, -135, -135 + probability * 270)} stroke={color} strokeWidth={10} fill="none" strokeLinecap="round" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="#202124" strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill="#202124" />
        {/* Center text */}
        <text x={cx} y={cy + r / 2} textAnchor="middle" style={{ fontFamily: "Roboto Mono", fontSize: 16, fontWeight: 700, fill: color }}>
          {(probability * 100).toFixed(0)}%
        </text>
      </svg>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#5F6368", marginTop: -4 }}>{region}</div>
    </div>
  );
}
