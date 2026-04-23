"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, Check, User } from "lucide-react";
import { assignTechnician } from "@/lib/manager/actions";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

interface TechnicianInfo {
  id: string;
  name: string;
  nameAr?: string | null;
  specialty: string;
  isOnLeave: boolean;
  activeTasks: number;
  workloadScore: number;
}

interface AssignPanelClientProps {
  reportId: string;
  locale: string;
  requiredSpecialty: string;
  recommended: TechnicianInfo[];
  others: TechnicianInfo[];
}

export function AssignPanelClient({
  reportId,
  locale,
  requiredSpecialty,
  recommended,
  others,
}: AssignPanelClientProps) {
  const t = useTranslations("manager");
  const tSpecialties = useTranslations("specialties");
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showMismatchDialog, setShowMismatchDialog] = useState<TechnicianInfo | null>(null);
  const [showOthers, setShowOthers] = useState(false);

  async function handleAssign(tech: TechnicianInfo) {
    const isMismatch = tech.specialty !== requiredSpecialty;

    if (isMismatch && !showMismatchDialog) {
      setShowMismatchDialog(tech);
      return;
    }

    setLoading(tech.id);
    setShowMismatchDialog(null);

    const result = await assignTechnician({ reportId, technicianId: tech.id });

    if (result.ok) {
      toast.success(t("assign.success"));
      router.push(`/${locale}/manager/reports/${reportId}`);
    } else {
      const errorKey = result.error === "technician_on_leave" ? "technicianOnLeave" : "error";
      toast.error(t(`errors.${errorKey}` as Parameters<typeof t>[0]));
    }
    setLoading(null);
  }

  function renderTechRow(tech: TechnicianInfo, isRecommended: boolean) {
    const isMismatch = tech.specialty !== requiredSpecialty;
    const displayName = locale === "ar" && tech.nameAr ? tech.nameAr : tech.name;

    return (
      <div
        key={tech.id}
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border-neutral bg-white p-4 transition-all",
          isRecommended && "ring-1 ring-nile-green/20",
          tech.isOnLeave && "opacity-60"
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nile-green/10 text-sm font-semibold text-nile-green">
          {displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-navy">{displayName}</span>
            {tech.isOnLeave && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                {locale === "ar" ? "في إجازة" : "On Leave"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-navy/50">
              {tSpecialties(tech.specialty as Parameters<typeof tSpecialties>[0])}
            </span>
            {isMismatch && (
              <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {t("specialtyMismatch.warning")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-navy/40">
            <span>{t("recommendedPanel.activeTasks")}: {tech.activeTasks}</span>
            <span>{t("recommendedPanel.workload")}: {tech.workloadScore}</span>
          </div>
        </div>

        <button
          onClick={() => handleAssign(tech)}
          disabled={loading === tech.id || tech.isOnLeave}
          className="shrink-0 rounded-lg bg-nile-green px-4 py-2 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === tech.id ? "..." : t("recommendedPanel.assignButton")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recommended */}
      <div>
        <h2 className="text-lg font-semibold text-navy mb-3">{t("recommendedPanel.title")}</h2>
        <div className="space-y-3">
          {recommended.length === 0 ? (
            <p className="text-sm text-navy/50">
              {locale === "ar" ? "لا يوجد فنيون موصى بهم" : "No recommended technicians available"}
            </p>
          ) : (
            recommended.map((tech) => renderTechRow(tech, true))
          )}
        </div>
      </div>

      {/* Other technicians */}
      {others.length > 0 && (
        <div>
          <button
            onClick={() => setShowOthers(!showOthers)}
            className="text-sm font-medium text-navy/60 hover:text-navy"
          >
            {t("otherTechnicians.title")} ({others.length}) {showOthers ? "▲" : "▼"}
          </button>
          {showOthers && (
            <div className="mt-3 space-y-3">
              {others.map((tech) => renderTechRow(tech, false))}
            </div>
          )}
        </div>
      )}

      {/* Mismatch dialog */}
      {showMismatchDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowMismatchDialog(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-navy">{t("specialtyMismatch.confirmTitle")}</h3>
            </div>
            <p className="text-sm text-navy/70 mb-4">{t("specialtyMismatch.confirmMessage")}</p>
            <p className="text-sm text-navy/70 mb-6">
              {t("specialtyMismatch.detail", {
                techSpecialty: tSpecialties(showMismatchDialog.specialty as Parameters<typeof tSpecialties>[0]),
                required: tSpecialties(requiredSpecialty as Parameters<typeof tSpecialties>[0]),
              })}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowMismatchDialog(null)}
                className="rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-sky-white"
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => handleAssign(showMismatchDialog)}
                disabled={!!loading}
                className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
              >
                {t("specialtyMismatch.confirmButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
