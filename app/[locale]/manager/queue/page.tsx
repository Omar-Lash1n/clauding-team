import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/staff/queries";
import { getQueue } from "@/lib/manager/queries";
import { getTranslations } from "next-intl/server";
import { QueueItem } from "@/components/manager/QueueItem";
import { Inbox } from "lucide-react";

interface QueuePageProps {
  params: Promise<{ locale: string }>;
}

export default async function QueuePage({ params }: QueuePageProps) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "manager" });
  const profile = await getCurrentProfile(supabase);

  if (!profile?.district_id) return null;

  const queue = await getQueue(supabase, profile.district_id);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Check for duplicate candidates per report
  const duplicateMap = new Map<string, boolean>();
  for (const report of queue) {
    try {
      const { data: nearby } = await supabase.rpc("find_nearby_active_reports", {
        p_lat: report.location_lat,
        p_lng: report.location_lng,
        p_category_id: report.category_id,
        p_radius_meters: 50,
      });
      duplicateMap.set(report.id, (nearby?.length ?? 0) > 1);
    } catch {
      duplicateMap.set(report.id, false);
    }
  }

  function getPhotoUrl(path: string) {
    return `${supabaseUrl}/storage/v1/object/public/report-photos/${path}`;
  }

  function getCategoryName(report: typeof queue[0]) {
    const cat = report.category as { name_ar?: string; name_en?: string } | null;
    if (!cat) return "";
    return locale === "ar" ? (cat.name_ar || cat.name_en || "") : (cat.name_en || "");
  }

  function getReporterName(report: typeof queue[0]) {
    const reporter = report.reporter as { full_name?: string; full_name_ar?: string } | null;
    if (!reporter) return "";
    return locale === "ar" ? (reporter.full_name_ar || reporter.full_name || "") : (reporter.full_name || "");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Inbox className="h-5 w-5 text-navy" />
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("queue.title")}</h1>
          <p className="text-sm text-navy/50 mt-0.5">{t("queue.subtitle")}</p>
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-sand-ivory text-4xl">
            ✓
          </div>
          <h3 className="text-lg font-semibold text-navy">{t("queue.empty")}</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((report) => {
            const photos = (report.photos || []) as { id: string; storage_path: string; photo_type: string }[];
            const firstPhoto = photos.find((p) => p.photo_type === "before");

            return (
              <QueueItem
                key={report.id}
                id={report.id}
                categoryName={getCategoryName(report)}
                priority={report.priority}
                addressDescription={report.address_description}
                reporterName={getReporterName(report)}
                description={report.description}
                photoUrl={firstPhoto ? getPhotoUrl(firstPhoto.storage_path) : null}
                hasDuplicate={duplicateMap.get(report.id) ?? false}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
