"use client";
import { useState } from "react";
import type { AlertHistoryItem } from "@/lib/types";

interface AlertHistoryTableProps {
  history: AlertHistoryItem[];
  onFilterChange: (filters: { region?: string; severity?: string }) => void;
}

export default function AlertHistoryTable({ history, onFilterChange }: AlertHistoryTableProps) {
  const [regionFilter, setRegionFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const handleRegionChange = (val: string) => {
    setRegionFilter(val);
    onFilterChange({ region: val || undefined, severity: severityFilter || undefined });
  };

  const handleSeverityChange = (val: string) => {
    setSeverityFilter(val);
    onFilterChange({ region: regionFilter || undefined, severity: val || undefined });
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case "bust_confirmed":
        return <span style={{ color: "#34A853", fontWeight: 700 }}>Bust ✓</span>;
      case "false_alarm":
        return <span style={{ color: "#EA4335", fontWeight: 700 }}>Miss ✗</span>;
      default:
        return <span style={{ color: "#FBBC04", fontWeight: 600 }}>Pending</span>;
    }
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #DADCE0",
        borderRadius: 8,
        padding: "16px 20px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#202124" }}>
          Alert History — Last 30 Days
        </h3>
        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={regionFilter}
            onChange={(e) => handleRegionChange(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #DADCE0", fontSize: 12 }}
          >
            <option value="">All Regions</option>
            <option value="Odisha">Odisha</option>
            <option value="Kerala">Kerala</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Uttarakhand">Uttarakhand</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => handleSeverityChange(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #DADCE0", fontSize: 12 }}
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MODERATE">MODERATE</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #DADCE0", color: "#5F6368" }}>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Date</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Region</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Prob</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Severity</th>
              <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.alert_id} style={{ borderBottom: "1px solid #F1F3F4" }}>
                <td style={{ padding: "10px 12px", fontFamily: "Roboto Mono, monospace", color: "#5F6368" }}>{item.date}</td>
                <td style={{ padding: "10px 12px", fontWeight: 500, color: "#202124" }}>{item.region}</td>
                <td style={{ padding: "10px 12px", fontFamily: "Roboto Mono, monospace", fontWeight: 600 }}>
                  {Math.round(item.bust_probability * 100)}%
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: item.severity === "CRITICAL" ? "#EA4335" : item.severity === "HIGH" ? "#B07D00" : "#1A73E8",
                    }}
                  >
                    {item.severity}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>{getOutcomeBadge(item.outcome)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
