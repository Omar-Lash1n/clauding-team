"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserPlus, RotateCcw, XCircle } from "lucide-react";
import { resolveDispute } from "@/lib/manager/actions";
import { toast } from "sonner";

interface DisputeResolutionClientProps {
  disputeId: string;
  reportId: string;
  districtId: string;
  locale: string;
}

export function DisputeResolutionClient({
  disputeId,
  reportId,
  districtId,
  locale,
}: DisputeResolutionClientProps) {
  const t = useTranslations("manager");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeDialog, setActiveDialog] = useState<"assign_new" | "same_tech" | "reject" | null>(null);
  const [notes, setNotes] = useState("");

  async function handleSameTechBack() {
    if (notes.length < 5) return;
    setLoading(true);
    const result = await resolveDispute({
      disputeId,
      resolution: "same_tech_again",
      dmNotes: notes,
    });
    if (result.ok) {
      toast.success(t("sameTechBack.success"));
      router.refresh();
    } else {
      toast.error(t("sameTechBack.error"));
    }
    setLoading(false);
    setActiveDialog(null);
  }

  async function handleRejectDispute() {
    if (notes.length < 5) return;
    setLoading(true);
    const result = await resolveDispute({
      disputeId,
      resolution: "dispute_rejected",
      dmNotes: notes,
    });
    if (result.ok) {
      toast.success(t("rejectDispute.success"));
      router.refresh();
    } else {
      toast.error(t("rejectDispute.error"));
    }
    setLoading(false);
    setActiveDialog(null);
  }

  return (
    <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card space-y-4">
      <h3 className="text-lg font-semibold text-navy">
        {locale === "ar" ? "حل النزاع" : "Resolve Dispute"}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => router.push(`/${locale}/manager/assign/${reportId}?dispute=${disputeId}`)}
          className="flex flex-col items-center gap-2 rounded-xl border border-border-neutral p-4 hover:border-nile-green hover:bg-nile-green/5 transition-colors"
        >
          <UserPlus className="h-6 w-6 text-nile-green" />
          <span className="text-sm font-medium text-navy">{t("assignNew.button")}</span>
        </button>

        <button
          onClick={() => { setActiveDialog("same_tech"); setNotes(""); }}
          className="flex flex-col items-center gap-2 rounded-xl border border-border-neutral p-4 hover:border-amber-400 hover:bg-amber-50 transition-colors"
        >
          <RotateCcw className="h-6 w-6 text-amber-500" />
          <span className="text-sm font-medium text-navy">{t("sameTechBack.button")}</span>
        </button>

        <button
          onClick={() => { setActiveDialog("reject"); setNotes(""); }}
          className="flex flex-col items-center gap-2 rounded-xl border border-border-neutral p-4 hover:border-red-400 hover:bg-red-50 transition-colors"
        >
          <XCircle className="h-6 w-6 text-red-500" />
          <span className="text-sm font-medium text-navy">{t("rejectDispute.button")}</span>
        </button>
      </div>

      {/* Same tech dialog */}
      {activeDialog === "same_tech" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setActiveDialog(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-navy mb-4">{t("sameTechBack.title")}</h3>
            <div className="mb-4">
              <label className="mb-1 block text-sm text-navy/70">{t("sameTechBack.notesLabel")}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("sameTechBack.notesPlaceholder")}
                rows={3}
                className="w-full rounded-lg border border-border-neutral px-3 py-2 text-sm resize-none focus:border-nile-green focus:outline-none focus:ring-1 focus:ring-nile-green"
              />
              {notes.length > 0 && notes.length < 5 && (
                <p className="text-xs text-red-500 mt-1">{t("sameTechBack.notesMinChars")}</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setActiveDialog(null)} className="rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-sky-white">
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button onClick={handleSameTechBack} disabled={loading || notes.length < 5} className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50">
                {locale === "ar" ? "تأكيد" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject dispute dialog */}
      {activeDialog === "reject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setActiveDialog(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-navy mb-2">{t("rejectDispute.title")}</h3>
            <p className="text-sm text-red-600 mb-4">{t("rejectDispute.warning")}</p>
            <div className="mb-4">
              <label className="mb-1 block text-sm text-navy/70">{t("rejectDispute.notesLabel")}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("rejectDispute.notesPlaceholder")}
                rows={3}
                className="w-full rounded-lg border border-border-neutral px-3 py-2 text-sm resize-none focus:border-nile-green focus:outline-none focus:ring-1 focus:ring-nile-green"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setActiveDialog(null)} className="rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-sky-white">
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button onClick={handleRejectDispute} disabled={loading || notes.length < 5} className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50">
                {t("rejectDispute.button")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
