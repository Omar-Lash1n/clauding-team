import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminSupabase();

    const [escalationResult, archiveResult] = await Promise.all([
      admin.rpc("sla_escalation_sweep"),
      admin.rpc("auto_archive_stale_resolved"),
    ]);

    if (escalationResult.error) {
      console.error("SLA sweep error:", escalationResult.error);
    }
    if (archiveResult.error) {
      console.error("Archive sweep error:", archiveResult.error);
    }

    return NextResponse.json({
      escalated: escalationResult.data ?? 0,
      archived: archiveResult.data ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
