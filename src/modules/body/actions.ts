"use server";

import { requireUserId } from "@/lib/user";
import { toFixed1 } from "@/lib/utils";
import {
  dailyLogRepository,
  measurementsRepository,
  userRepository,
} from "@/modules/body/repositories";
import {
  dailyLogSchema,
  goalSchema,
  measurementsSchema,
  type DailyLogInput,
  type GoalFormValues,
  type MeasurementsInput,
} from "@/modules/body/schemas";

export async function getUserDailyLog(date: string) {
  const userId = await requireUserId();
  try {
    const data = await dailyLogRepository.findDailyLogByUserAndDate(
      userId,
      date,
    );
    return { ok: true, data: data };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  }
}

export async function createOrUpdateDailyLog(input: DailyLogInput) {
  const userId = await requireUserId();
  const { success, data, error } = dailyLogSchema.safeParse(input);

  if (!success) {
    return { ok: false, data: null, error: error.message };
  }

  try {
    const result = await dailyLogRepository.upsertDailyLog({
      userId,
      date: data.date,
      weight: data.weight != null ? toFixed1(data.weight) : null,
      kcal: data.kcal ?? null,
    });
    return { ok: true, data: result };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  }
}

export async function createOrUpdateMeasurements(input: MeasurementsInput) {
  const userId = await requireUserId();
  const { success, data, error } = measurementsSchema.safeParse(input);
  if (!success) {
    return { ok: false, data: null, error: error.message };
  }
  try {
    const result = await measurementsRepository.upsertMeasurements({
      userId,
      date: data.date,
      neck: data.neck != null ? toFixed1(data.neck) : null,
      chest: data.chest != null ? toFixed1(data.chest) : null,
      waist: data.waist != null ? toFixed1(data.waist) : null,
      bellybutton: data.bellybutton != null ? toFixed1(data.bellybutton) : null,
      hips: data.hips != null ? toFixed1(data.hips) : null,
      biceps: data.biceps != null ? toFixed1(data.biceps) : null,
      thigh: data.thigh != null ? toFixed1(data.thigh) : null,
      notes: data.notes ?? null,
    });
    return { ok: true, data: result };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  }
}

export async function updateUserCaloricGoal(input: GoalFormValues) {
  const userId = await requireUserId();
  const { success, data, error } = goalSchema.safeParse(input);
  if (!success) {
    return { ok: false, data: null, error: error.message };
  }
  try {
    const result = await userRepository.updateCaloricGoal(
      userId,
      data.caloricGoal,
    );
    return { ok: true, data: result };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  }
}

export async function getLatestDailyLog(date: string) {
  const userId = await requireUserId();
  try {
    const result = await dailyLogRepository.findLatestDailyLogOnOrBefore(
      userId,
      date,
    );
    return { ok: true, data: result };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  }
}

export async function getLatestMeasurements(date: string) {
  const userId = await requireUserId();
  try {
    const result =
      await measurementsRepository.findLatestMeasurementsOnOrBefore(
        userId,
        date,
      );
    return { ok: true, data: result };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  }
}

export async function getCaloricGoal() {
  const userId = await requireUserId();
  try {
    const result = await userRepository.findCaloricGoal(userId);
    return { ok: true, data: result };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  }
}
