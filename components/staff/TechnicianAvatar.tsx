"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils/cn";
import type { SpecialtyType } from "@/types/domain";

interface TechnicianAvatarProps {
  name: string;
  nameAr?: string | null;
  specialty?: SpecialtyType | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SPECIALTY_COLORS: Record<SpecialtyType, string> = {
  plumber: "bg-blue-100 text-blue-700",
  electrician: "bg-amber-100 text-amber-700",
  road_maintenance: "bg-orange-100 text-orange-700",
  sanitation: "bg-green-100 text-green-700",
  general: "bg-slate-100 text-slate-700",
};

const SIZE_MAP = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function TechnicianAvatar({
  name,
  nameAr,
  specialty,
  className,
  size = "md",
}: TechnicianAvatarProps) {
  const locale = useLocale();
  const displayName = locale === "ar" && nameAr ? nameAr : name;
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-nile-green/10 font-semibold text-nile-green",
          SIZE_MAP[size]
        )}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-navy">{displayName}</p>
        {specialty && (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
              SPECIALTY_COLORS[specialty]
            )}
          >
            {specialty.replace("_", " ")}
          </span>
        )}
      </div>
    </div>
  );
}
