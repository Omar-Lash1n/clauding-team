import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export async function getMyTasks(supabase: DbClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      category:categories(*),
      district:districts(*),
      reporter:profiles!reports_reporter_id_fkey(id, full_name, full_name_ar, phone),
      photos:report_photos(*)
    `)
    .eq("assigned_technician_id", user.id)
    .in("status", ["assigned", "in_progress", "resolved", "rated"])
    .order("priority", { ascending: true })
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getTask(supabase: DbClient, taskId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      category:categories(*),
      district:districts(*),
      reporter:profiles!reports_reporter_id_fkey(id, full_name, full_name_ar, phone),
      photos:report_photos(*)
    `)
    .eq("id", taskId)
    .single();

  if (error) throw error;
  return data;
}

export async function getMyLeaveRequests(supabase: DbClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("leave_requests")
    .select(`
      *,
      substitute:profiles!leave_requests_substitute_id_fkey(id, full_name, full_name_ar, specialty)
    `)
    .eq("technician_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCompletedThisWeek(supabase: DbClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { count, error } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("assigned_technician_id", user.id)
    .in("status", ["resolved", "rated", "archived"])
    .gte("resolved_at", weekAgo.toISOString());

  if (error) throw error;
  return count ?? 0;
}
