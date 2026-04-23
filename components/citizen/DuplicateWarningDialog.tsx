"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatRelative } from "@/lib/utils/format";
import type { NearbyReport } from "@/types/domain";

interface DuplicateWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: NearbyReport[];
  onContinue: () => void;
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  candidates,
  onContinue,
}: DuplicateWarningDialogProps) {
  const t = useTranslations("citizen.duplicate");
  const locale = useLocale();
  const shown = candidates.slice(0, 5);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm mx-4">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("subtitle")}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-2">
          {shown.map((c) => {
            const shortDesc =
              c.description.length > 80
                ? c.description.slice(0, 80) + "…"
                : c.description;
            const distM = Math.round(c.distance_meters);

            return (
              <div
                key={c.id}
                className="rounded-lg border border-[#DCE3EA] bg-[#F0F7FF] p-3 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={c.status} />
                  <span className="text-xs text-[#1C2D5B]/50">
                    {t("distance", { n: distM })}
                  </span>
                </div>
                <p className="text-xs text-[#1C2D5B]/70">{shortDesc}</p>
                <p className="text-xs text-[#1C2D5B]/40">
                  {formatRelative(c.submitted_at, locale)}
                </p>
                <Link
                  href={`/${locale}/citizen/report/${c.id}`}
                  className="text-xs text-[#3E7D60] font-medium hover:underline"
                  onClick={() => onOpenChange(false)}
                >
                  {t("followThis")} →
                </Link>
              </div>
            );
          })}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            {/* keep dialog open path: user chose follow-link above */}
            ×
          </AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>
            {t("continueAnyway")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
