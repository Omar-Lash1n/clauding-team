"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CategoryTable } from "@/components/governor/CategoryTable";
import { CategoryFormDialog } from "@/components/governor/CategoryFormDialog";
import { Plus } from "lucide-react";
import type { Category } from "@/types/domain";

interface CategoriesClientProps {
  initialCategories: Category[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const t = useTranslations("governor.categories");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  function handleEdit(cat: Category) {
    setEditCategory(cat);
    setDialogOpen(true);
  }

  function handleCreate() {
    setEditCategory(null);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-navy">{t("title")}</h1>
        <Button onClick={handleCreate} className="bg-navy hover:bg-navy/90">
          <Plus className="h-4 w-4 me-2" />
          {t("addButton")}
        </Button>
      </div>

      <div className="rounded-xl border border-border-neutral bg-white shadow-card">
        <CategoryTable categories={initialCategories} onEdit={handleEdit} />
      </div>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editCategory}
      />
    </>
  );
}
