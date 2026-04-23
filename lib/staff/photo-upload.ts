import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export async function uploadAfterPhoto(
  supabase: DbClient,
  reportId: string,
  file: File,
  uploadedBy: string
): Promise<{ storagePath: string } | { error: string }> {
  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `${reportId}/after_${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("report-photos")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("report_photos").insert({
    report_id: reportId,
    storage_path: storagePath,
    photo_type: "after" as const,
    uploaded_by: uploadedBy,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  return { storagePath };
}

export function getPhotoUrl(
  supabase: DbClient,
  storagePath: string
): string {
  const { data } = supabase.storage
    .from("report-photos")
    .getPublicUrl(storagePath);

  return data.publicUrl;
}
