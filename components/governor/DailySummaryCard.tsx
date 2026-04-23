"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { formatNumber, formatDate } from "@/lib/utils/format";
import { FileText, ArrowUpRight } from "lucide-react";
import type { DailySummary } from "@/types/domain";
import type { Json } from "@/types/database";

interface DailySummaryCardProps {
  summary: DailySummary | null;
  isYesterday?: boolean;
}

export function DailySummaryCard({ summary, isYesterday }: DailySummaryCardProps) {
  const t = useTranslations("governor.dailySummary");
  const tDash = useTranslations("governor.dashboard");
  const locale = useLocale();

  if (!summary) {
    return (
      <div className="rounded-xl border border-border-neutral bg-sand-ivory/30 p-6 shadow-card">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="h-5 w-5 text-navy/40" />
          <h3 className="text-lg font-bold text-navy">{tDash("summarySectionTitle")}</h3>
        </div>
        <p className="text-sm text-navy/50">{tDash("summaryNotYet")}</p>
      </div>
    );
  }

  const payload = (summary.payload ?? {}) as Record<string, Json>;
  const criticalUnassigned = Number(payload.critical_unassigned ?? 0);
  const totalActive = Number(payload.total_active ?? 0);

  return (
    <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-navy" />
          <h3 className="text-lg font-bold text-navy">
            {isYesterday ? tDash("summaryYesterday") : tDash("summarySectionTitle")}
          </h3>
        </div>
        <Link
          href={`/${locale}/governor/daily-summary`}
          className="flex items-center gap-1 text-xs font-medium text-nile-green hover:underline"
        >
          {t("viewArchive")}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <p className="text-xs text-navy/40 mb-4">
        {formatDate(summary.summary_date, locale)}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-2xl font-bold text-navy tabular-nums">
            {formatNumber(summary.new_reports_count, locale)}
          </p>
          <p className="text-xs text-navy/50">{t("newReports")}</p>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-nile-green tabular-nums">
            {formatNumber(summary.resolved_count, locale)}
          </p>
          <p className="text-xs text-navy/50">{t("resolved")}</p>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-[#D9A441] tabular-nums">
            {formatNumber(totalActive, locale)}
          </p>
          <p className="text-xs text-navy/50">{t("escalations")}</p>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-[#C94C4C] tabular-nums">
            {formatNumber(criticalUnassigned, locale)}
          </p>
          <p className="text-xs text-navy/50">
            {t("topDelay")}
          </p>
        </div>
      </div>
    </div>
  );
}
