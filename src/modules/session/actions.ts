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

export async function findSessionById(id: string) {
  const userId = await requireUserId();
  const session = await sessionRepository.findSessionById(id);
  if (!session) throw new Error("Session not found");
  return session;
}

export async function completeStrengthSession(
  input: StrengthSessionFormValues & { startedAt: string },
) {
  await requireUserId();
  // We don't strictly check ownership here; ideally check session.userId === userId
  const parsed = strengthSessionSchema.parse(input);
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
  const userId = await requireUserId();
  await sessionRepository.completeStrengthSession(
    input.trainingId,
    parsed?.exercises ?? [],
    userId,
    new Date(input.startedAt),
    {
      durationSec,
      totalLoadKg,
      progress,
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
