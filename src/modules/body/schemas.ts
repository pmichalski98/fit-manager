import { dateRegex } from "@/lib/utils";
import { z } from "zod";

export const dailyLogSchema = z.object({
  date: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
  weight: z.coerce.string().min(0).max(1000).optional(),
  kcal: z.coerce.number().int().min(0).max(100000).optional(),
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

export const goalSchema = z.object({
  caloricGoal: z.coerce.number().int("Invalid caloric goal"),
});

export type GoalFormValues = z.infer<typeof goalSchema>;
