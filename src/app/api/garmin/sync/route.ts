import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import { syncGarminActivities } from "@/modules/garmin/lib/sync";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Cron endpoint: imports recent Garmin cycling activities.
 * Query params:
 *   - limit=N  how many recent activities to fetch (default 20, max 100) —
 *              raise for a one-off historical backfill
 * Auth: Authorization: Bearer <GARMIN_SYNC_SECRET> or ?secret=<GARMIN_SYNC_SECRET>
 */
export async function GET(request: NextRequest) {
  if (!env.GARMIN_SYNC_SECRET) {
    return NextResponse.json(
      { error: "Garmin sync is not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    searchParams.get("secret");
  if (provided !== env.GARMIN_SYNC_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = Math.min(
    Math.max(
      Number.parseInt(searchParams.get("limit") ?? "", 10) || DEFAULT_LIMIT,
      1,
    ),
    MAX_LIMIT,
  );

  try {
    const result = await syncGarminActivities(limit);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
