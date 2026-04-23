import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getReport } from "@/lib/citizen/queries";
import { getSignedUrl } from "@/lib/citizen/photo-upload";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { ReportTrackTimeline } from "@/components/citizen/ReportTrackTimeline";
import { EditGate } from "@/components/citizen/EditGate";
import { FeedbackForm } from "@/components/citizen/FeedbackForm";
import { DisputeButton } from "@/components/citizen/DisputeButton";
import { TrackMap } from "@/components/map/TrackMap";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelative, formatDateTime } from "@/lib/utils/format";
import { timeRemaining } from "@/lib/workflow/sla";
import { getCategoryIcon } from "@/lib/citizen/category-icons";
import type { ReportStatus } from "@/types/domain";

interface ReportDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id, locale } = await params;
  const t = await getTranslations("citizen.detail");
  const td = await getTranslations("citizen.dispute");
  const ts = await getTranslations("statuses");

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const report = await getReport(id);
  if (!report) notFound();

  const isOwner = report.reporter_id === user.id;

  // Generate signed URLs for photos
  const photoUrls: { id: string; url: string; type: string }[] = [];
  for (const photo of report.photos) {
    const url = await getSignedUrl(supabase, photo.storage_path, 3600);
    if (url) {
      photoUrls.push({ id: photo.id, url, type: photo.photo_type });
    }
  }
  const beforePhotos = photoUrls.filter((p) => p.type === "before");
  const afterPhotos = photoUrls.filter((p) => p.type === "after");

  const categoryName =
    locale === "ar"
      ? (report.category?.name_ar ?? "")
      : (report.category?.name_en ?? "");

  const districtName =
    locale === "ar"
      ? (report.district?.name_ar ?? "")
      : (report.district?.name_en ?? "");

  const techName = report.technician
    ? locale === "ar"
      ? (report.technician.full_name_ar ?? report.technician.full_name)
      : report.technician.full_name
    : null;

  const Icon = getCategoryIcon(report.category?.icon_name ?? "");

  // SLA remaining
  const showSla = ["approved", "assigned", "in_progress"].includes(report.status);
  let slaLabel = "";
  let slaBreached = false;
  if (showSla && report.sla_resolve_deadline) {
    const slaInfo = timeRemaining(report.sla_resolve_deadline);
    slaBreached = slaInfo.breached;
    const parts = slaInfo.label.split(":");
    if (parts.length >= 3) {
      slaLabel = `${parts[1]}h ${parts[2]}m`;
    } else if (parts.length >= 2) {
      slaLabel = `${parts[1]}m`;
    }
  }

  // Status-specific states
  const isRejected = report.status === "rejected";
  const isResolved = report.status === "resolved";
  const isRated = report.status === "rated";
  const isDisputed = report.status === "disputed";
  const hasFeedback = !!report.feedback;
  const hasDispute = !!report.dispute;
  const showFeedback = isResolved && !hasFeedback && isOwner;
  const showDisputeBtn = isRated && hasFeedback && report.feedback!.rating <= 2 && !hasDispute && isOwner;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={report.status} />
          <PriorityBadge priority={report.priority} />
        </div>
        <div className="flex items-center gap-2 text-xs text-[#1C2D5B]/50">
          <span>{t("submittedAt")}: {formatRelative(report.submitted_at, locale)}</span>
        </div>
      </div>

      {/* Rejected banner */}
      {isRejected && report.rejected_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-red-700">{t("rejectedTitle")}</h3>
            <p className="text-xs text-red-600 mt-1">
              {t("rejectedReason", { reason: report.rejected_reason })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-[#1C2D5B] mb-3">
            {t("timelineTitle")}
          </h3>
          <ReportTrackTimeline
            status={report.status}
            submittedAt={report.submitted_at}
            approvedAt={report.approved_at}
            assignedAt={report.assigned_at}
            startedAt={report.started_at}
            resolvedAt={report.resolved_at}
            rejectedReason={report.rejected_reason}
            locale={locale}
          />
        </CardContent>
      </Card>

      {/* Track Map */}
      <TrackMap
        reports={[
          {
            id: report.id,
            lat: report.location_lat,
            lng: report.location_lng,
            status: report.status,
            title: categoryName,
          },
        ]}
        className="h-48"
      />

      {/* Before Photos */}
      {beforePhotos.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-[#1C2D5B] mb-2">
              {t("photosBefore")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {beforePhotos.map((p) => (
                <div
                  key={p.id}
                  className="h-24 w-24 rounded-xl overflow-hidden border border-[#DCE3EA]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* After Photos */}
      {afterPhotos.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-[#1C2D5B] mb-2">
              {t("photosAfter")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {afterPhotos.map((p) => (
                <div
                  key={p.id}
                  className="h-24 w-24 rounded-xl overflow-hidden border border-[#DCE3EA]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#F0F7FF] p-2 shrink-0">
              <Icon className="h-5 w-5 text-[#3E7D60]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#1C2D5B]/50">{t("category")}</p>
              <p className="text-sm font-medium text-[#1C2D5B]">{categoryName}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-[#1C2D5B]/50">{t("district")}</p>
            <p className="text-sm text-[#1C2D5B]">{districtName}</p>
          </div>

          <div>
            <p className="text-xs text-[#1C2D5B]/50">{t("description")}</p>
            <p className="text-sm text-[#1C2D5B] whitespace-pre-wrap">
              {report.description}
            </p>
          </div>

          {report.address_description && (
            <div>
              <p className="text-xs text-[#1C2D5B]/50">{t("location")}</p>
              <p className="text-sm text-[#1C2D5B]">{report.address_description}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-[#1C2D5B]/50">
              {techName
                ? t("assignedTo", { name: techName })
                : t("pendingAssignment")}
            </p>
          </div>

          {showSla && slaLabel && (
            <div
              className={`text-xs font-medium ${
                slaBreached ? "text-red-600" : "text-[#3E7D60]"
              }`}
            >
              {slaBreached ? t("slaBreached") : t("slaRemaining")}: {slaLabel}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit / Cancel gate */}
      <EditGate reportId={report.id} status={report.status} isOwner={isOwner} />

      {/* Feedback form */}
      {showFeedback && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-[#1C2D5B] mb-3">
              {await getTranslations("citizen.feedback").then((tf) => tf("title"))}
            </h3>
            <FeedbackForm reportId={report.id} />
          </CardContent>
        </Card>
      )}

      {/* Dispute button */}
      {showDisputeBtn && <DisputeButton reportId={report.id} />}

      {/* Dispute status */}
      {hasDispute && report.dispute && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            {!report.dispute.resolution && (
              <p className="text-sm font-medium text-orange-700">
                {td("statusUnderReview")}
              </p>
            )}
            {report.dispute.resolution === "assign_new" && (
              <p className="text-sm font-medium text-orange-700">
                {td("statusReassigned")}
              </p>
            )}
            {report.dispute.resolution === "same_tech_again" && (
              <p className="text-sm font-medium text-orange-700">
                {td("statusSentBack")}
              </p>
            )}
            {report.dispute.resolution === "dispute_rejected" && (
              <div>
                <p className="text-sm font-medium text-orange-700">
                  {td("statusRejected")}
                </p>
                {report.dispute.dm_notes && (
                  <p className="text-xs text-orange-600 mt-1">
                    {report.dispute.dm_notes}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
