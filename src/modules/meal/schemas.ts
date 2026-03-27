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
