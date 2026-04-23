"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { validateTransition } from "@/lib/workflow/state-machine";
import type { ReportStatus } from "@/lib/workflow/state-machine";
import type { PriorityLevel } from "@/types/domain";

type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

export async function approveReport(input: {
  reportId: string;
  makePublic?: boolean;
  overridePriority?: PriorityLevel;
  overrideCategory?: string;
}): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("id, status, reporter_id")
    .eq("id", input.reportId)
    .single();

  if (fetchError || !report) return { ok: false, error: "not_found" };

  const fromStatus: ReportStatus = report.status;
  const toStatus: ReportStatus = "approved";
  const transition = validateTransition({ from: fromStatus, to: toStatus, role: "district_manager" });
  if (!transition.ok) return { ok: false, error: "invalid_transition" };

  const { error: updateError } = await supabase
    .from("reports")
    .update({
      status: toStatus,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      is_public: input.makePublic ?? false,
      ...(input.overridePriority ? { priority: input.overridePriority } : {}),
      ...(input.overrideCategory ? { category_id: input.overrideCategory } : {}),
    })
    .eq("id", input.reportId);

  if (updateError) return { ok: false, error: updateError.message };

  // Notify citizen
  await supabase.from("notifications").insert({
    user_id: report.reporter_id,
    type: "report_status_change" as const,
    title_ar: "تمت الموافقة على بلاغك",
    title_en: "Your report has been approved",
    body_ar: "تمت الموافقة على بلاغك وسيتم تعيين فني قريباً.",
    body_en: "Your report has been approved and a technician will be assigned soon.",
    link_url: `/citizen/reports/${input.reportId}`,
  });

  revalidatePath("/[locale]/manager/queue");
  revalidatePath("/[locale]/manager", "page");
  revalidatePath(`/[locale]/manager/reports/${input.reportId}`);
  revalidatePath("/[locale]/manager/reports");

  return { ok: true, data: null };
}

export async function rejectReport(input: {
  reportId: string;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  if (input.reason.length < 5) return { ok: false, error: "reason_too_short" };

  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("id, status, reporter_id")
    .eq("id", input.reportId)
    .single();

  if (fetchError || !report) return { ok: false, error: "not_found" };

  const fromStatus: ReportStatus = report.status;
  const toStatus: ReportStatus = "rejected";
  const transition = validateTransition({ from: fromStatus, to: toStatus, role: "district_manager" });
  if (!transition.ok) return { ok: false, error: "invalid_transition" };

  const { error: updateError } = await supabase
    .from("reports")
    .update({
      status: toStatus,
      rejected_reason: input.reason,
    })
    .eq("id", input.reportId);

  if (updateError) return { ok: false, error: updateError.message };

  await supabase.from("notifications").insert({
    user_id: report.reporter_id,
    type: "report_status_change" as const,
    title_ar: "تم رفض بلاغك",
    title_en: "Your report has been rejected",
    body_ar: `سبب الرفض: ${input.reason}`,
    body_en: `Reason: ${input.reason}`,
    link_url: `/citizen/reports/${input.reportId}`,
  });

  revalidatePath("/[locale]/manager/queue");
  revalidatePath("/[locale]/manager", "page");
  revalidatePath(`/[locale]/manager/reports/${input.reportId}`);

  return { ok: true, data: null };
}

export async function assignTechnician(input: {
  reportId: string;
  technicianId: string;
}): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // Fetch report
  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("id, status, district_id, category_id, reporter_id")
    .eq("id", input.reportId)
    .single();

  if (fetchError || !report) return { ok: false, error: "not_found" };

  // Validate transition
  const fromStatus: ReportStatus = report.status;
  const toStatus: ReportStatus = "assigned";
  const transition = validateTransition({ from: fromStatus, to: toStatus, role: "district_manager" });
  if (!transition.ok) return { ok: false, error: "invalid_transition" };

  // Fetch technician
  const { data: tech, error: techError } = await supabase
    .from("profiles")
    .select("id, district_id, is_on_leave, specialty, full_name, full_name_ar")
    .eq("id", input.technicianId)
    .single();

  if (techError || !tech) return { ok: false, error: "technician_not_found" };

  // Check on-leave
  if (tech.is_on_leave) return { ok: false, error: "technician_on_leave" };

  // Check district match (or cross-district permission)
  if (tech.district_id !== report.district_id) {
    if (!tech.district_id) return { ok: false, error: "district_mismatch_no_permission" };
    const now = new Date().toISOString();
    const { data: crossPerms } = await supabase
      .from("cross_district_requests")
      .select("id")
      .eq("requesting_dm_id", user.id)
      .eq("target_district_id", tech.district_id)
      .eq("status", "approved" as const)
      .gt("expires_at", now)
      .limit(1);

    if (!crossPerms || crossPerms.length === 0) {
      return { ok: false, error: "district_mismatch_no_permission" };
    }
  }

  // Check specialty mismatch for audit
  const { data: category } = await supabase
    .from("categories")
    .select("default_specialty")
    .eq("id", report.category_id)
    .single();

  const isMismatch = category && category.default_specialty !== tech.specialty;

  // Update report
  const { error: updateError } = await supabase
    .from("reports")
    .update({
      status: toStatus,
      assigned_technician_id: input.technicianId,
      assigned_at: new Date().toISOString(),
    })
    .eq("id", input.reportId);

  if (updateError) return { ok: false, error: updateError.message };

  // Notify technician
  await supabase.from("notifications").insert({
    user_id: input.technicianId,
    type: "new_task" as const,
    title_ar: "مهمة جديدة مُسندة إليك",
    title_en: "New task assigned to you",
    body_ar: "تم تعيينك على بلاغ جديد. يرجى مراجعته والبدء بالعمل.",
    body_en: "You have been assigned a new report. Please review and start work.",
    link_url: `/technician/task/${input.reportId}`,
  });

  // If mismatch, audit notification to DM
  if (isMismatch) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "generic" as const,
      title_ar: "تعيين بتخصص مختلف",
      title_en: "Specialty mismatch assignment",
      body_ar: `قمت بتعيين مهمة لفني بتخصص مختلف: ${tech.full_name_ar || tech.full_name}`,
      body_en: `You assigned a specialty-mismatched task to ${tech.full_name}`,
      link_url: `/manager/reports/${input.reportId}`,
    });
  }

  // Notify citizen
  await supabase.from("notifications").insert({
    user_id: report.reporter_id,
    type: "report_assigned" as const,
    title_ar: "تم تعيين فني على بلاغك",
    title_en: "A technician has been assigned to your report",
    body_ar: `تم تعيين الفني ${tech.full_name_ar || tech.full_name} على بلاغك.`,
    body_en: `Technician ${tech.full_name} has been assigned to your report.`,
    link_url: `/citizen/reports/${input.reportId}`,
  });

  revalidatePath(`/[locale]/manager/reports/${input.reportId}`);
  revalidatePath("/[locale]/manager/reports");
  revalidatePath("/[locale]/manager/technicians");
  revalidatePath("/[locale]/technician", "layout");

  return { ok: true, data: null };
}

export async function approveLeave(input: {
  leaveId: string;
}): Promise<ActionResult<{ substituteName: string | null }>> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const adminSupabase = createAdminSupabase();

  // Call auto_assign_substitute RPC
  const { data: substituteId, error: rpcError } = await adminSupabase.rpc(
    "auto_assign_substitute",
    { p_leave_id: input.leaveId }
  );

  let substituteName: string | null = null;

  if (rpcError) {
    // RPC failed entirely — still approve but warn
    const { error: updateError } = await supabase
      .from("leave_requests")
      .update({
        status: "approved" as const,
        approved_by: user.id,
        decided_at: new Date().toISOString(),
      })
      .eq("id", input.leaveId);

    if (updateError) return { ok: false, error: updateError.message };

    // Notify DM about no substitute
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "generic" as const,
      title_ar: "إجازة مُوافَق عليها بدون بديل",
      title_en: "Leave approved but no substitute available",
      body_ar: "تمت الموافقة على الإجازة ولكن لا يوجد بديل متاح. يرجى التدخل.",
      body_en: "Leave approved but no substitute available — tasks will remain with original technician until you intervene.",
    });
  } else if (substituteId === null) {
    // RPC succeeded but no substitute found
    const { error: updateError } = await supabase
      .from("leave_requests")
      .update({
        status: "approved" as const,
        approved_by: user.id,
        decided_at: new Date().toISOString(),
      })
      .eq("id", input.leaveId);

    if (updateError) return { ok: false, error: updateError.message };

    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "generic" as const,
      title_ar: "إجازة مُوافَق عليها بدون بديل",
      title_en: "Leave approved but no substitute available",
      body_ar: "تمت الموافقة على الإجازة ولكن لا يوجد بديل متاح.",
      body_en: "Leave approved but no substitute available — tasks remain with original technician.",
    });
  } else {
    // Substitute found
    const { data: subProfile } = await supabase
      .from("profiles")
      .select("full_name, full_name_ar")
      .eq("id", substituteId)
      .single();

    substituteName = subProfile?.full_name ?? null;

    // Update leave request
    const { error: updateError } = await supabase
      .from("leave_requests")
      .update({
        status: "approved" as const,
        approved_by: user.id,
        decided_at: new Date().toISOString(),
        substitute_id: substituteId,
      })
      .eq("id", input.leaveId);

    if (updateError) return { ok: false, error: updateError.message };
  }

  // Notify the technician
  const { data: leave } = await supabase
    .from("leave_requests")
    .select("technician_id")
    .eq("id", input.leaveId)
    .single();

  if (leave) {
    await supabase.from("notifications").insert({
      user_id: leave.technician_id,
      type: "leave_decision" as const,
      title_ar: "تمت الموافقة على طلب إجازتك",
      title_en: "Your leave request has been approved",
      body_ar: "تمت الموافقة على طلب إجازتك. يمكنك بدء إجازتك في الموعد المحدد.",
      body_en: "Your leave request has been approved. You may begin your leave on the scheduled date.",
      link_url: "/technician/leave",
    });
  }

  revalidatePath("/[locale]/manager/leave-requests");
  revalidatePath("/[locale]/manager/technicians");
  revalidatePath("/[locale]/technician/leave");
  revalidatePath("/[locale]/technician", "layout");

  return { ok: true, data: { substituteName } };
}

export async function rejectLeave(input: {
  leaveId: string;
}): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: leave } = await supabase
    .from("leave_requests")
    .select("technician_id")
    .eq("id", input.leaveId)
    .single();

  const { error: updateError } = await supabase
    .from("leave_requests")
    .update({
      status: "rejected" as const,
      approved_by: user.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", input.leaveId);

  if (updateError) return { ok: false, error: updateError.message };

  if (leave) {
    await supabase.from("notifications").insert({
      user_id: leave.technician_id,
      type: "leave_decision" as const,
      title_ar: "تم رفض طلب إجازتك",
      title_en: "Your leave request has been rejected",
      body_ar: "تم رفض طلب إجازتك. تواصل مع مديرك لمزيد من التفاصيل.",
      body_en: "Your leave request has been rejected. Contact your manager for details.",
      link_url: "/technician/leave",
    });
  }

  revalidatePath("/[locale]/manager/leave-requests");

  return { ok: true, data: null };
}

export async function resolveDispute(input: {
  disputeId: string;
  resolution: "assign_new" | "same_tech_again" | "dispute_rejected";
  newTechnicianId?: string;
  dmNotes?: string;
}): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // Fetch dispute
  const { data: dispute, error: fetchError } = await supabase
    .from("report_disputes")
    .select("id, report_id, feedback_id")
    .eq("id", input.disputeId)
    .single();

  if (fetchError || !dispute) return { ok: false, error: "not_found" };

  // Fetch report
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, status, district_id, category_id, assigned_technician_id, reporter_id")
    .eq("id", dispute.report_id)
    .single();

  if (reportError || !report) return { ok: false, error: "report_not_found" };

  const resolution = input.resolution;

  if (resolution === "assign_new") {
    if (!input.newTechnicianId) return { ok: false, error: "new_technician_required" };

    // Validate the new tech
    const { data: tech } = await supabase
      .from("profiles")
      .select("id, district_id, is_on_leave, full_name, full_name_ar")
      .eq("id", input.newTechnicianId)
      .single();

    if (!tech) return { ok: false, error: "technician_not_found" };
    if (tech.is_on_leave) return { ok: false, error: "technician_on_leave" };

    const fromStatus: ReportStatus = report.status;
    const toStatus: ReportStatus = "assigned";
    const transition = validateTransition({ from: fromStatus, to: toStatus, role: "district_manager" });
    if (!transition.ok) return { ok: false, error: "invalid_transition" };

    await supabase.from("reports").update({
      status: toStatus,
      assigned_technician_id: input.newTechnicianId,
      assigned_at: new Date().toISOString(),
    }).eq("id", report.id);

    await supabase.from("notifications").insert({
      user_id: input.newTechnicianId,
      type: "new_task" as const,
      title_ar: "مهمة جديدة مُسندة إليك",
      title_en: "New task assigned to you",
      body_ar: "تم تعيينك على بلاغ بعد نزاع.",
      body_en: "You have been assigned a report following a dispute.",
      link_url: `/technician/task/${report.id}`,
    });

    await supabase.from("notifications").insert({
      user_id: report.reporter_id,
      type: "report_status_change" as const,
      title_ar: "تم تعيين فني جديد على بلاغك",
      title_en: "A new technician has been assigned to your report",
      body_ar: "تمت مراجعة نزاعك وتعيين فني جديد.",
      body_en: "Your dispute has been reviewed and a new technician assigned.",
      link_url: `/citizen/reports/${report.id}`,
    });
  } else if (resolution === "same_tech_again") {
    if (!input.dmNotes || input.dmNotes.length < 5) return { ok: false, error: "notes_required" };

    const fromStatus: ReportStatus = report.status;
    const toStatus: ReportStatus = "in_progress";
    const transition = validateTransition({ from: fromStatus, to: toStatus, role: "district_manager" });
    if (!transition.ok) return { ok: false, error: "invalid_transition" };

    await supabase.from("reports").update({
      status: toStatus,
    }).eq("id", report.id);

    if (report.assigned_technician_id) {
      await supabase.from("notifications").insert({
        user_id: report.assigned_technician_id,
        type: "generic" as const,
        title_ar: "تم تقديم نزاع — يرجى إعادة المراجعة",
        title_en: "Dispute filed — please re-check",
        body_ar: `ملاحظات المدير: ${input.dmNotes}`,
        body_en: `Manager's notes: ${input.dmNotes}`,
        link_url: `/technician/task/${report.id}`,
      });
    }
  } else if (resolution === "dispute_rejected") {
    if (!input.dmNotes || input.dmNotes.length < 5) return { ok: false, error: "notes_required" };

    const fromStatus: ReportStatus = report.status;
    const toStatus: ReportStatus = "archived";
    const transition = validateTransition({ from: fromStatus, to: toStatus, role: "district_manager" });
    if (!transition.ok) return { ok: false, error: "invalid_transition" };

    await supabase.from("reports").update({
      status: toStatus,
      archived_at: new Date().toISOString(),
    }).eq("id", report.id);

    await supabase.from("notifications").insert({
      user_id: report.reporter_id,
      type: "report_status_change" as const,
      title_ar: "تم رفض نزاعك",
      title_en: "Your dispute has been rejected",
      body_ar: `ملاحظات المدير: ${input.dmNotes}`,
      body_en: `Manager's notes: ${input.dmNotes}`,
      link_url: `/citizen/reports/${report.id}`,
    });
  }

  // Update dispute row
  await supabase.from("report_disputes").update({
    resolution,
    new_technician_id: input.newTechnicianId ?? null,
    resolved_by_dm: user.id,
    dm_notes: input.dmNotes ?? null,
    resolved_at: new Date().toISOString(),
  }).eq("id", input.disputeId);

  revalidatePath("/[locale]/manager/disputes");
  revalidatePath(`/[locale]/manager/disputes/${input.disputeId}`);
  revalidatePath(`/[locale]/manager/reports/${report.id}`);
  revalidatePath("/[locale]/manager/reports");
  revalidatePath("/[locale]/technician", "layout");

  return { ok: true, data: null };
}

export async function requestCrossDistrict(input: {
  targetDistrictId: string;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  if (input.reason.length < 20) return { ok: false, error: "reason_too_short" };

  const { error: insertError } = await supabase.from("cross_district_requests").insert({
    requesting_dm_id: user.id,
    target_district_id: input.targetDistrictId,
    reason: input.reason,
    status: "pending" as const,
  });

  if (insertError) return { ok: false, error: insertError.message };

  // Notify all governors
  const { data: governors } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "governor" as const);

  if (governors) {
    for (const gov of governors) {
      await supabase.from("notifications").insert({
        user_id: gov.id,
        type: "cross_district_decision" as const,
        title_ar: "طلب وصول جديد عبر الأقسام",
        title_en: "New cross-district access request",
        body_ar: `سبب الطلب: ${input.reason.substring(0, 100)}`,
        body_en: `Reason: ${input.reason.substring(0, 100)}`,
        link_url: "/governor/cross-district",
      });
    }
  }

  revalidatePath("/[locale]/manager/cross-district");

  return { ok: true, data: null };
}

export async function toggleReportPublic(input: {
  reportId: string;
  isPublic: boolean;
}): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("reports")
    .update({ is_public: input.isPublic })
    .eq("id", input.reportId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/[locale]/manager/reports/${input.reportId}`);

  return { ok: true, data: null };
}

export async function revokeCrossDistrict(input: {
  requestId: string;
}): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("cross_district_requests")
    .update({ status: "rejected" as const })
    .eq("id", input.requestId)
    .eq("requesting_dm_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/[locale]/manager/cross-district");

  return { ok: true, data: null };
}
