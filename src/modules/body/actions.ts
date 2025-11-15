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
  type DailyLogFormValues,
  type GoalFormValues,
  type MeasurementsInput,
} from "@/modules/body/schemas";
import { revalidatePath } from "next/cache";

export async function getLatestDailyLog() {
  const userId = await requireUserId();
  try {
    const result = await dailyLogRepository.findLatestDailyLog(userId);
    return { ok: true, data: result };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  }
}

export async function getDailyLogByDate(date: string) {
  console.log("date", date);
  const userId = await requireUserId();
  try {
    const result = await dailyLogRepository.findDailyLogByUserAndDate(
      userId,
      date,
    );
    return { ok: true, data: result };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  }
}

export async function createOrUpdateDailyLog(input: DailyLogFormValues) {
  const userId = await requireUserId();
  const { success, data, error } = dailyLogSchema.safeParse(input);

  if (!success) {
    return { ok: false, data: null, error: error.message };
  }

  try {
    const result = await dailyLogRepository.upsertDailyLog({
      userId,
      date: data.date,
      weight: data.weight,
      kcal: data.kcal,
    });
    return { ok: true, data: result };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  } finally {
    revalidatePath("/body");
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
      notes: data.notes ?? "",
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
  } finally {
    revalidatePath("/body");
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
