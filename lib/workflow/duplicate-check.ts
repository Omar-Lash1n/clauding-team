import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { NearbyReport } from "@/types/domain";

export async function findNearbyActiveReports(
  supabase: SupabaseClient<Database>,
  lat: number,
  lng: number,
  categoryId: string,
  radiusMeters = 50
): Promise<NearbyReport[]> {
  const { data, error } = await supabase.rpc("find_nearby_active_reports", {
    p_lat: lat,
    p_lng: lng,
    p_category_id: categoryId,
    p_radius_meters: radiusMeters,
  });

  if (error) throw error;
  return (data as NearbyReport[]) ?? [];
}
