import { and, desc, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { bodyMeasurement } from "@/server/db/schema";
import type { MeasurementsFormValues } from "../schemas";

export type MeasurementsWithUserId = MeasurementsFormValues & {
  userId: string;
};

const normalizeMeasurementField = (value: string | null | undefined) =>
  value === "" || value === undefined ? null : value;

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

  async findLatestMeasurements(userId: string) {
    const [row] = await db
      .select()
      .from(bodyMeasurement)
      .where(and(eq(bodyMeasurement.userId, userId)))
      .orderBy(desc(bodyMeasurement.date))
      .limit(1);
    return row ?? null;
  }

  async upsertMeasurements(values: MeasurementsWithUserId) {
    const existing = await this.findMeasurementsByUserAndDate(
      values.userId,
      values.date,
    );

    const normalizedMeasurements = {
      neck: normalizeMeasurementField(values.neck),
      chest: normalizeMeasurementField(values.chest),
      waist: normalizeMeasurementField(values.waist),
      bellybutton: normalizeMeasurementField(values.bellybutton),
      hips: normalizeMeasurementField(values.hips),
      biceps: normalizeMeasurementField(values.biceps),
      thigh: normalizeMeasurementField(values.thigh),
    };

    if (existing) {
      const [updated] = await db
        .update(bodyMeasurement)
        .set({
          ...normalizedMeasurements,
          notes: values.notes ?? "",
          userId: values.userId,
          updatedAt: new Date(),
        })
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
      .values({
        ...normalizedMeasurements,
        notes: values.notes ?? "",
        userId: values.userId,
        date: values.date,
      })
      .returning();
    return inserted;
  }
}

export const measurementsRepository = new MeasurementsRepository();
