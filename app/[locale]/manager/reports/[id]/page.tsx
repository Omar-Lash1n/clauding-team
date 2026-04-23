import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getReportDetail } from "@/lib/manager/queries";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils/cn";
import { SLARing } from "@/components/staff/SLARing";
import { PhotoGallery } from "@/components/staff/PhotoGallery";
import { TechnicianAvatar } from "@/components/staff/TechnicianAvatar";
import { getStatusStyle, getPriorityStyle } from "@/lib/staff/report-views";
import { MapPin, User, Phone } from "lucide-react";
import type { SpecialtyType } from "@/types/domain";

interface ReportDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { locale, id } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "manager" });
  const tStatuses = await getTranslations({ locale, namespace: "statuses" });
  const tPriorities = await getTranslations({ locale, namespace: "priorities" });

  let report;
  try {
    report = await getReportDetail(supabase, id);
  } catch {
    notFound();
  }
  if (!report) notFound();

  const category = report.category as { name_ar?: string; name_en?: string } | null;
  const reporter = report.reporter as { full_name?: string; full_name_ar?: string; phone?: string; national_id?: string } | null;
  const tech = report.technician as { id?: string; full_name?: string; full_name_ar?: string; specialty?: SpecialtyType; is_on_leave?: boolean } | null;
  const photos = (report.photos || []) as { id: string; storage_path: string; photo_type: string }[];
  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");

  const categoryName = locale === "ar" ? (category?.name_ar || category?.name_en || "") : (category?.name_en || "");
  const statusStyle = getStatusStyle(report.status);
  const priorityStyle = getPriorityStyle(report.priority);

  const reporterName = reporter
    ? (locale === "ar" ? (reporter.full_name_ar || reporter.full_name || "") : (reporter.full_name || ""))
    : "";

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/manager/reports`} className="inline-flex items-center gap-1 text-sm text-navy/50 hover:text-navy">
        ← {locale === "ar" ? "رجوع" : "Back"}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy">{categoryName}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", priorityStyle.bg, priorityStyle.fg)}>
              {tPriorities(report.priority as Parameters<typeof tPriorities>[0])}
            </span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusStyle.bg, statusStyle.text)}>
              {tStatuses(report.status as Parameters<typeof tStatuses>[0])}
            </span>
            {report.is_public && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                {locale === "ar" ? "عام" : "Public"}
              </span>
            )}
          </div>
        </div>
        <SLARing deadline={report.sla_resolve_deadline} size={56} />
      </div>

      {/* Reporter info */}
      <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
        <h3 className="text-sm font-semibold text-navy mb-3">{t("reportDetail.reporter")}</h3>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-white">
            <User className="h-5 w-5 text-navy/50" />
          </div>
          <div>
            <p className="text-sm font-medium text-navy">{reporterName}</p>
            {reporter?.phone && (
              <a href={`tel:${reporter.phone}`} className="flex items-center gap-1 text-xs text-nile-green hover:underline">
                <Phone className="h-3 w-3" />
                {reporter.phone}
              </a>
            )}
            {reporter?.national_id && (
              <p className="text-xs text-navy/40 mt-0.5">
                {t("reportDetail.nidLast4")}: ***{reporter.national_id.slice(-4)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Technician info */}
      {tech && (
        <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
          <h3 className="text-sm font-semibold text-navy mb-3">{t("reportDetail.technician")}</h3>
          <TechnicianAvatar
            name={tech.full_name || ""}
            nameAr={tech.full_name_ar}
            specialty={tech.specialty}
          />
        </div>
      )}

      {/* Description */}
      <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
        <p className="text-sm text-navy/70 leading-relaxed">{report.description}</p>
        {report.address_description && (
          <div className="mt-2 flex items-center gap-1 text-xs text-navy/50">
            <MapPin className="h-3 w-3" />
            {report.address_description}
          </div>
        )}
      </div>

      {/* Photos */}
      {beforePhotos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-navy mb-3">
            {locale === "ar" ? "صور قبل العمل" : "Before Photos"}
          </h3>
          <PhotoGallery photos={beforePhotos} />
        </div>
      )}
      {afterPhotos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-navy mb-3">
            {locale === "ar" ? "صور بعد العمل" : "After Photos"}
          </h3>
          <PhotoGallery photos={afterPhotos} />
        </div>
      )}

      {/* DM Actions */}
      <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
        <h3 className="text-sm font-semibold text-navy mb-3">{t("reportDetail.actions")}</h3>
        <div className="flex flex-wrap gap-2">
          {report.status === "approved" && (
            <Link
              href={`/${locale}/manager/assign/${report.id}`}
              className="rounded-lg bg-nile-green px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95"
            >
              {t("reportDetail.assignTech")}
            </Link>
          )}
          {(report.status === "assigned" || report.status === "in_progress") && (
            <Link
              href={`/${locale}/manager/assign/${report.id}`}
              className="rounded-lg border border-navy px-4 py-2.5 text-sm font-medium text-navy hover:bg-sky-white"
            >
              {t("reportDetail.reassign")}
            </Link>
          )}
        </div>
      </div>

      {/* Cost summary if resolved */}
      {report.resolved_cost !== null && (
        <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
          <p className="text-sm text-navy/70">
            {locale === "ar" ? "التكلفة" : "Cost"}: {report.resolved_cost?.toLocaleString()} EGP
          </p>
        </div>
      )}
    </div>
  );
}
