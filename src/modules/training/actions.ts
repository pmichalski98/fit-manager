"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/lib/user";
import {
  completeCardioSession,
  completeStrengthSession,
  createSession,
} from "@/modules/training/repositories";
import {
  cardioSessionSchema,
  strengthSessionSchema,
  trainingFormSchema,
} from "@/modules/training/schemas";
import { redirect } from "next/navigation";
import { trainingRepository } from "./repositories/training.repo";

export type CreateTrainingInput = z.infer<typeof trainingFormSchema>;
const startTrainingSessionSchemaLocal = z.object({
  trainingId: z.string().uuid(),
});
export type StartTrainingSessionInput = z.infer<
  typeof startTrainingSessionSchemaLocal
>;

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

export async function createTrainingAction(input: CreateTrainingInput) {
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

export async function startTrainingSessionAction(
  input: StartTrainingSessionInput,
) {
  const userId = await requireUserId();
  const { trainingId } = startTrainingSessionSchemaLocal.parse(input);
  const tpl = await trainingRepository.findTrainingByIdWithExercises(
    userId,
    trainingId,
  );
  if (!tpl) throw new Error("Training not found");
  const session = await createSession({
    userId,
    trainingId: tpl.id,
    type: tpl.type,
  });
  if (!session) throw new Error("Failed to create session");
  redirect(`/training/session/${session.id}`);
}

export async function completeStrengthSessionAction(
  input: z.infer<typeof strengthSessionSchema> & { sessionId: string },
) {
  await requireUserId();
  // We don't strictly check ownership here; ideally check session.userId === userId
  const { sessionId, ...rest } = input;
  const parsed = strengthSessionSchema.parse(rest);
  const durationSec: number | null =
    typeof (parsed as { durationSec?: unknown }).durationSec === "number"
      ? (parsed as { durationSec?: number }).durationSec!
      : null;
  const totalLoadKg: number | null =
    typeof (parsed as { totalLoadKg?: unknown }).totalLoadKg === "number"
      ? (parsed as { totalLoadKg?: number }).totalLoadKg!
      : null;
  const progress: Array<{
    position: number;
    name: string;
    prevVolume: number;
    currentVolume: number;
    delta: number;
  }> | null = Array.isArray((parsed as { progress?: unknown }).progress)
    ? ((
        parsed as {
          progress?: Array<{
            position: number;
            name: string;
            prevVolume: number;
            currentVolume: number;
            delta: number;
          }>;
        }
      ).progress as Array<{
        position: number;
        name: string;
        prevVolume: number;
        currentVolume: number;
        delta: number;
      }>)
    : null;
  await completeStrengthSession(sessionId, parsed.exercises, {
    durationSec,
    totalLoadKg,
    progress,
  });
  return { ok: true } as const;
}

export async function completeCardioSessionAction(
  input: z.infer<typeof cardioSessionSchema> & { sessionId: string },
) {
  await requireUserId();
  const { sessionId, ...rest } = input;
  const parsed = cardioSessionSchema.parse(rest);
  await completeCardioSession(sessionId, {
    durationSec: parsed.durationSec,
    distanceM: parsed.distanceM ?? null,
    kcal: parsed.kcal ?? null,
    avgHr: parsed.avgHr ?? null,
    avgSpeedKmh: parsed.avgSpeedKmh ?? null,
    avgPowerW: parsed.avgPowerW ?? null,
    notes: parsed.notes ?? null,
  });
  return { ok: true } as const;
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
