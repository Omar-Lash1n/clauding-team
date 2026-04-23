import type { Database } from "@/types/database";

export type PriorityLevel = Database["public"]["Enums"]["priority_level"];

export const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  critical: 5,
  high: 3,
  medium: 2,
  low: 1,
  scheduled: 0.5,
};

export interface PriorityColor {
  bg: string;
  fg: string;
  heat: number;
}

export const PRIORITY_COLORS: Record<PriorityLevel, PriorityColor> = {
  critical: { bg: "bg-red-600", fg: "text-white", heat: 5 },
  high: { bg: "bg-orange-500", fg: "text-white", heat: 3 },
  medium: { bg: "bg-amber-500", fg: "text-white", heat: 2 },
  low: { bg: "bg-sky-500", fg: "text-white", heat: 1 },
  scheduled: { bg: "bg-slate-400", fg: "text-white", heat: 0.5 },
};

export function priorityLabelKey(p: PriorityLevel): string {
  return `priorities.${p}`;
}
