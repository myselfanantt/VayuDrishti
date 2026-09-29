"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface AlertAccuracyDonutProps {
  stats?: { verified: number; false_alarm: number; missed: number };
}

export default function AlertAccuracyDonut({ stats }: AlertAccuracyDonutProps) {
  if (!stats) return null;

  const total = stats.verified + stats.false_alarm + stats.missed;
  const pieData = [
    { name: "Verified Busts", value: stats.verified, color: "#34A853" },
    { name: "False Alarms", value: stats.false_alarm, color: "#EA4335" },
    { name: "Missed Busts", value: stats.missed, color: "#FBBC04" },
  ];

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
        Alert Accuracy
      </h3>
      <div style={{ fontSize: 12, color: "#5F6368", marginBottom: 12 }}>
        Verification outcome ratio for all issued alerts over last 30 days.
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(val: number) => [`${val} alerts (${Math.round((val / total) * 100)}%)`]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
