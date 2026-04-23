import { createServerSupabase } from "@/lib/supabase/server";
import type {
  ReportStatus,
  PriorityLevel,
  Category,
  District,
  Notification,
  PhotoType,
  DisputeResolution,
} from "@/types/domain";

export type ReportSummary = {
  id: string;
  status: ReportStatus;
  priority: PriorityLevel;
  description: string;
  submitted_at: string;
  category: { name_en: string; name_ar: string; icon_name: string } | null;
  district: { name_en: string; name_ar: string } | null;
};

export type ReportDetail = {
  id: string;
  status: ReportStatus;
  priority: PriorityLevel;
  description: string;
  address_description: string | null;
  submitted_at: string;
  approved_at: string | null;
  assigned_at: string | null;
  started_at: string | null;
  resolved_at: string | null;
  rejected_reason: string | null;
  reporter_id: string;
  location_lat: number;
  location_lng: number;
  sla_pickup_deadline: string | null;
  sla_resolve_deadline: string | null;
  is_public: boolean;
  category: {
    id: string;
    name_en: string;
    name_ar: string;
    icon_name: string;
  } | null;
  district: { id: string; name_en: string; name_ar: string } | null;
  technician: {
    id: string;
    full_name: string;
    full_name_ar: string | null;
    specialty: string | null;
  } | null;
  photos: {
    id: string;
    storage_path: string;
    photo_type: PhotoType;
  }[];
  feedback: {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
  } | null;
  dispute: {
    id: string;
    resolution: DisputeResolution | null;
    dm_notes: string | null;
    new_technician_id: string | null;
  } | null;
};

const ACTIVE_STATUSES: ReportStatus[] = [
  "submitted",
  "approved",
  "assigned",
  "in_progress",
];

export async function getMyReports(opts?: {
  limit?: number;
  status?: ReportStatus | "active" | "all";
}): Promise<ReportSummary[]> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("reports")
    .select(
      "id, status, priority, description, submitted_at, category:category_id(name_en, name_ar, icon_name), district:district_id(name_en, name_ar)"
    )
    .eq("reporter_id", user.id)
    .order("submitted_at", { ascending: false });

  if (opts?.status && opts.status !== "all") {
    if (opts.status === "active") {
      query = query.in("status", ACTIVE_STATUSES);
    } else {
      query = query.eq("status", opts.status);
    }
  }

  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data } = await query;
  return (data ?? []) as ReportSummary[];
}

export async function getMyReportCounts(): Promise<{
  active: number;
  resolved: number;
  total: number;
}> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { active: 0, resolved: 0, total: 0 };

  const { data } = await supabase
    .from("reports")
    .select("status")
    .eq("reporter_id", user.id);

  if (!data) return { active: 0, resolved: 0, total: 0 };

  const active = data.filter((r) =>
    ACTIVE_STATUSES.includes(r.status as ReportStatus)
  ).length;
  const resolved = data.filter((r) =>
    (["resolved", "rated", "archived"] as ReportStatus[]).includes(
      r.status as ReportStatus
    )
  ).length;

  return { active, resolved, total: data.length };
}

export async function getReport(id: string): Promise<ReportDetail | null> {
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("reports")
    .select(
      `id, status, priority, description, address_description,
       submitted_at, approved_at, assigned_at, started_at, resolved_at,
       rejected_reason, reporter_id, location_lat, location_lng,
       sla_pickup_deadline, sla_resolve_deadline, is_public,
       category:category_id(id, name_en, name_ar, icon_name),
       district:district_id(id, name_en, name_ar),
       technician:profiles!reports_assigned_technician_id_fkey(id, full_name, full_name_ar, specialty),
       report_photos(id, storage_path, photo_type),
       report_feedback(id, rating, comment, created_at),
       report_disputes(id, resolution, dm_notes, new_technician_id)`
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  return {
    ...data,
    category: Array.isArray(data.category) ? data.category[0] ?? null : (data.category as ReportDetail["category"]),
    district: Array.isArray(data.district) ? data.district[0] ?? null : (data.district as ReportDetail["district"]),
    technician: Array.isArray(data.technician) ? data.technician[0] ?? null : (data.technician as ReportDetail["technician"]),
    photos: (data.report_photos ?? []) as ReportDetail["photos"],
    feedback: Array.isArray(data.report_feedback)
      ? (data.report_feedback[0] ?? null) as ReportDetail["feedback"]
      : (data.report_feedback as ReportDetail["feedback"]) ?? null,
    dispute: Array.isArray(data.report_disputes)
      ? (data.report_disputes[0] ?? null) as ReportDetail["dispute"]
      : (data.report_disputes as ReportDetail["dispute"]) ?? null,
  } as ReportDetail;
}

export async function getActiveCategories(): Promise<Category[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name_en");
  return (data ?? []) as Category[];
}

export async function getAllDistricts(): Promise<District[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("districts")
    .select("*")
    .order("name_en");
  return (data ?? []) as District[];
}

export async function getMyNotifications(limit = 50): Promise<Notification[]> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Notification[];
}
