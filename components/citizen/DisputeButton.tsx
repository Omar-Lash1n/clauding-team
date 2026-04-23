"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { Button } from "@/components/ui/button";
import { fileDispute } from "@/lib/citizen/actions";

interface DisputeButtonProps {
  reportId: string;
}

export function DisputeButton({ reportId }: DisputeButtonProps) {
  const t = useTranslations("citizen.dispute");
  const tc = useTranslations("citizen.errors");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [filed, setFiled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const result = await fileDispute(reportId);
    setLoading(false);
    if (!result.ok) {
      setError(tc("disputeFailed"));
      return;
    }
    setFiled(true);
  }

  if (filed) {
    return (
      <p className="text-sm font-medium text-orange-600">{t("filed")}</p>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50">
          {t("button")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("confirmBody")}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-xs text-red-600 px-1">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            {loading ? "…" : t("confirmCta")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
