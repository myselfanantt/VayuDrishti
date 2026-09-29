"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { RegionDriver } from "@/lib/types";

interface RegionalDriversChartProps {
  drivers: RegionDriver[];
}

export default function RegionalDriversChart({ drivers }: RegionalDriversChartProps) {
  if (!drivers || drivers.length === 0) return null;

  const chartData = drivers.map((d) => ({
    feature: d.meteorological_label,
    shap: d.direction === "positive" ? d.avg_shap : -d.avg_shap,
    color: d.direction === "positive" ? "#7C4DFF" : "#34A853",
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
        Dominant Forecast Bust Drivers For This Region
      </h3>
      <div style={{ fontSize: 12, color: "#5F6368", marginBottom: 16 }}>
        Based on 5-year aggregated SHAP analysis of forecast errors in this region.
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 160 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#9AA0A6", fontFamily: "Roboto Mono" }} />
          <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: "#5F6368" }} width={160} />
          <Tooltip
            formatter={(val: any, name: string) => [
              typeof val === "number" ? `+${Math.abs(val).toFixed(2)}` : String(val ?? ""),
              name ?? "Avg SHAP",
            ]}
          />
          <Bar dataKey="shap" radius={3} maxBarSize={18}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
