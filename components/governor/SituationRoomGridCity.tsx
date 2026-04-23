"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { formatRelative } from "@/lib/utils/format";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { ReportStatus, PriorityLevel } from "@/types/domain";

interface ReportRow {
  id: string;
  status: ReportStatus;
  priority: PriorityLevel;
  description: string;
  submitted_at: string;
  sla_resolve_deadline: string | null;
  category: { name_en: string; name_ar: string } | null;
  district: { name_en: string; name_ar: string } | null;
  reporter: { full_name: string; full_name_ar: string | null } | null;
  technician: { full_name: string; full_name_ar: string | null } | null;
}

interface SituationRoomGridCityProps {
  reports: ReportRow[];
  totalCount: number;
}

export function SituationRoomGridCity({ reports, totalCount }: SituationRoomGridCityProps) {
  const t = useTranslations("governor.situationRoom");
  const locale = useLocale();

  if (reports.length === 0) {
    return <EmptyState title={t("empty")} />;
  }

  return (
    <div className="rounded-xl border border-border-neutral bg-white shadow-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border-neutral">
            <TableHead className="text-navy font-semibold">{t("columns.status")}</TableHead>
            <TableHead className="text-navy font-semibold">{t("columns.priority")}</TableHead>
            <TableHead className="text-navy font-semibold">{t("columns.district")}</TableHead>
            <TableHead className="text-navy font-semibold">{t("columns.category")}</TableHead>
            <TableHead className="text-navy font-semibold">{t("columns.reporter")}</TableHead>
            <TableHead className="text-navy font-semibold">{t("columns.technician")}</TableHead>
            <TableHead className="text-navy font-semibold">{t("columns.submitted")}</TableHead>
            <TableHead className="text-navy font-semibold" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((r) => (
            <TableRow key={r.id} className="border-border-neutral">
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={r.priority} />
              </TableCell>
              <TableCell className="text-sm">
                {locale === "ar" ? r.district?.name_ar : r.district?.name_en}
              </TableCell>
              <TableCell className="text-sm">
                {locale === "ar" ? r.category?.name_ar : r.category?.name_en}
              </TableCell>
              <TableCell className="text-sm">
                {locale === "ar"
                  ? r.reporter?.full_name_ar ?? r.reporter?.full_name
                  : r.reporter?.full_name}
              </TableCell>
              <TableCell className="text-sm">
                {r.technician
                  ? locale === "ar"
                    ? r.technician.full_name_ar ?? r.technician.full_name
                    : r.technician.full_name
                  : "—"}
              </TableCell>
              <TableCell className="text-xs text-navy/50">
                {formatRelative(r.submitted_at, locale)}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${locale}/governor/situation-room/${r.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
