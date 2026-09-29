"use client";
import type { ModelVersion } from "@/lib/types";

interface ModelVersionTableProps {
  versions: ModelVersion[];
}

export default function ModelVersionTable({ versions }: ModelVersionTableProps) {
  if (!versions || versions.length === 0) return null;

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #DADCE0",
        borderRadius: 8,
        padding: "16px 20px",
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 700, color: "#202124" }}>
        Model Version History
      </h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #DADCE0", color: "#5F6368" }}>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Version</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Trained Period</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>AUC-ROC</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Brier Score</th>
              <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>Release Date</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((ver, idx) => {
              const isCurrent = idx === versions.length - 1;
              return (
                <tr
                  key={ver.version}
                  style={{
                    borderBottom: "1px solid #F1F3F4",
                    borderLeft: isCurrent ? "4px solid #1A73E8" : "none",
                    background: isCurrent ? "#F8F9FA" : "transparent",
                  }}
                >
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#202124" }}>
                    {ver.version} {isCurrent && <span style={{ fontSize: 10, color: "#1A73E8", background: "#E8F0FE", padding: "1px 6px", borderRadius: 4, marginLeft: 6 }}>Active</span>}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#5F6368" }}>{ver.trained_period}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "Roboto Mono, monospace", fontWeight: 600, color: "#34A853" }}>
                    {ver.auc.toFixed(3)}
                  </td>
                  <td style={{ padding: "10px 12px", fontFamily: "Roboto Mono, monospace", color: "#5F6368" }}>
                    {ver.brier_score.toFixed(3)}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#9AA0A6" }}>{ver.released_at}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
