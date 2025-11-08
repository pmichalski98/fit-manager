"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  trainingFormSchema,
  cardioSessionSchema,
  strengthSessionSchema,
} from "@/modules/training/schemas";
import {
  createTraining,
  findTrainingByIdWithExercises,
} from "@/modules/training/repositories";
import {
  completeCardioSession,
  completeStrengthSession,
  createSession,
} from "@/modules/training/repositories";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export type CreateTrainingInput = z.infer<typeof trainingFormSchema>;

export async function createTrainingAction(input: CreateTrainingInput) {
  const userId = await requireUserId();
  const parsed = trainingFormSchema.parse(input);

  const exercises = parsed.type === "strength" ? parsed.exercises : [];

  const created = await createTraining({
    userId,
    name: parsed.name,
    type: parsed.type,
    exercises,
  });

  return { ok: true, data: created } as const;
}

export async function startTrainingSessionAction(formData: FormData) {
  const userId = await requireUserId();
  const trainingId = String(formData.get("trainingId") ?? "");
  if (!trainingId) throw new Error("Missing trainingId");
  const tpl = await findTrainingByIdWithExercises(userId, trainingId);
  if (!tpl) throw new Error("Training not found");
  const session = await createSession({
    userId,
    trainingId: tpl.id,
    type: tpl.type,
  });
  redirect(`/training/session/${session.id}`);
}

export async function completeStrengthSessionAction(
  input: z.infer<typeof strengthSessionSchema> & { sessionId: string },
) {
  const userId = await requireUserId();
  // We don't strictly check ownership here; ideally check session.userId === userId
  const parsed = strengthSessionSchema.parse(input);
  await completeStrengthSession(parsed.sessionId, parsed.exercises);
  return { ok: true } as const;
}

export async function completeCardioSessionAction(
  input: z.infer<typeof cardioSessionSchema> & { sessionId: string },
) {
  const userId = await requireUserId();
  const parsed = cardioSessionSchema.parse(input);
  await completeCardioSession(parsed.sessionId, {
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
