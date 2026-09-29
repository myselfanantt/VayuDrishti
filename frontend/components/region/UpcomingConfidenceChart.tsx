"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Line } from "recharts";

interface UpcomingConfidenceChartProps {
  data?: {
    lead_days: number[];
    confidence: number[];
    uncertainty_low: number[];
    uncertainty_high: number[];
  };
}

export default function UpcomingConfidenceChart({ data }: UpcomingConfidenceChartProps) {
  if (!data || !data.lead_days) return null;

  const chartData = data.lead_days.map((day, i) => ({
    day: `Day ${day}`,
    confidence: data.confidence[i] * 100,
    low: data.uncertainty_low[i] * 100,
    high: data.uncertainty_high[i] * 100,
    band: [data.uncertainty_low[i] * 100, data.uncertainty_high[i] * 100],
  }));

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
      <h3 style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 700, color: "#202124" }}>
        Upcoming Confidence — Day 1 to Day 10
      </h3>
      <div style={{ fontSize: 12, color: "#5F6368", marginBottom: 16 }}>
        Model confidence score trajectory across lead days. Shaded band indicates uncertainty bounds.
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9AA0A6" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9AA0A6", fontFamily: "Roboto Mono" }} unit="%" />
          <Tooltip
            formatter={(val: any, name: string) => [
              Array.isArray(val)
                ? `${Number(val[0]).toFixed(1)}% – ${Number(val[1]).toFixed(1)}%`
                : typeof val === "number"
                ? `${val.toFixed(1)}%`
                : String(val ?? ""),
              name ?? "Value",
            ]}
          />
          <ReferenceLine y={50} stroke="#EA4335" strokeDasharray="4 4" label={{ value: "50% Confidence Threshold", fill: "#EA4335", fontSize: 11, position: "top" }} />
          <Area type="monotone" dataKey="band" stroke="none" fill="#1A73E8" fillOpacity={0.15} name="Uncertainty Range" />
          <Line type="monotone" dataKey="confidence" stroke="#1A73E8" strokeWidth={2.5} dot={{ fill: "#1A73E8", r: 4 }} name="Confidence Score" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
