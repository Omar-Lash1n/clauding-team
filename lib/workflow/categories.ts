import type { Database } from "@/types/database";

type SpecialtyType = Database["public"]["Enums"]["specialty_type"];
type PriorityLevel = Database["public"]["Enums"]["priority_level"];

export interface CategoryMeta {
  defaultSpecialty: SpecialtyType;
  defaultPriority: PriorityLevel;
  iconName: string;
}

export const SPECIALTY_LABEL_KEYS: Record<SpecialtyType, string> = {
  plumber: "specialties.plumber",
  electrician: "specialties.electrician",
  road_maintenance: "specialties.road_maintenance",
  sanitation: "specialties.sanitation",
  general: "specialties.general",
};

export function specialtyForCategory(
  defaultSpecialty: SpecialtyType
): SpecialtyType {
  return defaultSpecialty;
}

export function specialtyLabelKey(specialty: SpecialtyType): string {
  return SPECIALTY_LABEL_KEYS[specialty];
}
