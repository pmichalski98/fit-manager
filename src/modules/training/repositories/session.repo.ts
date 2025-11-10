import { and, eq, gte, lt, inArray, asc } from "drizzle-orm";

import { db } from "@/server/db";
import {
  training,
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
      type: input.type,
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
      if (!insertedEx) {
        throw new Error("Failed to insert session exercise");
      }
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

type StrengthExerciseSummary = {
  name: string;
  setCount: number;
  avgReps: number;
  avgWeightKg: number | null;
};

export type SessionSummary = {
  id: string;
  trainingId: string;
  templateName: string;
  type: "strength" | "cardio";
  startAt: Date | string;
  endAt: Date | string | null;
  durationSec: number | null;
  strength?: {
    exercises: StrengthExerciseSummary[];
  };
  cardio?: {
    durationSec: number;
    distanceM: number | null;
    kcal: number | null;
  };
};

export async function findSessionsInRangeWithSummaries(
  userId: string,
  rangeStart: Date,
  rangeEndExclusive: Date,
): Promise<SessionSummary[]> {
  // 1) Sessions in range
  let sessions = await db
    .select()
    .from(trainingSession)
    .where(
      and(
        eq(trainingSession.userId, userId),
        gte(trainingSession.startAt, rangeStart),
        lt(trainingSession.startAt, rangeEndExclusive),
      ),
    )
    .orderBy(asc(trainingSession.startAt));
  // Consider only completed sessions (with endAt)
  sessions = sessions.filter((s) => s.endAt != null);
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const trainingIds = sessions.map((s) => s.trainingId);

  // 2) Template info
  const templates = await db
    .select()
    .from(training)
    .where(inArray(training.id, trainingIds));
  const tplById = new Map(templates.map((t) => [t.id, t]));

  // 3) Cardio metrics (only for cardio sessions)
  const cardioMetrics = await db
    .select()
    .from(trainingSessionCardio)
    .where(inArray(trainingSessionCardio.sessionId, sessionIds));
  const cardioBySession = new Map(cardioMetrics.map((c) => [c.sessionId, c]));

  // 4) Strength details (exercises and sets)
  const strengthSessionIds = sessions
    .filter((s) => s.type === "strength")
    .map((s) => s.id);
  const exercisesBySession = new Map<
    string,
    Array<{
      id: string;
      sessionId: string;
      name: string;
      position: number;
    }>
  >();
  const setsByExercise = new Map<
    string,
    Array<{
      sessionExerciseId: string;
      setIndex: number;
      reps: number;
      weight: string | null;
    }>
  >();
  if (strengthSessionIds.length) {
    const exercises = await db
      .select()
      .from(trainingSessionExercise)
      .where(inArray(trainingSessionExercise.sessionId, strengthSessionIds))
      .orderBy(asc(trainingSessionExercise.position));
    for (const ex of exercises) {
      const arr = exercisesBySession.get(ex.sessionId) ?? [];
      arr.push({
        id: ex.id,
        sessionId: ex.sessionId,
        name: ex.name,
        position: ex.position,
      });
      exercisesBySession.set(ex.sessionId, arr);
    }
    const exerciseIds = exercises.map((e) => e.id);
    const sets = exerciseIds.length
      ? await db
          .select()
          .from(trainingSessionSet)
          .where(inArray(trainingSessionSet.sessionExerciseId, exerciseIds))
          .orderBy(asc(trainingSessionSet.setIndex))
      : [];
    for (const st of sets) {
      const arr = setsByExercise.get(st.sessionExerciseId) ?? [];
      arr.push({
        sessionExerciseId: st.sessionExerciseId,
        setIndex: st.setIndex,
        reps: st.reps,
        weight: st.weight,
      });
      setsByExercise.set(st.sessionExerciseId, arr);
    }
  }

  // 5) Build summaries
  const result: SessionSummary[] = [];
  for (const s of sessions) {
    const tpl = tplById.get(s.trainingId);
    const name = tpl?.name ?? "Training";
    const type = tpl?.type ?? s.type;

    let durationSec: number | null = null;
    if (s.endAt && s.startAt) {
      const end = new Date(s.endAt as unknown as string);
      const start = new Date(s.startAt as unknown as string);
      durationSec = Math.max(
        0,
        Math.floor((end.getTime() - start.getTime()) / 1000),
      );
    }

    const summary: SessionSummary = {
      id: s.id,
      trainingId: s.trainingId,
      templateName: name,
      type,
      startAt: s.startAt,
      endAt: s.endAt ?? null,
      durationSec,
    };

    if (type === "cardio") {
      const cm = cardioBySession.get(s.id);
      if (cm) {
        summary.cardio = {
          durationSec: cm.durationSec,
          distanceM: cm.distanceM ?? null,
          kcal: cm.kcal ?? null,
        };
        // Prefer cardio duration if available
        summary.durationSec = cm.durationSec ?? summary.durationSec;
      }
    } else {
      const exercises = exercisesBySession.get(s.id) ?? [];
      const exSummaries: StrengthExerciseSummary[] = exercises.map((ex) => {
        const sets = setsByExercise.get(ex.id) ?? [];
        const setCount = sets.length;
        let repsTotal = 0;
        let weightTotal = 0;
        let weightCount = 0;
        for (const st of sets) {
          repsTotal += st.reps ?? 0;
          if (st.weight != null) {
            const w = parseFloat(st.weight);
            if (!Number.isNaN(w)) {
              weightTotal += w;
              weightCount += 1;
            }
          }
        }
        const avgReps = setCount ? Math.round(repsTotal / setCount) : 0;
        const avgWeightKg = weightCount ? weightTotal / weightCount : null;
        return {
          name: ex.name,
          setCount,
          avgReps,
          avgWeightKg,
        };
      });
      summary.strength = { exercises: exSummaries };
    }

    result.push(summary);
  }

  return result;
}
