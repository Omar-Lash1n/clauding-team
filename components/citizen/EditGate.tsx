"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cancelReport } from "@/lib/citizen/actions";
import type { ReportStatus } from "@/types/domain";

interface EditGateProps {
  reportId: string;
  status: ReportStatus;
  isOwner: boolean;
}

export function EditGate({ reportId, status, isOwner }: EditGateProps) {
  const t = useTranslations("citizen.detail");
  const tc = useTranslations("common");
  const te = useTranslations("citizen.errors");
  const locale = useLocale();
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "submitted" || !isOwner) return null;

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    const result = await cancelReport(reportId);
    setCancelling(false);
    if (!result.ok) {
      setError(te("cancelFailed"));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => router.push(`/${locale}/citizen/report/${reportId}/edit`)}
      >
        <Pencil className="h-3.5 w-3.5" />
        {t("edit")}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
            {t("cancel")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("cancelConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-xs text-red-600 px-1">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? "…" : tc("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
