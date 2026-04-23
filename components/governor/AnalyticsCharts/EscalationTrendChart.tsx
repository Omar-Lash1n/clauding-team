"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EscalationTrendChartProps {
  data: { date: string; count: number }[];
}

export function EscalationTrendChart({ data }: EscalationTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#1C2D5B" }}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis tick={{ fontSize: 12, fill: "#1C2D5B" }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #DCE3EA",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#C94C4C"
          strokeWidth={2}
          dot={{ r: 3, fill: "#C94C4C" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
