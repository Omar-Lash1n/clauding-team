import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { getDailySummary, getDailySummariesIndex } from "@/lib/governor/queries";
import { DailySummaryCard } from "@/components/governor/DailySummaryCard";
import { formatDate } from "@/lib/utils/format";

export default async function DailySummaryPage() {
  const t = await getTranslations("governor.dailySummary");
  const locale = await getLocale();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  let summary = await getDailySummary(todayStr);
  let isYesterday = false;

  if (!summary) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    summary = await getDailySummary(yesterday.toISOString().slice(0, 10));
    isYesterday = !!summary;
  }

  const { data: archive } = await getDailySummariesIndex(1, 20);

  return (
    <div className="p-4 md:p-8 max-w-5xl space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-navy">
        {isYesterday ? t("yesterdayTitle") : t("todayTitle")}
      </h1>

      <DailySummaryCard summary={summary} isYesterday={isYesterday} />

      <section>
        <h2 className="text-lg font-bold text-navy mb-4">{t("archiveTitle")}</h2>
        <div className="rounded-xl border border-border-neutral bg-white shadow-card divide-y divide-border-neutral">
          {archive.length === 0 ? (
            <p className="p-6 text-sm text-navy/40">{t("noSummary")}</p>
          ) : (
            archive.map((s) => (
              <Link
                key={s.id}
                href={`/${locale}/governor/daily-summary/${s.summary_date}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-sky-white transition-colors"
              >
                <span className="text-sm font-medium text-navy">
                  {formatDate(s.summary_date, locale, "EEEE, dd MMMM yyyy")}
                </span>
                <div className="flex gap-4 text-xs text-navy/50">
                  <span>
                    {t("newReports")}: {s.new_reports_count}
                  </span>
                  <span>
                    {t("resolved")}: {s.resolved_count}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
