import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type DistrictStatsRow = Database["public"]["Views"]["v_district_stats"]["Row"];
type HeatmapPointRow = Database["public"]["Views"]["v_heatmap_points"]["Row"];
type ReportRow = Database["public"]["Tables"]["reports"]["Row"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CityKPIs {
  totalReportsToday: number;
  activeReports: number;
  resolvedReports: number;
  escalatedReports: number;
  criticalUnassigned: number;
  avgResolutionHours7d: number;
}

export interface DistrictRankingRow {
  districtId: string;
  nameEn: string;
  nameAr: string;
  activeCount: number;
  avgResolutionHours: number;
  escalationCount: number;
  totalSpent: number;
  completedCount: number;
  totalReports: number;
  score: number;
  rank: number;
}

export interface AnalyticsData {
  resolutionByDistrict: {
    districtId: string;
    districtName: string;
    districtNameAr: string;
    priority: string;
    avgHours: number;
  }[];
  topCategories: {
    categoryId: string;
    nameEn: string;
    nameAr: string;
    count: number;
  }[];
  escalationTrend: { date: string; count: number }[];
  completionByDistrict: {
    districtId: string;
    districtName: string;
    districtNameAr: string;
    resolved: number;
    active: number;
    rejected: number;
    total: number;
  }[];
  costByCategory: {
    categoryId: string;
    nameEn: string;
    nameAr: string;
    totalCost: number;
  }[];
}

export interface BudgetDistrictData {
  districtId: string;
  nameEn: string;
  nameAr: string;
  totalSpentMonth: number;
  totalSpentYear: number;
  topCategories: { nameEn: string; nameAr: string; amount: number }[];
  sharePercent: number;
}

export interface BudgetCategoryData {
  categoryId: string;
  nameEn: string;
  nameAr: string;
  spentMonth: number;
  spentYear: number;
  reportCount: number;
  avgCostPerReport: number;
}

export interface BudgetMonthData {
  month: string;
  amount: number;
}

// ---------------------------------------------------------------------------
// Scoring helper
// ---------------------------------------------------------------------------
export function computeDistrictScore(stats: {
  avgResolutionHours: number;
  completedCount: number;
  totalReports: number;
  escalationCount: number;
}): number {
  const resolutionScore =
    stats.avgResolutionHours > 0
      ? Math.min(1, 24 / stats.avgResolutionHours)
      : 0;
  const completionRate =
    stats.totalReports > 0 ? stats.completedCount / stats.totalReports : 0;
  const escalationRate =
    stats.totalReports > 0 ? stats.escalationCount / stats.totalReports : 0;
  return 0.4 * resolutionScore + 0.3 * completionRate + 0.3 * (1 - escalationRate);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getCityStats(): Promise<CityKPIs> {
  const supabase = await createServerSupabase();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [reportsToday, activeRes, resolvedRes, escalatedRes, criticalRes, avgRes] =
    await Promise.all([
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .gte("submitted_at", todayStart.toISOString()),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .in("status", ["submitted", "approved", "assigned", "in_progress"] as const),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .in("status", ["resolved", "rated", "archived"] as const),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .not("escalated_at", "is", null),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("priority", "critical" as const)
        .in("status", ["submitted", "approved"] as const),
      supabase
        .from("v_district_stats")
        .select("avg_resolution_hours"),
    ]);

  let avgHours = 0;
  if (avgRes.data && avgRes.data.length > 0) {
    const validRows = avgRes.data.filter(
      (r) => r.avg_resolution_hours != null
    );
    if (validRows.length > 0) {
      avgHours =
        validRows.reduce(
          (sum, r) => sum + (r.avg_resolution_hours ?? 0),
          0
        ) / validRows.length;
    }
  }

  return {
    totalReportsToday: reportsToday.count ?? 0,
    activeReports: activeRes.count ?? 0,
    resolvedReports: resolvedRes.count ?? 0,
    escalatedReports: escalatedRes.count ?? 0,
    criticalUnassigned: criticalRes.count ?? 0,
    avgResolutionHours7d: Math.round(avgHours * 10) / 10,
  };
}

export async function getCityHeatmap() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("v_heatmap_points").select("*");
  if (error) throw error;
  return (data ?? []) as HeatmapPointRow[];
}

export async function getDistrictRanking(): Promise<DistrictRankingRow[]> {
  const supabase = await createServerSupabase();
  const { data: stats, error } = await supabase.from("v_district_stats").select("*");
  if (error) throw error;

  const rows: DistrictRankingRow[] = (stats ?? []).map((s: DistrictStatsRow) => {
    const totalReports =
      (s.submitted_count ?? 0) +
      (s.active_count ?? 0) +
      (s.completed_count ?? 0) +
      (s.rejected_count ?? 0);
    const score = computeDistrictScore({
      avgResolutionHours: s.avg_resolution_hours ?? 0,
      completedCount: s.completed_count ?? 0,
      totalReports,
      escalationCount: s.escalation_count ?? 0,
    });
    return {
      districtId: s.district_id ?? "",
      nameEn: s.name_en ?? "",
      nameAr: s.name_ar ?? "",
      activeCount: s.active_count ?? 0,
      avgResolutionHours: s.avg_resolution_hours ?? 0,
      escalationCount: s.escalation_count ?? 0,
      totalSpent: s.total_spent ?? 0,
      completedCount: s.completed_count ?? 0,
      totalReports,
      score,
      rank: 0,
    };
  });

  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });

  return rows;
}

export async function getCitywideReports(filters?: {
  status?: string[];
  priority?: string[];
  districtId?: string[];
  categoryId?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createServerSupabase();
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("reports")
    .select(
      "*, category:categories(*), district:districts(*), reporter:profiles!reports_reporter_id_fkey(id, full_name, full_name_ar, email), technician:profiles!reports_assigned_technician_id_fkey(id, full_name, full_name_ar, specialty)",
      { count: "exact" }
    )
    .order("submitted_at", { ascending: false })
    .range(from, to);

  if (filters?.status && filters.status.length > 0) {
    query = query.in("status", filters.status as Database["public"]["Enums"]["report_status"][]);
  }
  if (filters?.priority && filters.priority.length > 0) {
    query = query.in("priority", filters.priority as Database["public"]["Enums"]["priority_level"][]);
  }
  if (filters?.districtId && filters.districtId.length > 0) {
    query = query.in("district_id", filters.districtId);
  }
  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function getReportById(id: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("reports")
    .select(
      "*, category:categories(*), district:districts(*), reporter:profiles!reports_reporter_id_fkey(id, full_name, full_name_ar, email, phone), technician:profiles!reports_assigned_technician_id_fkey(id, full_name, full_name_ar, specialty), photos:report_photos(*), feedback:report_feedback(*), disputes:report_disputes(*)"
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getAnalytics(days: number = 30): Promise<AnalyticsData> {
  const supabase = await createServerSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const [reportsRes, categoriesRes, districtsRes, escalationsRes] =
    await Promise.all([
      supabase
        .from("reports")
        .select("id, district_id, category_id, priority, status, resolved_cost, resolved_at, approved_at, submitted_at, escalated_at")
        .gte("submitted_at", sinceISO),
      supabase.from("categories").select("id, name_en, name_ar"),
      supabase.from("districts").select("id, name_en, name_ar"),
      supabase
        .from("escalations")
        .select("id, created_at")
        .gte("created_at", sinceISO),
    ]);

  const reports = (reportsRes.data ?? []) as ReportRow[];
  const categories = categoriesRes.data ?? [];
  const districts = districtsRes.data ?? [];
  const escalations = escalationsRes.data ?? [];

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const districtMap = new Map(districts.map((d) => [d.id, d]));

  // Resolution by district × priority
  const resolutionByDistrict: AnalyticsData["resolutionByDistrict"] = [];
  const groupedByDP = new Map<string, { totalHours: number; count: number }>();

  for (const r of reports) {
    if (r.resolved_at && r.approved_at) {
      const hours =
        (new Date(r.resolved_at).getTime() - new Date(r.approved_at).getTime()) /
        3600000;
      const key = `${r.district_id}|${r.priority}`;
      const existing = groupedByDP.get(key) ?? { totalHours: 0, count: 0 };
      existing.totalHours += hours;
      existing.count += 1;
      groupedByDP.set(key, existing);
    }
  }

  for (const [key, val] of groupedByDP) {
    const [did, priority] = key.split("|");
    const d = districtMap.get(did);
    resolutionByDistrict.push({
      districtId: did,
      districtName: d?.name_en ?? "",
      districtNameAr: d?.name_ar ?? "",
      priority,
      avgHours: Math.round((val.totalHours / val.count) * 10) / 10,
    });
  }

  // Top categories by count
  const catCounts = new Map<string, number>();
  for (const r of reports) {
    catCounts.set(r.category_id, (catCounts.get(r.category_id) ?? 0) + 1);
  }
  const topCategories = Array.from(catCounts.entries())
    .map(([cid, count]) => {
      const c = categoryMap.get(cid);
      return {
        categoryId: cid,
        nameEn: c?.name_en ?? "",
        nameAr: c?.name_ar ?? "",
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Escalation trend (daily)
  const escByDay = new Map<string, number>();
  for (const e of escalations) {
    const day = e.created_at.slice(0, 10);
    escByDay.set(day, (escByDay.get(day) ?? 0) + 1);
  }
  const escalationTrend = Array.from(escByDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Completion by district
  const completionByDistrict: AnalyticsData["completionByDistrict"] = [];
  const districtGroups = new Map<
    string,
    { resolved: number; active: number; rejected: number; total: number }
  >();

  for (const r of reports) {
    const g = districtGroups.get(r.district_id) ?? {
      resolved: 0,
      active: 0,
      rejected: 0,
      total: 0,
    };
    g.total += 1;
    if (
      r.status === "resolved" ||
      r.status === "rated" ||
      r.status === "archived"
    ) {
      g.resolved += 1;
    } else if (r.status === "rejected") {
      g.rejected += 1;
    } else {
      g.active += 1;
    }
    districtGroups.set(r.district_id, g);
  }

  for (const [did, g] of districtGroups) {
    const d = districtMap.get(did);
    completionByDistrict.push({
      districtId: did,
      districtName: d?.name_en ?? "",
      districtNameAr: d?.name_ar ?? "",
      ...g,
    });
  }

  // Cost by category
  const costByCategory: AnalyticsData["costByCategory"] = [];
  const catCosts = new Map<string, number>();
  for (const r of reports) {
    if (r.resolved_cost != null) {
      catCosts.set(
        r.category_id,
        (catCosts.get(r.category_id) ?? 0) + Number(r.resolved_cost)
      );
    }
  }
  for (const [cid, total] of catCosts) {
    const c = categoryMap.get(cid);
    costByCategory.push({
      categoryId: cid,
      nameEn: c?.name_en ?? "",
      nameAr: c?.name_ar ?? "",
      totalCost: total,
    });
  }

  return {
    resolutionByDistrict,
    topCategories,
    escalationTrend,
    completionByDistrict,
    costByCategory,
  };
}

export async function getCategories() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getPendingCrossDistrict() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("cross_district_requests")
    .select(
      "*, requesting_dm:profiles!cross_district_requests_requesting_dm_id_fkey(id, full_name, full_name_ar, district_id), target_district:districts!cross_district_requests_target_district_id_fkey(id, name_en, name_ar)"
    )
    .eq("status", "pending" as const)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCrossDistrictHistory(limit: number = 30) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("cross_district_requests")
    .select(
      "*, requesting_dm:profiles!cross_district_requests_requesting_dm_id_fkey(id, full_name, full_name_ar, district_id), target_district:districts!cross_district_requests_target_district_id_fkey(id, name_en, name_ar)"
    )
    .neq("status", "pending" as const)
    .order("decided_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getDailySummary(date?: string) {
  const supabase = await createServerSupabase();
  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("summary_date", targetDate)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDailySummariesIndex(page: number = 1, pageSize: number = 20) {
  const supabase = await createServerSupabase();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await supabase
    .from("daily_summaries")
    .select("*", { count: "exact" })
    .order("summary_date", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function getBudgetData() {
  const supabase = await createServerSupabase();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

  const [reportsRes, districtsRes, categoriesRes] = await Promise.all([
    supabase
      .from("reports")
      .select("id, district_id, category_id, resolved_cost, resolved_at")
      .not("resolved_cost", "is", null),
    supabase.from("districts").select("id, name_en, name_ar"),
    supabase.from("categories").select("id, name_en, name_ar"),
  ]);

  const reports = reportsRes.data ?? [];
  const districts = districtsRes.data ?? [];
  const categories = categoriesRes.data ?? [];
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // By District
  const byDistrict: BudgetDistrictData[] = districts.map((d) => {
    const distReports = reports.filter((r) => r.district_id === d.id);
    const monthReports = distReports.filter(
      (r) => r.resolved_at && r.resolved_at >= monthStart
    );
    const yearReports = distReports.filter(
      (r) => r.resolved_at && r.resolved_at >= yearStart
    );

    const totalSpentMonth = monthReports.reduce(
      (s, r) => s + Number(r.resolved_cost ?? 0),
      0
    );
    const totalSpentYear = yearReports.reduce(
      (s, r) => s + Number(r.resolved_cost ?? 0),
      0
    );

    const catSpend = new Map<string, number>();
    for (const r of distReports) {
      catSpend.set(
        r.category_id,
        (catSpend.get(r.category_id) ?? 0) + Number(r.resolved_cost ?? 0)
      );
    }
    const topCats = Array.from(catSpend.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cid, amount]) => {
        const c = categoryMap.get(cid);
        return {
          nameEn: c?.name_en ?? "",
          nameAr: c?.name_ar ?? "",
          amount,
        };
      });

    return {
      districtId: d.id,
      nameEn: d.name_en,
      nameAr: d.name_ar,
      totalSpentMonth,
      totalSpentYear,
      topCategories: topCats,
      sharePercent: 0,
    };
  });

  const cityTotal = byDistrict.reduce((s, d) => s + d.totalSpentYear, 0);
  byDistrict.forEach((d) => {
    d.sharePercent = cityTotal > 0 ? Math.round((d.totalSpentYear / cityTotal) * 100) : 0;
  });

  // By Category
  const byCategory: BudgetCategoryData[] = categories.map((c) => {
    const catReports = reports.filter((r) => r.category_id === c.id);
    const monthReports = catReports.filter(
      (r) => r.resolved_at && r.resolved_at >= monthStart
    );
    const yearReports = catReports.filter(
      (r) => r.resolved_at && r.resolved_at >= yearStart
    );
    const totalCost = catReports.reduce(
      (s, r) => s + Number(r.resolved_cost ?? 0),
      0
    );
    return {
      categoryId: c.id,
      nameEn: c.name_en,
      nameAr: c.name_ar,
      spentMonth: monthReports.reduce(
        (s, r) => s + Number(r.resolved_cost ?? 0),
        0
      ),
      spentYear: yearReports.reduce(
        (s, r) => s + Number(r.resolved_cost ?? 0),
        0
      ),
      reportCount: catReports.length,
      avgCostPerReport: catReports.length > 0 ? totalCost / catReports.length : 0,
    };
  });

  // By Month (last 12)
  const byMonth: BudgetMonthData[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStart = d.toISOString();
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    const amount = reports
      .filter((r) => r.resolved_at && r.resolved_at >= mStart && r.resolved_at < mEnd)
      .reduce((s, r) => s + Number(r.resolved_cost ?? 0), 0);
    byMonth.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      amount,
    });
  }

  return { byDistrict, byCategory, byMonth, cityTotal };
}

export async function getDistrictsWithBounds() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("districts")
    .select("id, name_en, name_ar, center_lat, center_lng, bounding_radius_km");
  if (error) throw error;
  return data ?? [];
}

export async function getGovernorNotifications(limit: number = 50) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getGovernorProfile() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("[getGovernorProfile]", error.message);
    return null;
  }
  return data;
}

export async function getCityScoreLast7Days(): Promise<number> {
  const supabase = await createServerSupabase();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [resolvedInSLA, totalResolved] = await Promise.all([
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .gte("resolved_at", sevenDaysAgo.toISOString())
      .not("resolved_at", "is", null)
      .not("sla_resolve_deadline", "is", null)
      .lte("resolved_at", "sla_resolve_deadline"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .gte("resolved_at", sevenDaysAgo.toISOString())
      .not("resolved_at", "is", null),
  ]);

  const total = totalResolved.count ?? 0;
  if (total === 0) return 100;
  // Supabase doesn't support lte comparing two columns directly
  // so we approximate with total resolved count
  return Math.round(((resolvedInSLA.count ?? total) / total) * 100);
}
