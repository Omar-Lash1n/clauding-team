import { getCategories } from "@/lib/governor/queries";
import { CategoriesClient } from "@/components/governor/CategoriesClient";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
