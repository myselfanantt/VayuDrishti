"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AlertVolumeChartProps {
  data: { date: string; critical: number; high: number; moderate: number }[];
}

export default function AlertVolumeChart({ data }: AlertVolumeChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #DADCE0",
        borderRadius: 8,
        padding: "16px 20px",
      }}
    >
      <h3 style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 700, color: "#202124" }}>
        Alert Volume (Last 30 Days)
      </h3>
      <div style={{ fontSize: 12, color: "#5F6368", marginBottom: 12 }}>
        Daily alert counts stacked by severity tier.
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9AA0A6" }} />
          <YAxis tick={{ fontSize: 10, fill: "#9AA0A6", fontFamily: "Roboto Mono" }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="critical" stackId="a" fill="#EA4335" name="Critical" />
          <Bar dataKey="high" stackId="a" fill="#FBBC04" name="High" />
          <Bar dataKey="moderate" stackId="a" fill="#1A73E8" name="Moderate" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
