"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X, Calendar, User } from "lucide-react";
import { approveLeave, rejectLeave } from "@/lib/manager/actions";
import { toast } from "sonner";

interface LeaveApprovalClientProps {
  leaveId: string;
  locale: string;
  techName: string;
  techSpecialty: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export function LeaveApprovalClient({
  leaveId,
  locale,
  techName,
  techSpecialty,
  startDate,
  endDate,
  reason,
}: LeaveApprovalClientProps) {
  const t = useTranslations("manager");
  const tSpecialties = useTranslations("specialties");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const result = await approveLeave({ leaveId });

    if (result.ok) {
      if (result.data.substituteName) {
        toast.success(t("approveLeave.success", { name: result.data.substituteName }));
      } else {
        toast.warning(t("approveLeave.successNoSub"));
      }
      setShowConfirm(false);
    } else {
      toast.error(t("approveLeave.error"));
    }
    setLoading(false);
  }

  async function handleReject() {
    setLoading(true);
    const result = await rejectLeave({ leaveId });

    if (result.ok) {
      toast.success(t("rejectLeave.success"));
    } else {
      toast.error(t("rejectLeave.error"));
    }
    setLoading(false);
  }

  return (
    <>
      <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-navy/50" />
              <span className="text-sm font-medium text-navy">{techName}</span>
              <span className="text-xs text-navy/40">
                {tSpecialties(techSpecialty as Parameters<typeof tSpecialties>[0])}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-navy/50">
              <Calendar className="h-3 w-3" />
              {startDate} → {endDate}
            </div>
            <p className="mt-2 text-sm text-navy/70">{reason}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading}
              className="rounded-lg bg-nile-green px-3 py-1.5 text-xs font-medium text-white hover:brightness-95 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:brightness-95 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-navy mb-4">{t("approveLeave.button")}</h3>
            <p className="text-sm text-navy/70 mb-6">
              {locale === "ar"
                ? `سيتم تعيين بديل تلقائياً للمهام النشطة لدى ${techName}. هل تريد المتابعة؟`
                : `This will auto-assign a substitute for active tasks currently with ${techName}. Continue?`}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowConfirm(false)} className="rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-sky-white">
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button onClick={handleApprove} disabled={loading} className="rounded-lg bg-nile-green px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50">
                {t("approveLeave.button")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
