import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getReportById } from "@/lib/governor/queries";
import { ReportDetailView } from "@/components/governor/ReportDetailView";

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("governor");

  let report;
  try {
    report = await getReportById(id);
  } catch {
    notFound();
  }

  if (!report) notFound();

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <ReportDetailView report={report} />
    </div>
  );
}
