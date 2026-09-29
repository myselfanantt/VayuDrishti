"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, ResponsiveContainer } from "recharts";
import { FEATURE_DISPLAY_NAMES } from "@/lib/constants";
import type { SHAPFeature } from "@/lib/types";

interface SHAPWaterfallChartProps {
  features: SHAPFeature[] | any;
  baseValue?: number;
  predictedValue?: number;
  height?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const valNum = typeof d.value === "number" ? d.value : 0;
  return (
    <div className="tooltip" style={{ position: "relative", background: "#fff", border: "1px solid #DADCE0", padding: "8px 12px", borderRadius: 6 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.displayName}</div>
      <div style={{ fontSize: 12 }}>
        SHAP: <span style={{ fontFamily: "Roboto Mono", color: d.color }}>{d.direction === "positive" ? "+" : ""}{valNum.toFixed(4)}</span>
      </div>
      {d.description && <div style={{ fontSize: 11, color: "#9AA0A6", marginTop: 2 }}>{d.description}</div>}
    </div>
  );
};

export default function SHAPWaterfallChart({
  features,
  baseValue = 0.5,
  predictedValue,
  height = 280,
}: SHAPWaterfallChartProps) {
  const featureList: any[] = Array.isArray(features)
    ? features
    : Array.isArray((features as any)?.top_drivers)
    ? (features as any).top_drivers
    : [];

  if (featureList.length === 0) return null;

  const chartData = featureList.slice(0, 8).map((f: any) => {
    const featName = f.feature ?? f.meteorological_label ?? "Feature";
    const shapVal = typeof f.shap_value === "number" ? f.shap_value : typeof f.magnitude === "number" ? f.magnitude : 0;
    const isPos = f.direction === "positive" || shapVal > 0;
    return {
      feature: featName,
      displayName: f.meteorological_label ?? FEATURE_DISPLAY_NAMES[featName] ?? featName.replace(/_/g, " "),
      value: isPos ? Math.abs(shapVal) : -Math.abs(shapVal),
      direction: isPos ? "positive" : "negative",
      magnitude: Math.abs(shapVal),
      description: f.description ?? "",
      color: isPos ? "#EA4335" : "#34A853",
    };
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 11, color: "#9AA0A6" }}>Base value </span>
          <span style={{ fontFamily: "Roboto Mono", fontWeight: 600, fontSize: 13, color: "#5F6368" }}>
            {(baseValue * 100).toFixed(1)}%
          </span>
        </div>
        {predictedValue !== undefined && (
          <>
            <span style={{ color: "#DADCE0" }}>→</span>
            <div>
              <span style={{ fontSize: 11, color: "#9AA0A6" }}>Predicted </span>
              <span style={{ fontFamily: "Roboto Mono", fontWeight: 700, fontSize: 15, color: "#EA4335" }}>
                {(predictedValue * 100).toFixed(1)}%
              </span>
            </div>
          </>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 140 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#9AA0A6", fontFamily: "Roboto Mono" }}
            tickFormatter={(v) => (typeof v === "number" ? v.toFixed(2) : String(v ?? ""))}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            tick={{ fontSize: 11, fill: "#5F6368" }}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8F9FA" }} />
          <ReferenceLine x={0} stroke="#DADCE0" strokeWidth={1} />
          <Bar dataKey="value" radius={3} maxBarSize={18}>
            {chartData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#EA4335" }} />
          <span style={{ color: "#5F6368" }}>Increases bust risk</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#34A853" }} />
          <span style={{ color: "#5F6368" }}>Decreases bust risk</span>
        </div>
      </div>
    </div>
  );
}
