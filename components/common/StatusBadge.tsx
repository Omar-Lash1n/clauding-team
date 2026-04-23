"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { STATUS_COLORS } from "@/lib/constants";
import type { ReportStatus } from "@/types/domain";

interface StatusBadgeProps {
  status: ReportStatus;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const t = useTranslations("statuses");
  const colors = STATUS_COLORS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        colors.bg,
        colors.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {t(status)}
    </span>
  );
}
