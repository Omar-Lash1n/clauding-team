"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { PRIORITY_COLORS } from "@/lib/workflow/priorities";
import type { PriorityLevel } from "@/types/domain";

interface PriorityBadgeProps {
  priority: PriorityLevel;
  className?: string;
  size?: "sm" | "md";
}

export function PriorityBadge({ priority, className, size = "md" }: PriorityBadgeProps) {
  const t = useTranslations("priorities");
  const colors = PRIORITY_COLORS[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        colors.bg,
        colors.fg,
        className
      )}
    >
      {t(priority)}
    </span>
  );
}
