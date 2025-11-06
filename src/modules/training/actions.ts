"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { trainingFormSchema } from "@/modules/training/schemas";
import { createTraining } from "@/modules/training/repositories";

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


