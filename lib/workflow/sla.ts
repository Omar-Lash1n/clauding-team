import type { Database } from "@/types/database";

export type PriorityLevel = Database["public"]["Enums"]["priority_level"];

export interface SlaEntry {
  pickupMinutes: number;
  resolveMinutes: number;
  escalateMinutes: number;
}

export const SLA_MATRIX: Record<PriorityLevel, SlaEntry> = {
  critical: { pickupMinutes: 30, resolveMinutes: 120, escalateMinutes: 30 },
  high: { pickupMinutes: 240, resolveMinutes: 480, escalateMinutes: 240 },
  medium: { pickupMinutes: 1440, resolveMinutes: 2880, escalateMinutes: 1440 },
  low: { pickupMinutes: 4320, resolveMinutes: 10080, escalateMinutes: 4320 },
  scheduled: {
    pickupMinutes: 10080,
    resolveMinutes: 20160,
    escalateMinutes: 10080,
  },
};

export function computeSlaDeadlines(
  approvedAt: Date,
  priority: PriorityLevel
): { pickupAt: Date; resolveAt: Date } {
  const sla = SLA_MATRIX[priority];
  const pickupAt = new Date(
    approvedAt.getTime() + sla.pickupMinutes * 60 * 1000
  );
  const resolveAt = new Date(
    approvedAt.getTime() + sla.resolveMinutes * 60 * 1000
  );
  return { pickupAt, resolveAt };
}

export function isBreached(deadline: Date | string, now?: Date): boolean {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  const n = now ?? new Date();
  return d.getTime() < n.getTime();
}

export function timeRemaining(
  deadline: Date | string,
  now?: Date
): { minutes: number; breached: boolean; label: string } {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  const n = now ?? new Date();
  const diffMs = d.getTime() - n.getTime();
  const breached = diffMs < 0;
  const absMins = Math.round(Math.abs(diffMs) / 60000);
  const hours = Math.floor(absMins / 60);
  const mins = absMins % 60;

  let label: string;
  if (breached) {
    label =
      hours > 0
        ? `sla.breachedHoursAgo:${hours}:${mins}`
        : `sla.breachedMinsAgo:${absMins}`;
  } else {
    label =
      hours > 0
        ? `sla.hoursLeft:${hours}:${mins}`
        : `sla.minsLeft:${absMins}`;
  }

  return { minutes: breached ? -absMins : absMins, breached, label };
}
