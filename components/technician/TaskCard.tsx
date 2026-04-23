"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SLARing } from "@/components/staff/SLARing";
import { getStatusStyle, getPriorityStyle, formatSlaRemaining } from "@/lib/staff/report-views";
import type { ReportStatus, PriorityLevel } from "@/types/domain";

interface TaskCardProps {
  id: string;
  categoryName: string;
  categoryIcon?: string;
  priority: PriorityLevel;
  status: ReportStatus;
  addressDescription: string | null;
  slaPickupDeadline: string | null;
  slaResolveDeadline: string | null;
  className?: string;
}

export function TaskCard({
  id,
  categoryName,
  priority,
  status,
  addressDescription,
  slaPickupDeadline,
  slaResolveDeadline,
  className,
}: TaskCardProps) {
  const locale = useLocale();
  const t = useTranslations("technician");
  const tStatuses = useTranslations("statuses");
  const tPriorities = useTranslations("priorities");

  const statusStyle = getStatusStyle(status);
  const priorityStyle = getPriorityStyle(priority);
  const deadline = status === "assigned" ? slaPickupDeadline : slaResolveDeadline;
  const slaInfo = formatSlaRemaining(deadline);

  const isUrgent = slaInfo && slaInfo.urgent;
  const isBreached = slaInfo && slaInfo.breached;

  return (
    <Link href={`/${locale}/technician/task/${id}`}>
      <div
        className={cn(
          "group rounded-xl border border-border-neutral bg-white p-4 shadow-card transition-all hover:shadow-card-hover",
          isUrgent && !isBreached && "border-amber-400 animate-pulse",
          isBreached && "border-red-400 border-2",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Category */}
            <p className="text-sm font-semibold text-navy truncate">{categoryName}</p>

            {/* Address */}
            {addressDescription && (
              <div className="mt-1 flex items-center gap-1 text-xs text-navy/50">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{addressDescription}</span>
              </div>
            )}

            {/* Badges */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  priorityStyle.bg,
                  priorityStyle.fg
                )}
              >
                {tPriorities(priority as Parameters<typeof tPriorities>[0])}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  statusStyle.bg,
                  statusStyle.text
                )}
              >
                {tStatuses(status as Parameters<typeof tStatuses>[0])}
              </span>
            </div>
          </div>

          {/* SLA Ring */}
          <SLARing deadline={deadline} size={44} />
        </div>

        {/* Action hint */}
        <div className="mt-3 pt-2 border-t border-border-neutral">
          {status === "assigned" ? (
            <span className="text-xs font-medium text-nile-green">
              {t("start.button")} →
            </span>
          ) : (
            <span className="text-xs font-medium text-navy/50">
              {t("task.title")} →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
