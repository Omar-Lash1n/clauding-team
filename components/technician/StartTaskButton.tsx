"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { startTask } from "@/lib/technician/actions";
import { toast } from "sonner";

interface StartTaskButtonProps {
  reportId: string;
  disabled?: boolean;
}

export function StartTaskButton({ reportId, disabled }: StartTaskButtonProps) {
  const t = useTranslations("technician");
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (loading) return;
    setLoading(true);

    const result = await startTask({ reportId });

    if (result.ok) {
      toast.success(t("start.success"));
    } else {
      toast.error(t("start.error"));
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading || disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-nile-green px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Play className="h-4 w-4" />
      {loading ? t("start.button") + "..." : t("start.button")}
    </button>
  );
}
