"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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
  deleteTraining,
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
const startTrainingSessionSchemaLocal = z.object({
  trainingId: z.string().uuid(),
});
export type StartTrainingSessionInput = z.infer<
  typeof startTrainingSessionSchemaLocal
>;

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

  revalidatePath("/training");

  return { ok: true, data: created } as const;
}

export async function startTrainingSessionAction(
  input: StartTrainingSessionInput,
) {
  const userId = await requireUserId();
  const { trainingId } = startTrainingSessionSchemaLocal.parse(input);
  const tpl = await findTrainingByIdWithExercises(userId, trainingId);
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
  await completeStrengthSession(sessionId, parsed.exercises);
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

export async function deleteTrainingAction(trainingId: string) {
  const userId = await requireUserId();
  await deleteTraining(userId, trainingId);
  revalidatePath("/training");
  return { ok: true } as const;
}
