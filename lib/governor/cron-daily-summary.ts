import { createAdminSupabase } from "@/lib/supabase/admin";

/**
 * Generate daily summary for a given date.
 * Called by /api/cron/daily-summary route.
 * Uses admin (service-role) client to bypass RLS.
 */
export async function generateDailySummary(date: Date) {
  const admin = createAdminSupabase();
  const dateStr = date.toISOString().slice(0, 10);

  // Count new reports submitted on this date
  const dayStart = `${dateStr}T00:00:00.000Z`;
  const dayEnd = `${dateStr}T23:59:59.999Z`;

  const [newReportsRes, resolvedRes, escalatedRes, activeRes, avgResRes, spentRes] =
    await Promise.all([
      admin
        .from("reports")
        .select("id", { count: "exact", head: true })
        .gte("submitted_at", dayStart)
        .lte("submitted_at", dayEnd),
      admin
        .from("reports")
        .select("id", { count: "exact", head: true })
        .gte("resolved_at", dayStart)
        .lte("resolved_at", dayEnd),
      admin
        .from("reports")
        .select("id", { count: "exact", head: true })
        .not("escalated_at", "is", null)
        .in("status", ["submitted", "approved", "assigned", "in_progress"]),
      admin
        .from("reports")
        .select("id", { count: "exact", head: true })
        .in("status", ["submitted", "approved", "assigned", "in_progress"]),
      admin.from("v_district_stats").select("avg_resolution_hours"),
      admin
        .from("reports")
        .select("resolved_cost")
        .gte("resolved_at", dayStart)
        .lte("resolved_at", dayEnd)
        .not("resolved_cost", "is", null),
    ]);

  // Top 3 delay districts by escalation count
  const { data: distStats } = await admin
    .from("v_district_stats")
    .select("district_id, name_en, name_ar, escalation_count")
    .order("escalation_count", { ascending: false })
    .limit(3);

  const topDelayDistricts = distStats ?? [];

  // Count critical unassigned
  const { count: criticalCount } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("priority", "critical")
    .in("status", ["submitted", "approved"]);

  // Avg resolution hours (7d rolling)
  let avgResHours = 0;
  if (avgResRes.data && avgResRes.data.length > 0) {
    const valid = avgResRes.data.filter(
      (r: { avg_resolution_hours: number | null }) => r.avg_resolution_hours != null
    );
    if (valid.length > 0) {
      avgResHours =
        valid.reduce(
          (s: number, r: { avg_resolution_hours: number | null }) =>
            s + (r.avg_resolution_hours ?? 0),
          0
        ) / valid.length;
    }
  }

  // Total spent today
  const totalSpentToday = (spentRes.data ?? []).reduce(
    (s: number, r: { resolved_cost: number | null }) =>
      s + Number(r.resolved_cost ?? 0),
    0
  );

  const payload = {
    critical_unassigned: criticalCount ?? 0,
    total_active: activeRes.count ?? 0,
    avg_resolution_hours_7d: Math.round(avgResHours * 10) / 10,
    total_spent_today: totalSpentToday,
  };

  // Upsert keyed on summary_date
  const { data, error } = await admin
    .from("daily_summaries")
    .upsert(
      {
        summary_date: dateStr,
        new_reports_count: newReportsRes.count ?? 0,
        resolved_count: resolvedRes.count ?? 0,
        top_delay_districts: topDelayDistricts,
        payload,
      },
      { onConflict: "summary_date" }
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
