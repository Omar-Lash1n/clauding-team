import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/staff/queries";
import { getDistricts } from "@/lib/staff/queries";
import { getCrossDistrictStatus } from "@/lib/manager/queries";
import { getTranslations } from "next-intl/server";
import { Globe } from "lucide-react";
import { CrossDistrictClient } from "./CrossDistrictClient";

interface CrossDistrictPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CrossDistrictPage({ params }: CrossDistrictPageProps) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "manager" });
  const profile = await getCurrentProfile(supabase);

  if (!profile) return null;

  const districts = await getDistricts(supabase);
  const requests = await getCrossDistrictStatus(supabase, profile.id);

  const otherDistricts = districts.filter((d) => d.id !== profile.district_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-navy" />
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("crossDistrict.title")}</h1>
          <p className="text-sm text-navy/50 mt-0.5">{t("crossDistrict.subtitle")}</p>
        </div>
      </div>

      <CrossDistrictClient
        locale={locale}
        districts={otherDistricts.map((d) => ({
          id: d.id,
          name: locale === "ar" ? d.name_ar : d.name_en,
        }))}
        requests={requests.map((r) => {
          const targetDistrict = r.target_district as { name_ar?: string; name_en?: string } | null;
          return {
            id: r.id,
            targetDistrictName: targetDistrict
              ? (locale === "ar" ? (targetDistrict.name_ar || "") : (targetDistrict.name_en || ""))
              : "",
            status: r.status,
            reason: r.reason,
            createdAt: r.created_at,
            expiresAt: r.expires_at,
          };
        })}
      />
    </div>
  );
}
