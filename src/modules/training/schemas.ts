import { z } from "zod";

export const trainingType = z.enum(["strength", "cardio"]);

export const trainingFormSchema = z.object({
  type: trainingType,
  name: z.string().min(1, "Name is required"),
  exercises: z
    .array(z.object({ name: z.string().min(1, "Exercise name is required") }))
    .optional()
    .default([]),
});

export type CreateTrainingInput = z.infer<typeof trainingFormSchema>;
