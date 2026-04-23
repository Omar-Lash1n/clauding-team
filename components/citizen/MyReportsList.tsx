"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ReportCard } from "@/components/citizen/ReportCard";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils/cn";
import { ClipboardList } from "lucide-react";
import type { ReportSummary } from "@/lib/citizen/queries";

type FilterKey = "all" | "active" | "resolved" | "archived";

const FILTERS: FilterKey[] = ["all", "active", "resolved", "archived"];

interface MyReportsListProps {
  initialReports: ReportSummary[];
}

export function MyReportsList({ initialReports }: MyReportsListProps) {
  const t = useTranslations("citizen.list");
  const td = useTranslations("citizen.dashboard");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [reports, setReports] = useState(initialReports);

  useEffect(() => {
    setReports(initialReports);
  }, [initialReports]);

  const ACTIVE_STATUSES = ["submitted", "approved", "assigned", "in_progress"];
  const RESOLVED_STATUSES = ["resolved", "rated", "archived"];

  const filtered = reports.filter((r) => {
    switch (filter) {
      case "active":
        return ACTIVE_STATUSES.includes(r.status);
      case "resolved":
        return RESOLVED_STATUSES.includes(r.status);
      case "archived":
        return r.status === "archived";
      default:
        return true;
    }
  });

  const filterLabels: Record<FilterKey, string> = {
    all: t("filterAll"),
    active: t("filterActive"),
    resolved: t("filterResolved"),
    archived: t("filterArchived"),
  };

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f
                ? "bg-[#3E7D60] text-white"
                : "bg-[#F0F7FF] text-[#1C2D5B]/60 hover:bg-[#C7E1D4]/30"
            )}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* Reports list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={td("empty")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
