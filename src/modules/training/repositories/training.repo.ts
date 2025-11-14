import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/server/db";
import {
  training,
  trainingExercise,
  trainingSession,
  trainingSessionExercise,
  trainingSessionSet,
  type trainingTypeEnum,
  trainingSessionCardio,
} from "@/server/db/schema";

export type CreateTrainingValues = {
  userId: string;
  name: string;
  type: (typeof trainingTypeEnum.enumValues)[number];
  exercises: Array<{ name: string }>;
};

class TrainingRepository {
  async createTraining(values: CreateTrainingValues) {
    return await db.transaction(async (tx) => {
      const [createdTraining] = await tx
        .insert(training)
        .values({
          userId: values.userId,
          name: values.name,
          type: values.type,
        })
        .returning();
      if (!createdTraining) return createdTraining;

      if (values.type === "strength" && values.exercises.length > 0) {
        await tx.insert(trainingExercise).values(
          values.exercises.map((ex, idx) => ({
            trainingId: createdTraining.id,
            name: ex.name,
            position: idx,
          })),
        );
      }

      return createdTraining;
    });
  }

  async findAllTrainingsWithExercises(userId: string) {
    const trainings = await db
      .select()
      .from(training)
      .where(eq(training.userId, userId))
      .orderBy(desc(training.createdAt));

    const ids = trainings.map((t) => t.id);
    type TrainingRow = typeof training.$inferSelect;
    type ExerciseRow = typeof trainingExercise.$inferSelect;
    type TrainingWithExercises = TrainingRow & { exercises: ExerciseRow[] };
    if (ids.length === 0) return [] as TrainingWithExercises[];

    const exercises = await db
      .select()
      .from(trainingExercise)
      .where(inArray(trainingExercise.trainingId, ids))
      .orderBy(trainingExercise.position);

    const byTrainingId = new Map<string, ExerciseRow[]>();
    for (const t of trainings) byTrainingId.set(t.id, []);
    for (const ex of exercises) {
      const arr = byTrainingId.get(ex.trainingId);
      if (arr) arr.push(ex);
    }

    return trainings.map((t) => ({
      ...t,
      exercises: byTrainingId.get(t.id) ?? [],
    }));
  }

  async findTrainingByIdWithExercises(userId: string, trainingId: string) {
    const [t] = await db
      .select()
      .from(training)
      .where(and(eq(training.userId, userId), eq(training.id, trainingId)));
    if (!t) return null;
    const exs = await db
      .select()
      .from(trainingExercise)
      .where(eq(trainingExercise.trainingId, trainingId))
      .orderBy(trainingExercise.position);
    return { ...t, exercises: exs };
  }

  async findLatestStrengthSessionWithDetails(
    userId: string,
    trainingId: string,
  ) {
    const [s] = await db
      .select()
      .from(trainingSession)
      .where(
        and(
          eq(trainingSession.userId, userId),
          eq(trainingSession.trainingId, trainingId),
          eq(trainingSession.type, "strength"),
          isNotNull(trainingSession.endAt),
        ),
      )
      .orderBy(desc(trainingSession.endAt))
      .limit(1);
    if (!s) return null;
    const exercises = await db
      .select()
      .from(trainingSessionExercise)
      .where(eq(trainingSessionExercise.sessionId, s.id))
      .orderBy(trainingSessionExercise.position);
    const exerciseIds = exercises.map((e) => e.id);
    type SetRow = typeof trainingSessionSet.$inferSelect;
    const sets: SetRow[] = exerciseIds.length
      ? await db
          .select()
          .from(trainingSessionSet)
          .where(inArray(trainingSessionSet.sessionExerciseId, exerciseIds))
          .orderBy(trainingSessionSet.setIndex)
      : [];
    const setsByExercise = new Map<string, SetRow[]>();
    for (const e of exercises) setsByExercise.set(e.id, []);
    for (const st of sets) {
      const arr = setsByExercise.get(st.sessionExerciseId);
      if (arr) arr.push(st);
    }
    return {
      session: s,
      exercises: exercises.map((e) => ({
        ...e,
        sets: setsByExercise.get(e.id) ?? [],
      })),
    };
  }

  async deleteTraining(userId: string, trainingId: string) {
    return await db
      .delete(training)
      .where(and(eq(training.userId, userId), eq(training.id, trainingId)));
  }

  async findLatestCardioSessionWithMetrics(userId: string, trainingId: string) {
    const [s] = await db
      .select()
      .from(trainingSession)
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
    if (!s) return null;
    const [metrics] = await db
      .select()
      .from(trainingSessionCardio)
      .where(eq(trainingSessionCardio.sessionId, s.id))
      .limit(1);
    return { session: s, metrics: metrics ?? null };
  }
}

export const trainingRepository = new TrainingRepository();
