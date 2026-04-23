import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { getDailySummary } from "@/lib/governor/queries";
import { DailySummaryCard } from "@/components/governor/DailySummaryCard";
import { ArrowLeft } from "lucide-react";

interface PastSummaryPageProps {
  params: Promise<{ date: string }>;
}

export default async function PastSummaryPage({ params }: PastSummaryPageProps) {
  const { date } = await params;
  const t = await getTranslations("governor.dailySummary");
  const locale = await getLocale();

  const summary = await getDailySummary(date);

  if (!summary) {
    return (
      <div className="p-4 md:p-8 max-w-5xl">
        <Link
          href={`/${locale}/governor/daily-summary`}
          className="inline-flex items-center gap-1 text-sm text-navy/50 hover:text-navy mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToArchive")}
        </Link>
        <p className="text-navy/50">{t("noSummary")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl space-y-6">
      <Link
        href={`/${locale}/governor/daily-summary`}
        className="inline-flex items-center gap-1 text-sm text-navy/50 hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToArchive")}
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-navy">{date}</h1>
      <DailySummaryCard summary={summary} />
    </div>
  );
}
