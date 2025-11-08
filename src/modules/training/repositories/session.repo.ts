import { and, eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
  training,
  trainingExercise,
  trainingSession,
  trainingSessionCardio,
  trainingSessionExercise,
  trainingSessionSet,
} from "@/server/db/schema";

export async function createSession(input: {
  userId: string;
  trainingId: string;
  type: "strength" | "cardio";
  startAt?: Date;
}) {
  const [row] = await db
    .insert(trainingSession)
    .values({
      userId: input.userId,
      trainingId: input.trainingId,
      type: input.type as any,
      startAt: input.startAt ?? new Date(),
    })
    .returning();
  return row;
}

export type StrengthSessionPayload = Array<{
  templateExerciseId?: string | null;
  name: string;
  position: number;
  sets: Array<{
    setIndex: number;
    reps: number;
    weight?: number | null;
    rpe?: number | null;
    rir?: number | null;
    restSec?: number | null;
  }>;
}>;

export async function completeStrengthSession(
  sessionId: string,
  payload: StrengthSessionPayload,
) {
  return await db.transaction(async (tx) => {
    for (const ex of payload) {
      const [insertedEx] = await tx
        .insert(trainingSessionExercise)
        .values({
          sessionId,
          templateExerciseId: ex.templateExerciseId ?? null,
          name: ex.name,
          position: ex.position,
        })
        .returning();
      if (ex.sets?.length) {
        await tx.insert(trainingSessionSet).values(
          ex.sets.map((s) => ({
            sessionExerciseId: insertedEx.id,
            setIndex: s.setIndex,
            reps: s.reps,
            weight: s.weight != null ? String(s.weight) : null,
            rpe: s.rpe != null ? String(s.rpe) : null,
            rir: s.rir != null ? String(s.rir) : null,
            restSec: s.restSec ?? null,
          })),
        );
      }
    }
    const [updated] = await tx
      .update(trainingSession)
      .set({ endAt: new Date(), updatedAt: new Date() })
      .where(eq(trainingSession.id, sessionId))
      .returning();
    return updated;
  });
}

export async function completeCardioSession(
  sessionId: string,
  metrics: {
    durationSec: number;
    distanceM?: number | null;
    kcal?: number | null;
    avgHr?: number | null;
    avgSpeedKmh?: number | null;
    avgPowerW?: number | null;
    notes?: string | null;
  },
) {
  return await db.transaction(async (tx) => {
    await tx.insert(trainingSessionCardio).values({
      sessionId,
      durationSec: metrics.durationSec,
      distanceM: metrics.distanceM ?? null,
      kcal: metrics.kcal ?? null,
      avgHr: metrics.avgHr ?? null,
      avgSpeedKmh:
        metrics.avgSpeedKmh != null ? String(metrics.avgSpeedKmh) : null,
      avgPowerW: metrics.avgPowerW ?? null,
      notes: metrics.notes ?? null,
    });
    const [updated] = await tx
      .update(trainingSession)
      .set({ endAt: new Date(), updatedAt: new Date() })
      .where(eq(trainingSession.id, sessionId))
      .returning();
    return updated;
  });
}

export async function findSessionById(sessionId: string) {
  const [row] = await db
    .select()
    .from(trainingSession)
    .where(eq(trainingSession.id, sessionId));
  return row ?? null;
}
