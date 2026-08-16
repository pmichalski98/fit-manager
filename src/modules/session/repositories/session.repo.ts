"server-only";

import {
  and,
  eq,
  gte,
  lt,
  lte,
  inArray,
  asc,
  isNotNull,
  desc,
} from "drizzle-orm";
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
import type { SessionDetail, SessionSummary } from "../types";
import { buildExerciseRecords, type ExerciseRecord } from "../lib/set-progress";

function cardioFieldsFromInput(input: CardioSessionFormValues) {
  return {
    durationMin: input.durationMin ?? null,
    distanceKm: input.distanceKm ?? null,
    kcal: input.kcal ?? null,
    avgHr: input.avgHr ?? null,
    avgSpeedKmh: input.avgSpeedKmh ?? null,
    maxSpeedKmh: input.maxSpeedKmh ?? null,
    avgPowerW: input.avgPowerW ?? null,
    notes: input.notes ?? null,
    cadence: input.cadence ?? null,
  };
}

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
  notes?: string | null;
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
      notes?: string | null;
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
          durationMin:
            summary?.durationSec != null
              ? Math.round(summary.durationSec / 60)
              : null,
          totalLoadKg: summary?.totalLoadKg ?? null,
          notes: summary?.notes ?? null,
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
            notes: ex.notes ?? null,
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
          .set(cardioFieldsFromInput(input))
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
        ...cardioFieldsFromInput(input),
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
        durationMin: trainingSession.durationMin,
      })
      .from(trainingSession)
      .where(whereClause)
      .orderBy(asc(trainingSession.date));
  }

  async getTrainingVolumeHistory(userId: string, trainingId: string) {
    return await db
      .select({
        date: trainingSession.date,
        totalLoadKg: trainingSession.totalLoadKg,
      })
      .from(trainingSession)
      .where(
        and(
          eq(trainingSession.userId, userId),
          eq(trainingSession.trainingId, trainingId),
          isNotNull(trainingSession.endAt),
          isNotNull(trainingSession.totalLoadKg),
        ),
      )
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
        totalLoadKg: s.totalLoadKg ?? null,
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

  /**
   * Full per-set session data for a date range, for the AI export.
   * Filters on the `date` column (the semantic training day) rather than
   * `startAt`, which for retroactively added cardio holds the insertion time.
   */
  async getDetailedSessionsInRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<SessionDetail[]> {
    // 1) Completed sessions in range
    const sessions = await db
      .select()
      .from(trainingSession)
      .where(
        and(
          eq(trainingSession.userId, userId),
          gte(trainingSession.date, startDate),
          lte(trainingSession.date, endDate),
          isNotNull(trainingSession.endAt),
        ),
      )
      .orderBy(asc(trainingSession.date), asc(trainingSession.startAt));

    if (sessions.length === 0) return [];

    const sessionIds = sessions.map((s) => s.id);
    const trainingIds = sessions.map((s) => s.trainingId);

    // 2) Template info
    const templates = await db
      .select()
      .from(training)
      .where(inArray(training.id, trainingIds));
    const tplById = new Map(templates.map((t) => [t.id, t]));

    // 3) Cardio metrics
    const cardioMetrics = await db
      .select()
      .from(trainingSessionCardio)
      .where(inArray(trainingSessionCardio.sessionId, sessionIds));
    const cardioBySession = new Map(cardioMetrics.map((c) => [c.sessionId, c]));

    // 4) Exercises and raw sets. No isDone filter: legacy sessions
    // (completeStrengthSession path) left it false on every set.
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
      const cardio = cardioBySession.get(s.id);
      return {
        id: s.id,
        date: s.date,
        templateName: tplById.get(s.trainingId)?.name ?? "Unknown Training",
        type: s.type,
        durationMin: s.durationMin ?? null,
        totalLoadKg: s.totalLoadKg ?? null,
        notes: s.notes ?? null,
        cardio: cardio
          ? {
              durationMin: cardio.durationMin,
              distanceKm:
                cardio.distanceKm != null ? Number(cardio.distanceKm) : null,
              kcal: cardio.kcal ?? null,
              avgHr: cardio.avgHr ?? null,
              cadence: cardio.cadence ?? null,
              avgSpeedKmh:
                cardio.avgSpeedKmh != null ? Number(cardio.avgSpeedKmh) : null,
              maxSpeedKmh:
                cardio.maxSpeedKmh != null ? Number(cardio.maxSpeedKmh) : null,
              avgPowerW: cardio.avgPowerW ?? null,
              notes: cardio.notes ?? null,
            }
          : null,
        exercises: (exercisesBySession.get(s.id) ?? []).map((ex) => ({
          name: ex.name,
          position: ex.position,
          notes: ex.notes ?? null,
          sets: (setsByExercise.get(ex.id) ?? []).map((set) => ({
            setIndex: set.setIndex,
            reps: set.reps,
            weight: set.weight != null ? Number(set.weight) : null,
          })),
        })),
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

  async createInProgressSession(userId: string, trainingId: string) {
    const [row] = await db
      .insert(trainingSession)
      .values({
        userId,
        trainingId,
        type: "strength",
        status: "in_progress",
        startAt: new Date(),
      })
      .returning({ id: trainingSession.id, startAt: trainingSession.startAt });
    if (!row) throw new Error("Failed to create in-progress session");
    return row;
  }

  async upsertSessionProgress(
    sessionId: string,
    exercises: Array<{
      templateExerciseId?: string | null;
      name: string;
      position: number;
      notes?: string | null;
      sets: Array<{
        setIndex: number;
        reps: number | null;
        weight: number | null;
        isDone: boolean;
      }>;
    }>,
    sessionNotes?: string | null,
  ) {
    await db.transaction(async (tx) => {
      if (sessionNotes !== undefined) {
        await tx
          .update(trainingSession)
          .set({ notes: sessionNotes })
          .where(eq(trainingSession.id, sessionId));
      }

      // Delete existing exercises (cascade deletes sets)
      await tx
        .delete(trainingSessionExercise)
        .where(eq(trainingSessionExercise.sessionId, sessionId));

      // Re-insert all exercises and sets
      for (const ex of exercises) {
        const [insertedEx] = await tx
          .insert(trainingSessionExercise)
          .values({
            sessionId,
            templateExerciseId: ex.templateExerciseId ?? null,
            name: ex.name,
            position: ex.position,
            notes: ex.notes ?? null,
          })
          .returning();
        if (!insertedEx) throw new Error("Failed to insert exercise");

        if (ex.sets.length > 0) {
          await tx.insert(trainingSessionSet).values(
            ex.sets.map((s) => ({
              sessionExerciseId: insertedEx.id,
              setIndex: s.setIndex,
              reps: s.reps ?? 0,
              weight: s.weight != null ? String(s.weight) : null,
              isDone: s.isDone,
            })),
          );
        }
      }
    });
  }

  async finalizeSession(
    sessionId: string,
    summary: {
      durationSec: number | null;
      totalLoadKg: number | null;
    },
  ) {
    const now = new Date();
    await db.transaction(async (tx) => {
      const [session] = await tx
        .update(trainingSession)
        .set({
          status: "completed",
          endAt: now,
          durationMin:
            summary.durationSec != null
              ? Math.round(summary.durationSec / 60)
              : null,
          totalLoadKg: summary.totalLoadKg,
          updatedAt: now,
        })
        .where(
          and(
            eq(trainingSession.id, sessionId),
            eq(trainingSession.status, "in_progress"),
          ),
        )
        .returning();
      if (!session) throw new Error("Session not found or already completed");

      // Update training lastSessionAt
      if (isToday(session.startAt)) {
        await tx
          .update(training)
          .set({ lastSessionAt: session.startAt })
          .where(eq(training.id, session.trainingId));
      }
    });
  }

  async findInProgressSession(userId: string, trainingId: string) {
    // Find the in-progress session
    const [session] = await db
      .select()
      .from(trainingSession)
      .where(
        and(
          eq(trainingSession.userId, userId),
          eq(trainingSession.trainingId, trainingId),
          eq(trainingSession.status, "in_progress"),
        ),
      )
      .orderBy(desc(trainingSession.startAt))
      .limit(1);

    if (!session) return null;

    // Get exercises and sets
    const exercises = await db
      .select()
      .from(trainingSessionExercise)
      .where(eq(trainingSessionExercise.sessionId, session.id))
      .orderBy(asc(trainingSessionExercise.position));

    const exerciseIds = exercises.map((e) => e.id);
    let sets: (typeof trainingSessionSet.$inferSelect)[] = [];
    if (exerciseIds.length > 0) {
      sets = await db
        .select()
        .from(trainingSessionSet)
        .where(inArray(trainingSessionSet.sessionExerciseId, exerciseIds))
        .orderBy(asc(trainingSessionSet.setIndex));
    }

    const setsByExercise = new Map<
      string,
      (typeof trainingSessionSet.$inferSelect)[]
    >();
    for (const s of sets) {
      const arr = setsByExercise.get(s.sessionExerciseId) ?? [];
      arr.push(s);
      setsByExercise.set(s.sessionExerciseId, arr);
    }

    return {
      sessionId: session.id,
      startAt: session.startAt.toISOString(),
      notes: session.notes ?? null,
      exercises: exercises.map((ex) => ({
        name: ex.name,
        position: ex.position,
        templateExerciseId: ex.templateExerciseId,
        notes: ex.notes ?? null,
        sets: (setsByExercise.get(ex.id) ?? []).map((s) => ({
          setIndex: s.setIndex,
          reps: s.reps,
          weight: s.weight != null ? Number(s.weight) : null,
          isDone: s.isDone,
        })),
      })),
    };
  }

  async deleteSession(sessionId: string) {
    await db.delete(trainingSession).where(eq(trainingSession.id, sessionId));
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

  async getExerciseRecords(
    userId: string,
    trainingId: string,
  ): Promise<Record<string, ExerciseRecord>> {
    // isNotNull(endAt) excludes the current in-progress session, whose sets
    // are already in the DB via autosave and would otherwise beat themselves.
    const rows = await db
      .select({
        templateExerciseId: trainingSessionExercise.templateExerciseId,
        reps: trainingSessionSet.reps,
        weight: trainingSessionSet.weight,
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
          eq(trainingSession.trainingId, trainingId),
          eq(trainingSession.type, "strength"),
          isNotNull(trainingSession.endAt),
          isNotNull(trainingSessionExercise.templateExerciseId),
        ),
      );

    return buildExerciseRecords(rows);
  }
}

export const sessionRepository = new SessionRepository();
