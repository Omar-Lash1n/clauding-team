import { getTranslations } from "next-intl/server";
import { getMyReports } from "@/lib/citizen/queries";
import { MyReportsList } from "@/components/citizen/MyReportsList";

export default async function ReportsPage() {
  const t = await getTranslations("citizen.reports");
  const reports = await getMyReports();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-[#1C2D5B]">{t("title")}</h1>
      <MyReportsList initialReports={reports} />
    </div>
  );
}
