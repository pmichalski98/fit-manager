import { z } from "zod";

export const foodProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  source: z.enum(["openfoodfacts", "ai_estimate", "manual"]),
  sourceId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isVerified: z.boolean().optional(),
  kcalPer100g: z.coerce.number().min(0),
  proteinPer100g: z.coerce.number().min(0),
  carbsPer100g: z.coerce.number().min(0),
  fatPer100g: z.coerce.number().min(0),
  fiberPer100g: z.coerce.number().min(0).optional().nullable(),
  defaultServingG: z.coerce.number().int().min(1).optional(),
});

export type FoodProductInput = z.infer<typeof foodProductSchema>;

export const foodSearchSchema = z.object({
  query: z.string().min(1),
});

export type FoodSearchInput = z.infer<typeof foodSearchSchema>;

export const updateFoodProductSchema = foodProductSchema.partial();
export type UpdateFoodProductInput = z.infer<typeof updateFoodProductSchema>;

export function macrosToDbStrings(macros: {
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number | null;
}) {
  return {
    kcalPer100g: String(macros.kcalPer100g),
    proteinPer100g: String(macros.proteinPer100g),
    carbsPer100g: String(macros.carbsPer100g),
    fatPer100g: String(macros.fatPer100g),
    fiberPer100g: macros.fiberPer100g != null ? String(macros.fiberPer100g) : null,
  };
}
