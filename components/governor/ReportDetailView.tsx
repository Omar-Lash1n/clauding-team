"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { overridePublicFlag, addGovernorNote } from "@/lib/governor/actions";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDateTime, formatCurrency } from "@/lib/utils/format";
import { ArrowLeft, Globe, Lock, Send } from "lucide-react";
import Link from "next/link";
import type { ReportStatus, PriorityLevel } from "@/types/domain";

interface ReportData {
  id: string;
  status: ReportStatus;
  priority: PriorityLevel;
  description: string;
  address_description: string | null;
  is_public: boolean;
  submitted_at: string;
  approved_at: string | null;
  assigned_at: string | null;
  started_at: string | null;
  resolved_at: string | null;
  resolved_cost: number | null;
  sla_pickup_deadline: string | null;
  sla_resolve_deadline: string | null;
  location_lat: number;
  location_lng: number;
  category: { name_en: string; name_ar: string } | null;
  district: { name_en: string; name_ar: string } | null;
  reporter: { full_name: string; full_name_ar: string | null; email: string; phone: string | null } | null;
  technician: { full_name: string; full_name_ar: string | null; specialty: string | null } | null;
}

interface ReportDetailViewProps {
  report: ReportData;
}

export function ReportDetailView({ report }: ReportDetailViewProps) {
  const t = useTranslations("governor.actions");
  const tErrors = useTranslations("governor.errors");
  const locale = useLocale();
  const [isPublic, setIsPublic] = useState(report.is_public);
  const [noteText, setNoteText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleTogglePublic(checked: boolean) {
    startTransition(async () => {
      const result = await overridePublicFlag(report.id, checked);
      if (result.error) {
        toast.error(tErrors("overrideFailed"));
      } else {
        setIsPublic(checked);
        toast.success(checked ? t("override.publicOn") : t("override.publicOff"));
      }
    });
  }

  function handleSendNote() {
    if (!noteText.trim()) return;
    startTransition(async () => {
      const result = await addGovernorNote(report.id, noteText.trim());
      if (result.error) {
        toast.error(tErrors("noteFailed"));
      } else {
        toast.success(t("noteSaved"));
        setNoteText("");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/governor/situation-room`}
        className="inline-flex items-center gap-1 text-sm text-navy/50 hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === "ar" ? "العودة" : "Back"}
      </Link>

      <div className="rounded-xl border border-border-neutral bg-white p-6 md:p-8 shadow-card space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={report.status} />
          <PriorityBadge priority={report.priority} />
          <span className="text-sm text-navy/40">
            {locale === "ar" ? report.district?.name_ar : report.district?.name_en}
          </span>
          <span className="text-sm text-navy/40">
            {locale === "ar" ? report.category?.name_ar : report.category?.name_en}
          </span>
        </div>

        {/* Description */}
        <p className="text-base text-navy leading-relaxed">{report.description}</p>
        {report.address_description && (
          <p className="text-sm text-navy/60">{report.address_description}</p>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border-neutral pt-4">
          <div>
            <p className="text-xs text-navy/40">{locale === "ar" ? "تاريخ التقديم" : "Submitted"}</p>
            <p className="text-sm font-medium text-navy">{formatDateTime(report.submitted_at, locale)}</p>
          </div>
          {report.resolved_at && (
            <div>
              <p className="text-xs text-navy/40">{locale === "ar" ? "تم الحل" : "Resolved"}</p>
              <p className="text-sm font-medium text-navy">{formatDateTime(report.resolved_at, locale)}</p>
            </div>
          )}
          {report.resolved_cost != null && (
            <div>
              <p className="text-xs text-navy/40">{locale === "ar" ? "التكلفة" : "Cost"}</p>
              <p className="text-sm font-medium text-navy">{formatCurrency(report.resolved_cost, locale)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-navy/40">{locale === "ar" ? "المُبلّغ" : "Reporter"}</p>
            <p className="text-sm font-medium text-navy">
              {locale === "ar"
                ? report.reporter?.full_name_ar ?? report.reporter?.full_name
                : report.reporter?.full_name}
            </p>
          </div>
          {report.technician && (
            <div>
              <p className="text-xs text-navy/40">{locale === "ar" ? "الفني" : "Technician"}</p>
              <p className="text-sm font-medium text-navy">
                {locale === "ar"
                  ? report.technician.full_name_ar ?? report.technician.full_name
                  : report.technician.full_name}
              </p>
            </div>
          )}
        </div>

        {/* Governor Actions */}
        <div className="border-t border-border-neutral pt-6 space-y-4">
          {/* Public flag override */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-nile-green" />
              ) : (
                <Lock className="h-4 w-4 text-navy/40" />
              )}
              <span className="text-sm font-medium text-navy">
                {isPublic ? t("override.publicOn") : t("override.publicOff")}
              </span>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              disabled={isPending}
            />
          </div>

          {/* Add note */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-navy">{t("addNote")}</Label>
            <div className="flex gap-2">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={locale === "ar" ? "اكتب ملاحظة..." : "Write a note..."}
                className="flex-1 min-h-[80px]"
              />
              <Button
                onClick={handleSendNote}
                disabled={isPending || !noteText.trim()}
                className="bg-navy hover:bg-navy/90 self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
