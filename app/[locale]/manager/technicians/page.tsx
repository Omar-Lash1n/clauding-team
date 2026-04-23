import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/staff/queries";
import { getTechnicianRanking } from "@/lib/manager/queries";
import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import { TechnicianAvatar } from "@/components/staff/TechnicianAvatar";
import { cn } from "@/lib/utils/cn";
import type { SpecialtyType } from "@/types/domain";

interface TechniciansPageProps {
  params: Promise<{ locale: string }>;
}

export default async function TechniciansPage({ params }: TechniciansPageProps) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "manager" });
  const profile = await getCurrentProfile(supabase);

  if (!profile?.district_id) return null;

  const technicians = await getTechnicianRanking(supabase, profile.district_id);
  const maxWorkload = Math.max(...technicians.map((t) => t.workload_score || 1), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-navy" />
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("technicians.title")}</h1>
          <p className="text-sm text-navy/50 mt-0.5">{t("technicians.subtitle")}</p>
        </div>
      </div>

      <div className="space-y-3">
        {technicians.map((tech) => {
          const workloadPercent = ((tech.workload_score || 0) / maxWorkload) * 100;
          const displayName = locale === "ar" ? (tech.full_name_ar || tech.full_name || "") : (tech.full_name || "");

          return (
            <div
              key={tech.technician_id}
              className="rounded-xl border border-border-neutral bg-white p-4 shadow-card"
            >
              <div className="flex items-center justify-between gap-4">
                <TechnicianAvatar
                  name={tech.full_name || ""}
                  nameAr={tech.full_name_ar}
                  specialty={tech.specialty as SpecialtyType | null}
                  size="md"
                />

                <div className="flex items-center gap-3">
                  {tech.is_on_leave && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {t("technicians.onLeave")}
                    </span>
                  )}
                  <div className="text-end">
                    <p className="text-sm font-semibold text-navy">{tech.active_tasks || 0}</p>
                    <p className="text-xs text-navy/50">{t("technicians.activeTasks")}</p>
                  </div>
                </div>
              </div>

              {/* Workload bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-navy/50 mb-1">
                  <span>{t("technicians.workloadBar")}</span>
                  <span>{tech.workload_score || 0}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      workloadPercent > 80 ? "bg-red-400" : workloadPercent > 50 ? "bg-amber-400" : "bg-nile-green"
                    )}
                    style={{ width: `${Math.max(workloadPercent, 2)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {technicians.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-navy/50">
              {locale === "ar" ? "لا يوجد فنيون في هذا القسم" : "No technicians in this district"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
