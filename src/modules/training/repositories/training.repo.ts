import { db } from "@/server/db";
import {
  training,
  trainingExercise,
  trainingSessionExercise,
  type trainingTypeEnum,
} from "@/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export type CreateTrainingValues = {
  userId: string;
  name: string;
  type: (typeof trainingTypeEnum.enumValues)[number];
  exercises: Array<{ name: string }>;
};

export type UpdateTrainingValues = {
  id: string;
  userId: string;
  name: string;
  type: (typeof trainingTypeEnum.enumValues)[number];
  exercises: Array<{ id?: string; name: string; replace?: boolean }>;
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

  async updateTraining(values: UpdateTrainingValues) {
    return await db.transaction(async (tx) => {
      const [updatedTraining] = await tx
        .update(training)
        .set({
          name: values.name,
          // type is not editable
          updatedAt: new Date(),
        })
        .where(
          and(eq(training.id, values.id), eq(training.userId, values.userId)),
        )
        .returning();

      if (!updatedTraining) return null;

      if (values.type === "strength") {
        // Get existing exercises
        const existingExercises = await tx
          .select()
          .from(trainingExercise)
          .where(eq(trainingExercise.trainingId, values.id));

        const existingIds = new Set(existingExercises.map((e) => e.id));
        const inputIds = new Set(
          values.exercises.map((e) => e.id).filter((id): id is string => !!id),
        );

        const toDeleteIds = [...existingIds].filter((id) => !inputIds.has(id));

        // 1. Delete removed exercises and their session history
        if (toDeleteIds.length > 0) {
          // Delete session history for these exercises
          await tx
            .delete(trainingSessionExercise)
            .where(
              inArray(trainingSessionExercise.templateExerciseId, toDeleteIds),
            );

          // Delete the exercises themselves
          await tx
            .delete(trainingExercise)
            .where(inArray(trainingExercise.id, toDeleteIds));
        }

        // 2. Update existing exercises and create new ones
        for (let i = 0; i < values.exercises.length; i++) {
          const ex = values.exercises[i];
          if (!ex) continue; // Safety check

          if (ex.id && existingIds.has(ex.id)) {
            // Handle potential "replace" logic here
            if (ex.replace) {
              // User chose to replace: treat as delete old + create new

              // Delete session history for this exercise
              await tx
                .delete(trainingSessionExercise)
                .where(eq(trainingSessionExercise.templateExerciseId, ex.id));

              // Instead of deleting the exercise row (which would change the ID if we re-inserted),
              // or dealing with complex ID swapping, we can just update it but clear history.
              // But user intent is "New Exercise", so maybe fresh start is cleaner?
              // Actually, if we just update the name, it's the same ID.
              // So "Replace" mainly means "Clear history for this ID".

              // Wait, if we keep the ID, old sessions will still point to it unless we delete them.
              // I just deleted them above. So updating the name now effectively "replaces" it
              // from a data perspective (history gone, new name).

              await tx
                .update(trainingExercise)
                .set({
                  name: ex.name,
                  position: i,
                  updatedAt: new Date(),
                })
                .where(eq(trainingExercise.id, ex.id));
            } else {
              // User chose to rename (keep history)
              await tx
                .update(trainingExercise)
                .set({
                  name: ex.name,
                  position: i,
                  updatedAt: new Date(),
                })
                .where(eq(trainingExercise.id, ex.id));
            }
          } else {
            // Create new exercises
            await tx.insert(trainingExercise).values({
              trainingId: values.id,
              name: ex.name,
              position: i,
            });
          }
        }
      }

      return updatedTraining;
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
