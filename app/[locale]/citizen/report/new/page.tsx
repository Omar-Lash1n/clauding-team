import { getActiveCategories, getAllDistricts } from "@/lib/citizen/queries";
import { ReportWizard } from "@/components/citizen/ReportWizard";

export default async function NewReportPage() {
  const categories = await getActiveCategories();
  const districts = await getAllDistricts();

  return <ReportWizard categories={categories} districts={districts} />;
}
