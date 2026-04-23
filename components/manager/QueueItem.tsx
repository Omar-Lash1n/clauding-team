"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Check, X, Eye, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { approveReport, rejectReport } from "@/lib/manager/actions";
import toast from "react-hot-toast";
import type { PriorityLevel } from "@/types/domain";

interface QueueItemProps {
  id: string;
  categoryName: string;
  priority: PriorityLevel;
  addressDescription: string | null;
  reporterName: string;
  description: string;
  photoUrl?: string | null;
  hasDuplicate?: boolean;
  onActionComplete?: () => void;
}

export function QueueItem({
  id,
  categoryName,
  priority,
  addressDescription,
  reporterName,
  description,
  photoUrl,
  hasDuplicate,
  onActionComplete,
}: QueueItemProps) {
  const t = useTranslations("manager");
  const tPriorities = useTranslations("priorities");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Approve dialog state
  const [makePublic, setMakePublic] = useState(false);
  const [overridePriority, setOverridePriority] = useState<PriorityLevel | "">("");

  // Reject dialog state
  const [rejectReason, setRejectReason] = useState("");

  const priorityColors: Record<PriorityLevel, string> = {
    critical: "bg-red-600 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-amber-500 text-white",
    low: "bg-sky-500 text-white",
    scheduled: "bg-slate-400 text-white",
  };

  async function handleApprove() {
    setLoading(true);
    const result = await approveReport({
      reportId: id,
      makePublic,
      overridePriority: overridePriority || undefined,
    });

    if (result.ok) {
      toast.success(t("approve.success"));
      setShowApproveDialog(false);
      onActionComplete?.();
    } else {
      toast.error(t("approve.error"));
    }
    setLoading(false);
  }

  async function handleReject() {
    if (rejectReason.length < 5) return;
    setLoading(true);
    const result = await rejectReport({ reportId: id, reason: rejectReason });

    if (result.ok) {
      toast.success(t("reject.success"));
      setShowRejectDialog(false);
      onActionComplete?.();
    } else {
      toast.error(t("reject.error"));
    }
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-border-neutral bg-white shadow-card transition-all hover:shadow-card-hover">
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Photo thumbnail */}
        {photoUrl && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border-neutral bg-gray-50">
            <Image 
              src={photoUrl} 
              alt="" 
              fill
              sizes="56px"
              className="object-cover" 
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-navy truncate">{categoryName}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", priorityColors[priority])}>
              {tPriorities(priority as Parameters<typeof tPriorities>[0])}
            </span>
            {hasDuplicate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                <AlertCircle className="h-3 w-3" />
                {t("queue.duplicateIndicator")}
              </span>
            )}
          </div>
          {addressDescription && (
            <p className="text-xs text-navy/50 mt-0.5 truncate">{addressDescription}</p>
          )}
          <p className="text-xs text-navy/40 mt-0.5">{reporterName}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg p-2 text-navy/50 hover:bg-sky-white hover:text-navy"
            aria-label="Expand"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowApproveDialog(true)}
            className="rounded-lg bg-nile-green px-3 py-1.5 text-xs font-medium text-white hover:brightness-95"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowRejectDialog(true)}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:brightness-95"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="border-t border-border-neutral p-4 bg-sky-white/50">
          <p className="text-sm text-navy">{description}</p>
        </div>
      )}

      {/* Approve dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowApproveDialog(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-navy mb-4">{t("approvalDialog.title")}</h3>

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={makePublic}
                onChange={(e) => setMakePublic(e.target.checked)}
                className="rounded border-border-neutral"
              />
              <span className="text-sm text-navy">{t("approvalDialog.makePublic")}</span>
            </label>

            <div className="mb-4">
              <label className="mb-1 block text-sm text-navy/70">{t("approvalDialog.overridePriority")}</label>
              <select
                value={overridePriority}
                onChange={(e) => setOverridePriority(e.target.value as PriorityLevel | "")}
                className="w-full rounded-lg border border-border-neutral px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {(["critical", "high", "medium", "low", "scheduled"] as const).map((p) => (
                  <option key={p} value={p}>
                    {tPriorities(p)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowApproveDialog(false)} className="rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-sky-white">
                {tCommon("cancel")}
              </button>
              <button onClick={handleApprove} disabled={loading} className="rounded-lg bg-nile-green px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50">
                {t("approvalDialog.confirmApproval")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowRejectDialog(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-navy mb-4">{t("rejectDialog.title")}</h3>

            <div className="mb-4">
              <label className="mb-1 block text-sm text-navy/70">{t("rejectDialog.reason")}</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("rejectDialog.reasonPlaceholder")}
                rows={3}
                className="w-full rounded-lg border border-border-neutral px-3 py-2 text-sm resize-none focus:border-nile-green focus:outline-none focus:ring-1 focus:ring-nile-green"
              />
              {rejectReason.length > 0 && rejectReason.length < 5 && (
                <p className="text-xs text-red-500 mt-1">{t("rejectDialog.reasonMinChars")}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRejectDialog(false)} className="rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-sky-white">
                {tCommon("cancel")}
              </button>
              <button onClick={handleReject} disabled={loading || rejectReason.length < 5} className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50">
                {t("rejectDialog.confirmRejection")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

