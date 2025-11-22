import { z } from "zod";

export const trainingType = z.enum(["strength", "cardio"]);

export const trainingFormSchema = z.object({
  type: trainingType,
  name: z.string().min(1, "Name is required"),
  exercises: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Exercise name is required"),
        // Optional flag to indicate if the user chose to replace the exercise history
        // when renaming. If true, we delete old history and create new.
        // If false/undefined, we keep history (rename).
        replace: z.boolean().optional(),
      }),
    )
    .optional()
    .default([]),
});

export type CreateTrainingInput = z.infer<typeof trainingFormSchema>;
