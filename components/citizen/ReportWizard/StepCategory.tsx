"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { getCategoryIcon } from "@/lib/citizen/category-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, PriorityLevel } from "@/types/domain";
import { ALL_PRIORITY_LEVELS } from "@/types/domain";

interface StepCategoryProps {
  categories: Category[];
  selectedCategoryId: string | null;
  priority: PriorityLevel;
  onSelectCategory: (cat: Category) => void;
  onChangePriority: (p: PriorityLevel) => void;
}

export function StepCategory({
  categories,
  selectedCategoryId,
  priority,
  onSelectCategory,
  onChangePriority,
}: StepCategoryProps) {
  const t = useTranslations("citizen.wizard");
  const tp = useTranslations("priorities");
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#1C2D5B]/70">{t("categoryPrompt")}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.icon_name);
          const isSelected = selectedCategoryId === cat.id;
          const name = locale === "ar" ? cat.name_ar : cat.name_en;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                isSelected
                  ? "border-[#3E7D60] bg-[#3E7D60]/5 shadow-sm"
                  : "border-[#DCE3EA] bg-white hover:border-[#3E7D60]/40 hover:bg-[#F0F7FF]"
              )}
            >
              <div
                className={cn(
                  "rounded-xl p-3 transition-colors",
                  isSelected ? "bg-[#3E7D60]/10" : "bg-[#F0F7FF]"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6",
                    isSelected ? "text-[#3E7D60]" : "text-[#1C2D5B]/50"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center leading-tight",
                  isSelected ? "text-[#3E7D60]" : "text-[#1C2D5B]/70"
                )}
              >
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {selectedCategoryId && (
        <div className="space-y-2 rounded-xl bg-[#F0F7FF] p-4">
          <p className="text-xs text-[#1C2D5B]/60">
            {t("prioritySuggestion", { priority: tp(priority) })}
          </p>

          <Select
            value={priority}
            onValueChange={(v) => onChangePriority(v as PriorityLevel)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_PRIORITY_LEVELS.map((p) => (
                <SelectItem key={p} value={p}>
                  {tp(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-[#1C2D5B]/40">{t("priorityNote")}</p>
        </div>
      )}
    </div>
  );
}
