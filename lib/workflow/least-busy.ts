import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { LeastBusyTechnician } from "@/types/domain";

type SpecialtyType = Database["public"]["Enums"]["specialty_type"];

export async function pickLeastBusyTechnician(
  supabase: SupabaseClient<Database>,
  districtId: string,
  specialty: SpecialtyType
): Promise<LeastBusyTechnician[]>;

export async function pickLeastBusyTechnician(
  supabase: SupabaseClient<Database>,
  districtId: string,
  specialty: SpecialtyType,
  excludeTechnicianId: string
): Promise<LeastBusyTechnician[]>;

export async function pickLeastBusyTechnician(
  supabase: SupabaseClient<Database>,
  districtId: string,
  specialty: SpecialtyType,
  excludeTechnicianId?: string
): Promise<LeastBusyTechnician[]> {
  const { data, error } = await supabase.rpc("pick_least_busy_technician", {
    p_district_id: districtId,
    p_specialty: specialty,
  });

  if (error) throw error;
  if (!data) return [];

  const results = data as LeastBusyTechnician[];

  if (excludeTechnicianId) {
    return results.filter((t) => t.technician_id !== excludeTechnicianId);
  }

  return results;
}
