import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PhotoType } from "@/types/domain";

export async function uploadReportPhoto(
  supabase: SupabaseClient<Database>,
  file: File | Blob,
  reportId: string,
  photoType: PhotoType,
  index: number
): Promise<{ path: string }> {
  const fileName =
    file instanceof File ? file.name : `photo_${index}.jpg`;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${reportId}/${photoType}_${Date.now()}_${index}.${ext}`;

  const { error } = await supabase.storage
    .from("reports")
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) throw error;
  return { path };
}

export async function getSignedUrl(
  supabase: SupabaseClient<Database>,
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  const { data } = await supabase.storage
    .from("reports")
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}
