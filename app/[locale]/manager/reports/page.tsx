import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/staff/queries";
import { getDistrictReports } from "@/lib/manager/queries";
import { getTranslations } from "next-intl/server";
import { ClipboardList, Eye } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SLARing } from "@/components/staff/SLARing";
import { getStatusStyle, getPriorityStyle } from "@/lib/staff/report-views";

interface ReportsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SituationRoomPage({ params }: ReportsPageProps) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "manager" });
  const tStatuses = await getTranslations({ locale, namespace: "statuses" });
  const tPriorities = await getTranslations({ locale, namespace: "priorities" });
  const profile = await getCurrentProfile(supabase);

  if (!profile?.district_id) return null;

  const reports = await getDistrictReports(supabase, profile.district_id);

  function getCategoryName(report: typeof reports[0]) {
    const cat = report.category as { name_ar?: string; name_en?: string } | null;
    if (!cat) return "";
    return locale === "ar" ? (cat.name_ar || cat.name_en || "") : (cat.name_en || "");
  }

  function getReporterName(report: typeof reports[0]) {
    const reporter = report.reporter as { full_name?: string; full_name_ar?: string } | null;
    if (!reporter) return "";
    return locale === "ar" ? (reporter.full_name_ar || reporter.full_name || "") : (reporter.full_name || "");
  }

  function getTechName(report: typeof reports[0]) {
    const tech = report.technician as { full_name?: string; full_name_ar?: string } | null;
    if (!tech) return "—";
    return locale === "ar" ? (tech.full_name_ar || tech.full_name || "") : (tech.full_name || "");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-navy" />
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("situationRoom.title")}</h1>
          <p className="text-sm text-navy/50 mt-0.5">{t("situationRoom.subtitle")}</p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border-neutral bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-neutral bg-sky-white/50">
              <th className="px-4 py-3 text-start font-medium text-navy/70">{tStatuses("submitted").split(" ")[0]}</th>
              <th className="px-4 py-3 text-start font-medium text-navy/70">{t("filters.priority")}</th>
              <th className="px-4 py-3 text-start font-medium text-navy/70">{t("filters.category")}</th>
              <th className="px-4 py-3 text-start font-medium text-navy/70">{t("reportDetail.reporter")}</th>
              <th className="px-4 py-3 text-start font-medium text-navy/70">{t("reportDetail.technician")}</th>
              <th className="px-4 py-3 text-start font-medium text-navy/70">SLA</th>
              <th className="px-4 py-3 text-start font-medium text-navy/70"></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const statusStyle = getStatusStyle(report.status);
              const priorityStyle = getPriorityStyle(report.priority);
              const deadline = report.sla_resolve_deadline;

              return (
                <tr key={report.id} className="border-b border-border-neutral last:border-0 hover:bg-sky-white/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", statusStyle.bg, statusStyle.text)}>
                      {tStatuses(report.status as Parameters<typeof tStatuses>[0])}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", priorityStyle.bg, priorityStyle.fg)}>
                      {tPriorities(report.priority as Parameters<typeof tPriorities>[0])}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy">{getCategoryName(report)}</td>
                  <td className="px-4 py-3 text-navy/70">{getReporterName(report)}</td>
                  <td className="px-4 py-3 text-navy/70">{getTechName(report)}</td>
                  <td className="px-4 py-3">
                    <SLARing deadline={deadline} size={32} strokeWidth={3} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${locale}/manager/reports/${report.id}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-nile-green hover:bg-nile-green/10"
                    >
                      <Eye className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {reports.map((report) => {
          const statusStyle = getStatusStyle(report.status);
          const priorityStyle = getPriorityStyle(report.priority);
          const deadline = report.sla_resolve_deadline;

          return (
            <Link
              key={report.id}
              href={`/${locale}/manager/reports/${report.id}`}
              className="block rounded-xl border border-border-neutral bg-white p-4 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy truncate">{getCategoryName(report)}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusStyle.bg, statusStyle.text)}>
                      {tStatuses(report.status as Parameters<typeof tStatuses>[0])}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", priorityStyle.bg, priorityStyle.fg)}>
                      {tPriorities(report.priority as Parameters<typeof tPriorities>[0])}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-navy/50">{getReporterName(report)} → {getTechName(report)}</p>
                </div>
                <SLARing deadline={deadline} size={40} />
              </div>
            </Link>
          );
        })}
      </div>

      {reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-navy/50">{locale === "ar" ? "لا توجد بلاغات" : "No reports found"}</p>
        </div>
      )}
    </div>
  );
}
