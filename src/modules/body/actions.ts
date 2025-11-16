"use server";

import { requireUserId } from "@/lib/user";
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
  type MeasurementsFormValues,
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

export async function createOrUpdateMeasurements(
  input: MeasurementsFormValues,
) {
  const userId = await requireUserId();
  const { success, data, error } = measurementsSchema.safeParse(input);
  if (!success) {
    return { ok: false, data: null, error: error.message };
  }
  try {
    const result = await measurementsRepository.upsertMeasurements({
      userId,
      date: data.date,
      neck: data.neck,
      chest: data.chest,
      waist: data.waist,
      bellybutton: data.bellybutton,
      hips: data.hips,
      biceps: data.biceps,
      thigh: data.thigh,
      notes: data.notes ?? "",
    });
    return { ok: true, data: result };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  } finally {
    revalidatePath("/body");
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

export async function getLatestMeasurements() {
  const userId = await requireUserId();
  try {
    const result = await measurementsRepository.findLatestMeasurements(userId);
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
