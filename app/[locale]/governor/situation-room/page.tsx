import { getLocale, getTranslations } from "next-intl/server";
import { getCitywideReports } from "@/lib/governor/queries";
import { SituationRoomGridCity } from "@/components/governor/SituationRoomGridCity";

interface SituationRoomPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SituationRoomPage({ searchParams }: SituationRoomPageProps) {
  const locale = await getLocale();
  const t = await getTranslations("governor.situationRoom");
  const params = await searchParams;

  const status = params.status
    ? (Array.isArray(params.status) ? params.status : params.status.split(","))
    : undefined;
  const priority = params.priority
    ? (Array.isArray(params.priority) ? params.priority : params.priority.split(","))
    : undefined;
  const district = params.district
    ? (Array.isArray(params.district) ? params.district : params.district.split(","))
    : undefined;
  const categoryId = typeof params.category === "string" ? params.category : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;

  const { data: reports, count } = await getCitywideReports({
    status,
    priority,
    districtId: district,
    categoryId,
    page,
    pageSize: 20,
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl">
      <h1 className="text-2xl md:text-3xl font-bold text-navy">{t("title")}</h1>
      <SituationRoomGridCity reports={reports} totalCount={count} />
    </div>
  );
}
