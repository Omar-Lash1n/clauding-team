import type { UserRole, ReportStatus, PriorityLevel, SpecialtyType } from "@/types/domain";

export const ASWAN_CENTER: [number, number] = [24.0889, 32.8998];
export const DEFAULT_MAP_ZOOM = 13;

export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";

// Role → dashboard path
export const ROLE_PATHS: Record<UserRole, string> = {
  citizen: "/citizen",
  technician: "/technician",
  district_manager: "/manager",
  governor: "/governor",
};

// Prefix groups that require authentication
export const PROTECTED_PREFIXES = [
  "/citizen",
  "/technician",
  "/manager",
  "/governor",
];

// Route guards: which roles are allowed per path prefix
export const ROLE_ALLOWED_PREFIXES: Record<UserRole, string[]> = {
  citizen: ["/citizen"],
  technician: ["/technician"],
  district_manager: ["/manager"],
  governor: ["/governor"],
};

// Status → Tailwind color class
export const STATUS_COLORS: Record<ReportStatus, { bg: string; text: string; dot: string }> = {
  submitted: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  approved: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  rejected: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  assigned: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  in_progress: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  resolved: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  rated: { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
  disputed: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  archived: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

// Map marker colors per status
export const STATUS_MARKER_COLORS: Record<ReportStatus, string> = {
  submitted: "#3B82F6",
  approved: "#6366F1",
  rejected: "#EF4444",
  cancelled: "#9CA3AF",
  assigned: "#A855F7",
  in_progress: "#F59E0B",
  resolved: "#22C55E",
  rated: "#14B8A6",
  disputed: "#F97316",
  archived: "#64748B",
};

export const DISTRICT_NAMES: Record<string, { en: string; ar: string }> = {
  "11111111-1111-1111-1111-111111111111": { en: "Aswan 1", ar: "قسم أول أسوان" },
  "22222222-2222-2222-2222-222222222222": { en: "Aswan 2", ar: "قسم ثان أسوان" },
  "33333333-3333-3333-3333-333333333333": { en: "Aswan Markaz", ar: "مركز أسوان" },
  "44444444-4444-4444-4444-444444444444": { en: "Nasr", ar: "مركز نصر" },
};

// Demo credentials
export const DEMO_CREDENTIALS: Record<UserRole, { email: string; label: string; labelAr: string }> = {
  governor: {
    email: "amr.lashin@aswan.gov.eg",
    label: "Governor",
    labelAr: "المحافظ",
  },
  district_manager: {
    email: "dm1@aswan.gov.eg",
    label: "District Manager (Aswan 1)",
    labelAr: "مدير قسم (أسوان 1)",
  },
  technician: {
    email: "tech.plumber1@aswan.gov.eg",
    label: "Technician (Plumber)",
    labelAr: "فني (سباك)",
  },
  citizen: {
    email: "citizen1@example.com",
    label: "Citizen",
    labelAr: "مواطن",
  },
};

export const DEMO_PASSWORD = "Demo@1234";

export const SPECIALTY_ICONS: Record<SpecialtyType, string> = {
  plumber: "Droplets",
  electrician: "Zap",
  road_maintenance: "Construction",
  sanitation: "Trash2",
  general: "Wrench",
};
