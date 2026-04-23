import type { Database } from "./database";

// Re-export enum types for convenience
export type UserRole = Database["public"]["Enums"]["user_role"];
export type SpecialtyType = Database["public"]["Enums"]["specialty_type"];
export type PriorityLevel = Database["public"]["Enums"]["priority_level"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type LeaveStatus = Database["public"]["Enums"]["leave_status"];
export type DisputeResolution =
  Database["public"]["Enums"]["dispute_resolution"];
export type CrossDistrictStatus =
  Database["public"]["Enums"]["cross_district_status"];
export type EscalationType = Database["public"]["Enums"]["escalation_type"];
export type NotificationType =
  Database["public"]["Enums"]["notification_type"];
export type PhotoType = Database["public"]["Enums"]["photo_type"];
export type GenderType = Database["public"]["Enums"]["gender_type"];

// Row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type District = Database["public"]["Tables"]["districts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportPhoto = Database["public"]["Tables"]["report_photos"]["Row"];
export type ReportFeedback =
  Database["public"]["Tables"]["report_feedback"]["Row"];
export type ReportDispute =
  Database["public"]["Tables"]["report_disputes"]["Row"];
export type LeaveRequest =
  Database["public"]["Tables"]["leave_requests"]["Row"];
export type CrossDistrictRequest =
  Database["public"]["Tables"]["cross_district_requests"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Escalation = Database["public"]["Tables"]["escalations"]["Row"];
export type DailySummary =
  Database["public"]["Tables"]["daily_summaries"]["Row"];

// Insert types
export type ProfileInsert =
  Database["public"]["Tables"]["profiles"]["Insert"];
export type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];
export type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];

// View types
export type TechnicianWorkload =
  Database["public"]["Views"]["v_technician_workload"]["Row"];
export type DistrictStats =
  Database["public"]["Views"]["v_district_stats"]["Row"];
export type HeatmapPoint =
  Database["public"]["Views"]["v_heatmap_points"]["Row"];

// RPC return types
export type NearbyReport =
  Database["public"]["Functions"]["find_nearby_active_reports"]["Returns"][0];
export type LeastBusyTechnician =
  Database["public"]["Functions"]["pick_least_busy_technician"]["Returns"][0];

// Computed / helper types
export type ReportWithDetails = Report & {
  category?: Category;
  district?: District;
  reporter?: Pick<Profile, "id" | "full_name" | "full_name_ar" | "email">;
  technician?: Pick<Profile, "id" | "full_name" | "full_name_ar" | "specialty">;
  photos?: ReportPhoto[];
  feedback?: ReportFeedback | null;
  dispute?: ReportDispute | null;
};

export type ProfileWithDistrict = Profile & {
  district?: District | null;
};

// Route constants per role
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  citizen: "/citizen",
  technician: "/technician",
  district_manager: "/manager",
  governor: "/governor",
};

// Enum value arrays (for iteration)
export const ALL_REPORT_STATUSES: ReportStatus[] = [
  "submitted",
  "approved",
  "rejected",
  "cancelled",
  "assigned",
  "in_progress",
  "resolved",
  "rated",
  "disputed",
  "archived",
];

export const ALL_PRIORITY_LEVELS: PriorityLevel[] = [
  "critical",
  "high",
  "medium",
  "low",
  "scheduled",
];

export const ALL_SPECIALTIES: SpecialtyType[] = [
  "plumber",
  "electrician",
  "road_maintenance",
  "sanitation",
  "general",
];

export const ALL_USER_ROLES: UserRole[] = [
  "citizen",
  "technician",
  "district_manager",
  "governor",
];
