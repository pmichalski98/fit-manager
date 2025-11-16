import { db } from "@/server/db";
import {
  training,
  trainingExercise,
  type trainingTypeEnum,
} from "@/server/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

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
      .where(eq(training.userId, userId));

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

    const trainingsWithExercises = trainings.map((t) => ({
      ...t,
      exercises: byTrainingId.get(t.id) ?? [],
    }));

    // Sort by lastSessionAt ascending (oldest first), with nulls last
    return trainingsWithExercises.sort((a, b) => {
      if (a.lastSessionAt === null && b.lastSessionAt === null) return 0;
      if (a.lastSessionAt === null) return 1;
      if (b.lastSessionAt === null) return -1;
      return (
        new Date(a.lastSessionAt).getTime() -
        new Date(b.lastSessionAt).getTime()
      );
    });
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

  async deleteTraining(userId: string, trainingId: string) {
    return await db
      .delete(training)
      .where(and(eq(training.userId, userId), eq(training.id, trainingId)));
  }
}

export const trainingRepository = new TrainingRepository();
