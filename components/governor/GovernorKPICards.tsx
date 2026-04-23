"use client";

import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { formatNumber, formatCurrency } from "@/lib/utils/format";
import {
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
} from "lucide-react";
import type { CityKPIs } from "@/lib/governor/queries";

interface GovernorKPICardsProps {
  kpis: CityKPIs;
}

const KPI_CONFIG = [
  { key: "totalReports" as const, icon: FileText, color: "text-navy" },
  { key: "active" as const, icon: Activity, color: "text-[#D9A441]" },
  { key: "resolved" as const, icon: CheckCircle2, color: "text-nile-green" },
  { key: "escalated" as const, icon: AlertTriangle, color: "text-[#D9822F]" },
  { key: "criticalUnassigned" as const, icon: AlertOctagon, color: "text-[#C94C4C]" },
  { key: "avgResolution" as const, icon: Clock, color: "text-navy" },
] as const;

export function GovernorKPICards({ kpis }: GovernorKPICardsProps) {
  const t = useTranslations("governor.dashboard.kpis");
  const locale = useLocale();

  const values: Record<string, string> = {
    totalReports: formatNumber(kpis.totalReportsToday, locale),
    active: formatNumber(kpis.activeReports, locale),
    resolved: formatNumber(kpis.resolvedReports, locale),
    escalated: formatNumber(kpis.escalatedReports, locale),
    criticalUnassigned: formatNumber(kpis.criticalUnassigned, locale),
    avgResolution: `${formatNumber(kpis.avgResolutionHours7d, locale)}h`,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {KPI_CONFIG.map((kpi) => {
        const Icon = kpi.icon;
        const isCritical = kpi.key === "criticalUnassigned" && kpis.criticalUnassigned > 0;

        return (
          <div
            key={kpi.key}
            className={cn(
              "rounded-xl border border-border-neutral bg-white p-6 shadow-card",
              isCritical && "border-[#C94C4C]/30 bg-[#C94C4C]/5"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <Icon className={cn("h-5 w-5", kpi.color)} />
            </div>
            <p
              className={cn(
                "text-3xl md:text-4xl font-bold tabular-nums",
                isCritical ? "text-[#C94C4C]" : "text-navy"
              )}
            >
              {values[kpi.key]}
            </p>
            <p className="text-sm text-navy/50 mt-1">{t(kpi.key)}</p>
          </div>
        );
      })}
    </div>
  );
}
