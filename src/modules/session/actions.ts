"use server";

import { requireUserId } from "@/lib/user";
import { sessionRepository } from "@/modules/session/repositories";
import {
  cardioSessionSchema,
  strengthSessionSchema,
  type CardioSessionFormValues,
  type StrengthSessionFormValues,
} from "./schemas";
import { trainingRepository } from "../training/repositories";
import type { InProgressSession } from "./types";

export async function findSessionById(id: string) {
  const userId = await requireUserId();
  const session = await sessionRepository.findSessionById(id);
  if (!session) throw new Error("Session not found");
  return session;
}

export async function startStrengthSession(trainingId: string) {
  const userId = await requireUserId();
  const row = await sessionRepository.createInProgressSession(
    userId,
    trainingId,
  );
  return { sessionId: row.id, startAt: row.startAt.toISOString() };
}

export async function saveSessionProgress(input: {
  sessionId: string;
  exercises: InProgressSession["exercises"];
}) {
  const userId = await requireUserId();
  // Verify ownership
  const session = await sessionRepository.findSessionById(input.sessionId);
  if (!session || session.userId !== userId) {
    throw new Error("Session not found");
  }
  await sessionRepository.upsertSessionProgress(
    input.sessionId,
    input.exercises,
  );
}

export async function findInProgressSession(
  trainingId: string,
): Promise<InProgressSession | null> {
  const userId = await requireUserId();
  return sessionRepository.findInProgressSession(userId, trainingId);
}

export async function discardSession(sessionId: string) {
  const userId = await requireUserId();
  const session = await sessionRepository.findSessionById(sessionId);
  if (!session || session.userId !== userId) {
    throw new Error("Session not found");
  }
  if (session.status !== "in_progress") {
    throw new Error("Can only discard in-progress sessions");
  }
  await sessionRepository.deleteSession(sessionId);
}

export async function completeStrengthSession(
  input: StrengthSessionFormValues & { startedAt: string; sessionId?: string },
) {
  const userId = await requireUserId();
  const parsed = strengthSessionSchema.parse(input);
  const durationSec: number | null =
    typeof (parsed as { durationSec?: unknown }).durationSec === "number"
      ? (parsed as { durationSec?: number }).durationSec!
      : null;
  const totalLoadKg: number | null =
    typeof (parsed as { totalLoadKg?: unknown }).totalLoadKg === "number"
      ? (parsed as { totalLoadKg?: number }).totalLoadKg!
      : null;

  // If we have a sessionId, finalize the in-progress session
  if (input.sessionId) {
    const session = await sessionRepository.findSessionById(input.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }
    // Save final exercise data
    await sessionRepository.upsertSessionProgress(
      input.sessionId,
      (parsed.exercises ?? []).map((ex) => ({
        templateExerciseId: ex.templateExerciseId,
        name: ex.name,
        position: ex.position,
        sets: ex.sets.map((s) => ({
          setIndex: s.setIndex,
          reps: s.reps,
          weight: s.weight ?? null,
          isDone: true,
        })),
      })),
    );
    await sessionRepository.finalizeSession(input.sessionId, {
      durationSec,
      totalLoadKg,
    });
    return { ok: true } as const;
  }

  // Fallback: legacy flow (create new session atomically)
  await sessionRepository.completeStrengthSession(
    input.trainingId,
    parsed?.exercises ?? [],
    userId,
    new Date(input.startedAt),
    {
      durationSec,
      totalLoadKg,
    },
  );
  return { ok: true } as const;
}

export async function completeCardioSession(input: CardioSessionFormValues) {
  const userId = await requireUserId();
  const parsed = cardioSessionSchema.safeParse(input);
  if (!parsed.success) {
    console.error(parsed.error);
    throw new Error("Failed to parse input");
  }
  const session = await sessionRepository.createOrUpdateCardioSession(
    parsed.data,
    userId,
  );
  if (!session) {
    throw new Error("Failed to complete session");
  }
  return { ok: true } as const;
}

export async function findLatestStrengthSessionWithDetails(trainingId: string) {
  const userId = await requireUserId();
  const session = await sessionRepository.findLatestStrengthSessionWithDetails(
    userId,
    trainingId,
  );
  if (!session) return null;
  return session;
}

export async function findLatestCardioSessionWithMetrics(trainingId: string) {
  const userId = await requireUserId();
  const session = await sessionRepository.findLatestCardioSessionWithMetrics(
    userId,
    trainingId,
  );
  if (!session) return null;
  return session;
}
