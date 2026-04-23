import { getLocale, getTranslations } from "next-intl/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";
import { User } from "lucide-react";
import type { Profile } from "@/types/domain";

function maskNid(nid: string): string {
  if (nid.length <= 6) return nid;
  return nid.slice(0, 4) + "••••••••" + nid.slice(-2);
}

export default async function ProfilePage() {
  const locale = await getLocale();
  const t = await getTranslations("citizen.profile");
  const tAuth = await getTranslations("auth");

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const fullName =
    locale === "ar"
      ? (profile.full_name_ar ?? profile.full_name)
      : profile.full_name;

  const genderLabel = profile.gender
    ? profile.gender === "male"
      ? tAuth("male")
      : tAuth("female")
    : "—";

  const rows: { label: string; value: string }[] = [
    { label: t("fullName"), value: fullName },
    { label: t("email"), value: profile.email },
    { label: t("phone"), value: profile.phone ?? "—" },
    { label: t("nid"), value: profile.national_id ? maskNid(profile.national_id) : "—" },
    { label: t("birthdate"), value: profile.birth_date ? formatDate(profile.birth_date, locale) : "—" },
    { label: t("gender"), value: genderLabel },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#C7E1D4] p-4">
          <User className="h-8 w-8 text-[#3E7D60]" />
        </div>
        <h1 className="text-lg font-bold text-[#1C2D5B]">{t("title")}</h1>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-[#DCE3EA]">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#1C2D5B]/50">{row.label}</span>
              <span className="text-sm font-medium text-[#1C2D5B] text-end max-w-[60%] truncate">
                {row.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
