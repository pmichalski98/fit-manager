import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { env } from "@/env";
import { db } from "@/server/db";
import { dailyLog, user } from "@/server/db/schema";

/**
 * Single-day payload, handy for manual testing with curl:
 * { "date": "2026-08-05", "steps": 7431 }
 */
const simpleStepsSchema = z.object({
  date: z.string(),
  steps: z.coerce.number().min(0),
});

/**
 * Payload sent by the iOS Shortcut: two parallel lists rendered as
 * newline-joined strings (or arrays), aligned by index. Produced by
 * "Find Health Samples" grouped by day (values) + "Get Details of
 * Health Samples" → Start Date → "Format Date" (dates).
 * { "dates": "2026-07-30\n2026-07-31", "values": "6 214\n8 003" }
 */
const pairedListsSchema = z.object({
  dates: z.union([z.string(), z.array(z.string())]),
  values: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
});

function toLines(value: string | (string | number)[]): (string | number)[] {
  const items = Array.isArray(value) ? value : value.split(/\r?\n/);
  return items.filter((item) => String(item).trim() !== "");
}

function parseQty(qty: number | string): number | null {
  if (typeof qty === "number") {
    return Number.isFinite(qty) ? qty : null;
  }
  // Strip spaces (incl. NBSP) and thousands separators: "1 234" / "1,234"
  const cleaned = qty.replace(/[\s ,]/g, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

export type HealthIngestResult = {
  date: string;
  steps: number;
};

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Extracts daily step totals from an Apple Health payload (sent by the iOS
 * Shortcut) and upserts them into daily_log. Only the steps column is
 * written, so weight, kcal and macros from other sources stay untouched.
 * Re-posting a day is idempotent — the latest total replaces the previous.
 */
export async function ingestHealthExport(
  payload: unknown,
): Promise<HealthIngestResult[]> {
  const syncEmail = env.HEALTH_EXPORT_USER_EMAIL ?? env.FITATU_SYNC_USER_EMAIL;
  if (!syncEmail) {
    throw new Error(
      "Health export is not configured: set HEALTH_EXPORT_USER_EMAIL (or FITATU_SYNC_USER_EMAIL)",
    );
  }

  const stepsByDate = new Map<string, number>();

  const simple = simpleStepsSchema.safeParse(payload);
  const paired = simple.success ? null : pairedListsSchema.safeParse(payload);
  if (simple.success) {
    const date = simple.data.date.slice(0, 10);
    if (!dateRegex.test(date)) {
      throw new Error("Invalid date, expected YYYY-MM-DD");
    }
    stepsByDate.set(date, simple.data.steps);
  } else if (paired?.success) {
    const dates = toLines(paired.data.dates).map(String);
    const values = toLines(paired.data.values);
    if (dates.length !== values.length) {
      throw new Error(
        `dates (${dates.length}) and values (${values.length}) have different lengths — check that both come from the same Find Health Samples result`,
      );
    }
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i]!.trim().slice(0, 10);
      const qty = parseQty(values[i]!);
      if (!dateRegex.test(date) || qty == null || qty < 0) continue;
      stepsByDate.set(date, (stepsByDate.get(date) ?? 0) + qty);
    }
  } else {
    throw new Error("Unrecognized payload format");
  }

  if (stepsByDate.size === 0) return [];

  const [appUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, syncEmail));
  if (!appUser) {
    throw new Error(`No app user with email ${syncEmail}`);
  }

  const results: HealthIngestResult[] = [];
  for (const [date, total] of stepsByDate) {
    const steps = Math.round(total);
    await db
      .insert(dailyLog)
      .values({ userId: appUser.id, date, steps })
      .onConflictDoUpdate({
        target: [dailyLog.userId, dailyLog.date],
        set: { steps, updatedAt: sql`now()` },
      });
    results.push({ date, steps });
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}
