import { getTranslations } from "next-intl/server";
import { getBudgetData } from "@/lib/governor/queries";
import { BudgetBreakdown } from "@/components/governor/BudgetBreakdown";

export default async function BudgetPage() {
  const t = await getTranslations("governor.budget");
  const budgetData = await getBudgetData();

  return (
    <div className="p-4 md:p-8 max-w-7xl space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-navy">{t("title")}</h1>
      <BudgetBreakdown
        byDistrict={budgetData.byDistrict}
        byCategory={budgetData.byCategory}
        byMonth={budgetData.byMonth}
        cityTotal={budgetData.cityTotal}
      />
    </div>
  );
}
