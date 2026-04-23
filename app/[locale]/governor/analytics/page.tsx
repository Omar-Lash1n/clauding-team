import { getTranslations } from "next-intl/server";
import { getAnalytics } from "@/lib/governor/queries";
import { AnalyticsClient } from "@/components/governor/AnalyticsClient";

export default async function AnalyticsPage() {
  const t = await getTranslations("governor.analytics");
  const data = await getAnalytics(30);

  return (
    <div className="p-4 md:p-8 max-w-7xl space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-navy">{t("title")}</h1>
      <AnalyticsClient initialData={data} />
    </div>
  );
}
