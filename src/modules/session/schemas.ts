import { dateRegex } from "@/lib/utils";
import { z } from "zod";

// Session payloads
export const strengthSessionSchema = z.object({
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
              weight: z.coerce.number().min(0).optional().nullable(),
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
  // Optional client-computed summary fields (persisted server-side)
  durationSec: z.coerce.number().int().positive().optional(),
  totalLoadKg: z.coerce.number().min(0).optional(),
  progress: z
    .array(
      z.object({
        position: z.coerce.number().int().nonnegative(),
        name: z.string().min(1),
        prevVolume: z.coerce.number().min(0),
        currentVolume: z.coerce.number().min(0),
        delta: z.number(), // can be negative, zero, or positive
      }),
    )
    .optional(),
  trainingId: z.uuid(),
});

export type StrengthSessionFormValues = z.infer<typeof strengthSessionSchema>;

export const cardioSessionSchema = z.object({
  durationMin: z.coerce.number().int().positive(),
  distanceKm: z.coerce.string().optional().nullable(),
  kcal: z.coerce.number().int().positive().optional().nullable(),
  avgHr: z.coerce.number().int().positive().optional().nullable(),
  cadence: z.coerce.number().int().positive().optional().nullable(),
  avgSpeedKmh: z.coerce.string().optional().nullable(),
  avgPowerW: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  trainingId: z.uuid(),
  date: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
});

export type CardioSessionFormValues = z.infer<typeof cardioSessionSchema>;

export const startTrainingSessionSchema = z.object({
  trainingId: z.uuid(),
});
export type StartTrainingSessionInput = z.infer<
  typeof startTrainingSessionSchema
>;
