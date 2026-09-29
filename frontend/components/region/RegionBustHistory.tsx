"use client";
import { useRouter } from "next/navigation";
import type { RegionBustEvent } from "@/lib/types";

interface RegionBustHistoryProps {
  events: RegionBustEvent[];
}

export default function RegionBustHistory({ events }: RegionBustHistoryProps) {
  const router = useRouter();

  if (!events || events.length === 0) return null;

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
        Bust Event History — This Region
      </h3>
      <div
        style={{
          maxHeight: 320,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {events.map((ev) => {
          const prob = Math.round(ev.bust_probability * 100);
          return (
            <div
              key={ev.bust_id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: 6,
                border: "1px solid #F1F3F4",
                background: "#F8F9FA",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#202124", fontFamily: "Roboto Mono, monospace" }}>
                  {ev.date}
                </span>
                <span style={{ fontSize: 12, color: "#1A73E8", fontWeight: 500 }}>
                  Day {ev.lead_day}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: prob >= 80 ? "#EA4335" : "#FBBC04", fontFamily: "Roboto Mono" }}>
                  {prob}% prob
                </span>
              </div>

              <button
                onClick={() => router.push(`/explain/${ev.bust_id}`)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#1A73E8",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                → Explain
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
