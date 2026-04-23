import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/staff/queries";
import { getPendingLeaves } from "@/lib/manager/queries";
import { getTranslations } from "next-intl/server";
import { CalendarOff } from "lucide-react";
import { LeaveApprovalClient } from "./LeaveApprovalClient";
import type { LeaveStatus, SpecialtyType } from "@/types/domain";

interface LeaveRequestsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LeaveRequestsPage({ params }: LeaveRequestsPageProps) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "manager" });
  const profile = await getCurrentProfile(supabase);

  if (!profile?.district_id) return null;

  const allLeaves = await getPendingLeaves(supabase, profile.district_id);
  const pending = allLeaves.filter((l) => l.status === "pending");
  const decided = allLeaves.filter((l) => l.status !== "pending").slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarOff className="h-5 w-5 text-navy" />
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("leaveRequests.title")}</h1>
          <p className="text-sm text-navy/50 mt-0.5">{t("leaveRequests.subtitle")}</p>
        </div>
      </div>

      {/* Pending */}
      <div>
        <h2 className="text-lg font-semibold text-navy mb-3">{t("leaveRequests.pendingSection")}</h2>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-border-neutral bg-white p-8 text-center shadow-card">
            <p className="text-sm text-navy/50">{t("leaveRequests.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((leave) => {
              const tech = leave.technician as {
                id: string;
                full_name: string;
                full_name_ar?: string | null;
                specialty?: SpecialtyType;
              } | null;

              return (
                <LeaveApprovalClient
                  key={leave.id}
                  leaveId={leave.id}
                  locale={locale}
                  techName={locale === "ar" ? (tech?.full_name_ar || tech?.full_name || "") : (tech?.full_name || "")}
                  techSpecialty={tech?.specialty || "general"}
                  startDate={leave.start_date}
                  endDate={leave.end_date}
                  reason={leave.reason}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Recent decisions */}
      {decided.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy mb-3">{t("leaveRequests.recentSection")}</h2>
          <div className="space-y-3">
            {decided.map((leave) => {
              const tech = leave.technician as {
                full_name: string;
                full_name_ar?: string | null;
                specialty?: SpecialtyType;
              } | null;
              const sub = leave.substitute as { full_name?: string; full_name_ar?: string | null } | null;

              const statusColors: Record<string, string> = {
                approved: "bg-green-100 text-green-700",
                rejected: "bg-red-100 text-red-700",
                cancelled: "bg-gray-100 text-gray-600",
                completed: "bg-blue-100 text-blue-700",
              };

              return (
                <div key={leave.id} className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-navy">
                        {locale === "ar" ? (tech?.full_name_ar || tech?.full_name) : tech?.full_name}
                      </p>
                      <p className="text-xs text-navy/50 mt-0.5">
                        {leave.start_date} → {leave.end_date}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[leave.status] || "bg-gray-100 text-gray-600"}`}>
                      {leave.status}
                    </span>
                  </div>
                  {sub && leave.status === "approved" && (
                    <p className="text-xs text-nile-green mt-2">
                      {locale === "ar" ? "البديل" : "Substitute"}: {locale === "ar" ? (sub.full_name_ar || sub.full_name) : sub.full_name}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
