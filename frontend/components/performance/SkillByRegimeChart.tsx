"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { RegimeSkill } from "@/lib/types";

interface SkillByRegimeChartProps {
  data: RegimeSkill[];
}

export default function SkillByRegimeChart({ data }: SkillByRegimeChartProps) {
  if (!data || data.length === 0) return null;

  const getColor = (auc: number) => {
    if (auc >= 0.88) return "#34A853";
    if (auc >= 0.82) return "#1A73E8";
    if (auc >= 0.78) return "#FBBC04";
    return "#EA4335";
  };

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
        Skill Score by Synoptic Regime
      </h3>
      <div style={{ fontSize: 12, color: "#5F6368", marginBottom: 16 }}>
        AUC-ROC performance breakdown across different weather regime classifications.
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 110 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" horizontal={false} />
          <XAxis type="number" domain={[0.5, 1.0]} tick={{ fontSize: 11, fill: "#9AA0A6", fontFamily: "Roboto Mono" }} />
          <YAxis type="category" dataKey="regime" tick={{ fontSize: 11, fill: "#5F6368" }} width={110} />
          <Tooltip
            formatter={(val: any, name: string) => [
              typeof val === "number" ? val.toFixed(3) : String(val ?? ""),
              name ?? "AUC-ROC",
            ]}
          />
          <Bar dataKey="auc" radius={3} maxBarSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.auc)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
