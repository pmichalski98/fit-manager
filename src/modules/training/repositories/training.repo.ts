import { db } from "@/server/db";
import { training, trainingExercise, type trainingTypeEnum } from "@/server/db/schema";

export type CreateTrainingValues = {
  userId: string;
  name: string;
  type: (typeof trainingTypeEnum.enumValues)[number];
  exercises: Array<{ name: string }>;
};

export async function createTraining(values: CreateTrainingValues) {
  return await db.transaction(async (tx) => {
    const [createdTraining] = await tx
      .insert(training)
      .values({
        userId: values.userId,
        name: values.name,
        type: values.type,
      })
      .returning();

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


