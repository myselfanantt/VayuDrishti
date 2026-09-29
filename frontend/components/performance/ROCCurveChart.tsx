"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

interface ROCCurveChartProps {
  data?: { fpr: number[]; tpr: number[]; auc: number };
}

export default function ROCCurveChart({ data }: ROCCurveChartProps) {
  if (!data || !data.fpr) return null;

  const chartData = data.fpr.map((f, i) => ({
    fpr: f,
    tpr: data.tpr[i],
    random: f,
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
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#202124" }}>
          ROC Curve
        </h3>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1A73E8", fontFamily: "Roboto Mono, monospace" }}>
          AUC = {data.auc.toFixed(3)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" />
          <XAxis dataKey="fpr" tick={{ fontSize: 10, fill: "#9AA0A6", fontFamily: "Roboto Mono" }} label={{ value: "False Positive Rate", position: "bottom", offset: 5, fontSize: 11, fill: "#5F6368" }} />
          <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: "#9AA0A6", fontFamily: "Roboto Mono" }} label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", fontSize: 11, fill: "#5F6368" }} />
          <Tooltip
            formatter={(val: any, name: string) => [
              typeof val === "number" ? val.toFixed(3) : String(val ?? ""),
              name ?? "Value",
            ]}
          />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#DADCE0" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="tpr" stroke="#1A73E8" strokeWidth={2} fill="#1A73E8" fillOpacity={0.15} name="ROC" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
