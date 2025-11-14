import { and, desc, lte, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { bodyMeasurement } from "@/server/db/schema";

export type MeasurementsDBValues = {
  userId: string;
  date: string; // YYYY-MM-DD
  neck: string | null;
  chest: string | null;
  waist: string | null;
  bellybutton: string | null;
  hips: string | null;
  biceps: string | null;
  thigh: string | null;
  notes: string | null;
};

class MeasurementsRepository {
  async findMeasurementsByUserAndDate(userId: string, date: string) {
    const [row] = await db
      .select()
      .from(bodyMeasurement)
      .where(
        and(eq(bodyMeasurement.userId, userId), eq(bodyMeasurement.date, date)),
      );
    return row ?? null;
  }

  async upsertMeasurements(values: MeasurementsDBValues) {
    const existing = await this.findMeasurementsByUserAndDate(
      values.userId,
      values.date,
    );

    if (existing) {
      const [updated] = await db
        .update(bodyMeasurement)
        .set({ ...values, updatedAt: new Date() })
        .where(
          and(
            eq(bodyMeasurement.userId, values.userId),
            eq(bodyMeasurement.date, values.date),
          ),
        )
        .returning();
      return updated;
    }

    const [inserted] = await db
      .insert(bodyMeasurement)
      .values(values)
      .returning();
    return inserted;
  }

  async findLatestMeasurementsOnOrBefore(userId: string, date: string) {
    const [row] = await db
      .select()
      .from(bodyMeasurement)
      .where(
        and(
          eq(bodyMeasurement.userId, userId),
          lte(bodyMeasurement.date, date),
        ),
      )
      .orderBy(desc(bodyMeasurement.date))
      .limit(1);
    return row ?? null;
  }
}

export const measurementsRepository = new MeasurementsRepository();
