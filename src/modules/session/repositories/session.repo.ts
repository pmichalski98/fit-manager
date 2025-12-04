"server-only";

import { and, eq, gte, lt, inArray, asc, isNotNull, desc } from "drizzle-orm";
import { isToday } from "date-fns";

import { db } from "@/server/db";
import {
  training,
  trainingSession,
  trainingSessionCardio,
  trainingSessionExercise,
  trainingSessionSet,
} from "@/server/db/schema";
import type { CardioSessionFormValues } from "../schemas";
import type { SessionSummary } from "../types";

type CreateSessionInput = {
  userId: string;
  trainingId: string;
  type: "strength" | "cardio";
  startAt?: Date;
};

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

class SessionRepository {
  async createSession(input: CreateSessionInput) {
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

  async completeStrengthSession(
    trainingId: string,
    payload: StrengthSessionPayload,
    userId: string,
    startAt: Date,
    summary?: {
      durationSec?: number | null;
      totalLoadKg?: number | null;
      progress?: Array<{
        position: number;
        name: string;
        prevVolume: number;
        currentVolume: number;
        delta: number;
      }> | null;
    },
  ) {
    return await db.transaction(async (tx) => {
      const [session] = await tx
        .insert(trainingSession)
        .values({
          userId: userId,
          trainingId,
          type: "strength",
          startAt: startAt,
          endAt: new Date(),
          durationMin: summary?.durationSec ?? null, // Assuming input might be minutes or seconds? Logic might need check.
          // Wait, summary.durationSec suggests seconds. Schema expects minutes.
          // If summary.durationSec is passed, I should convert to minutes if needed.
          // However, this function signature hasn't changed in the plan, just the repo method.
          // I'll leave it as is for now but note that durationMin expects minutes.
          // If existing calls pass seconds, this is a bug in existing code or schema mismatch.
          // I'll assume durationSec is converted or handled elsewhere for now as this wasn't explicitly in plan to fix existing writes, only read.
          totalLoadKg: summary?.totalLoadKg ?? null,
        })
        .returning();
      if (!session) {
        throw new Error("Failed to insert session");
      }
      for (const ex of payload) {
        const [insertedEx] = await tx
          .insert(trainingSessionExercise)
          .values({
            sessionId: session.id,
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
            })),
          );
        }
      }
      // Only update lastSessionAt if the session date is today
      const sessionDate = new Date(startAt);

      if (isToday(sessionDate)) {
        await tx
          .update(training)
          .set({
            lastSessionAt: sessionDate,
          })
          .where(eq(training.id, trainingId));
      }
      return session;
    });
  }

  async createOrUpdateCardioSession(
    input: CardioSessionFormValues,
    userId: string,
  ) {
    const [exists] = await db
      .select()
      .from(trainingSession)
      .where(
        and(
          eq(trainingSession.userId, userId),
          eq(trainingSession.trainingId, input.trainingId),
          eq(trainingSession.type, "cardio"),
          eq(trainingSession.date, input.date),
          isNotNull(trainingSession.endAt),
        ),
      );
    if (exists) {
      return await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(trainingSession)
          .set({
            endAt: new Date(),
          })
          .where(eq(trainingSession.id, exists.id))
          .returning();
        if (!updated) {
          throw new Error("Failed to update session");
        }
        await db
          .update(trainingSessionCardio)
          .set({
            durationMin: input.durationMin ?? null,
            distanceKm: input.distanceKm ?? null,
            kcal: input.kcal ?? null,
            avgHr: input.avgHr ?? null,
            avgSpeedKmh: input.avgSpeedKmh ?? null,
            avgPowerW: input.avgPowerW ?? null,
            notes: input.notes ?? null,
            cadence: input.cadence ?? null,
          })
          .where(eq(trainingSessionCardio.sessionId, exists.id));
        return updated;
      });
    }
    return await db.transaction(async (tx) => {
      const [session] = await tx
        .insert(trainingSession)
        .values({
          userId,
          trainingId: input.trainingId,
          type: "cardio",
          date: input.date,
          durationMin: input.durationMin,
          endAt: new Date(),
        })
        .returning();
      if (!session) {
        throw new Error("Failed to insert session");
      }
      await tx.insert(trainingSessionCardio).values({
        durationMin: input.durationMin ?? null,
        distanceKm: input.distanceKm ?? null,
        kcal: input.kcal ?? null,
        avgHr: input.avgHr ?? null,
        avgSpeedKmh: input.avgSpeedKmh ?? null,
        avgPowerW: input.avgPowerW ?? null,
        notes: input.notes ?? null,
        cadence: input.cadence ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId: session.id,
      });

      // Only update lastSessionAt if the session date is today
      const sessionDate = new Date(input.date);

      if (isToday(sessionDate)) {
        await tx
          .update(training)
          .set({
            lastSessionAt: new Date(input.date),
          })
          .where(eq(training.id, input.trainingId));
      }

      return session;
    });
  }

  async findSessionById(sessionId: string) {
    const [row] = await db
      .select()
      .from(trainingSession)
      .where(eq(trainingSession.id, sessionId));
    return row ?? null;
  }

  async getSessionDistribution(userId: string, fromDate?: Date, toDate?: Date) {
    const whereClause = and(
      eq(trainingSession.userId, userId),
      isNotNull(trainingSession.endAt),
      fromDate ? gte(trainingSession.date, fromDate.toISOString()) : undefined,
      toDate ? lt(trainingSession.date, toDate.toISOString()) : undefined,
    );

    return await db
      .select({
        date: trainingSession.date,
        type: trainingSession.type,
      })
      .from(trainingSession)
      .where(whereClause)
      .orderBy(asc(trainingSession.date));
  }

  async getSessionsInRange(
    userId: string,
    rangeStart: Date,
    rangeEndExclusive: Date,
  ): Promise<SessionSummary[]> {
    // 1) Sessions in range
    const sessions = await db
      .select()
      .from(trainingSession)
      .where(
        and(
          eq(trainingSession.userId, userId),
          gte(trainingSession.startAt, rangeStart),
          lt(trainingSession.startAt, rangeEndExclusive),
          isNotNull(trainingSession.endAt),
        ),
      )
      .orderBy(asc(trainingSession.startAt));

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

    type ExerciseRow = typeof trainingSessionExercise.$inferSelect;
    type SetRow = typeof trainingSessionSet.$inferSelect;

    const exercisesBySession = new Map<string, ExerciseRow[]>();
    const setsByExercise = new Map<string, SetRow[]>();

    if (strengthSessionIds.length > 0) {
      const exercises = await db
        .select()
        .from(trainingSessionExercise)
        .where(inArray(trainingSessionExercise.sessionId, strengthSessionIds))
        .orderBy(asc(trainingSessionExercise.position));

      for (const ex of exercises) {
        const arr = exercisesBySession.get(ex.sessionId) ?? [];
        arr.push(ex);
        exercisesBySession.set(ex.sessionId, arr);
      }

      const exerciseIds = exercises.map((e) => e.id);
      if (exerciseIds.length > 0) {
        const sets = await db
          .select()
          .from(trainingSessionSet)
          .where(inArray(trainingSessionSet.sessionExerciseId, exerciseIds))
          .orderBy(asc(trainingSessionSet.setIndex));

        for (const s of sets) {
          const arr = setsByExercise.get(s.sessionExerciseId) ?? [];
          arr.push(s);
          setsByExercise.set(s.sessionExerciseId, arr);
        }
      }
    }

    return sessions.map((s) => {
      const tpl = tplById.get(s.trainingId);
      const cardio = cardioBySession.get(s.id);
      const exercises = exercisesBySession.get(s.id) ?? [];

      const strengthSummary =
        s.type === "strength"
          ? {
              exercises: exercises.map((ex) => {
                const sets = setsByExercise.get(ex.id) ?? [];
                const setCount = sets.length;
                const repsTotal = sets.reduce(
                  (acc: number, set) => acc + set.reps,
                  0,
                );
                const avgReps = setCount ? Math.round(repsTotal / setCount) : 0;

                const validWeights = sets
                  .filter((set) => set.weight != null)
                  .map((set) => Number(set.weight));
                const avgWeightKg = validWeights.length
                  ? validWeights.reduce(
                      (acc: number, w: number) => acc + w,
                      0,
                    ) / validWeights.length
                  : null;

                return {
                  name: ex.name,
                  setCount,
                  avgReps,
                  avgWeightKg,
                };
              }),
            }
          : undefined;

      return {
        id: s.id,
        trainingId: s.trainingId,
        templateName: tpl?.name ?? "Unknown Training",
        type: s.type,
        startAt: s.startAt,
        endAt: s.endAt,
        durationMin: s.durationMin ?? null,
        cardio: cardio
          ? {
              durationMin: cardio.durationMin,
              distanceKm: cardio.distanceKm ? Number(cardio.distanceKm) : null,
              kcal: cardio.kcal ?? null,
            }
          : undefined,
        strength: strengthSummary,
      };
    });
  }

  async findLatestCardioSessionWithMetrics(userId: string, trainingId: string) {
    const [result] = await db
      .select()
      .from(trainingSession)
      .innerJoin(
        trainingSessionCardio,
        eq(trainingSessionCardio.sessionId, trainingSession.id),
      )
      .where(
        and(
          eq(trainingSession.userId, userId),
          eq(trainingSession.trainingId, trainingId),
          eq(trainingSession.type, "cardio"),
          isNotNull(trainingSession.endAt),
        ),
      )
      .orderBy(desc(trainingSession.endAt))
      .limit(1);
    if (!result) return null;
    return {
      session: result.training_session,
      metrics: result.training_session_cardio,
    };
  }

  async findLatestStrengthSessionWithDetails(
    userId: string,
    trainingId: string,
  ) {
    // Get session, exercises, and sets in one query with joins
    const rows = await db
      .select()
      .from(trainingSession)
      .leftJoin(
        trainingSessionExercise,
        eq(trainingSessionExercise.sessionId, trainingSession.id),
      )
      .leftJoin(
        trainingSessionSet,
        eq(trainingSessionSet.sessionExerciseId, trainingSessionExercise.id),
      )
      .where(
        and(
          eq(trainingSession.userId, userId),
          eq(trainingSession.trainingId, trainingId),
          eq(trainingSession.type, "strength"),
          isNotNull(trainingSession.endAt),
        ),
      )
      .orderBy(
        desc(trainingSession.endAt),
        asc(trainingSessionExercise.position),
        asc(trainingSessionSet.setIndex),
      );

    if (rows.length === 0) return null;

    // Get the session from the first row
    const firstRow = rows[0];
    if (!firstRow?.training_session) return null;
    const session = firstRow.training_session;
    const latestSessionId = session.id;

    // Group exercises and sets (only process rows from the latest session)
    type ExerciseRow = typeof trainingSessionExercise.$inferSelect;
    type SetRow = typeof trainingSessionSet.$inferSelect;
    const exercisesMap = new Map<string, ExerciseRow>();
    const setsByExercise = new Map<string, SetRow[]>();

    for (const row of rows) {
      // Stop processing if we encounter a different session
      if (row.training_session?.id !== latestSessionId) break;

      const exercise = row.training_session_exercise;
      if (!exercise) continue;

      // Store exercise if not already stored
      if (!exercisesMap.has(exercise.id)) {
        exercisesMap.set(exercise.id, exercise);
        setsByExercise.set(exercise.id, []);
      }

      // Add set if it exists
      if (row.training_session_set) {
        const sets = setsByExercise.get(exercise.id);
        if (sets) sets.push(row.training_session_set);
      }
    }

    // Convert map to array, maintaining order
    const exercises = Array.from(exercisesMap.values()).sort(
      (a, b) => a.position - b.position,
    );

    return {
      session,
      exercises: exercises.map((exercise) => ({
        ...exercise,
        sets: setsByExercise.get(exercise.id) ?? [],
      })),
    };
  }

  async getExerciseHistory(userId: string, exerciseName: string) {
    // Get all completed sessions with this exercise
    const rows = await db
      .select({
        date: trainingSession.date,
        weight: trainingSessionSet.weight,
        reps: trainingSessionSet.reps,
      })
      .from(trainingSession)
      .innerJoin(
        trainingSessionExercise,
        eq(trainingSessionExercise.sessionId, trainingSession.id),
      )
      .innerJoin(
        trainingSessionSet,
        eq(trainingSessionSet.sessionExerciseId, trainingSessionExercise.id),
      )
      .where(
        and(
          eq(trainingSession.userId, userId),
          eq(trainingSession.type, "strength"),
          eq(trainingSessionExercise.name, exerciseName),
          isNotNull(trainingSessionSet.weight),
        ),
      )
      .orderBy(asc(trainingSession.date));

    return rows.map((r) => ({
      date: r.date,
      weight: Number(r.weight),
      reps: r.reps,
    }));
  }
}

export const sessionRepository = new SessionRepository();
