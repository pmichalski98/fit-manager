"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { dailyLogSchema, measurementsSchema } from "@/modules/body/schemas";
import {
  upsertDailyLog,
  upsertMeasurements,
} from "@/modules/body/repositories";

type MaybeNumber = number | undefined;

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
  bellybutton?: MaybeNumber;
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
  const toFixed1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
  const data = await upsertDailyLog({
    userId,
    date: parsed.date,
    weight: parsed.weight != null ? toFixed1(parsed.weight) : null,
    kcal: parsed.kcal ?? null,
  });
  return { ok: true, data } as const;
}

export async function createOrUpdateMeasurements(input: MeasurementsInput) {
  const userId = await requireUserId();
  const parsed = measurementsSchema.parse(input);
  const toFixed1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
  const data = await upsertMeasurements({
    userId,
    date: parsed.date,
    neck: parsed.neck != null ? toFixed1(parsed.neck) : null,
    chest: parsed.chest != null ? toFixed1(parsed.chest) : null,
    waist: parsed.waist != null ? toFixed1(parsed.waist) : null,
    bellybutton:
      parsed.bellybutton != null ? toFixed1(parsed.bellybutton) : null,
    hips: parsed.hips != null ? toFixed1(parsed.hips) : null,
    biceps: parsed.biceps != null ? toFixed1(parsed.biceps) : null,
    thigh: parsed.thigh != null ? toFixed1(parsed.thigh) : null,
    notes: parsed.notes ?? null,
  });
  return { ok: true, data } as const;
}
