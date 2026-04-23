"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoUploader } from "@/components/citizen/PhotoUploader";
import { PinMap } from "@/components/map/PinMap";
import { getCategoryIcon } from "@/lib/citizen/category-icons";
import { editReport } from "@/lib/citizen/actions";
import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";
import { ALL_PRIORITY_LEVELS } from "@/types/domain";
import type { Category, District, PriorityLevel } from "@/types/domain";

interface ReportEditFormProps {
  report: {
    id: string;
    categoryId: string;
    priority: PriorityLevel;
    description: string;
    addressDescription: string;
    lat: number;
    lng: number;
  };
  existingPhotos: { id: string; url: string }[];
  categories: Category[];
  districts: District[];
}

export function ReportEditForm({
  report,
  existingPhotos,
  categories,
  districts,
}: ReportEditFormProps) {
  const t = useTranslations("citizen.wizard");
  const tc = useTranslations("common");
  const te = useTranslations("citizen.errors");
  const tp = useTranslations("priorities");
  const locale = useLocale();
  const router = useRouter();

  const [categoryId, setCategoryId] = useState(report.categoryId);
  const [priority, setPriority] = useState(report.priority);
  const [description, setDescription] = useState(report.description);
  const [addressDescription, setAddressDescription] = useState(report.addressDescription);
  const [lat, setLat] = useState(report.lat);
  const [lng, setLng] = useState(report.lng);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const keptPhotos = existingPhotos.filter((p) => !removedPhotoIds.includes(p.id));
  const totalPhotos = keptPhotos.length + newPhotos.length;
  const canAddMore = totalPhotos < 4;

  async function handleSubmit() {
    setSubmitting(true);
    const formData = new FormData();
    formData.set("category_id", categoryId);
    formData.set("priority", priority);
    formData.set("description", description);
    formData.set("address_description", addressDescription);
    newPhotos.forEach((file, i) => {
      formData.set(`photo_${i}`, file);
    });

    const result = await editReport(report.id, formData, removedPhotoIds);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(te("editFailed"));
      return;
    }

    toast.success(tc("success"));
    router.push(`/${locale}/citizen/report/${report.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-[#1C2D5B]">{t("confirmTitle")}</h1>

      {/* Category */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <label className="text-sm font-medium text-[#1C2D5B]">
            {t("step1Title")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon_name);
              const isSelected = categoryId === cat.id;
              const name = locale === "ar" ? cat.name_ar : cat.name_en;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(cat.id);
                    setPriority(cat.default_priority);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-xs transition-all",
                    isSelected
                      ? "border-[#3E7D60] bg-[#3E7D60]/5"
                      : "border-[#DCE3EA] hover:border-[#3E7D60]/40"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isSelected ? "text-[#3E7D60]" : "text-[#1C2D5B]/40")} />
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Priority */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <label className="text-sm font-medium text-[#1C2D5B]">
            {t("prioritySuggestion", { priority: tp(priority) })}
          </label>
          <Select value={priority} onValueChange={(v) => setPriority(v as PriorityLevel)}>
            <SelectTrigger>
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
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <label className="text-sm font-medium text-[#1C2D5B]">
            {t("descriptionLabel")}
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-end">
            <span className="text-xs text-[#1C2D5B]/40">{description.length}/500</span>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <label className="text-sm font-medium text-[#1C2D5B]">
            {t("photosLabel")}
          </label>
          {/* Existing photos */}
          <div className="flex flex-wrap gap-2">
            {keptPhotos.map((p) => (
              <div key={p.id} className="relative h-20 w-20 rounded-xl overflow-hidden border border-[#DCE3EA]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setRemovedPhotoIds([...removedPhotoIds, p.id])}
                  className="absolute top-1 end-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          {/* New photos */}
          {canAddMore && (
            <PhotoUploader
              maxCount={4 - keptPhotos.length}
              value={newPhotos}
              onChange={setNewPhotos}
            />
          )}
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <label className="text-sm font-medium text-[#1C2D5B]">{t("step3Title")}</label>
          <PinMap
            defaultLat={lat}
            defaultLng={lng}
            onChange={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
            className="h-48 rounded-xl"
          />
          <Input
            value={addressDescription}
            onChange={(e) => setAddressDescription(e.target.value)}
            placeholder={t("landmarkHint")}
            maxLength={500}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          {tc("cancel")}
        </Button>
        <Button
          className="flex-1"
          disabled={submitting || description.length < 20}
          onClick={handleSubmit}
        >
          {submitting ? t("submitting") : tc("save")}
        </Button>
      </div>
    </div>
  );
}
