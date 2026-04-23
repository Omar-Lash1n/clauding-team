import { getTranslations } from "next-intl/server";
import { getPendingCrossDistrict, getCrossDistrictHistory } from "@/lib/governor/queries";
import { CrossDistrictInbox } from "@/components/governor/CrossDistrictInbox";
import { CrossDistrictHistoryTable } from "@/components/governor/CrossDistrictHistoryTable";

export default async function CrossDistrictApprovalsPage() {
  const t = await getTranslations("governor.crossDistrict");
  const [pending, history] = await Promise.all([
    getPendingCrossDistrict(),
    getCrossDistrictHistory(),
  ]);

  return (
    <div className="p-4 md:p-8 max-w-5xl space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-navy">{t("title")}</h1>

      <section>
        <h2 className="text-lg font-bold text-navy mb-4">{t("pending")}</h2>
        <CrossDistrictInbox requests={pending} />
      </section>

      <section>
        <h2 className="text-lg font-bold text-navy mb-4">{t("history")}</h2>
        <CrossDistrictHistoryTable requests={history} />
      </section>
    </div>
  );
}
