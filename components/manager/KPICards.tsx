"use client";

import { useTranslations } from "next-intl";
import { BarChart3, Clock, AlertTriangle, CheckCircle, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface KPICardsProps {
  submitted: number;
  active: number;
  completedToday: number;
  escalated: number;
  avgResolutionHours: number;
  totalSpent: number;
}

const CARD_CONFIG = [
  { key: "submitted", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  { key: "active", icon: BarChart3, color: "text-nile-green", bg: "bg-nile-green-50" },
  { key: "completedToday", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  { key: "escalated", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  { key: "avgResolution", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
  { key: "totalSpent", icon: Wallet, color: "text-purple-600", bg: "bg-purple-50" },
] as const;

export function KPICards({
  submitted,
  active,
  completedToday,
  escalated,
  avgResolutionHours,
  totalSpent,
}: KPICardsProps) {
  const t = useTranslations("manager");

  const values: Record<string, string | number> = {
    submitted,
    active,
    completedToday,
    escalated,
    avgResolution: avgResolutionHours.toFixed(1),
    totalSpent: totalSpent.toLocaleString(),
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {CARD_CONFIG.map(({ key, icon: Icon, color, bg }) => (
        <div
          key={key}
          className="rounded-xl border border-border-neutral bg-white p-4 shadow-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("rounded-lg p-2", bg)}>
              <Icon className={cn("h-4 w-4", color)} />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy">{values[key]}</p>
          <p className="text-xs text-navy/50 mt-1">
            {t(`kpis.${key}` as Parameters<typeof t>[0])}
          </p>
        </div>
      ))}
    </div>
  );
}
