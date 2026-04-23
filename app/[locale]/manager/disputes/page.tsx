import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/staff/queries";
import { getPendingDisputes } from "@/lib/manager/queries";
import { getTranslations } from "next-intl/server";
import { AlertTriangle, Star } from "lucide-react";

interface DisputesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DisputesPage({ params }: DisputesPageProps) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "manager" });
  const profile = await getCurrentProfile(supabase);

  if (!profile?.district_id) return null;

  const disputes = await getPendingDisputes(supabase, profile.district_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-navy" />
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("disputes.title")}</h1>
          <p className="text-sm text-navy/50 mt-0.5">{t("disputes.subtitle")}</p>
        </div>
      </div>

      {disputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-sand-ivory text-4xl">
            ✓
          </div>
          <h3 className="text-lg font-semibold text-navy">{t("disputes.empty")}</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => {
            const report = dispute.report as {
              id?: string;
              priority?: string;
              category?: { name_ar?: string; name_en?: string };
              technician?: { full_name?: string; full_name_ar?: string };
            } | null;

            const feedback = dispute.feedback as { rating?: number; comment?: string } | null;

            const catName = report?.category
              ? (locale === "ar" ? report.category.name_ar : report.category.name_en) || ""
              : "";

            const techName = report?.technician
              ? (locale === "ar" ? report.technician.full_name_ar : report.technician.full_name) || ""
              : "";

            return (
              <Link
                key={dispute.id}
                href={`/${locale}/manager/disputes/${dispute.id}`}
                className="block rounded-xl border border-border-neutral bg-white p-4 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy">{catName}</p>
                    {feedback?.rating !== undefined && (
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < (feedback.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    )}
                    {feedback?.comment && (
                      <p className="text-xs text-navy/50 mt-1 line-clamp-2">{feedback.comment}</p>
                    )}
                    <p className="text-xs text-navy/40 mt-1">
                      {locale === "ar" ? "الفني الأصلي" : "Original technician"}: {techName}
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 shrink-0 text-orange-500" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
