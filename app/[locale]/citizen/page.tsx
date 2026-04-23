import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyReports, getMyReportCounts } from "@/lib/citizen/queries";
import { Card, CardContent } from "@/components/ui/card";
import { ReportCard } from "@/components/citizen/ReportCard";
import { MyReportsList } from "@/components/citizen/MyReportsList";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/utils/format";
import { formatNumber } from "@/lib/utils/format";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Plus,
} from "lucide-react";

export default async function CitizenDashboard() {
  const locale = await getLocale();
  const t = await getTranslations("citizen.dashboard");

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, full_name_ar")
      .eq("id", user.id)
      .single<{ full_name: string; full_name_ar: string | null }>();

    if (profile) {
      const fullName =
        locale === "ar"
          ? (profile.full_name_ar ?? profile.full_name)
          : profile.full_name;
      firstName = fullName.split(" ")[0] ?? fullName;
    }
  }

  const recentReports = await getMyReports({ limit: 5 });
  const allReports = await getMyReports();
  const counts = await getMyReportCounts();

  const today = formatDate(new Date(), locale, "EEEE, dd MMMM yyyy");

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-[#1C2D5B]">
          {t("greeting", { name: firstName })}
        </h1>
        <p className="text-sm text-[#1C2D5B]/50 mt-0.5">
          {t("date", { date: today })}
        </p>
      </div>

      {/* Report CTA */}
      <Link
        href={`/${locale}/citizen/report/new`}
        className="flex items-center justify-center gap-3 rounded-2xl bg-[#3E7D60] text-white font-bold text-lg min-h-[96px] w-full shadow-lg hover:bg-[#356b52] active:scale-[0.98] transition-all"
      >
        <Plus className="h-6 w-6" />
        {t("reportCta")}
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1C2D5B]">
              {formatNumber(counts.active, locale)}
            </p>
            <p className="text-xs text-[#1C2D5B]/50">{t("stats.active")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1C2D5B]">
              {formatNumber(counts.resolved, locale)}
            </p>
            <p className="text-xs text-[#1C2D5B]/50">{t("stats.resolved")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <ClipboardList className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1C2D5B]">
              {formatNumber(counts.total, locale)}
            </p>
            <p className="text-xs text-[#1C2D5B]/50">{t("stats.total")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1C2D5B]">
            {t("recentTitle")}
          </h2>
        </div>

        {recentReports.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={t("empty")}
            action={
              <Link
                href={`/${locale}/citizen/report/new`}
                className="rounded-lg bg-[#3E7D60] px-4 py-2 text-sm font-medium text-white hover:bg-[#356b52] transition-colors"
              >
                {t("reportCta")}
              </Link>
            }
          />
        ) : (
          <>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>

            {allReports.length > 5 && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-[#3E7D60] hover:underline list-none flex items-center gap-1">
                  {t("seeAll")} →
                </summary>
                <div className="mt-4">
                  <MyReportsList initialReports={allReports} />
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}
