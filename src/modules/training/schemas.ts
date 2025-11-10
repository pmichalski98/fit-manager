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

// Session payloads
export const strengthSessionSchema = z.object({
  sessionId: z.string().uuid().optional(), // will be merged in actions
  exercises: z
    .array(
      z.object({
        templateExerciseId: z.string().uuid().optional().nullable(),
        name: z.string().min(1),
        position: z.coerce.number().int().nonnegative(),
        sets: z
          .array(
            z.object({
              setIndex: z.coerce.number().int().nonnegative(),
              reps: z.coerce.number().int().positive(),
              weight: z.coerce.number().positive().optional().nullable(),
              rpe: z.coerce.number().min(0).max(10).optional().nullable(),
              rir: z.coerce.number().min(0).max(10).optional().nullable(),
              restSec: z.coerce
                .number()
                .int()
                .nonnegative()
                .optional()
                .nullable(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export type StrengthSessionFormValues = z.infer<typeof strengthSessionSchema>;

export const cardioSessionSchema = z.object({
  sessionId: z.string().uuid().optional(),
  durationSec: z.coerce.number().int().positive(),
  distanceM: z.coerce.number().int().positive().optional().nullable(),
  kcal: z.coerce.number().int().positive().optional().nullable(),
  avgHr: z.coerce.number().int().positive().optional().nullable(),
  avgSpeedKmh: z.coerce.number().positive().optional().nullable(),
  avgPowerW: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Start training session
export const startTrainingSessionSchema = z.object({
  trainingId: z.string().uuid(),
});
export type StartTrainingSessionValues = z.infer<
  typeof startTrainingSessionSchema
>;
