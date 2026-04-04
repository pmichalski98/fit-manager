"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/user";
import { foodRepository } from "./repositories/food.repo";
import {
  foodProductSchema,
  updateFoodProductSchema,
  macrosToDbStrings,
  type FoodProductInput,
} from "./schemas";
import { estimateMacros } from "./services/ai-nutrition";
import { assignCategoryInBackground } from "./services/assign-category";

export async function searchFood(query: string) {
  const userId = await requireUserId();

  try {
    console.log(`[searchFood] Query: "${query}"`);

    const localResults = await foodRepository.searchByName(userId, query);

    console.log(`[searchFood] Results — local: ${localResults.length}`);

    return { ok: true as const, data: { local: localResults } };
  } catch (error) {
    console.error("Search food error:", error);
    return { ok: false as const, error: "Failed to search food" };
  }
}

export async function estimateWithAI(productName: string) {
  const userId = await requireUserId();

  try {
    const macros = await estimateMacros(productName);

    const created = await foodRepository.create({
      userId,
      name: productName,
      source: "ai_estimate",
      sourceId: `ai-${Date.now()}`,
      isVerified: false,
      ...macrosToDbStrings(macros),
      ...(macros.portionG ? { defaultServingG: Math.round(macros.portionG) } : {}),
      ...(macros.portionLabel ? { portionLabel: macros.portionLabel } : {}),
    });

    // AI categorization in background
    void assignCategoryInBackground(created.id, userId, productName, null).catch(console.error);

    revalidatePath("/food");
    return { ok: true as const, data: created };
  } catch (error) {
    console.error("AI estimation error:", error);
    return { ok: false as const, error: "Failed to estimate macros" };
  }
}

export async function addFoodProduct(input: FoodProductInput) {
  const userId = await requireUserId();

  try {
    const parsed = foodProductSchema.parse(input);

    const created = await foodRepository.create({
      ...parsed,
      userId,
      ...macrosToDbStrings(parsed),
      source: parsed.source,
    });

    // AI categorization if no category was provided
    if (!parsed.categoryId) {
      void assignCategoryInBackground(created.id, userId, parsed.name, parsed.brand ?? null).catch(console.error);
    }

    revalidatePath("/food");
    return { ok: true as const, data: created };
  } catch (error) {
    console.error("Add food product error:", error);
    return { ok: false as const, error: "Failed to add product" };
  }
}

export async function updateFoodProduct(id: string, input: unknown) {
  const userId = await requireUserId();

  try {
    const parsed = updateFoodProductSchema.parse(input);

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.brand !== undefined) updateData.brand = parsed.brand;
    if (parsed.categoryId !== undefined) updateData.categoryId = parsed.categoryId;
    if (parsed.imageUrl !== undefined) updateData.imageUrl = parsed.imageUrl;
    if (parsed.isVerified !== undefined) updateData.isVerified = parsed.isVerified;
    if (parsed.defaultServingG !== undefined) updateData.defaultServingG = parsed.defaultServingG;
    if (parsed.kcalPer100g !== undefined) updateData.kcalPer100g = String(parsed.kcalPer100g);
    if (parsed.proteinPer100g !== undefined) updateData.proteinPer100g = String(parsed.proteinPer100g);
    if (parsed.carbsPer100g !== undefined) updateData.carbsPer100g = String(parsed.carbsPer100g);
    if (parsed.fatPer100g !== undefined) updateData.fatPer100g = String(parsed.fatPer100g);
    if (parsed.fiberPer100g !== undefined)
      updateData.fiberPer100g = parsed.fiberPer100g != null ? String(parsed.fiberPer100g) : null;

    const result = await foodRepository.update(id, userId, updateData);
    if (!result) return { ok: false as const, error: "Product not found" };

    revalidatePath("/food");
    return { ok: true as const, data: result };
  } catch (error) {
    console.error("Update food product error:", error);
    return { ok: false as const, error: "Failed to update product" };
  }
}

export async function deleteFoodProduct(id: string) {
  const userId = await requireUserId();

  try {
    const result = await foodRepository.delete(id, userId);
    if (!result) return { ok: false as const, error: "Product not found" };

    revalidatePath("/food");
    return { ok: true as const, data: result };
  } catch (error) {
    console.error("Delete food product error:", error);
    return { ok: false as const, error: "Failed to delete product" };
  }
}

export async function getAllProducts() {
  const userId = await requireUserId();
  return foodRepository.getAll(userId);
}


