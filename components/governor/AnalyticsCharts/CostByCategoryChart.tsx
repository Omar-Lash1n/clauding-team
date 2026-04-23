"use client";

import { useLocale } from "next-intl";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils/format";

interface CostByCategoryChartProps {
  data: { categoryId: string; nameEn: string; nameAr: string; totalCost: number }[];
}

const COLORS = [
  "#3E7D60",
  "#1C2D5B",
  "#D9A441",
  "#C94C4C",
  "#D9822F",
  "#2D5C46",
  "#94A3B8",
  "#6366F1",
  "#14B8A6",
  "#F97316",
];

export function CostByCategoryChart({ data }: CostByCategoryChartProps) {
  const locale = useLocale();

  const chartData = data
    .filter((d) => d.totalCost > 0)
    .map((d) => ({
      name: locale === "ar" ? d.nameAr : d.nameEn,
      value: d.totalCost,
    }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={120}
          paddingAngle={2}
          dataKey="value"
          label={({ name }) => name}
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatCurrency(value, locale)}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #DCE3EA",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
