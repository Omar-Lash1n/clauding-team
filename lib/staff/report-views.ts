import { STATUS_COLORS } from "@/lib/constants";
import { PRIORITY_COLORS } from "@/lib/workflow/priorities";
import { timeRemaining, isBreached } from "@/lib/workflow/sla";
import type { ReportStatus, PriorityLevel } from "@/types/domain";

export function getStatusStyle(status: ReportStatus) {
  return STATUS_COLORS[status];
}

export function getPriorityStyle(priority: PriorityLevel) {
  return PRIORITY_COLORS[priority];
}

export function formatSlaRemaining(
  deadline: string | null | undefined
): { text: string; breached: boolean; minutes: number; urgent: boolean } | null {
  if (!deadline) return null;
  const remaining = timeRemaining(deadline);
  const absMinutes = Math.abs(remaining.minutes);
  return {
    text: remaining.label,
    breached: remaining.breached,
    minutes: absMinutes,
    urgent: !remaining.breached && absMinutes < 60,
  };
}

export function isSlaBreached(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  return isBreached(deadline);
}

export function getSlaProgress(deadline: string | null | undefined, totalMinutes: number): number {
  if (!deadline) return 0;
  const remaining = timeRemaining(deadline);
  if (remaining.breached) return 100;
  const elapsed = totalMinutes - remaining.minutes;
  return Math.min(100, Math.max(0, (elapsed / totalMinutes) * 100));
}

export function getSlaColor(deadline: string | null | undefined): string {
  if (!deadline) return "text-gray-400";
  const remaining = timeRemaining(deadline);
  if (remaining.breached) return "text-red-600";
  if (remaining.minutes < 60) return "text-orange-500";
  if (remaining.minutes < 240) return "text-amber-500";
  return "text-nile-green";
}

export function getSlaRingColor(deadline: string | null | undefined): string {
  if (!deadline) return "#9CA3AF";
  const remaining = timeRemaining(deadline);
  if (remaining.breached) return "#DC2626";
  if (remaining.minutes < 60) return "#F97316";
  if (remaining.minutes < 240) return "#F59E0B";
  return "#3E7D60";
}
