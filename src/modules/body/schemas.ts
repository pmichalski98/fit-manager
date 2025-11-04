import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

const optionalNumber = z
  .union([z.number(), z.string()])
  .transform((v) =>
    v === "" ? undefined : typeof v === "string" ? Number(v) : v,
  )
  .pipe(z.number().finite().nonnegative().optional());

export const dailyLogSchema = z.object({
  date: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
  weight: optionalNumber,
  kcal: optionalNumber,
});
export type DailyLogFormValues = z.infer<typeof dailyLogSchema>;

export const measurementsSchema = z.object({
  date: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
  neck: optionalNumber,
  chest: optionalNumber,
  waist: optionalNumber,
  hips: optionalNumber,
  biceps: optionalNumber,
  thigh: optionalNumber,
  notes: z.string().max(1000).optional().or(z.literal("")),
});
export type MeasurementsFormValues = z.infer<typeof measurementsSchema>;
