import { eq, sql } from "drizzle-orm";

import { env } from "@/env";
import { db } from "@/server/db";
import { dailyLog, user } from "@/server/db/schema";
import { aggregateDayMacros } from "./aggregate";
import { FitatuClient } from "./fitatu-client";
import type { FitatuSyncResult } from "../types";

/** Today's date (YYYY-MM-DD) in the Fitatu account's timezone. */
export function warsawToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
  }).format(new Date());
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function upsertDayMacros(
  userId: string,
  date: string,
  macros: { kcal: number; proteinG: number; carbsG: number; fatG: number; fiberG: number },
) {
  await db
    .insert(dailyLog)
    .values({ userId, date, ...macros })
    .onConflictDoUpdate({
      target: [dailyLog.userId, dailyLog.date],
      set: {
        kcal: macros.kcal,
        proteinG: macros.proteinG,
        carbsG: macros.carbsG,
        fatG: macros.fatG,
        fiberG: macros.fiberG,
        updatedAt: sql`now()`,
      },
    });
}

/**
 * Pulls the given days from Fitatu and upserts kcal + macros into daily_log.
 * Weight stays untouched; days with no logged meals are skipped so an empty
 * Fitatu day never zeroes out manually entered calories.
 */
export async function syncFitatuDays(
  dates: string[],
): Promise<FitatuSyncResult[]> {
  const { FITATU_USERNAME, FITATU_PASSWORD, FITATU_SYNC_USER_EMAIL } = env;
  if (!FITATU_USERNAME || !FITATU_PASSWORD || !FITATU_SYNC_USER_EMAIL) {
    throw new Error(
      "Fitatu sync is not configured: set FITATU_USERNAME, FITATU_PASSWORD and FITATU_SYNC_USER_EMAIL",
    );
  }

  const [appUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, FITATU_SYNC_USER_EMAIL));
  if (!appUser) {
    throw new Error(`No app user with email ${FITATU_SYNC_USER_EMAIL}`);
  }

  const client = new FitatuClient(FITATU_USERNAME, FITATU_PASSWORD);
  const results: FitatuSyncResult[] = [];

  for (const date of dates) {
    try {
      const day = await client.getDay(date);
      const macros = aggregateDayMacros(day);

      if (macros.itemCount === 0) {
        results.push({ date, status: "empty" });
        continue;
      }

      await upsertDayMacros(appUser.id, date, macros);
      results.push({ date, status: "synced", macros });
    } catch (error) {
      results.push({
        date,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}
