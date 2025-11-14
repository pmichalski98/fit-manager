import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

// Accepts numbers/strings, normalizes comma→dot, rounds to 1 decimal, optional
const decimal1Optional = z
  .preprocess((v) => {
    if (v === "" || v == null) return undefined;
    const normalized = typeof v === "string" ? v.replace(/,/g, ".") : v;
    return typeof normalized === "string" ? Number(normalized) : normalized;
  }, z.number().finite().nonnegative())
  .transform((n) => Math.round(n * 10) / 10)
  .optional();

// Integer optional (for kcal). Empty string/null/undefined → undefined
const intOptional = z
  .preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().nonnegative(),
  )
  .optional();

export const dailyLogSchema = z.object({
  date: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
  weight: decimal1Optional,
  kcal: intOptional,
});
export type DailyLogFormValues = z.infer<typeof dailyLogSchema>;

export const measurementsSchema = z.object({
  date: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
  neck: decimal1Optional,
  chest: decimal1Optional,
  waist: decimal1Optional,
  bellybutton: decimal1Optional,
  hips: decimal1Optional,
  biceps: decimal1Optional,
  thigh: decimal1Optional,
  notes: z.string().max(1000).optional().or(z.literal("")),
});
export type MeasurementsFormValues = z.infer<typeof measurementsSchema>;

export const goalSchema = z.object({
  caloricGoal: z.number().int().nonnegative(),
});

export type GoalFormValues = z.infer<typeof goalSchema>;

type MaybeNumber = number | undefined;

export type DailyLogInput = {
  date: string; // YYYY-MM-DD
  weight?: MaybeNumber;
  kcal?: MaybeNumber;
};

export type MeasurementsInput = {
  date: string; // YYYY-MM-DD
  neck?: MaybeNumber;
  chest?: MaybeNumber;
  waist?: MaybeNumber;
  bellybutton?: MaybeNumber;
  hips?: MaybeNumber;
  biceps?: MaybeNumber;
  thigh?: MaybeNumber;
  notes?: string | null;
};
