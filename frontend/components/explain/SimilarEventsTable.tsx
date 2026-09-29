"use client";
import { useRouter } from "next/navigation";
import type { AddendumSimilarEvent } from "@/lib/types";

interface SimilarEventsTableProps {
  events: AddendumSimilarEvent[] | any[];
}

export default function SimilarEventsTable({ events }: SimilarEventsTableProps) {
  const router = useRouter();

  const eventList = Array.isArray(events) ? events : [];
  if (eventList.length === 0) return null;

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
      <h3 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 700, color: "#202124" }}>
        Similar Past Events
      </h3>
      <div style={{ fontSize: 12, color: "#5F6368", marginBottom: 12 }}>
        Historical events where similar synoptic and thermodynamic feature patterns occurred.
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #DADCE0", color: "#5F6368" }}>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Date</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Event Name</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Region</th>
              <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>Bust MAE</th>
            </tr>
          </thead>
          <tbody>
            {eventList.map((ev, idx) => {
              const date = ev.date ?? ev.event_date ?? "2026-09-28";
              const name = ev.event_name ?? ev.synoptic_regime ?? "Monsoon Depression";
              const reg = ev.region ?? ev.region_name ?? "Odisha Coast";
              const mae = ev.bust_mae ?? 45;

              return (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid #F1F3F4",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8F9FA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => router.push(`/regions/${encodeURIComponent(reg)}`)}
                >
                  <td style={{ padding: "10px 12px", color: "#202124", fontFamily: "Roboto Mono, monospace" }}>
                    {date}
                  </td>
                  <td style={{ padding: "10px 12px", fontWeight: 500, color: "#1A73E8" }}>
                    {name}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#5F6368" }}>
                    {reg}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "Roboto Mono, monospace", fontWeight: 600, color: "#EA4335" }}>
                    {mae} mm
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
