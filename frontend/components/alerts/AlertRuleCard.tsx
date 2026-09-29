"use client";
import type { AlertRule } from "@/lib/types";

interface AlertRuleCardProps {
  rule: AlertRule;
  onDelete: (ruleId: string) => void;
}

export default function AlertRuleCard({ rule, onDelete }: AlertRuleCardProps) {
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "CRITICAL": return "#EA4335";
      case "HIGH": return "#FBBC04";
      default: return "#1A73E8";
    }
  };

  const color = getSeverityColor(rule.severity);

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #DADCE0",
        borderLeft: `4px solid ${color}`,
        borderRadius: 6,
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#202124" }}>
          Region: {rule.region_name} | Threshold ≥ {rule.threshold}%
        </div>
        <div style={{ fontSize: 12, color: "#5F6368", marginTop: 2 }}>
          Lead Day ≤ {rule.lead_day_max} | Severity: <strong style={{ color }}>{rule.severity}</strong> | Notify: {rule.notify_channels.join(", ")}
        </div>
      </div>
      <button
        onClick={() => onDelete(rule.rule_id)}
        style={{
          background: "transparent",
          border: "none",
          color: "#EA4335",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Delete
      </button>
    </div>
  );
}
