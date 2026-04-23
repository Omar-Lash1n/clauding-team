import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export async function getQueue(supabase: DbClient, districtId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      category:categories(*),
      district:districts(*),
      reporter:profiles!reports_reporter_id_fkey(id, full_name, full_name_ar, phone),
      photos:report_photos(*)
    `)
    .eq("district_id", districtId)
    .eq("status", "submitted" as const)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getDistrictReports(supabase: DbClient, districtId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      category:categories(*),
      district:districts(*),
      reporter:profiles!reports_reporter_id_fkey(id, full_name, full_name_ar),
      technician:profiles!reports_assigned_technician_id_fkey(id, full_name, full_name_ar, specialty)
    `)
    .eq("district_id", districtId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getReportDetail(supabase: DbClient, reportId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      category:categories(*),
      district:districts(*),
      reporter:profiles!reports_reporter_id_fkey(id, full_name, full_name_ar, phone, national_id),
      technician:profiles!reports_assigned_technician_id_fkey(id, full_name, full_name_ar, specialty, is_on_leave),
      photos:report_photos(*),
      feedback:report_feedback(*),
      dispute:report_disputes(*)
    `)
    .eq("id", reportId)
    .single();

  if (error) throw error;
  return data;
}

export async function getTechnicianRanking(
  supabase: DbClient,
  districtId: string
) {
  const { data, error } = await supabase
    .from("v_technician_workload")
    .select("*")
    .eq("district_id", districtId)
    .order("workload_score", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPendingLeaves(supabase: DbClient, districtId: string) {
  // Get all techs in district first
  const { data: techs } = await supabase
    .from("profiles")
    .select("id")
    .eq("district_id", districtId)
    .eq("role", "technician" as const);

  if (!techs || techs.length === 0) return [];

  const techIds = techs.map((t) => t.id);

  const { data, error } = await supabase
    .from("leave_requests")
    .select(`
      *,
      technician:profiles!leave_requests_technician_id_fkey(id, full_name, full_name_ar, specialty),
      substitute:profiles!leave_requests_substitute_id_fkey(id, full_name, full_name_ar, specialty)
    `)
    .in("technician_id", techIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPendingDisputes(supabase: DbClient, districtId: string) {
  const { data, error } = await supabase
    .from("report_disputes")
    .select(`
      *,
      report:reports!report_disputes_report_id_fkey(
        *,
        category:categories(*),
        reporter:profiles!reports_reporter_id_fkey(id, full_name, full_name_ar),
        technician:profiles!reports_assigned_technician_id_fkey(id, full_name, full_name_ar, specialty),
        photos:report_photos(*)
      ),
      feedback:report_feedback!report_disputes_feedback_id_fkey(*)
    `)
    .is("resolved_at", null);

  if (error) throw error;

  // Filter by district
  const filtered = (data ?? []).filter(
    (d) => d.report && (d.report as { district_id: string }).district_id === districtId
  );

  return filtered;
}

export async function getDisputeDetail(supabase: DbClient, disputeId: string) {
  const { data, error } = await supabase
    .from("report_disputes")
    .select(`
      *,
      report:reports!report_disputes_report_id_fkey(
        *,
        category:categories(*),
        district:districts(*),
        reporter:profiles!reports_reporter_id_fkey(id, full_name, full_name_ar, phone),
        technician:profiles!reports_assigned_technician_id_fkey(id, full_name, full_name_ar, specialty, is_on_leave),
        photos:report_photos(*)
      ),
      feedback:report_feedback!report_disputes_feedback_id_fkey(*)
    `)
    .eq("id", disputeId)
    .single();

  if (error) throw error;
  return data;
}

export async function getCrossDistrictStatus(supabase: DbClient, dmId: string) {
  const { data, error } = await supabase
    .from("cross_district_requests")
    .select(`
      *,
      target_district:districts!cross_district_requests_target_district_id_fkey(*)
    `)
    .eq("requesting_dm_id", dmId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getDistrictStats(supabase: DbClient, districtId: string) {
  const { data, error } = await supabase
    .from("v_district_stats")
    .select("*")
    .eq("district_id", districtId)
    .single();

  if (error) return null;
  return data;
}

export async function getHeatmapPoints(supabase: DbClient, districtId: string) {
  const { data, error } = await supabase
    .from("v_heatmap_points")
    .select("*")
    .eq("district_id", districtId);

  if (error) throw error;
  return data ?? [];
}

export async function getActiveCrossDistrictPermission(supabase: DbClient, dmId: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("cross_district_requests")
    .select("*")
    .eq("requesting_dm_id", dmId)
    .eq("status", "approved" as const)
    .gt("expires_at", now);

  if (error) return [];
  return data ?? [];
}
