import {
  Droplets,
  Zap,
  Construction,
  Trash2,
  Wrench,
  Lightbulb,
  TreePine,
  Building2,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Droplets,
  Zap,
  Construction,
  Trash2,
  Wrench,
  Lightbulb,
  TreePine,
  Building2,
  AlertTriangle,
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? AlertTriangle;
}
