"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/user";
import {
  trainingFormSchema,
  type CreateTrainingInput,
} from "@/modules/training/schemas";
import { trainingRepository } from "./repositories/training.repo";

export async function getAllTrainingsWithExercises() {
  const userId = await requireUserId();
  try {
    const trainingsWithExercises =
      await trainingRepository.findAllTrainingsWithExercises(userId);
    return { ok: true, data: trainingsWithExercises };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Internal server error", data: [] };
  }
}

export async function createTraining(input: CreateTrainingInput) {
  const userId = await requireUserId();
  const parsed = trainingFormSchema.parse(input);

  const exercises = parsed.type === "strength" ? parsed.exercises : [];

  const created = await trainingRepository.createTraining({
    userId,
    name: parsed.name,
    type: parsed.type,
    exercises,
  });

  revalidatePath("/training");

  return { ok: true, data: created };
}

export async function deleteTraining(trainingId: string) {
  const userId = await requireUserId();
  try {
    await trainingRepository.deleteTraining(userId, trainingId);
    revalidatePath("/training");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Internal server error" };
  }
}
