"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { formatRelative } from "@/lib/utils/format";
import { getCategoryIcon } from "@/lib/citizen/category-icons";
import type { ReportSummary } from "@/lib/citizen/queries";

interface ReportCardProps {
  report: ReportSummary;
}

export function ReportCard({ report }: ReportCardProps) {
  const tc = useTranslations("common");
  const locale = useLocale();

  const CategoryIcon = getCategoryIcon(report.category?.icon_name ?? "");
  const categoryName =
    locale === "ar"
      ? (report.category?.name_ar ?? "")
      : (report.category?.name_en ?? "");

  const descPreview =
    report.description.length > 80
      ? report.description.slice(0, 80) + "…"
      : report.description;

  return (
    <Link href={`/${locale}/citizen/report/${report.id}`}>
      <Card className="transition-shadow hover:shadow-md active:scale-[0.99]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5 rounded-xl bg-[#F0F7FF] p-2">
              <CategoryIcon className="h-5 w-5 text-[#3E7D60]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <StatusBadge status={report.status} />
                <PriorityBadge priority={report.priority} />
              </div>
              <p className="text-sm text-[#1C2D5B] font-medium truncate">
                {categoryName}
              </p>
              <p className="text-xs text-[#1C2D5B]/60 mt-0.5 line-clamp-2">
                {descPreview}
              </p>
              <p className="text-xs text-[#1C2D5B]/40 mt-1">
                {formatRelative(report.submitted_at, locale)}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 text-[#1C2D5B]/30 shrink-0 mt-1 rtl:rotate-180" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
