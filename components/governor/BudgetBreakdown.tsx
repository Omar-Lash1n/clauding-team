"use client";

import { useTranslations, useLocale } from "next-intl";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import type { BudgetDistrictData, BudgetCategoryData, BudgetMonthData } from "@/lib/governor/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useRouter } from "next/navigation";

interface BudgetBreakdownProps {
  byDistrict: BudgetDistrictData[];
  byCategory: BudgetCategoryData[];
  byMonth: BudgetMonthData[];
  cityTotal: number;
}

export function BudgetBreakdown({ byDistrict, byCategory, byMonth, cityTotal }: BudgetBreakdownProps) {
  const t = useTranslations("governor.budget");
  const locale = useLocale();
  const router = useRouter();

  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      {/* City total */}
      <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card">
        <p className="text-sm text-navy/50">{t("totalCity")}</p>
        <p className="text-4xl font-bold text-navy mt-1 tabular-nums">
          {formatCurrency(cityTotal, locale)}
        </p>
      </div>

      <Tabs defaultValue="district">
        <TabsList className="mb-4">
          <TabsTrigger value="district">{t("tabDistrict")}</TabsTrigger>
          <TabsTrigger value="category">{t("tabCategory")}</TabsTrigger>
          <TabsTrigger value="month">{t("tabMonth")}</TabsTrigger>
        </TabsList>

        {/* By District */}
        <TabsContent value="district">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {byDistrict.map((d) => (
              <div
                key={d.districtId}
                className="rounded-xl border border-border-neutral bg-white p-6 shadow-card"
              >
                <h4 className="text-lg font-bold text-navy mb-3">
                  {locale === "ar" ? d.nameAr : d.nameEn}
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-navy/50">{t("thisMonth")}</p>
                    <p className="text-xl font-bold text-navy tabular-nums">
                      {formatCurrency(d.totalSpentMonth, locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-navy/50">{t("thisYear")}</p>
                    <p className="text-xl font-bold text-navy tabular-nums">
                      {formatCurrency(d.totalSpentYear, locale)}
                    </p>
                  </div>
                </div>
                {/* Share bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-navy/50 mb-1">
                    <span>{t("shareOfCity")}</span>
                    <span>{formatNumber(d.sharePercent, locale)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-navy/5">
                    <div
                      className="h-2 rounded-full bg-navy"
                      style={{ width: `${d.sharePercent}%` }}
                    />
                  </div>
                </div>
                {/* Top categories */}
                {d.topCategories.length > 0 && (
                  <div>
                    <p className="text-xs text-navy/50 mb-2">{t("topCategories")}</p>
                    {d.topCategories.map((tc, i) => (
                      <div key={i} className="flex justify-between text-sm py-1">
                        <span className="text-navy/70">
                          {locale === "ar" ? tc.nameAr : tc.nameEn}
                        </span>
                        <span className="tabular-nums text-navy font-medium">
                          {formatCurrency(tc.amount, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* By Category */}
        <TabsContent value="category">
          <div className="rounded-xl border border-border-neutral bg-white shadow-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border-neutral">
                  <TableHead className="text-navy font-semibold">
                    {locale === "ar" ? "الفئة" : "Category"}
                  </TableHead>
                  <TableHead className="text-navy font-semibold text-end">{t("thisMonth")}</TableHead>
                  <TableHead className="text-navy font-semibold text-end">{t("thisYear")}</TableHead>
                  <TableHead className="text-navy font-semibold text-center">
                    {locale === "ar" ? "البلاغات" : "Reports"}
                  </TableHead>
                  <TableHead className="text-navy font-semibold text-end">{t("avgPerReport")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCategory
                  .filter((c) => c.reportCount > 0)
                  .sort((a, b) => b.spentYear - a.spentYear)
                  .map((c) => (
                    <TableRow key={c.categoryId} className="border-border-neutral">
                      <TableCell className="font-medium">
                        {locale === "ar" ? c.nameAr : c.nameEn}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatCurrency(c.spentMonth, locale)}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatCurrency(c.spentYear, locale)}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {formatNumber(c.reportCount, locale)}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatCurrency(Math.round(c.avgCostPerReport), locale)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* By Month */}
        <TabsContent value="month">
          <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={byMonth} margin={{ top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#1C2D5B" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 12, fill: "#1C2D5B" }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, locale)}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #DCE3EA",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {byMonth.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.month === currentMonth ? "#3E7D60" : "#1C2D5B"}
                      cursor="pointer"
                      onClick={() => {
                        router.push(
                          `/${locale}/governor/situation-room?month=${entry.month}`
                        );
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
