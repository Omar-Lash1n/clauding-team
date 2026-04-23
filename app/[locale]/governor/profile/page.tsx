import { getTranslations, getLocale } from "next-intl/server";
import { getGovernorProfile } from "@/lib/governor/queries";
import { formatDate } from "@/lib/utils/format";
import { User, Mail, Phone, BadgeCheck, Calendar } from "lucide-react";

export default async function GovernorProfilePage() {
  const t = await getTranslations("governor.profile");
  const locale = await getLocale();
  const profile = await getGovernorProfile();

  if (!profile) return null;

  const fields = [
    {
      icon: User,
      label: locale === "ar" ? profile.full_name_ar ?? profile.full_name : profile.full_name,
      sublabel: t("role"),
    },
    {
      icon: BadgeCheck,
      label: profile.employee_id ?? "—",
      sublabel: t("employeeId"),
    },
    {
      icon: Mail,
      label: profile.email,
      sublabel: t("email"),
    },
    {
      icon: Phone,
      label: profile.phone ?? "—",
      sublabel: t("phone"),
    },
    {
      icon: Calendar,
      label: t("appointed"),
      sublabel: formatDate(profile.created_at, locale, "dd MMMM yyyy"),
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-navy">{t("title")}</h1>

      <div className="rounded-xl border border-border-neutral bg-white p-6 md:p-8 shadow-card space-y-6">
        {/* Avatar and name */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy/10 text-navy text-2xl font-bold">
            {profile.full_name[0]}
          </div>
          <div>
            <p className="text-xl font-bold text-navy">
              {locale === "ar" ? profile.full_name_ar ?? profile.full_name : profile.full_name}
            </p>
            <p className="text-sm text-navy/50">{t("role")}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="divide-y divide-border-neutral">
          {fields.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="flex items-center gap-4 py-4">
                <Icon className="h-5 w-5 text-navy/30 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-navy">{f.label}</p>
                  <p className="text-xs text-navy/40">{f.sublabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
