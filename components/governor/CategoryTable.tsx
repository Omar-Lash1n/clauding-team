"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { toggleCategoryActive } from "@/lib/governor/actions";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil } from "lucide-react";
import * as Icons from "lucide-react";
import type { Category } from "@/types/domain";
import { cn } from "@/lib/utils/cn";

interface CategoryTableProps {
  categories: Category[];
  onEdit: (cat: Category) => void;
}

export function CategoryTable({ categories, onEdit }: CategoryTableProps) {
  const t = useTranslations("governor.categories");
  const tPriority = useTranslations("priorities");
  const tSpecialty = useTranslations("specialties");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: string, currentActive: boolean) {
    startTransition(async () => {
      const result = await toggleCategoryActive(id, !currentActive);
      if (result.error) {
        toast.error(t("deactivateConfirm"));
      } else {
        toast.success(currentActive ? t("deactivateSuccess") : t("activateSuccess"));
      }
    });
  }

  function renderIcon(iconName: string) {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="h-5 w-5 text-navy" />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border-neutral">
            <TableHead className="text-navy font-semibold">{t("fields.icon")}</TableHead>
            <TableHead className="text-navy font-semibold">{t("fields.nameEn")}</TableHead>
            <TableHead className="text-navy font-semibold">{t("fields.nameAr")}</TableHead>
            <TableHead className="text-navy font-semibold">{t("fields.specialty")}</TableHead>
            <TableHead className="text-navy font-semibold">{t("fields.priority")}</TableHead>
            <TableHead className="text-navy font-semibold text-center">{t("fields.active")}</TableHead>
            <TableHead className="text-navy font-semibold" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((cat) => (
            <TableRow
              key={cat.id}
              className={cn(
                "border-border-neutral",
                !cat.is_active && "opacity-50"
              )}
            >
              <TableCell>{renderIcon(cat.icon_name)}</TableCell>
              <TableCell className="font-medium">{cat.name_en}</TableCell>
              <TableCell className="font-medium">{cat.name_ar}</TableCell>
              <TableCell>{tSpecialty(cat.default_specialty)}</TableCell>
              <TableCell>{tPriority(cat.default_priority)}</TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={cat.is_active}
                  onCheckedChange={() => handleToggle(cat.id, cat.is_active)}
                  disabled={isPending}
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(cat)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
