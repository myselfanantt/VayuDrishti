"use client";
import { useRouter } from "next/navigation";
import type { ActiveAlert } from "@/lib/types";

interface ActiveAlertListProps {
  alerts: ActiveAlert[];
  onAcknowledge: (alertId: string) => void;
}

export default function ActiveAlertList({ alerts, onAcknowledge }: ActiveAlertListProps) {
  const router = useRouter();

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return { borderColor: "#EA4335", bg: "#FFF0EF", color: "#EA4335" };
      case "HIGH":
        return { borderColor: "#FBBC04", bg: "#FFF8E1", color: "#B07D00" };
      default:
        return { borderColor: "#1A73E8", bg: "#E8F0FE", color: "#1A73E8" };
    }
  };

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#202124" }}>
          Active Alerts (Live WebSocket Feed)
        </h3>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#34A853" }}>● LIVE</span>
      </div>

      {alerts.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "#9AA0A6", fontSize: 13 }}>
          No active unacknowledged alerts.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);
            const probPct = Math.round(alert.bust_probability * 100);

            return (
              <div
                key={alert.alert_id}
                style={{
                  background: style.bg,
                  borderLeft: `4px solid ${style.borderColor}`,
                  borderTop: "1px solid #DADCE0",
                  borderRight: "1px solid #DADCE0",
                  borderBottom: "1px solid #DADCE0",
                  borderRadius: 6,
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: style.color, textTransform: "uppercase" }}>
                      [{alert.severity}]
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#202124" }}>
                      {alert.region}
                    </span>
                    <span style={{ fontSize: 12, color: "#5F6368" }}>
                      Day {alert.lead_day} bust prob <strong style={{ fontFamily: "Roboto Mono", color: style.borderColor }}>{probPct}%</strong>
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#9AA0A6", marginTop: 4 }}>
                    Issued: {alert.issued_at}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onAcknowledge(alert.alert_id)}
                    style={{
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 4,
                      border: "1px solid #DADCE0",
                      background: "#FFFFFF",
                      color: "#5F6368",
                      cursor: "pointer",
                    }}
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => router.push(`/explain/${alert.bust_id}`)}
                    style={{
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 4,
                      border: "none",
                      background: "#1A73E8",
                      color: "#FFFFFF",
                      cursor: "pointer",
                    }}
                  >
                    → Explain
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
