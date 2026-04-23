"use client";

import { useTranslations, useLocale } from "next-intl";
import { formatDateTime } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HistoryRequest {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  decided_at: string | null;
  expires_at: string | null;
  requesting_dm: { full_name: string; full_name_ar: string | null } | null;
  target_district: { name_en: string; name_ar: string } | null;
}

interface CrossDistrictHistoryTableProps {
  requests: HistoryRequest[];
}

export function CrossDistrictHistoryTable({ requests }: CrossDistrictHistoryTableProps) {
  const t = useTranslations("governor.crossDistrict");
  const locale = useLocale();

  if (requests.length === 0) {
    return (
      <p className="text-sm text-navy/40 py-4">{locale === "ar" ? "لا يوجد سجل" : "No history"}</p>
    );
  }

  return (
    <div className="rounded-xl border border-border-neutral bg-white shadow-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border-neutral">
            <TableHead className="text-navy font-semibold">{t("requestingDm")}</TableHead>
            <TableHead className="text-navy font-semibold">{t("targetDistrict")}</TableHead>
            <TableHead className="text-navy font-semibold">{locale === "ar" ? "الحالة" : "Status"}</TableHead>
            <TableHead className="text-navy font-semibold">{t("requestedAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.id} className="border-border-neutral">
              <TableCell className="font-medium">
                {locale === "ar"
                  ? req.requesting_dm?.full_name_ar ?? req.requesting_dm?.full_name
                  : req.requesting_dm?.full_name}
              </TableCell>
              <TableCell>
                {locale === "ar" ? req.target_district?.name_ar : req.target_district?.name_en}
              </TableCell>
              <TableCell>
                <Badge
                  variant={req.status === "approved" ? "default" : "destructive"}
                  className={req.status === "approved" ? "bg-nile-green" : ""}
                >
                  {req.status === "approved"
                    ? t("approve")
                    : req.status === "rejected"
                    ? t("reject")
                    : req.status}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-navy/50">
                {formatDateTime(req.decided_at ?? req.created_at, locale)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
