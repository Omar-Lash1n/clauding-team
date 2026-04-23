import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export async function getCategories(supabase: DbClient) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name_en");

  if (error) throw error;
  return data;
}

export async function getDistricts(supabase: DbClient) {
  const { data, error } = await supabase
    .from("districts")
    .select("*")
    .order("name_en");

  if (error) throw error;
  return data;
}

export async function getTechnicianById(supabase: DbClient, id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, full_name_ar, email, phone, specialty, district_id, is_on_leave, substitute_for_user_id")
    .eq("id", id)
    .eq("role", "technician" as const)
    .single();

  if (error) throw error;
  return data;
}

export async function getCurrentProfile(supabase: DbClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data;
}
