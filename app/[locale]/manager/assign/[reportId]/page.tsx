import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/staff/queries";
import { getReportDetail, getTechnicianRanking } from "@/lib/manager/queries";
import { getTranslations } from "next-intl/server";
import { AssignPanelClient } from "./AssignPanelClient";

interface AssignPageProps {
  params: Promise<{ locale: string; reportId: string }>;
}

export default async function AssignPage({ params }: AssignPageProps) {
  const { locale, reportId } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "manager" });
  const profile = await getCurrentProfile(supabase);

  if (!profile?.district_id) return null;

  let report;
  try {
    report = await getReportDetail(supabase, reportId);
  } catch {
    notFound();
  }
  if (!report) notFound();

  const category = report.category as { name_ar?: string; name_en?: string; default_specialty?: string } | null;
  const requiredSpecialty = category?.default_specialty || "general";

  // Get all technicians in district
  const technicians = await getTechnicianRanking(supabase, profile.district_id);

  // Also try the RPC for least busy
  let recommended: typeof technicians = [];
  try {
    const { data } = await supabase.rpc("pick_least_busy_technician", {
      p_district_id: profile.district_id,
      p_specialty: requiredSpecialty as "plumber" | "electrician" | "road_maintenance" | "sanitation" | "general",
    });
    if (data) {
      recommended = data.map((d) => ({
        technician_id: d.technician_id,
        full_name: d.full_name,
        full_name_ar: null,
        is_on_leave: false,
        specialty: requiredSpecialty as "plumber" | "electrician" | "road_maintenance" | "sanitation" | "general",
        district_id: profile.district_id,
        active_tasks: d.active_tasks,
        workload_score: d.workload_score,
      }));
    }
  } catch {
    // Fallback to all technicians filtered by specialty
    recommended = technicians.filter(
      (t) => t.specialty === requiredSpecialty && !t.is_on_leave
    );
  }

  const categoryName = locale === "ar" ? (category?.name_ar || category?.name_en || "") : (category?.name_en || "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("assign.title")}</h1>
        <p className="text-sm text-navy/50 mt-1">{t("assign.subtitle")}</p>
      </div>

      {/* Report summary */}
      <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
        <p className="text-sm font-semibold text-navy">{categoryName}</p>
        <p className="text-xs text-navy/70 mt-1 line-clamp-2">{report.description}</p>
      </div>

      {/* Assign panel client component */}
      <AssignPanelClient
        reportId={reportId}
        locale={locale}
        requiredSpecialty={requiredSpecialty}
        recommended={recommended.slice(0, 5).map((t) => ({
          id: t.technician_id || "",
          name: t.full_name || "",
          nameAr: t.full_name_ar,
          specialty: t.specialty || "general",
          isOnLeave: t.is_on_leave || false,
          activeTasks: t.active_tasks || 0,
          workloadScore: t.workload_score || 0,
        }))}
        others={technicians
          .filter((t) => !recommended.slice(0, 5).some((r) => r.technician_id === t.technician_id))
          .map((t) => ({
            id: t.technician_id || "",
            name: t.full_name || "",
            nameAr: t.full_name_ar,
            specialty: t.specialty || "general",
            isOnLeave: t.is_on_leave || false,
            activeTasks: t.active_tasks || 0,
            workloadScore: t.workload_score || 0,
          }))}
      />
    </div>
  );
}
