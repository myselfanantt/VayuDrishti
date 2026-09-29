"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import type { ReliabilityData } from "@/lib/types";

interface ReliabilityDiagramProps {
  data: ReliabilityData;
}

export default function ReliabilityDiagram({ data }: ReliabilityDiagramProps) {
  if (!data || !data.forecast_prob_bins) return null;

  const chartData = data.forecast_prob_bins.map((bin, i) => ({
    forecast: bin * 100,
    observed: (data.observed_frequency[i] ?? 0) * 100,
    perfect: bin * 100,
  }));

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #DADCE0",
        borderRadius: 8,
        padding: "16px 20px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#202124" }}>
            Model Reliability — "Should I trust this?"
          </h3>
          <div style={{ fontSize: 12, color: "#5F6368", marginTop: 2 }}>
            Historical calibration curve for this region. Perfect calibration = dashed line.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, textAlign: "right" }}>
          <div>
            <span style={{ fontSize: 11, color: "#9AA0A6" }}>Hit Rate</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#34A853", fontFamily: "Roboto Mono, monospace" }}>
              {Math.round(data.hit_rate * 100)}%
            </div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#9AA0A6" }}>False Alarm</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#EA4335", fontFamily: "Roboto Mono, monospace" }}>
              {Math.round(data.false_alarm_rate * 100)}%
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" />
          <XAxis
            dataKey="forecast"
            unit="%"
            tick={{ fontSize: 11, fill: "#9AA0A6", fontFamily: "Roboto Mono" }}
            label={{ value: "Forecast Probability", position: "bottom", offset: 5, fontSize: 11, fill: "#5F6368" }}
          />
          <YAxis
            unit="%"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#9AA0A6", fontFamily: "Roboto Mono" }}
            label={{ value: "Observed Frequency", angle: -90, position: "insideLeft", fontSize: 11, fill: "#5F6368" }}
          />
          <Tooltip
            formatter={(val: any, name: string) => [
              typeof val === "number" ? `${val.toFixed(1)}%` : String(val ?? ""),
              name ?? "Value",
            ]}
          />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="#DADCE0" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="observed" stroke="#1A73E8" strokeWidth={2.5} dot={{ fill: "#1A73E8", r: 4 }} name="Observed" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
