import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import {
  shiftDate,
  syncFitatuDays,
  warsawToday,
} from "@/modules/fitatu/lib/sync";

export const dynamic = "force-dynamic";

const MAX_BACKFILL_DAYS = 31;

/**
 * Cron endpoint: syncs yesterday's Fitatu entries by default.
 * Query params:
 *   - date=YYYY-MM-DD  sync a single specific day
 *   - days=N           sync the last N days ending yesterday (backfill, max 31)
 * Auth: Authorization: Bearer <FITATU_SYNC_SECRET> or ?secret=<FITATU_SYNC_SECRET>
 */
export async function GET(request: NextRequest) {
  if (!env.FITATU_SYNC_SECRET) {
    return NextResponse.json(
      { error: "Fitatu sync is not configured" },
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

  const dateParam = searchParams.get("date");
  const daysParam = searchParams.get("days");

  let dates: string[];
  if (dateParam) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    dates = [dateParam];
  } else {
    const days = Math.min(
      Math.max(Number.parseInt(daysParam ?? "1", 10) || 1, 1),
      MAX_BACKFILL_DAYS,
    );
    const yesterday = shiftDate(warsawToday(), -1);
    dates = Array.from({ length: days }, (_, i) =>
      shiftDate(yesterday, -(days - 1 - i)),
    );
  }

  try {
    const results = await syncFitatuDays(dates);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
