"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, X } from "lucide-react";
import { cancelLeaveRequest } from "@/lib/technician/actions";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import type { LeaveStatus } from "@/types/domain";

interface LeaveRequestCardProps {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  substituteName?: string | null;
  substituteNameAr?: string | null;
  substituteSpecialty?: string | null;
}

const STATUS_STYLES: Record<LeaveStatus, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-100", text: "text-amber-700" },
  approved: { bg: "bg-green-100", text: "text-green-700" },
  rejected: { bg: "bg-red-100", text: "text-red-700" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-600" },
  completed: { bg: "bg-blue-100", text: "text-blue-700" },
};

export function LeaveRequestCard({
  id,
  startDate,
  endDate,
  reason,
  status,
  substituteName,
  substituteNameAr,
  substituteSpecialty,
}: LeaveRequestCardProps) {
  const t = useTranslations("technician");
  const tSpecialties = useTranslations("specialties");
  const locale = useLocale();
  const [cancelling, setCancelling] = useState(false);

  const statusStyle = STATUS_STYLES[status];

  async function handleCancel() {
    setCancelling(true);
    const result = await cancelLeaveRequest({ leaveId: id });
    if (result.ok) {
      toast.success(t("cancelRequest.success"));
    } else {
      toast.error(t("cancelRequest.error"));
    }
    setCancelling(false);
  }

  const displaySubName = locale === "ar" && substituteNameAr ? substituteNameAr : substituteName;
  const specialtyLabel = substituteSpecialty
    ? tSpecialties(substituteSpecialty as Parameters<typeof tSpecialties>[0])
    : "";

  return (
    <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-navy/50" />
          <span className="text-sm font-medium text-navy">
            {startDate} → {endDate}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            statusStyle.bg,
            statusStyle.text
          )}
        >
          {t(`leave.${status}` as Parameters<typeof t>[0])}
        </span>
      </div>

      <p className="mt-2 text-sm text-navy/70">{reason}</p>

      {status === "approved" && displaySubName && (
        <p className="mt-2 text-xs text-nile-green font-medium">
          {t("leave.coveredBy", { name: displaySubName, specialty: specialtyLabel })}
        </p>
      )}

      {status === "pending" && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="mt-3 inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          <X className="h-3 w-3" />
          {t("cancelRequest.button")}
        </button>
      )}
    </div>
  );
}
