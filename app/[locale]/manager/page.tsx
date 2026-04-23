import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/staff/queries";
import { getDistrictStats, getHeatmapPoints, getQueue, getPendingDisputes } from "@/lib/manager/queries";
import { getTranslations } from "next-intl/server";
import { KPICards } from "@/components/manager/KPICards";
import { HeatmapCard } from "@/components/manager/HeatmapCard";
import { QueueItem } from "@/components/manager/QueueItem";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface ManagerPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ManagerDashboard({ params }: ManagerPageProps) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "manager" });
  const profile = await getCurrentProfile(supabase);

  if (!profile?.district_id) return null;

  const stats = await getDistrictStats(supabase, profile.district_id);
  const heatmapPoints = await getHeatmapPoints(supabase, profile.district_id);
  
  // Get active cross-district permissions
  const { getActiveCrossDistrictPermission } = await import("@/lib/manager/queries");
  const crossDistrictAccess = await getActiveCrossDistrictPermission(supabase, profile.id);
  const allowedDistrictIds = [
    profile.district_id,
    ...crossDistrictAccess.map((req) => req.target_district_id),
  ];

  const queue = await getQueue(supabase, allowedDistrictIds);
  const disputes = await getPendingDisputes(supabase, profile.district_id);

  const heatData = heatmapPoints.map((p) => ({
    lat: p.location_lat ?? 0,
    lng: p.location_lng ?? 0,
    weight: p.weight ?? 1,
  }));

  const topQueueItems = queue.slice(0, 5);

  // Generate signed URLs for top queue items
  const pathsToSign = topQueueItems
    .map(report => {
      const photos = (report.photos || []) as { id: string; storage_path: string; photo_type: string }[];
      const firstPhoto = photos.find((p) => p.photo_type === "before");
      return firstPhoto?.storage_path;
    })
    .filter(Boolean) as string[];

  let signedUrls: Record<string, string> = {};
  if (pathsToSign.length > 0) {
    const { data: signedData } = await supabase.storage.from("reports").createSignedUrls(pathsToSign, 3600);
    if (signedData) {
      signedUrls = signedData.reduce((acc, curr) => {
        if (!curr.error && curr.signedUrl) {
          acc[curr.path] = curr.signedUrl;
        }
        return acc;
      }, {} as Record<string, string>);
    }
  }

  function getCategoryName(report: typeof queue[0]) {
    const cat = report.category as { name_ar?: string; name_en?: string } | null;
    if (!cat) return "";
    return locale === "ar" ? (cat.name_ar || cat.name_en || "") : (cat.name_en || "");
  }

  function getReporterName(report: typeof queue[0]) {
    const reporter = report.reporter as { full_name?: string; full_name_ar?: string } | null;
    if (!reporter) return "";
    return locale === "ar" ? (reporter.full_name_ar || reporter.full_name || "") : (reporter.full_name || "");
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("dashboard.title")}</h1>
        <p className="text-sm text-navy/50 mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {/* KPI Cards */}
      <KPICards
        submitted={stats?.submitted_count ?? 0}
        active={stats?.active_count ?? 0}
        completedToday={stats?.completed_count ?? 0}
        escalated={stats?.escalation_count ?? 0}
        avgResolutionHours={stats?.avg_resolution_hours ?? 0}
        totalSpent={stats?.total_spent ?? 0}
      />

      {/* Heatmap */}
      <HeatmapCard points={heatData} />

      {/* Two column: Awaiting Approval + Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Awaiting Approval */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-navy">{t("dashboard.awaitingApproval")}</h2>
            <Link
              href={`/${locale}/manager/queue`}
              className="text-xs text-nile-green hover:underline"
            >
              {locale === "ar" ? "عرض الكل" : "View all"} →
            </Link>
          </div>
          <div className="space-y-3">
            {topQueueItems.length === 0 ? (
              <div className="rounded-xl border border-border-neutral bg-white p-6 text-center shadow-card">
                <p className="text-sm text-navy/50">{t("queue.empty")}</p>
              </div>
            ) : (
              topQueueItems.map((report) => {
                const photos = (report.photos || []) as { id: string; storage_path: string; photo_type: string }[];
                const firstPhoto = photos.find((p) => p.photo_type === "before");
                const photoUrl = firstPhoto ? signedUrls[firstPhoto.storage_path] : null;

                return (
                  <QueueItem
                    key={report.id}
                    id={report.id}
                    categoryName={getCategoryName(report)}
                    priority={report.priority}
                    addressDescription={report.address_description}
                    reporterName={getReporterName(report)}
                    description={report.description}
                    photoUrl={photoUrl}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Needs Attention */}
        <div>
          <h2 className="text-lg font-semibold text-navy mb-3">{t("dashboard.needsAttention")}</h2>
          <div className="space-y-3">
            {disputes.length === 0 ? (
              <div className="rounded-xl border border-border-neutral bg-white p-6 text-center shadow-card">
                <p className="text-sm text-navy/50">
                  {locale === "ar" ? "لا توجد عناصر تحتاج انتباهك" : "No items need attention"}
                </p>
              </div>
            ) : (
              disputes.slice(0, 5).map((dispute) => {
                const report = dispute.report as {
                  id: string;
                  category?: { name_ar?: string; name_en?: string };
                  priority?: string;
                } | null;

                const catName = report?.category
                  ? (locale === "ar" ? report.category.name_ar : report.category.name_en) || ""
                  : "";

                return (
                  <Link
                    key={dispute.id}
                    href={`/${locale}/manager/disputes/${dispute.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border-neutral bg-white p-4 shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <AlertTriangle className="h-5 w-5 shrink-0 text-orange-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-navy truncate">{catName}</p>
                      <p className="text-xs text-navy/50">
                        {t("disputes.title")}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
