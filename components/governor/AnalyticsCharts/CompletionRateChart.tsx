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

interface CompletionRateChartProps {
  data: {
    districtId: string;
    districtName: string;
    districtNameAr: string;
    resolved: number;
    active: number;
    rejected: number;
    total: number;
  }[];
}

export function CompletionRateChart({ data }: CompletionRateChartProps) {
  const locale = useLocale();

  const chartData = data.map((d) => ({
    name: locale === "ar" ? d.districtNameAr : d.districtName,
    resolved: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0,
    active: d.total > 0 ? Math.round((d.active / d.total) * 100) : 0,
    rejected: d.total > 0 ? Math.round((d.rejected / d.total) * 100) : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#1C2D5B" }} />
        <YAxis
          tick={{ fontSize: 12, fill: "#1C2D5B" }}
          label={{
            value: "%",
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
        <Bar dataKey="resolved" stackId="a" fill="#2D5C46" name={locale === "ar" ? "محلول" : "Resolved"} />
        <Bar dataKey="active" stackId="a" fill="#D9A441" name={locale === "ar" ? "نشط" : "Active"} />
        <Bar dataKey="rejected" stackId="a" fill="#C94C4C" name={locale === "ar" ? "مرفوض" : "Rejected"} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
