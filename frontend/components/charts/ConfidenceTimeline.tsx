"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Legend,
} from "recharts";
import type { LeadTimeConfidence } from "@/lib/types";

interface ConfidenceTimelineProps {
  data: LeadTimeConfidence[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip" style={{ position: "relative" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Day {label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ color: "#9AA0A6" }}>{p.name}:</span>
          <span style={{ fontFamily: "Roboto Mono", fontWeight: 600 }}>
            {(p.value * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ConfidenceTimeline({ data, height = 220 }: ConfidenceTimelineProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="skeleton" style={{ width: "90%", height: height - 40, borderRadius: 6 }} />
      </div>
    );
  }

  const chartData = data.map((d) => ({
    day: d.lead_day,
    bustProbability: Math.round(d.bust_probability * 1000) / 1000,
    confidenceLow: Math.round(d.uncertainty_low * 1000) / 1000,
    confidenceHigh: Math.round(d.uncertainty_high * 1000) / 1000,
    meanConfidence: Math.round(d.mean_confidence * 1000) / 1000,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="bustGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EA4335" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#EA4335" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="uncertGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#1A73E8" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "#9AA0A6", fontFamily: "Roboto Mono" }}
          tickFormatter={(v) => `D${v}`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 1]}
          tick={{ fontSize: 11, fill: "#9AA0A6", fontFamily: "Roboto Mono" }}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0.55} stroke="#FBBC04" strokeDasharray="4 3" strokeWidth={1} />
        <ReferenceLine y={0.75} stroke="#EA4335" strokeDasharray="4 3" strokeWidth={1} />
        {/* Uncertainty band (CI) */}
        <Area
          type="monotone"
          dataKey="confidenceHigh"
          stroke="none"
          fill="url(#uncertGradient)"
          name="CI High"
          legendType="none"
        />
        <Area
          type="monotone"
          dataKey="confidenceLow"
          stroke="none"
          fill="#fff"
          name="CI Low"
          legendType="none"
        />
        {/* Bust probability */}
        <Area
          type="monotone"
          dataKey="bustProbability"
          stroke="#EA4335"
          strokeWidth={2}
          fill="url(#bustGradient)"
          name="Bust Probability"
          dot={{ fill: "#EA4335", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#EA4335" }}
        />
        {/* Mean confidence */}
        <Area
          type="monotone"
          dataKey="meanConfidence"
          stroke="#1A73E8"
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="5 3"
          name="Confidence Score"
          dot={false}
        />
        <Legend
          iconType="line"
          wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
