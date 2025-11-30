import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/server/db";
import { dailyLog } from "@/server/db/schema";
import type { DailyLogFormValues } from "../schemas";

export type DailyLogWithUserId = DailyLogFormValues & { userId: string };

class DailyLogRepository {
  async findLatestDailyLog(userId: string) {
    const [row] = await db
      .select()
      .from(dailyLog)
      .where(eq(dailyLog.userId, userId))
      .orderBy(desc(dailyLog.date))
      .limit(1);
    return row ?? null;
  }

  async findDailyLogByUserAndDate(userId: string, date: string) {
    const [row] = await db
      .select()
      .from(dailyLog)
      .where(and(eq(dailyLog.userId, userId), eq(dailyLog.date, date)));
    return row ?? null;
  }

  async upsertDailyLog(values: DailyLogWithUserId) {
    const existing = await this.findDailyLogByUserAndDate(
      values.userId,
      values.date,
    );

    if (existing) {
      const [updated] = await db
        .update(dailyLog)
        .set({
          weight: values.weight === "" ? null : (values.weight ?? null),
          kcal:
            values.kcal === 0 || values.kcal === undefined
              ? null
              : (values.kcal ?? null),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(dailyLog.userId, values.userId),
            eq(dailyLog.date, values.date),
          ),
        )
        .returning();
      return updated;
    }

    const [inserted] = await db
      .insert(dailyLog)
      .values({
        ...values,
        kcal:
          values.kcal === 0 || values.kcal === undefined
            ? null
            : (values.kcal ?? null),
        weight: values.weight === "" ? null : (values.weight ?? null),
      })
      .returning();
    return inserted;
  }

  async findDailyLogsInRange(
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
}

export const dailyLogRepository = new DailyLogRepository();
