"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { dailyLogSchema, measurementsSchema } from "@/modules/body/schemas";
import {
  upsertDailyLog,
  upsertMeasurements,
} from "@/modules/body/repositories";

type MaybeNumber = number | null | undefined;

export type DailyLogInput = {
  date: string; // YYYY-MM-DD
  weight?: MaybeNumber;
  kcal?: MaybeNumber;
};

export type MeasurementsInput = {
  date: string; // YYYY-MM-DD
  neck?: MaybeNumber;
  chest?: MaybeNumber;
  waist?: MaybeNumber;
  hips?: MaybeNumber;
  biceps?: MaybeNumber;
  thigh?: MaybeNumber;
  notes?: string | null;
};

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function createOrUpdateDailyLog(input: DailyLogInput) {
  const userId = await requireUserId();
  const parsed = dailyLogSchema.parse(input);
  const data = await upsertDailyLog({
    userId,
    date: parsed.date,
    weight: parsed.weight != null ? String(parsed.weight) : null,
    kcal: parsed.kcal ?? null,
  });
  return { ok: true, data } as const;
}

export async function createOrUpdateMeasurements(input: MeasurementsInput) {
  const userId = await requireUserId();
  const parsed = measurementsSchema.parse(input);
  const data = await upsertMeasurements({
    userId,
    date: parsed.date,
    neck: parsed.neck != null ? String(parsed.neck) : null,
    chest: parsed.chest != null ? String(parsed.chest) : null,
    waist: parsed.waist != null ? String(parsed.waist) : null,
    hips: parsed.hips != null ? String(parsed.hips) : null,
    biceps: parsed.biceps != null ? String(parsed.biceps) : null,
    thigh: parsed.thigh != null ? String(parsed.thigh) : null,
    notes: parsed.notes ?? null,
  });
  return { ok: true, data } as const;
}
