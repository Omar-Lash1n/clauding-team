"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { getCategoryIcon } from "@/lib/citizen/category-icons";
import type { Category, PriorityLevel } from "@/types/domain";

interface StepConfirmProps {
  category: Category | null;
  priority: PriorityLevel;
  description: string;
  photos: File[];
  lat: number | null;
  lng: number | null;
  districtName: string | null;
  addressDescription: string;
}

export function StepConfirm({
  category,
  priority,
  description,
  photos,
  lat,
  lng,
  districtName,
  addressDescription,
}: StepConfirmProps) {
  const t = useTranslations("citizen.wizard");
  const td = useTranslations("citizen.detail");
  const locale = useLocale();

  const Icon = category ? getCategoryIcon(category.icon_name) : null;
  const categoryName = category
    ? locale === "ar"
      ? category.name_ar
      : category.name_en
    : "";

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-[#1C2D5B]">
        {t("confirmTitle")}
      </h3>

      {/* Category & Priority */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="rounded-xl bg-[#F0F7FF] p-2">
                <Icon className="h-5 w-5 text-[#3E7D60]" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-[#1C2D5B]">
                {categoryName}
              </p>
              <div className="mt-1">
                <PriorityBadge priority={priority} size="sm" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-[#1C2D5B]/50 mb-1">
            {td("description")}
          </p>
          <p className="text-sm text-[#1C2D5B] whitespace-pre-wrap">
            {description}
          </p>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-[#1C2D5B]/50 mb-2">
            {t("photosLabel")} ({photos.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {photos.map((file, idx) => {
              const url = URL.createObjectURL(file);
              return (
                <div
                  key={idx}
                  className="h-16 w-16 rounded-lg overflow-hidden border border-[#DCE3EA]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                    onLoad={() => URL.revokeObjectURL(url)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardContent className="p-4 space-y-1">
          <p className="text-xs font-medium text-[#1C2D5B]/50">
            {td("location")}
          </p>
          {lat !== null && lng !== null && (
            <p className="text-xs text-[#1C2D5B]/60 font-mono">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          )}
          {districtName && (
            <p className="text-sm text-[#3E7D60] font-medium">
              {t("detectedDistrict", { district: districtName })}
            </p>
          )}
          {addressDescription && (
            <p className="text-sm text-[#1C2D5B]">{addressDescription}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
