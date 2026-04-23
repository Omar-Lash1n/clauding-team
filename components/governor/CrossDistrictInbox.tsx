"use client";

import { useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { approveCrossDistrict, rejectCrossDistrict } from "@/lib/governor/actions";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils/format";
import { CheckCircle2, XCircle, ArrowLeftRight } from "lucide-react";
import { DISTRICT_NAMES } from "@/lib/constants";

interface CrossDistrictRequest {
  id: string;
  reason: string;
  created_at: string;
  requesting_dm: { id: string; full_name: string; full_name_ar: string | null; district_id: string | null } | null;
  target_district: { id: string; name_en: string; name_ar: string } | null;
}

interface CrossDistrictInboxProps {
  requests: CrossDistrictRequest[];
}

export function CrossDistrictInbox({ requests }: CrossDistrictInboxProps) {
  const t = useTranslations("governor.crossDistrict");
  const tErrors = useTranslations("governor.errors");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: string) {
    startTransition(async () => {
      const result = await approveCrossDistrict(id);
      if (result.error) {
        toast.error(tErrors("approvalFailed"));
      } else {
        toast.success(t("approve"));
      }
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      const result = await rejectCrossDistrict(id);
      if (result.error) {
        toast.error(tErrors("rejectionFailed"));
      } else {
        toast.success(t("reject"));
      }
    });
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border-neutral bg-sand-ivory/30 p-8 text-center">
        <ArrowLeftRight className="h-8 w-8 text-navy/20 mx-auto mb-3" />
        <p className="text-sm text-navy/50">{t("noPending")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const dmName = locale === "ar"
          ? req.requesting_dm?.full_name_ar ?? req.requesting_dm?.full_name
          : req.requesting_dm?.full_name;
        const dmDistrict = req.requesting_dm?.district_id
          ? DISTRICT_NAMES[req.requesting_dm.district_id]
          : null;
        const targetName = locale === "ar"
          ? req.target_district?.name_ar
          : req.target_district?.name_en;

        return (
          <div
            key={req.id}
            className="rounded-xl border border-border-neutral bg-white p-5 shadow-card"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-semibold text-navy">
                  {dmName}
                  {dmDistrict && (
                    <span className="text-navy/40 font-normal">
                      {" — "}
                      {locale === "ar" ? dmDistrict.ar : dmDistrict.en}
                    </span>
                  )}
                </p>
                <p className="text-xs text-navy/50">
                  {t("targetDistrict")}: <span className="font-medium">{targetName}</span>
                </p>
                <p className="text-xs text-navy/60 mt-1">{req.reason}</p>
                <p className="text-xs text-navy/40 mt-1">
                  {formatRelative(req.created_at, locale)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  className="bg-nile-green hover:bg-nile-green/90 text-white"
                  onClick={() => handleApprove(req.id)}
                  disabled={isPending}
                >
                  <CheckCircle2 className="h-4 w-4 me-1" />
                  {t("approve")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#C94C4C]/30 text-[#C94C4C] hover:bg-[#C94C4C]/5"
                  onClick={() => handleReject(req.id)}
                  disabled={isPending}
                >
                  <XCircle className="h-4 w-4 me-1" />
                  {t("reject")}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
