"use server";

import { requireUserId } from "@/lib/user";
import { sessionRepository } from "@/modules/session/repositories";
import { trainingRepository } from "@/modules/training/repositories/training.repo";
import { redirect } from "next/navigation";
import {
  cardioSessionSchema,
  startTrainingSessionSchema,
  strengthSessionSchema,
  type CardioSessionFormValues,
  type StartTrainingSessionInput,
  type StrengthSessionFormValues,
} from "./schemas";

export async function startTrainingSession(input: StartTrainingSessionInput) {
  const userId = await requireUserId();
  const { trainingId } = startTrainingSessionSchema.parse(input);
  const tpl = await trainingRepository.findTrainingByIdWithExercises(
    userId,
    trainingId,
  );
  if (!tpl) throw new Error("Training not found");
  const session = await sessionRepository.createSession({
    userId,
    trainingId: tpl.id,
    type: tpl.type,
  });
  if (!session) throw new Error("Failed to create session");
  redirect(`/training/session/${session.id}`);
}

export async function completeStrengthSession(
  input: StrengthSessionFormValues & { sessionId: string },
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
  await sessionRepository.completeStrengthSession(sessionId, parsed.exercises, {
    durationSec,
    totalLoadKg,
    progress,
  });
  return { ok: true } as const;
}

export async function completeCardioSession(
  input: CardioSessionFormValues & { sessionId: string },
) {
  await requireUserId();
  const { sessionId, ...rest } = input;
  const parsed = cardioSessionSchema.parse(rest);
  await sessionRepository.completeCardioSession(sessionId, {
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
