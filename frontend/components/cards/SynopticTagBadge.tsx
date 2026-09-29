"use client";
import { SYNOPTIC_LABELS, SYNOPTIC_COLORS } from "@/lib/constants";

interface SynopticTagBadgeProps {
  regime: string;
  size?: "sm" | "md";
}

export default function SynopticTagBadge({ regime, size = "md" }: SynopticTagBadgeProps) {
  const label = SYNOPTIC_LABELS[regime] ?? regime.replace(/_/g, " ");
  const color = SYNOPTIC_COLORS[regime] ?? "#5F6368";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: size === "sm" ? "2px 8px" : "3px 10px",
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 4,
        color,
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: size === "sm" ? 6 : 7,
          height: size === "sm" ? 6 : 7,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
