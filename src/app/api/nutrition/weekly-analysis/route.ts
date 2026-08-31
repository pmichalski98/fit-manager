import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import { warsawToday } from "@/modules/fitatu/lib/sync";
import {
  lastCompletedWeekStart,
  weekStartOf,
} from "@/modules/nutrition/lib/week";
import { analyzeWeek } from "@/modules/nutrition/services/weekly-analysis";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";

export const dynamic = "force-dynamic";
// A reasoning model on a full week takes well over a minute.
export const maxDuration = 300;

/**
 * Cron endpoint: analyses the last completed week (Mon–Sun) of synced meals.
 * Query params:
 *   - week=YYYY-MM-DD  analyse the week containing this date instead
 * Auth: Authorization: Bearer <FITATU_SYNC_SECRET> or ?secret=<FITATU_SYNC_SECRET>
 */
export async function GET(request: NextRequest) {
  if (!env.FITATU_SYNC_SECRET || !env.FITATU_SYNC_USER_EMAIL) {
    return NextResponse.json(
      { error: "Nutrition analysis is not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    searchParams.get("secret");
  if (provided !== env.FITATU_SYNC_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const weekParam = searchParams.get("week");
  if (weekParam && !/^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    return NextResponse.json({ error: "Invalid week" }, { status: 400 });
  }
  const weekStart = weekParam
    ? weekStartOf(weekParam)
    : lastCompletedWeekStart(warsawToday());

  const [appUser] = await db
    .select({ id: user.id, autoWeeklyAnalysis: user.autoWeeklyAnalysis })
    .from(user)
    .where(eq(user.email, env.FITATU_SYNC_USER_EMAIL));
  if (!appUser) {
    return NextResponse.json(
      { error: `No app user with email ${env.FITATU_SYNC_USER_EMAIL}` },
      { status: 500 },
    );
  }

  // The user analyses weeks manually from the app; the cron only runs when
  // explicitly re-enabled there. 200 so the scheduler never treats it as
  // a failure.
  if (!appUser.autoWeeklyAnalysis) {
    return NextResponse.json({ weekStart, status: "disabled" });
  }

  try {
    const insight = await analyzeWeek(appUser.id, weekStart);
    if (!insight) {
      return NextResponse.json({ weekStart, status: "empty" });
    }
    return NextResponse.json({
      weekStart,
      status: "analyzed",
      summary: insight.summary,
      observations: insight.observations,
      swaps: insight.swaps,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
