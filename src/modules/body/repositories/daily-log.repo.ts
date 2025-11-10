import { and, desc, lte, gte, eq, asc } from "drizzle-orm";

import { db } from "@/server/db";
import { dailyLog } from "@/server/db/schema";

export type DailyLogDBValues = {
  userId: string;
  date: string; // YYYY-MM-DD
  weight: string | null; // pg numeric → string
  kcal: number | null;
};

export async function findDailyLogByUserAndDate(userId: string, date: string) {
  const [row] = await db
    .select()
    .from(dailyLog)
    .where(and(eq(dailyLog.userId, userId), eq(dailyLog.date, date)));
  return row ?? null;
}

export async function upsertDailyLog(values: DailyLogDBValues) {
  const existing = await findDailyLogByUserAndDate(values.userId, values.date);

  if (existing) {
    const [updated] = await db
      .update(dailyLog)
      .set({
        weight: values.weight,
        kcal: values.kcal,
        updatedAt: new Date(),
      })
      .where(
        and(eq(dailyLog.userId, values.userId), eq(dailyLog.date, values.date)),
      )
      .returning();
    return updated;
  }

  const [inserted] = await db.insert(dailyLog).values(values).returning();
  return inserted;
}

export async function findLatestDailyLogOnOrBefore(
  userId: string,
  date: string,
) {
  const [row] = await db
    .select()
    .from(dailyLog)
    .where(and(eq(dailyLog.userId, userId), lte(dailyLog.date, date)))
    .orderBy(desc(dailyLog.date))
    .limit(1);
  return row ?? null;
}

export async function findDailyLogsInRange(
  userId: string,
  startDate: string,
  endDate: string,
) {
  return await db
    .select({
      date: dailyLog.date,
      weight: dailyLog.weight,
      kcal: dailyLog.kcal,
    })
    .from(dailyLog)
    .where(
      and(
        eq(dailyLog.userId, userId),
        gte(dailyLog.date, startDate),
        lte(dailyLog.date, endDate),
      ),
    )
    .orderBy(asc(dailyLog.date));
}
