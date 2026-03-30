import { z } from "zod";

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
export type MealType = z.infer<typeof mealTypeSchema>;

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const addMealEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: mealTypeSchema,
  foodProductId: z.string().uuid(),
  amountG: z.coerce.number().min(0.1, "Amount must be at least 0.1g"),
  notes: z.string().optional().nullable(),
});

export type AddMealEntryInput = z.infer<typeof addMealEntrySchema>;

export const updateMealEntrySchema = z.object({
  amountG: z.coerce.number().min(0.1).optional(),
  notes: z.string().optional().nullable(),
});

export type UpdateMealEntryInput = z.infer<typeof updateMealEntrySchema>;

export const mealTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mealType: mealTypeSchema.optional().nullable(),
  items: z.array(
    z.object({
      foodProductId: z.string().uuid(),
      amountG: z.coerce.number().min(0.1),
    }),
  ),
});

export type MealTemplateInput = z.infer<typeof mealTemplateSchema>;

export const macroGoalsSchema = z.object({
  caloricGoal: z.coerce.number().int().min(0).optional().nullable(),
  proteinGoal: z.coerce.number().int().min(0).optional().nullable(),
  carbsGoal: z.coerce.number().int().min(0).optional().nullable(),
  fatGoal: z.coerce.number().int().min(0).optional().nullable(),
  fiberGoal: z.coerce.number().int().min(0).optional().nullable(),
});

export type MacroGoalsInput = z.infer<typeof macroGoalsSchema>;

export type DaySummary = {
  totalKcal: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
};

export type MacroGoals = {
  caloricGoal: number | null;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;
  fiberGoal: number | null;
};

import type { MealEntry, FoodProduct } from "@/server/db/schema";

export type PlanData = Record<string, Record<string, { entry: MealEntry; product: FoodProduct }[]>>;
export type SummaryData = Record<string, DaySummary>;

export const EMPTY_SUMMARY: DaySummary = {
  totalKcal: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
  totalFiber: 0,
};

/** Parse a yyyy-MM-dd string as a local date (avoids timezone-shift bugs) */
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}
