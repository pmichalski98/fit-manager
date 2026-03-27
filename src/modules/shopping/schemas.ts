import { z } from "zod";

export const shoppingCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type ShoppingCategoryInput = z.infer<typeof shoppingCategorySchema>;

export const reorderCategoriesSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});

export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;

export const generateShoppingListSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
});

export type GenerateShoppingListInput = z.infer<
  typeof generateShoppingListSchema
>;
