import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getDisputeDetail } from "@/lib/manager/queries";
import { getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import { PhotoGallery } from "@/components/staff/PhotoGallery";
import { TechnicianAvatar } from "@/components/staff/TechnicianAvatar";
import { DisputeResolutionClient } from "./DisputeResolutionClient";
import type { SpecialtyType } from "@/types/domain";

interface DisputeDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function DisputeDetailPage({ params }: DisputeDetailPageProps) {
  const { locale, id } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "manager" });

  let dispute;
  try {
    dispute = await getDisputeDetail(supabase, id);
  } catch {
    notFound();
  }
  if (!dispute) notFound();

  const report = dispute.report as {
    id: string;
    district_id: string;
    category?: { name_ar?: string; name_en?: string };
    technician?: { id: string; full_name: string; full_name_ar?: string | null; specialty?: SpecialtyType };
    photos?: { id: string; storage_path: string; photo_type: string }[];
    description?: string;
  } | null;

  const feedback = dispute.feedback as { rating?: number; comment?: string } | null;

  const photos = (report?.photos || []) as { id: string; storage_path: string; photo_type: string }[];
  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");

  const catName = report?.category
    ? (locale === "ar" ? report.category.name_ar : report.category.name_en) || ""
    : "";

  const techName = report?.technician
    ? (locale === "ar" ? (report.technician.full_name_ar || report.technician.full_name) : report.technician.full_name)
    : "";

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/manager/disputes`} className="inline-flex items-center gap-1 text-sm text-navy/50 hover:text-navy">
        ← {locale === "ar" ? "رجوع" : "Back"}
      </Link>

      <h1 className="text-2xl font-bold text-navy">{t("disputeDetail.title")}</h1>

      {/* Report info */}
      <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
        <p className="text-sm font-semibold text-navy">{catName}</p>
        {report?.description && (
          <p className="text-sm text-navy/70 mt-2">{report.description}</p>
        )}
      </div>

      {/* Citizen feedback */}
      <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
        <h3 className="text-sm font-semibold text-navy mb-3">{t("disputeDetail.citizenFeedback")}</h3>
        {feedback?.rating !== undefined && (
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < (feedback.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
              />
            ))}
          </div>
        )}
        {feedback?.comment && (
          <p className="text-sm text-navy/70">{feedback.comment}</p>
        )}
      </div>

      {/* Before & after photos */}
      <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
        <h3 className="text-sm font-semibold text-navy mb-3">{t("disputeDetail.beforeAfter")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-navy/50 mb-2">{locale === "ar" ? "قبل" : "Before"}</p>
            <PhotoGallery photos={beforePhotos} />
          </div>
          <div>
            <p className="text-xs text-navy/50 mb-2">{locale === "ar" ? "بعد" : "After"}</p>
            <PhotoGallery photos={afterPhotos} />
          </div>
        </div>
      </div>

      {/* Original technician */}
      {report?.technician && (
        <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
          <h3 className="text-sm font-semibold text-navy mb-3">{t("disputeDetail.originalTechnician")}</h3>
          <TechnicianAvatar
            name={report.technician.full_name}
            nameAr={report.technician.full_name_ar}
            specialty={report.technician.specialty}
          />
        </div>
      )}

      {/* Resolution panel */}
      {!dispute.resolved_at && (
        <DisputeResolutionClient
          disputeId={dispute.id}
          reportId={report?.id || ""}
          districtId={report?.district_id || ""}
          locale={locale}
        />
      )}

      {/* Already resolved */}
      {dispute.resolved_at && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-card">
          <p className="text-sm font-semibold text-green-700">
            {locale === "ar" ? "تم حل النزاع" : "Dispute resolved"}
          </p>
          {dispute.dm_notes && (
            <p className="text-sm text-green-600 mt-1">{dispute.dm_notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
