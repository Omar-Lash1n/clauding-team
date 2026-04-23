import type { Database } from "@/types/database";

export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type UserRole = Database["public"]["Enums"]["user_role"];

export const ALLOWED_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  submitted: ["approved", "rejected", "cancelled"],
  approved: ["assigned", "rejected"],
  assigned: ["in_progress", "assigned"],
  in_progress: ["resolved"],
  resolved: ["rated", "archived"],
  rated: ["archived", "disputed"],
  disputed: ["assigned", "in_progress", "archived"],
  rejected: [],
  cancelled: [],
  archived: [],
};

// key = `${from}->${to}`, value = roles allowed to perform it
export const TRANSITION_ROLES: Record<string, UserRole[]> = {
  "submitted->approved": ["district_manager"],
  "submitted->rejected": ["district_manager"],
  "submitted->cancelled": ["citizen"],
  "approved->assigned": ["district_manager"],
  "approved->rejected": ["district_manager"],
  "assigned->in_progress": ["technician"],
  "assigned->assigned": ["district_manager"],
  "in_progress->resolved": ["technician"],
  "resolved->rated": ["citizen"],
  "resolved->archived": ["district_manager", "governor"],
  "rated->archived": ["district_manager", "governor"],
  "rated->disputed": ["citizen"],
  "disputed->assigned": ["district_manager"],
  "disputed->in_progress": ["district_manager"],
  "disputed->archived": ["district_manager", "governor"],
};

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStates(from: ReportStatus): ReportStatus[] {
  return ALLOWED_TRANSITIONS[from] ?? [];
}

export function rolesAllowed(from: ReportStatus, to: ReportStatus): UserRole[] {
  return TRANSITION_ROLES[`${from}->${to}`] ?? [];
}

export function validateTransition(args: {
  from: ReportStatus;
  to: ReportStatus;
  role: UserRole;
}): { ok: true } | { ok: false; reason: string } {
  const { from, to, role } = args;
  if (!canTransition(from, to)) {
    return {
      ok: false,
      reason: `Transition ${from} → ${to} is not allowed by the workflow.`,
    };
  }
  const allowed = rolesAllowed(from, to);
  if (allowed.length > 0 && !allowed.includes(role)) {
    return {
      ok: false,
      reason: `Role '${role}' cannot perform transition ${from} → ${to}. Allowed: ${allowed.join(", ")}.`,
    };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Inline assertions (run during tests: NODE_ENV=test)
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV === "test") {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error(`state-machine assertion failed: ${msg}`);
  };

  // Valid transitions
  assert(canTransition("submitted", "approved"), "submitted->approved");
  assert(canTransition("submitted", "rejected"), "submitted->rejected");
  assert(canTransition("submitted", "cancelled"), "submitted->cancelled");
  assert(canTransition("approved", "assigned"), "approved->assigned");
  assert(canTransition("assigned", "in_progress"), "assigned->in_progress");
  assert(canTransition("in_progress", "resolved"), "in_progress->resolved");
  assert(canTransition("resolved", "rated"), "resolved->rated");
  assert(canTransition("rated", "disputed"), "rated->disputed");
  assert(canTransition("disputed", "assigned"), "disputed->assigned");

  // Invalid / terminal transitions
  assert(!canTransition("archived", "submitted"), "archived->submitted illegal");
  assert(!canTransition("rejected", "approved"), "rejected->approved illegal");
  assert(!canTransition("cancelled", "approved"), "cancelled->approved illegal");
  assert(!canTransition("submitted", "in_progress"), "submitted->in_progress illegal");
  assert(!canTransition("resolved", "submitted"), "resolved->submitted illegal");

  // Role checks
  const r1 = validateTransition({ from: "submitted", to: "approved", role: "district_manager" });
  assert(r1.ok, "DM can approve submitted");

  const r2 = validateTransition({ from: "submitted", to: "approved", role: "citizen" });
  assert(!r2.ok, "citizen cannot approve");

  const r3 = validateTransition({ from: "in_progress", to: "resolved", role: "technician" });
  assert(r3.ok, "technician can resolve");

  const r4 = validateTransition({ from: "in_progress", to: "resolved", role: "governor" });
  assert(!r4.ok, "governor cannot resolve in_progress");

  const r5 = validateTransition({ from: "submitted", to: "cancelled", role: "citizen" });
  assert(r5.ok, "citizen can cancel own submitted");
}
