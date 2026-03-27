import { and, eq, asc } from "drizzle-orm";
import { db } from "@/server/db";
import { shoppingCategory } from "@/server/db/schema";

export type CreateShoppingCategoryValues =
  typeof shoppingCategory.$inferInsert;

const DEFAULT_CATEGORIES = [
  "Bread & Bakery",
  "Fruits",
  "Vegetables",
  "Dairy & Eggs",
  "Meat & Fish",
  "Deli & Cold Cuts",
  "Pasta, Rice & Grains",
  "Canned & Jarred",
  "Frozen",
  "Snacks & Sweets",
  "Beverages",
  "Oils, Sauces & Condiments",
  "Spices & Seasonings",
  "Other",
];

class ShoppingRepository {
  async getCategories(userId: string) {
    return db
      .select()
      .from(shoppingCategory)
      .where(eq(shoppingCategory.userId, userId))
      .orderBy(asc(shoppingCategory.position));
  }

  async getCategoryByName(userId: string, name: string) {
    const [result] = await db
      .select()
      .from(shoppingCategory)
      .where(
        and(
          eq(shoppingCategory.userId, userId),
          eq(shoppingCategory.name, name),
        ),
      )
      .limit(1);

    return result ?? null;
  }

  async create(values: CreateShoppingCategoryValues) {
    const [result] = await db
      .insert(shoppingCategory)
      .values(values)
      .returning();
    return result!;
  }

  async update(id: string, userId: string, name: string) {
    const [result] = await db
      .update(shoppingCategory)
      .set({ name, updatedAt: new Date() })
      .where(
        and(
          eq(shoppingCategory.id, id),
          eq(shoppingCategory.userId, userId),
        ),
      )
      .returning();

    return result ?? null;
  }

  async delete(id: string, userId: string) {
    const [result] = await db
      .delete(shoppingCategory)
      .where(
        and(
          eq(shoppingCategory.id, id),
          eq(shoppingCategory.userId, userId),
        ),
      )
      .returning();

    return result ?? null;
  }

  async reorderCategories(
    userId: string,
    orderedIds: string[],
  ) {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(shoppingCategory)
          .set({ position: i, updatedAt: new Date() })
          .where(
            and(
              eq(shoppingCategory.id, orderedIds[i]!),
              eq(shoppingCategory.userId, userId),
            ),
          );
      }
    });
  }

  async seedDefaultCategories(userId: string) {
    const existing = await this.getCategories(userId);
    if (existing.length > 0) return existing;

    const values = DEFAULT_CATEGORIES.map((name, i) => ({
      userId,
      name,
      position: i,
    }));

    return db.insert(shoppingCategory).values(values).returning();
  }
}

export const shoppingRepository = new ShoppingRepository();
