"use client";

import { useLocale } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopCategoriesChartProps {
  data: { categoryId: string; nameEn: string; nameAr: string; count: number }[];
}

export function TopCategoriesChart({ data }: TopCategoriesChartProps) {
  const locale = useLocale();

  const chartData = data.map((d) => ({
    name: locale === "ar" ? d.nameAr : d.nameEn,
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" />
        <XAxis type="number" tick={{ fontSize: 12, fill: "#1C2D5B" }} />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 11, fill: "#1C2D5B" }}
          width={120}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #DCE3EA",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="count" fill="#3E7D60" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
