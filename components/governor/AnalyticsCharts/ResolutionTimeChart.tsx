"use client";

import { useLocale } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ResolutionTimeChartProps {
  data: {
    districtId: string;
    districtName: string;
    districtNameAr: string;
    priority: string;
    avgHours: number;
  }[];
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#C94C4C",
  high: "#D9822F",
  medium: "#D9A441",
  low: "#2D5C46",
  scheduled: "#94A3B8",
};

export function ResolutionTimeChart({ data }: ResolutionTimeChartProps) {
  const locale = useLocale();

  // Transform data into grouped format: one row per district, columns per priority
  const districtMap = new Map<string, Record<string, number> & { name: string }>();
  for (const d of data) {
    const name = locale === "ar" ? d.districtNameAr : d.districtName;
    if (!districtMap.has(d.districtId)) {
      districtMap.set(d.districtId, { name } as Record<string, number> & { name: string });
    }
    const row = districtMap.get(d.districtId)!;
    row[d.priority] = d.avgHours;
  }

  const chartData = Array.from(districtMap.values());
  const priorities = ["critical", "high", "medium", "low", "scheduled"];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#1C2D5B" }} />
        <YAxis
          tick={{ fontSize: 12, fill: "#1C2D5B" }}
          label={{
            value: locale === "ar" ? "ساعات" : "Hours",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 12, fill: "#1C2D5B" },
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #DCE3EA",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        {priorities.map((p) => (
          <Bar
            key={p}
            dataKey={p}
            fill={PRIORITY_COLORS[p]}
            name={p}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
