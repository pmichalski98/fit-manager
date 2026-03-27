"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/user";
import { shoppingRepository } from "./repositories/shopping.repo";
import { mealRepository } from "../meal/repositories/meal.repo";
import {
  shoppingCategorySchema,
  reorderCategoriesSchema,
  generateShoppingListSchema,
  type GenerateShoppingListInput,
} from "./schemas";

export type ShoppingListItem = {
  productId: string;
  productName: string;
  brand: string | null;
  totalAmountG: number;
  categoryId: string | null;
  categoryName: string;
};

export type ShoppingListGroup = {
  categoryId: string | null;
  categoryName: string;
  position: number;
  items: ShoppingListItem[];
};

export async function generateShoppingList(input: GenerateShoppingListInput) {
  const userId = await requireUserId();

  try {
    const parsed = generateShoppingListSchema.parse(input);
    const dates = parsed.dates.sort();
    const startDate = dates[0]!;
    const endDate = dates[dates.length - 1]!;

    // Get all entries for the date range
    const entries = await mealRepository.getEntriesByDateRange(
      userId,
      startDate,
      endDate,
    );

    // Filter to only selected dates
    const dateSet = new Set(dates);
    const filteredEntries = entries.filter((e) => dateSet.has(e.entry.date));

    // Aggregate by product
    const productMap = new Map<
      string,
      { productName: string; brand: string | null; totalAmountG: number; categoryId: string | null }
    >();

    for (const { entry, product } of filteredEntries) {
      const existing = productMap.get(product.id);
      if (existing) {
        existing.totalAmountG += Number(entry.amountG);
      } else {
        productMap.set(product.id, {
          productName: product.name,
          brand: product.brand,
          totalAmountG: Number(entry.amountG),
          categoryId: product.categoryId,
        });
      }
    }

    // Get categories for grouping
    const categories = await shoppingRepository.getCategories(userId);
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Group by category
    const groupMap = new Map<string, ShoppingListGroup>();

    for (const [productId, data] of productMap) {
      const category = data.categoryId ? categoryMap.get(data.categoryId) : null;
      const categoryKey = category?.id ?? "other";
      const categoryName = category?.name ?? "Other";
      const UNCATEGORIZED_POSITION = 999;
      const position = category?.position ?? UNCATEGORIZED_POSITION;

      if (!groupMap.has(categoryKey)) {
        groupMap.set(categoryKey, {
          categoryId: category?.id ?? null,
          categoryName,
          position,
          items: [],
        });
      }

      groupMap.get(categoryKey)!.items.push({
        productId,
        productName: data.productName,
        brand: data.brand,
        totalAmountG: Math.round(data.totalAmountG),
        categoryId: data.categoryId,
        categoryName,
      });
    }

    // Sort groups by position, items alphabetically
    const groups = Array.from(groupMap.values())
      .sort((a, b) => a.position - b.position)
      .map((g) => ({
        ...g,
        items: g.items.sort((a, b) => a.productName.localeCompare(b.productName)),
      }));

    return { ok: true as const, data: groups };
  } catch (error) {
    console.error("Generate shopping list error:", error);
    return { ok: false as const, error: "Failed to generate shopping list" };
  }
}

export async function getShoppingCategories() {
  const userId = await requireUserId();
  return shoppingRepository.getCategories(userId);
}

export async function ensureShoppingCategories() {
  const userId = await requireUserId();
  return shoppingRepository.seedDefaultCategories(userId);
}

export async function createShoppingCategory(name: string) {
  const userId = await requireUserId();

  try {
    const parsed = shoppingCategorySchema.parse({ name });
    const categories = await shoppingRepository.getCategories(userId);
    const nextPosition = categories.length;

    const result = await shoppingRepository.create({
      userId,
      name: parsed.name,
      position: nextPosition,
    });

    revalidatePath("/food");
    return { ok: true as const, data: result };
  } catch (error) {
    console.error("Create shopping category error:", error);
    return { ok: false as const, error: "Failed to create category" };
  }
}

export async function updateShoppingCategory(id: string, name: string) {
  const userId = await requireUserId();

  try {
    const parsed = shoppingCategorySchema.parse({ name });
    const result = await shoppingRepository.update(id, userId, parsed.name);
    if (!result) return { ok: false as const, error: "Category not found" };

    revalidatePath("/food");
    return { ok: true as const, data: result };
  } catch (error) {
    console.error("Update shopping category error:", error);
    return { ok: false as const, error: "Failed to update category" };
  }
}

export async function deleteShoppingCategory(id: string) {
  const userId = await requireUserId();

  try {
    const result = await shoppingRepository.delete(id, userId);
    if (!result) return { ok: false as const, error: "Category not found" };

    revalidatePath("/food");
    return { ok: true as const, data: result };
  } catch (error) {
    console.error("Delete shopping category error:", error);
    return { ok: false as const, error: "Failed to delete category" };
  }
}

export async function reorderShoppingCategories(orderedIds: string[]) {
  const userId = await requireUserId();

  try {
    const parsed = reorderCategoriesSchema.parse({ orderedIds });
    await shoppingRepository.reorderCategories(userId, parsed.orderedIds);

    revalidatePath("/food");
    return { ok: true as const };
  } catch (error) {
    console.error("Reorder categories error:", error);
    return { ok: false as const, error: "Failed to reorder categories" };
  }
}
