"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getAnalytics } from "@/lib/governor/queries";
import { ResolutionTimeChart } from "@/components/governor/AnalyticsCharts/ResolutionTimeChart";
import { TopCategoriesChart } from "@/components/governor/AnalyticsCharts/TopCategoriesChart";
import { EscalationTrendChart } from "@/components/governor/AnalyticsCharts/EscalationTrendChart";
import { CompletionRateChart } from "@/components/governor/AnalyticsCharts/CompletionRateChart";
import { CostByCategoryChart } from "@/components/governor/AnalyticsCharts/CostByCategoryChart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { AnalyticsData } from "@/lib/governor/queries";

interface AnalyticsClientProps {
  initialData: AnalyticsData;
}

export function AnalyticsClient({ initialData }: AnalyticsClientProps) {
  const t = useTranslations("governor.analytics");
  const [data] = useState<AnalyticsData>(initialData);
  const [range, setRange] = useState(30);

  const ranges = [
    { value: 7, label: t("timeRange7") },
    { value: 30, label: t("timeRange30") },
    { value: 90, label: t("timeRange90") },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Time range selector */}
      <div className="flex gap-2">
        {ranges.map((r) => (
          <Button
            key={r.value}
            variant={range === r.value ? "default" : "outline"}
            size="sm"
            className={cn(range === r.value && "bg-navy hover:bg-navy/90")}
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-navy mb-4">{t("resolutionTimeTitle")}</h3>
          <ResolutionTimeChart data={data.resolutionByDistrict} />
        </div>

        <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-navy mb-4">{t("topCategoriesTitle")}</h3>
          <TopCategoriesChart data={data.topCategories} />
        </div>

        <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-navy mb-4">{t("escalationTrendTitle")}</h3>
          <EscalationTrendChart data={data.escalationTrend} />
        </div>

        <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-navy mb-4">{t("completionRateTitle")}</h3>
          <CompletionRateChart data={data.completionByDistrict} />
        </div>

        <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card lg:col-span-2">
          <h3 className="text-lg font-bold text-navy mb-4">{t("costByCategoryTitle")}</h3>
          <CostByCategoryChart data={data.costByCategory} />
        </div>
      </div>
    </div>
  );
}
