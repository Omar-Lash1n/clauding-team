"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { upsertCategory } from "@/lib/governor/actions";
import { CategoryIconPicker } from "./CategoryIconPicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types/domain";
import { ALL_SPECIALTIES, ALL_PRIORITY_LEVELS } from "@/types/domain";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const t = useTranslations("governor.categories");
  const tCommon = useTranslations("common");
  const tSpecialty = useTranslations("specialties");
  const tPriority = useTranslations("priorities");
  const tErrors = useTranslations("governor.errors");
  const [isPending, startTransition] = useTransition();

  const [nameEn, setNameEn] = useState(category?.name_en ?? "");
  const [nameAr, setNameAr] = useState(category?.name_ar ?? "");
  const [iconName, setIconName] = useState(category?.icon_name ?? "AlertCircle");
  const [specialty, setSpecialty] = useState<string>(category?.default_specialty ?? "general");
  const [priority, setPriority] = useState<string>(category?.default_priority ?? "medium");

  // Reset form when category changes
  const isEdit = !!category;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await upsertCategory({
        id: category?.id,
        name_en: nameEn,
        name_ar: nameAr,
        icon_name: iconName,
        default_specialty: specialty,
        default_priority: priority,
      });
      if (result.error) {
        toast.error(tErrors("categorySaveFailed"));
      } else {
        toast.success(tCommon("success"));
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-navy text-lg font-bold">
            {isEdit ? t("editTitle") : t("createTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("fields.nameEn")}</Label>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
              minLength={2}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("fields.nameAr")}</Label>
            <Input
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              required
              minLength={2}
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("fields.icon")}</Label>
            <CategoryIconPicker value={iconName} onChange={setIconName} />
          </div>
          <div className="space-y-2">
            <Label>{t("fields.specialty")}</Label>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {tSpecialty(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("fields.priority")}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_PRIORITY_LEVELS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {tPriority(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className="bg-navy hover:bg-navy/90">
              {tCommon("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
