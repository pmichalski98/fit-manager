import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import { ingestHealthExport } from "@/modules/health/lib/ingest";

export const dynamic = "force-dynamic";

/**
 * Inbound webhook for the iOS Shortcut that exports Apple Health steps.
 * Receives daily step totals as JSON and upserts them into daily_log.
 * Auth: Authorization: Bearer <HEALTH_EXPORT_SECRET> or ?secret=<...>
 */
export async function POST(request: NextRequest) {
  if (!env.HEALTH_EXPORT_SECRET) {
    return NextResponse.json(
      { error: "Health export is not configured" },
      { status: 503 },
    );
  }

  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.nextUrl.searchParams.get("secret");
  if (provided !== env.HEALTH_EXPORT_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const results = await ingestHealthExport(payload);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ingest failed" },
      { status: 500 },
    );
  }
}
