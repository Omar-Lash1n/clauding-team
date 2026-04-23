import { NextRequest, NextResponse } from "next/server";
import { generateDailySummary } from "@/lib/governor/cron-daily-summary";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    const rowId = await generateDailySummary(today);

    return NextResponse.json({
      ok: true,
      date: today.toISOString().slice(0, 10),
      rowId,
    });
  } catch (err) {
    console.error("Daily summary cron error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
