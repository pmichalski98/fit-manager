import { dateRegex } from "@/lib/utils";
import { z } from "zod";

export const dailyLogSchema = z.object({
  date: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
  weight: z.coerce.string().min(0).max(1000).optional(),
  kcal: z.coerce.number().int().min(0).max(100000).optional(),
  steps: z.coerce.number().int().min(0).max(200000).optional(),
});
export type DailyLogFormValues = z.infer<typeof dailyLogSchema>;

export const measurementsSchema = z.object({
  date: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
  neck: z.coerce.string().max(1000).optional(),
  chest: z.coerce.string().max(1000).optional(),
  waist: z.coerce.string().max(1000).optional(),
  bellybutton: z.coerce.string().max(1000).optional(),
  hips: z.coerce.string().max(1000).optional(),
  biceps: z.coerce.string().max(1000).optional(),
  thigh: z.coerce.string().max(1000).optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
});
export type MeasurementsFormValues = z.infer<typeof measurementsSchema>;

export const dailyGoalsSchema = z.object({
  caloricGoal: z.coerce.number().int("Invalid caloric goal").min(0).max(100000),
  stepsGoal: z.coerce.number().int("Invalid steps goal").min(0).max(200000),
  weeklyTrainingGoal: z.coerce
    .number()
    .int("Invalid weekly training goal")
    .min(0)
    .max(14),
  goalTrainingEnabled: z.boolean(),
  goalStepsEnabled: z.boolean(),
  goalWeightEnabled: z.boolean(),
  goalKcalEnabled: z.boolean(),
});

export type DailyGoalsFormValues = z.infer<typeof dailyGoalsSchema>;
