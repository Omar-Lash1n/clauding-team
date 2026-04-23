"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { formatNumber, formatCurrency } from "@/lib/utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DistrictRankingRow } from "@/lib/governor/queries";
import { cn } from "@/lib/utils/cn";

interface DistrictRankingProps {
  rows: DistrictRankingRow[];
}

export function DistrictRanking({ rows }: DistrictRankingProps) {
  const t = useTranslations("governor.ranking.columns");
  const locale = useLocale();
  const router = useRouter();

  return (
    <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border-neutral">
              <TableHead className="text-navy font-semibold">{t("rank")}</TableHead>
              <TableHead className="text-navy font-semibold">{t("district")}</TableHead>
              <TableHead className="text-navy font-semibold text-center">{t("active")}</TableHead>
              <TableHead className="text-navy font-semibold text-center">{t("avgResolution")}</TableHead>
              <TableHead className="text-navy font-semibold text-center">{t("escalations")}</TableHead>
              <TableHead className="text-navy font-semibold text-end">{t("spent")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.districtId}
                className="cursor-pointer hover:bg-sky-white border-border-neutral transition-colors"
                onClick={() =>
                  router.push(
                    `/${locale}/governor/situation-room?district=${row.districtId}`
                  )
                }
              >
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                      row.rank === 1
                        ? "bg-nile-green/10 text-nile-green"
                        : row.rank === 4
                        ? "bg-[#C94C4C]/10 text-[#C94C4C]"
                        : "bg-navy/5 text-navy"
                    )}
                  >
                    {formatNumber(row.rank, locale)}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-navy">
                  {locale === "ar" ? row.nameAr : row.nameEn}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {formatNumber(row.activeCount, locale)}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {row.avgResolutionHours > 0
                    ? `${formatNumber(Math.round(row.avgResolutionHours * 10) / 10, locale)}h`
                    : "—"}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  <span
                    className={cn(
                      row.escalationCount > 0 && "text-[#D9822F] font-semibold"
                    )}
                  >
                    {formatNumber(row.escalationCount, locale)}
                  </span>
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {formatCurrency(row.totalSpent, locale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
