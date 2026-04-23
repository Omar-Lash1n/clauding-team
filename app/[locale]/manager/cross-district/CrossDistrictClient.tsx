"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, XCircle } from "lucide-react";
import { requestCrossDistrict, revokeCrossDistrict } from "@/lib/manager/actions";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

interface CrossDistrictClientProps {
  locale: string;
  districts: { id: string; name: string }[];
  requests: {
    id: string;
    targetDistrictName: string;
    status: string;
    reason: string;
    createdAt: string;
    expiresAt: string | null;
  }[];
}

export function CrossDistrictClient({
  locale,
  districts,
  requests,
}: CrossDistrictClientProps) {
  const t = useTranslations("manager");
  const [loading, setLoading] = useState(false);
  const [targetDistrict, setTargetDistrict] = useState("");
  const [reason, setReason] = useState("");

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    expired: "bg-gray-100 text-gray-600",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.length < 20 || !targetDistrict) return;

    setLoading(true);
    const result = await requestCrossDistrict({
      targetDistrictId: targetDistrict,
      reason,
    });

    if (result.ok) {
      toast.success(t("newRequest.success"));
      setTargetDistrict("");
      setReason("");
    } else {
      toast.error(t("newRequest.error"));
    }
    setLoading(false);
  }

  async function handleRevoke(requestId: string) {
    setLoading(true);
    const result = await revokeCrossDistrict({ requestId });
    if (result.ok) {
      toast.success(t("revoke.success"));
    } else {
      toast.error(t("revoke.error"));
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* New request form */}
      <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-navy">
              {t("newRequest.targetDistrict")}
            </label>
            <select
              value={targetDistrict}
              onChange={(e) => setTargetDistrict(e.target.value)}
              className="w-full rounded-lg border border-border-neutral px-4 py-2.5 text-sm text-navy focus:border-nile-green focus:outline-none focus:ring-1 focus:ring-nile-green"
              required
            >
              <option value="">—</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-navy">
              {t("newRequest.reason")}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("newRequest.reasonPlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-border-neutral px-4 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:border-nile-green focus:outline-none focus:ring-1 focus:ring-nile-green resize-none"
              required
              minLength={20}
            />
            {reason.length > 0 && reason.length < 20 && (
              <p className="text-xs text-red-500 mt-1">{t("newRequest.reasonMinChars")}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !targetDistrict || reason.length < 20}
            className="inline-flex items-center gap-2 rounded-lg bg-nile-green px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            {t("newRequest.submit")}
          </button>
        </form>
      </div>

      {/* Request history */}
      {requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => {
            const now = new Date();
            const isActiveApproved = req.status === "approved" && req.expiresAt && new Date(req.expiresAt) > now;

            return (
              <div key={req.id} className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy">{req.targetDistrictName}</p>
                    <p className="text-xs text-navy/50 mt-0.5">{req.reason}</p>
                    <p className="text-xs text-navy/40 mt-0.5">
                      {new Date(req.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                    </p>
                    {req.expiresAt && req.status === "approved" && (
                      <p className="text-xs text-nile-green mt-0.5">
                        {locale === "ar" ? "ينتهي في" : "Expires"}: {new Date(req.expiresAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[req.status] || "bg-gray-100 text-gray-600")}>
                      {req.status}
                    </span>
                    {isActiveApproved && (
                      <button
                        onClick={() => handleRevoke(req.id)}
                        disabled={loading}
                        className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
