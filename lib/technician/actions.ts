"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { validateTransition } from "@/lib/workflow/state-machine";
import type { ReportStatus } from "@/lib/workflow/state-machine";

type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

export async function startTask(input: {
  reportId: string;
}): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // Fetch report
  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("id, status, assigned_technician_id, reporter_id")
    .eq("id", input.reportId)
    .single();

  if (fetchError || !report) return { ok: false, error: "not_found" };
  if (report.assigned_technician_id !== user.id) return { ok: false, error: "not_assigned_to_you" };

  // Validate transition
  const fromStatus: ReportStatus = report.status;
  const toStatus: ReportStatus = "in_progress";
  const transition = validateTransition({ from: fromStatus, to: toStatus, role: "technician" });
  if (!transition.ok) return { ok: false, error: "invalid_transition" };

  // Update report
  const { error: updateError } = await supabase
    .from("reports")
    .update({
      status: toStatus,
      started_at: new Date().toISOString(),
    })
    .eq("id", input.reportId);

  if (updateError) return { ok: false, error: updateError.message };

  // Notify citizen
  await supabase.from("notifications").insert({
    user_id: report.reporter_id,
    type: "report_status_change" as const,
    title_ar: "تم بدء العمل على بلاغك",
    title_en: "Work has started on your report!",
    body_ar: "بدأ الفني العمل على حل المشكلة التي أبلغت عنها.",
    body_en: "A technician has started working on the issue you reported.",
    link_url: `/citizen/reports/${input.reportId}`,
  });

  revalidatePath("/[locale]/technician", "layout");
  revalidatePath(`/[locale]/technician/task/${input.reportId}`);
  revalidatePath(`/[locale]/manager/reports/${input.reportId}`);
  revalidatePath("/[locale]/manager/reports");

  return { ok: true, data: null };
}

export async function resolveTask(input: {
  reportId: string;
  cost: number;
}): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // Fetch report
  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("id, status, assigned_technician_id, reporter_id")
    .eq("id", input.reportId)
    .single();

  if (fetchError || !report) return { ok: false, error: "not_found" };
  if (report.assigned_technician_id !== user.id) return { ok: false, error: "not_assigned_to_you" };

  // Validate transition
  const fromStatus: ReportStatus = report.status;
  const toStatus: ReportStatus = "resolved";
  const transition = validateTransition({ from: fromStatus, to: toStatus, role: "technician" });
  if (!transition.ok) return { ok: false, error: "invalid_transition" };

  if (input.cost < 0) return { ok: false, error: "invalid_cost" };

  // Update report
  const { error: updateError } = await supabase
    .from("reports")
    .update({
      status: toStatus,
      resolved_at: new Date().toISOString(),
      resolved_cost: input.cost,
    })
    .eq("id", input.reportId);

  if (updateError) return { ok: false, error: updateError.message };

  // Notify citizen
  await supabase.from("notifications").insert({
    user_id: report.reporter_id,
    type: "report_resolved" as const,
    title_ar: "تم حل بلاغك — يرجى تقييم الخدمة",
    title_en: "Your report is resolved — please rate the service.",
    body_ar: "أنهى الفني العمل على بلاغك. يُرجى تقييم جودة الخدمة.",
    body_en: "The technician has finished working on your report. Please rate the service quality.",
    link_url: `/citizen/reports/${input.reportId}`,
  });

  revalidatePath("/[locale]/technician", "layout");
  revalidatePath(`/[locale]/technician/task/${input.reportId}`);
  revalidatePath(`/[locale]/manager/reports/${input.reportId}`);
  revalidatePath("/[locale]/manager/reports");

  return { ok: true, data: null };
}

export async function requestLeave(input: {
  startDate: string;
  endDate: string;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  if (input.reason.length < 10) return { ok: false, error: "reason_too_short" };
  if (new Date(input.endDate) < new Date(input.startDate)) return { ok: false, error: "invalid_dates" };

  // Get technician's profile to find their DM
  const { data: profile } = await supabase
    .from("profiles")
    .select("district_id")
    .eq("id", user.id)
    .single();

  const { error: insertError } = await supabase.from("leave_requests").insert({
    technician_id: user.id,
    start_date: input.startDate,
    end_date: input.endDate,
    reason: input.reason,
    status: "pending" as const,
  });

  if (insertError) return { ok: false, error: insertError.message };

  // Notify the DM
  if (profile?.district_id) {
    const { data: dms } = await supabase
      .from("profiles")
      .select("id")
      .eq("district_id", profile.district_id)
      .eq("role", "district_manager" as const);

    if (dms) {
      const { data: techProfile } = await supabase
        .from("profiles")
        .select("full_name, full_name_ar")
        .eq("id", user.id)
        .single();

      for (const dm of dms) {
        await supabase.from("notifications").insert({
          user_id: dm.id,
          type: "leave_decision" as const,
          title_ar: `طلب إجازة جديد من ${techProfile?.full_name_ar || techProfile?.full_name}`,
          title_en: `New leave request from ${techProfile?.full_name}`,
          body_ar: `الفترة: ${input.startDate} إلى ${input.endDate}`,
          body_en: `Period: ${input.startDate} to ${input.endDate}`,
          link_url: "/manager/leave-requests",
        });
      }
    }
  }

  revalidatePath("/[locale]/technician/leave");

  return { ok: true, data: null };
}

export async function cancelLeaveRequest(input: {
  leaveId: string;
}): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // Verify the leave request belongs to this user and is pending
  const { data: leave, error: fetchError } = await supabase
    .from("leave_requests")
    .select("id, status, technician_id")
    .eq("id", input.leaveId)
    .single();

  if (fetchError || !leave) return { ok: false, error: "not_found" };
  if (leave.technician_id !== user.id) return { ok: false, error: "not_your_request" };
  if (leave.status !== "pending") return { ok: false, error: "can_only_cancel_pending" };

  const { error: updateError } = await supabase
    .from("leave_requests")
    .update({ status: "cancelled" as const })
    .eq("id", input.leaveId);

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath("/[locale]/technician/leave");

  return { ok: true, data: null };
}
