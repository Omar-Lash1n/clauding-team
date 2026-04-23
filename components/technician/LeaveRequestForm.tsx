"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus } from "lucide-react";
import { requestLeave } from "@/lib/technician/actions";
import { toast } from "sonner";

interface LeaveRequestFormProps {
  onSuccess?: () => void;
}

export function LeaveRequestForm({ onSuccess }: LeaveRequestFormProps) {
  const t = useTranslations("technician");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (reason.length < 10) {
      toast.error(t("leave.reason"));
      return;
    }

    setLoading(true);
    const result = await requestLeave({ startDate, endDate, reason });

    if (result.ok) {
      toast.success(t("requestLeave.success"));
      setStartDate("");
      setEndDate("");
      setReason("");
      onSuccess?.();
    } else {
      toast.error(t("requestLeave.error"));
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="mb-2 block text-sm font-medium text-navy">
            {t("leave.startDate")}
          </label>
          <input
            id="startDate"
            type="date"
            min={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-border-neutral bg-white px-4 py-2.5 text-sm text-navy focus:border-nile-green focus:outline-none focus:ring-1 focus:ring-nile-green"
            required
          />
        </div>
        <div>
          <label htmlFor="endDate" className="mb-2 block text-sm font-medium text-navy">
            {t("leave.endDate")}
          </label>
          <input
            id="endDate"
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-border-neutral bg-white px-4 py-2.5 text-sm text-navy focus:border-nile-green focus:outline-none focus:ring-1 focus:ring-nile-green"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="mb-2 block text-sm font-medium text-navy">
          {t("leave.reason")}
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("leave.reasonPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-border-neutral bg-white px-4 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:border-nile-green focus:outline-none focus:ring-1 focus:ring-nile-green resize-none"
          required
          minLength={10}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !startDate || !endDate || reason.length < 10}
        className="inline-flex items-center gap-2 rounded-lg bg-nile-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CalendarPlus className="h-4 w-4" />
        {loading ? tCommon("loading") : tCommon("submit")}
      </button>
    </form>
  );
}
