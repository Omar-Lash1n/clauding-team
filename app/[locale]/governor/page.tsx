import { getLocale, getTranslations } from "next-intl/server";
import {
  getCityStats,
  getCityHeatmap,
  getDistrictRanking,
  getDailySummary,
  getDistrictsWithBounds,
  getCityScoreLast7Days,
  getGovernorProfile,
} from "@/lib/governor/queries";
import { GovernorKPICards } from "@/components/governor/GovernorKPICards";
import { CityHeatmapCard } from "@/components/governor/CityHeatmapCard";
import { DistrictRanking } from "@/components/governor/DistrictRanking";
import { DailySummaryCard } from "@/components/governor/DailySummaryCard";
import { formatDate } from "@/lib/utils/format";

export default async function GovernorDashboard() {
  const locale = await getLocale();
  const t = await getTranslations("governor.dashboard");

  const [kpis, heatmapPoints, ranking, districts, cityScore, profile] =
    await Promise.all([
      getCityStats(),
      getCityHeatmap(),
      getDistrictRanking(),
      getDistrictsWithBounds(),
      getCityScoreLast7Days(),
      getGovernorProfile(),
    ]);

  // Try today's summary first, then yesterday's
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

  // Determine greeting based on Cairo time
  const cairoHour = new Date().getUTCHours() + 2; // Simple Cairo offset
  const lastName = profile?.full_name?.split(" ").pop() ?? "";
  const lastNameAr = profile?.full_name_ar?.split(" ").pop() ?? "";
  const name = locale === "ar" ? lastNameAr : lastName;

  let greetingKey: "greetingMorning" | "greetingAfternoon" | "greetingEvening";
  if (cairoHour < 12) greetingKey = "greetingMorning";
  else if (cairoHour < 18) greetingKey = "greetingAfternoon";
  else greetingKey = "greetingEvening";

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy">
            {t(greetingKey, { name })}
          </h1>
          <p className="text-sm text-navy/50 mt-1">
            {formatDate(today, locale, "EEEE, dd MMMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border-neutral bg-white px-5 py-3 text-center shadow-card">
            <p className="text-3xl font-bold text-nile-green tabular-nums">
              {cityScore}%
            </p>
            <p className="text-xs text-navy/50 mt-1">{t("cityScoreLabel")}</p>
          </div>
        </div>
      </div>

      {/* Daily summary card */}
      <DailySummaryCard summary={summary} isYesterday={isYesterday} />

      {/* KPI Cards */}
      <section>
        <GovernorKPICards kpis={kpis} />
      </section>

      {/* Heatmap */}
      <section>
        <h2 className="text-xl font-bold text-navy mb-4">{t("heatmapTitle")}</h2>
        <CityHeatmapCard points={heatmapPoints} districts={districts} />
      </section>

      {/* District Ranking */}
      <section>
        <h2 className="text-xl font-bold text-navy mb-4">{t("rankingTitle")}</h2>
        <DistrictRanking rows={ranking} />
      </section>
    </div>
  );
}
