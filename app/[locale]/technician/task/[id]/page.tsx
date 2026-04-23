import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getTask } from "@/lib/technician/queries";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { MapPin, Phone, User } from "lucide-react";
import { SLARing } from "@/components/staff/SLARing";
import { PhotoGallery } from "@/components/staff/PhotoGallery";
import { StartTaskButton } from "@/components/technician/StartTaskButton";
import { ResolveTaskForm } from "@/components/technician/ResolveTaskForm";
import { cn } from "@/lib/utils/cn";
import { getStatusStyle, getPriorityStyle } from "@/lib/staff/report-views";

interface TaskDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { locale, id } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "technician" });
  const tStatuses = await getTranslations({ locale, namespace: "statuses" });
  const tPriorities = await getTranslations({ locale, namespace: "priorities" });

  let task;
  try {
    task = await getTask(supabase, id);
  } catch {
    notFound();
  }

  if (!task) notFound();

  const category = task.category as { name_ar?: string; name_en?: string; icon_name?: string } | null;
  const reporter = task.reporter as { full_name?: string; full_name_ar?: string; phone?: string } | null;
  const photos = (task.photos || []) as { id: string; storage_path: string; photo_type: string }[];

  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");

  const categoryName = locale === "ar"
    ? (category?.name_ar || category?.name_en || "")
    : (category?.name_en || "");

  const reporterFirstName = reporter
    ? (locale === "ar" ? (reporter.full_name_ar || reporter.full_name || "") : (reporter.full_name || "")).split(" ")[0]
    : "";

  const statusStyle = getStatusStyle(task.status);
  const priorityStyle = getPriorityStyle(task.priority);
  const deadline = task.status === "assigned" ? task.sla_pickup_deadline : task.sla_resolve_deadline;

  const mapsUrl = `geo:${task.location_lat},${task.location_lng}?q=${task.location_lat},${task.location_lng}`;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/${locale}/technician`}
        className="inline-flex items-center gap-1 text-sm text-navy/50 hover:text-navy"
      >
        ← {locale === "ar" ? "رجوع" : "Back"}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy">{categoryName}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", priorityStyle.bg, priorityStyle.fg)}>
              {tPriorities(task.priority as Parameters<typeof tPriorities>[0])}
            </span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusStyle.bg, statusStyle.text)}>
              {tStatuses(task.status as Parameters<typeof tStatuses>[0])}
            </span>
          </div>
        </div>
        <SLARing deadline={deadline} size={56} />
      </div>

      {/* Location */}
      <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-nile-green" />
            <span className="text-sm text-navy">{t("task.location")}</span>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-nile-green/10 px-3 py-1.5 text-xs font-medium text-nile-green hover:bg-nile-green/20"
          >
            <MapPin className="h-3 w-3" />
            {t("task.openInMaps")}
          </a>
        </div>
        {task.address_description && (
          <p className="mt-2 text-sm text-navy/70">{task.address_description}</p>
        )}
      </div>

      {/* Reporter info */}
      {reporter && (
        <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-white">
              <User className="h-5 w-5 text-navy/50" />
            </div>
            <div>
              <p className="text-sm font-medium text-navy">
                {t("task.reportedBy")}: {reporterFirstName}
              </p>
              {reporter.phone && (
                <a href={`tel:${reporter.phone}`} className="flex items-center gap-1 text-xs text-nile-green hover:underline">
                  <Phone className="h-3 w-3" />
                  {reporter.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
        <h3 className="text-sm font-semibold text-navy mb-2">{t("task.description")}</h3>
        <p className="text-sm text-navy/70 leading-relaxed">{task.description}</p>
      </div>

      {/* Before photos */}
      {beforePhotos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-navy mb-3">{t("task.beforePhotos")}</h3>
          <PhotoGallery photos={beforePhotos} />
        </div>
      )}

      {/* Action section */}
      <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card">
        {task.status === "assigned" && (
          <StartTaskButton reportId={task.id} />
        )}

        {task.status === "in_progress" && (
          <ResolveTaskForm reportId={task.id} />
        )}

        {(task.status === "resolved" || task.status === "rated" || task.status === "archived") && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-nile-green">
              <span className="text-lg">✓</span>
              <span className="font-semibold">{t("task.resolutionSubmitted")}</span>
            </div>
            {task.resolved_cost !== null && (
              <p className="text-sm text-navy/70">
                {t("task.cost")}: {task.resolved_cost?.toLocaleString()} EGP
              </p>
            )}
            {afterPhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-navy mb-3">{t("task.afterPhotos")}</h3>
                <PhotoGallery photos={afterPhotos} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
