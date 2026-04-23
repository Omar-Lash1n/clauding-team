"use client";

import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUploader } from "@/components/citizen/PhotoUploader";

interface StepDetailsProps {
  photos: File[];
  description: string;
  onPhotosChange: (files: File[]) => void;
  onDescriptionChange: (value: string) => void;
}

export function StepDetails({
  photos,
  description,
  onPhotosChange,
  onDescriptionChange,
}: StepDetailsProps) {
  const t = useTranslations("citizen.wizard");

  const charCount = description.length;
  const charMin = 20;
  const charMax = 500;

  return (
    <div className="space-y-6">
      {/* Photos */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#1C2D5B]">
          {t("photosLabel")}
        </label>
        <p className="text-xs text-[#1C2D5B]/50">{t("photosHint")}</p>
        <PhotoUploader
          maxCount={4}
          value={photos}
          onChange={onPhotosChange}
        />
        {photos.length === 0 && (
          <p className="text-xs text-amber-600">{t("photosMandatory")}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#1C2D5B]">
          {t("descriptionLabel")}
        </label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t("descriptionHint")}
          maxLength={charMax}
          rows={4}
          className="resize-none"
        />
        <div className="flex justify-end">
          <span
            className={`text-xs ${
              charCount < charMin
                ? "text-amber-600"
                : charCount > charMax - 50
                  ? "text-red-600"
                  : "text-[#1C2D5B]/40"
            }`}
          >
            {charCount}/{charMax}
          </span>
        </div>
      </div>
    </div>
  );
}
