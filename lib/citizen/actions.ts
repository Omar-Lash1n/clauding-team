"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { validateTransition } from "@/lib/workflow/state-machine";
import { feedbackSchema } from "@/lib/validators/schemas";
import { districtFromPoint } from "@/lib/utils/geo";
import { uploadReportPhoto } from "@/lib/citizen/photo-upload";
import { findNearbyActiveReports } from "@/lib/workflow/duplicate-check";
import type { PriorityLevel, NearbyReport } from "@/types/domain";

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createReport(
  formData: FormData
): Promise<ActionResult<{ reportId: string }>> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const categoryId = formData.get("category_id") as string;
  const priority = formData.get("priority") as PriorityLevel;
  const description = formData.get("description") as string;
  const addressDescription = formData.get("address_description") as string | null;
  const lat = parseFloat(formData.get("location_lat") as string);
  const lng = parseFloat(formData.get("location_lng") as string);

  if (!categoryId || !priority || !description || isNaN(lat) || isNaN(lng)) {
    return { ok: false, error: "missing_fields" };
  }
  if (description.length < 20) {
    return { ok: false, error: "description_too_short" };
  }

  // Determine district from coordinates
  const { data: districts } = await supabase
    .from("districts")
    .select("id, center_lat, center_lng, bounding_radius_km");
  const districtBounds = (districts ?? []).map((d) => ({
    id: d.id,
    centerLat: d.center_lat,
    centerLng: d.center_lng,
    boundingRadiusKm: d.bounding_radius_km,
  }));
  const districtId = districtFromPoint(lat, lng, districtBounds);
  if (!districtId) return { ok: false, error: "district_not_found" };

  // Insert report row
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      category_id: categoryId,
      priority: priority,
      description,
      address_description: addressDescription || null,
      location_lat: lat,
      location_lng: lng,
      district_id: districtId,
      reporter_id: user.id,
      status: "submitted" as const,
    })
    .select("id")
    .single<{ id: string }>();

  if (reportError || !report) {
    return { ok: false, error: reportError?.message ?? "insert_failed" };
  }

  // Upload photos
  const photoEntries: { path: string; index: number }[] = [];
  let photoIndex = 0;
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("photo_") && value instanceof File && value.size > 0) {
      try {
        const { path } = await uploadReportPhoto(
          supabase,
          value,
          report.id,
          "before",
          photoIndex
        );
        photoEntries.push({ path, index: photoIndex });
        photoIndex++;
      } catch {
        // Rollback report on photo failure
        await supabase.from("reports").delete().eq("id", report.id);
        return { ok: false, error: "upload_failed" };
      }
    }
  }

  if (photoEntries.length === 0) {
    await supabase.from("reports").delete().eq("id", report.id);
    return { ok: false, error: "no_photos" };
  }

  // Insert report_photos rows
  const { error: photosError } = await supabase.from("report_photos").insert(
    photoEntries.map(({ path }) => ({
      report_id: report.id,
      storage_path: path,
      photo_type: "before" as const,
      uploaded_by: user.id,
    }))
  );

  if (photosError) {
    await supabase.from("reports").delete().eq("id", report.id);
    return { ok: false, error: photosError.message };
  }

  revalidatePath("/[locale]/citizen", "layout");
  return { ok: true, data: { reportId: report.id } };
}

export async function checkNearbyReports(
  lat: number,
  lng: number,
  categoryId: string
): Promise<NearbyReport[]> {
  const supabase = await createServerSupabase();
  try {
    return await findNearbyActiveReports(supabase, lat, lng, categoryId, 50);
  } catch {
    return [];
  }
}

export async function editReport(
  id: string,
  formData: FormData,
  removedPhotoIds: string[]
): Promise<ActionResult<void>> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: existing } = await supabase
    .from("reports")
    .select("status, reporter_id")
    .eq("id", id)
    .single<{ status: string; reporter_id: string }>();

  if (!existing || existing.reporter_id !== user.id) {
    return { ok: false, error: "not_found" };
  }
  if (existing.status !== "submitted") {
    return { ok: false, error: "not_editable" };
  }

  const description = formData.get("description") as string | null;
  const addressDescription = formData.get("address_description") as string | null;
  const priority = formData.get("priority") as PriorityLevel | null;
  const categoryId = formData.get("category_id") as string | null;

  const { error } = await supabase
    .from("reports")
    .update({
      ...(description ? { description } : {}),
      ...(addressDescription !== null ? { address_description: addressDescription } : {}),
      ...(priority ? { priority } : {}),
      ...(categoryId ? { category_id: categoryId } : {}),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  // Remove deleted photos
  if (removedPhotoIds.length > 0) {
    await supabase
      .from("report_photos")
      .delete()
      .in("id", removedPhotoIds)
      .eq("report_id", id);
  }

  // Upload new photos
  let photoIndex = 0;
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("photo_") && value instanceof File && value.size > 0) {
      try {
        const { path } = await uploadReportPhoto(
          supabase,
          value,
          id,
          "before",
          photoIndex
        );
        await supabase.from("report_photos").insert({
          report_id: id,
          storage_path: path,
          photo_type: "before" as const,
          uploaded_by: user.id,
        });
        photoIndex++;
      } catch {
        // Non-fatal: continue
      }
    }
  }

  revalidatePath("/[locale]/citizen", "layout");
  return { ok: true, data: undefined };
}

export async function cancelReport(id: string): Promise<ActionResult<void>> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: existing } = await supabase
    .from("reports")
    .select("status, reporter_id")
    .eq("id", id)
    .single<{ status: string; reporter_id: string }>();

  if (!existing || existing.reporter_id !== user.id) {
    return { ok: false, error: "not_found" };
  }

  const validation = validateTransition({
    from: existing.status as "submitted",
    to: "cancelled",
    role: "citizen",
  });
  if (!validation.ok) return { ok: false, error: "invalid_transition" };

  const { error } = await supabase
    .from("reports")
    .update({ status: "cancelled" as const })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/[locale]/citizen", "layout");
  return { ok: true, data: undefined };
}

export async function submitFeedback(
  reportId: string,
  input: { rating: number; comment?: string }
): Promise<ActionResult<void>> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation_failed" };

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: report } = await supabase
    .from("reports")
    .select("status, reporter_id")
    .eq("id", reportId)
    .single<{ status: string; reporter_id: string }>();

  if (!report || report.reporter_id !== user.id) {
    return { ok: false, error: "not_found" };
  }

  const validation = validateTransition({
    from: report.status as "resolved",
    to: "rated",
    role: "citizen",
  });
  if (!validation.ok) return { ok: false, error: "invalid_transition" };

  const { error: fbError } = await supabase.from("report_feedback").insert({
    report_id: reportId,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  });
  if (fbError) return { ok: false, error: fbError.message };

  await supabase
    .from("reports")
    .update({ status: "rated" as const })
    .eq("id", reportId);

  revalidatePath("/[locale]/citizen", "layout");
  return { ok: true, data: undefined };
}

export async function fileDispute(reportId: string): Promise<ActionResult<void>> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: report } = await supabase
    .from("reports")
    .select("status, reporter_id")
    .eq("id", reportId)
    .single<{ status: string; reporter_id: string }>();

  if (!report || report.reporter_id !== user.id) {
    return { ok: false, error: "not_found" };
  }

  const validation = validateTransition({
    from: report.status as "rated",
    to: "disputed",
    role: "citizen",
  });
  if (!validation.ok) return { ok: false, error: "invalid_transition" };

  // Get feedback for this report
  const { data: feedback } = await supabase
    .from("report_feedback")
    .select("id, rating")
    .eq("report_id", reportId)
    .single<{ id: string; rating: number }>();

  if (!feedback) return { ok: false, error: "feedback_not_found" };
  if (feedback.rating > 2) return { ok: false, error: "rating_too_high" };

  const { error: disputeError } = await supabase
    .from("report_disputes")
    .insert({
      report_id: reportId,
      feedback_id: feedback.id,
    });
  if (disputeError) return { ok: false, error: disputeError.message };

  await supabase
    .from("reports")
    .update({ status: "disputed" as const })
    .eq("id", reportId);

  revalidatePath("/[locale]/citizen", "layout");
  return { ok: true, data: undefined };
}

export async function markNotificationRead(id: string): Promise<ActionResult<void>> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/[locale]/citizen/notifications", "page");
  return { ok: true, data: undefined };
}

export async function markAllNotificationsRead(): Promise<ActionResult<void>> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/[locale]/citizen/notifications", "page");
  return { ok: true, data: undefined };
}
