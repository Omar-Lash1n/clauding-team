"use client";

import { useTranslations } from "next-intl";
import {
  Clock,
  CheckCircle2,
  UserCheck,
  Wrench,
  PackageCheck,
  Star,
  Archive,
  XCircle,
  Ban,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";
import type { ReportStatus } from "@/types/domain";

interface TimelineStep {
  status: ReportStatus;
  icon: React.ElementType;
  labelKey: string;
  reachedAt?: string | null;
}

const NORMAL_FLOW: TimelineStep[] = [
  { status: "submitted", icon: Clock, labelKey: "submitted" },
  { status: "approved", icon: CheckCircle2, labelKey: "approved" },
  { status: "assigned", icon: UserCheck, labelKey: "assigned" },
  { status: "in_progress", icon: Wrench, labelKey: "in_progress" },
  { status: "resolved", icon: PackageCheck, labelKey: "resolved" },
  { status: "rated", icon: Star, labelKey: "rated" },
  { status: "archived", icon: Archive, labelKey: "archived" },
];

const STATUS_ORDER: ReportStatus[] = [
  "submitted",
  "approved",
  "assigned",
  "in_progress",
  "resolved",
  "rated",
  "disputed",
  "archived",
];

interface ReportTrackTimelineProps {
  status: ReportStatus;
  submittedAt: string;
  approvedAt?: string | null;
  assignedAt?: string | null;
  startedAt?: string | null;
  resolvedAt?: string | null;
  rejectedReason?: string | null;
  locale?: string;
}

export function ReportTrackTimeline({
  status,
  submittedAt,
  approvedAt,
  assignedAt,
  startedAt,
  resolvedAt,
  rejectedReason,
  locale = "ar",
}: ReportTrackTimelineProps) {
  const ts = useTranslations("statuses");

  if (status === "rejected") {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex gap-3">
        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700">{ts("rejected")}</p>
          {rejectedReason && (
            <p className="text-xs text-red-600 mt-1">{rejectedReason}</p>
          )}
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 flex gap-3">
        <Ban className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
        <p className="text-sm font-semibold text-gray-600">{ts("cancelled")}</p>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(status);

  const timestamps: Record<ReportStatus, string | null | undefined> = {
    submitted: submittedAt,
    approved: approvedAt,
    assigned: assignedAt,
    in_progress: startedAt,
    resolved: resolvedAt,
    rated: undefined,
    archived: undefined,
    disputed: undefined,
    rejected: undefined,
    cancelled: undefined,
  };

  return (
    <ol className="relative">
      {NORMAL_FLOW.map((step, idx) => {
        const isReached =
          STATUS_ORDER.indexOf(step.status) <= currentIndex;
        const isCurrent =
          step.status === status ||
          (status === "disputed" && step.status === "rated");
        const timestamp = timestamps[step.status];
        const Icon = step.icon;

        const isLast = idx === NORMAL_FLOW.length - 1;

        return (
          <li key={step.status} className="flex gap-3 pb-4 last:pb-0 relative">
            {/* Vertical connector line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute start-4 top-8 bottom-0 w-0.5 -translate-x-1/2",
                  isReached ? "bg-[#3E7D60]" : "bg-[#DCE3EA]"
                )}
              />
            )}

            {/* Icon */}
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                isReached
                  ? "border-[#3E7D60] bg-[#3E7D60] text-white"
                  : "border-[#DCE3EA] bg-white text-[#1C2D5B]/30",
                isCurrent && "ring-2 ring-[#3E7D60]/30 ring-offset-1"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Label + timestamp */}
            <div className="pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  isReached ? "text-[#1C2D5B]" : "text-[#1C2D5B]/40"
                )}
              >
                {ts(step.labelKey as Parameters<typeof ts>[0])}
              </p>
              {timestamp && (
                <p className="text-xs text-[#1C2D5B]/50 mt-0.5">
                  {formatDateTime(timestamp, locale)}
                </p>
              )}

              {/* Disputed sub-item */}
              {step.status === "rated" && status === "disputed" && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <p className="text-xs text-orange-700 font-medium">
                    {ts("disputed")}
                  </p>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
