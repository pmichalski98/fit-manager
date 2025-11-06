import { z } from "zod";

export const trainingType = z.enum(["strength", "cardio"]);

const strengthSchema = z.object({
  type: z.literal("strength"),
  name: z.string().min(1, "Name is required"),
  exercises: z
    .array(z.object({ name: z.string().min(1, "Exercise name is required") }))
    .min(1, "Add at least one exercise"),
});

const cardioSchema = z.object({
  type: z.literal("cardio"),
  name: z.string().min(1, "Name is required"),
});

export const trainingFormSchema = z.discriminatedUnion("type", [
  strengthSchema,
  cardioSchema,
]);

export type TrainingFormValues = z.infer<typeof trainingFormSchema>;


