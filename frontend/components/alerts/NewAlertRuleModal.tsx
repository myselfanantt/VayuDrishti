"use client";
import { useState } from "react";
import type { AlertSeverity } from "@/lib/types";

interface NewAlertRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (rule: {
    region_id: string;
    threshold: number;
    lead_day_max: number;
    notify_channels: string[];
  }) => void;
}

export default function NewAlertRuleModal({ isOpen, onClose, onCreate }: NewAlertRuleModalProps) {
  const [regionId, setRegionId] = useState("all_india");
  const [threshold, setThreshold] = useState(80);
  const [leadDayMax, setLeadDayMax] = useState(3);
  const [channels, setChannels] = useState<string[]>(["dashboard", "email"]);

  if (!isOpen) return null;

  const severity: AlertSeverity = threshold >= 80 ? "CRITICAL" : threshold >= 60 ? "HIGH" : "MODERATE";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      region_id: regionId,
      threshold,
      lead_day_max: leadDayMax,
      notify_channels: channels,
    });
    onClose();
  };

  const toggleChannel = (ch: string) => {
    if (channels.includes(ch)) {
      setChannels(channels.filter((c) => c !== ch));
    } else {
      setChannels([...channels, ch]);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 8,
          width: 440,
          maxWidth: "90%",
          padding: 24,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#202124" }}>
          Create New Alert Rule
        </h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5F6368", display: "block", marginBottom: 6 }}>
              Target Region
            </label>
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #DADCE0",
                fontSize: 13,
              }}
            >
              <option value="all_india">All India</option>
              <option value="odisha_coast">Odisha Coast</option>
              <option value="kerala">Kerala Coast</option>
              <option value="uttarakhand">Uttarakhand</option>
              <option value="rajasthan">Rajasthan Desert</option>
              <option value="bob_coast">Bay of Bengal Coast</option>
            </select>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#5F6368", marginBottom: 6 }}>
              <span>Probability Threshold</span>
              <span style={{ color: "#1A73E8", fontFamily: "Roboto Mono" }}>{threshold}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#5F6368", marginBottom: 6 }}>
              <span>Max Lead Day (≤)</span>
              <span style={{ fontFamily: "Roboto Mono" }}>Day {leadDayMax}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={leadDayMax}
              onChange={(e) => setLeadDayMax(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#5F6368" }}>Auto-Computed Severity: </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: severity === "CRITICAL" ? "#EA4335" : severity === "HIGH" ? "#FBBC04" : "#1A73E8",
                marginLeft: 4,
              }}
            >
              {severity}
            </span>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5F6368", display: "block", marginBottom: 6 }}>
              Notification Channels
            </label>
            <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={channels.includes("dashboard")}
                  onChange={() => toggleChannel("dashboard")}
                />
                Dashboard
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={channels.includes("email")}
                  onChange={() => toggleChannel("email")}
                />
                Email
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={channels.includes("sms")}
                  onChange={() => toggleChannel("sms")}
                />
                SMS
              </label>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #DADCE0",
                background: "#FFFFFF",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: "#1A73E8",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Create Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
