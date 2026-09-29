"use client";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Line, ComposedChart, Area,
} from "recharts";
import type { ReliabilityPoint } from "@/lib/types";

interface ReliabilityDiagramProps {
  data: ReliabilityPoint[];
  height?: number;
}

export default function ReliabilityDiagram({ data, height = 200 }: ReliabilityDiagramProps) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({
    ...d,
    perfect: d.bin_center,
  }));

  return (
    <div>
      <div style={{ fontSize: 12, color: "#5F6368", marginBottom: 8 }}>
        Reliability Diagram — Model calibration on 2023 validation data
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 16, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" />
          <XAxis
            dataKey="bin_center"
            tick={{ fontSize: 10, fill: "#9AA0A6", fontFamily: "Roboto Mono" }}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            label={{ value: "Forecast Probability", position: "bottom", offset: 10, fontSize: 11, fill: "#9AA0A6" }}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 10, fill: "#9AA0A6", fontFamily: "Roboto Mono" }}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            width={36}
          />
          <Tooltip
            formatter={(v: number, name: string) => [`${(v * 100).toFixed(1)}%`, name]}
            labelFormatter={(l: number) => `Forecast bin: ${(l * 100).toFixed(0)}%`}
          />
          <ReferenceLine
            segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
            stroke="#DADCE0"
            strokeDasharray="5 3"
            strokeWidth={1}
          />
          <Line
            type="monotone"
            dataKey="perfect"
            stroke="#DADCE0"
            strokeDasharray="5 3"
            dot={false}
            name="Perfect calibration"
            strokeWidth={1}
          />
          <Scatter
            dataKey="mean_observed"
            fill="#1A73E8"
            name="Observed frequency"
            shape="circle"
          />
          <Line
            type="monotone"
            dataKey="mean_observed"
            stroke="#1A73E8"
            strokeWidth={2}
            dot={{ fill: "#1A73E8", r: 4 }}
            name="Observed frequency"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
