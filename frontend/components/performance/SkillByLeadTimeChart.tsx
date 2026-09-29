"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from "recharts";
import type { LeadTimeSkill } from "@/lib/types";

interface SkillByLeadTimeChartProps {
  data: LeadTimeSkill;
}

export default function SkillByLeadTimeChart({ data }: SkillByLeadTimeChartProps) {
  if (!data || !data.lead_days) return null;

  const chartData = data.lead_days.map((day, i) => ({
    day: `Day ${day}`,
    auc: data.auc[i],
    ci_low: data.ci_low[i],
    ci_high: data.ci_high[i],
    ci_range: [(data.ci_low[i] ?? 0), (data.ci_high[i] ?? 0)],
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
      <h3 style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 700, color: "#202124" }}>
        Skill Score by Lead Time
      </h3>
      <div style={{ fontSize: 12, color: "#5F6368", marginBottom: 16 }}>
        AUC-ROC score across Day 1–10 lead times with 95% confidence interval ribbon.
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9AA0A6" }} />
          <YAxis domain={[0.5, 1.0]} tick={{ fontSize: 11, fill: "#9AA0A6", fontFamily: "Roboto Mono" }} />
          <Tooltip
            formatter={(val: any, name: string) => [
              Array.isArray(val)
                ? `${Number(val[0]).toFixed(3)} – ${Number(val[1]).toFixed(3)}`
                : typeof val === "number"
                ? val.toFixed(3)
                : String(val ?? ""),
              name ?? "Value",
            ]}
          />
          <Area type="monotone" dataKey="ci_range" stroke="none" fill="#1A73E8" fillOpacity={0.15} name="95% CI" />
          <Line type="monotone" dataKey="auc" stroke="#1A73E8" strokeWidth={2.5} dot={{ fill: "#1A73E8", r: 4 }} name="AUC-ROC" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
