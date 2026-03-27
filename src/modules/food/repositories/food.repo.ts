import { and, eq, sql, ilike, desc } from "drizzle-orm";
import { db } from "@/server/db";
import { foodProduct } from "@/server/db/schema";

const SIMILARITY_THRESHOLD = 0.15;

export type CreateFoodProductValues = typeof foodProduct.$inferInsert;
export type UpdateFoodProductValues = Partial<
  Omit<CreateFoodProductValues, "id" | "userId" | "createdAt">
>;

class FoodRepository {
  async searchByName(userId: string, query: string, limit = 20) {
    if (!query.trim()) return [];

    const results = await db
      .select()
      .from(foodProduct)
      .where(
        and(
          eq(foodProduct.userId, userId),
          sql`(
            similarity(${foodProduct.name}, ${query}) > ${SIMILARITY_THRESHOLD}
            OR ${foodProduct.name} ILIKE ${"%" + query + "%"}
            OR ${foodProduct.brand} ILIKE ${"%" + query + "%"}
          )`,
        ),
      )
      .orderBy(sql`similarity(${foodProduct.name}, ${query}) DESC`)
      .limit(limit);

    return results;
  }

  async findBySourceId(userId: string, source: string, sourceId: string) {
    const [result] = await db
      .select()
      .from(foodProduct)
      .where(
        and(
          eq(foodProduct.userId, userId),
          eq(foodProduct.source, source as "openfoodfacts" | "ai_estimate" | "manual"),
          eq(foodProduct.sourceId, sourceId),
        ),
      )
      .limit(1);

    return result ?? null;
  }

  async getAll(userId: string) {
    return db
      .select()
      .from(foodProduct)
      .where(eq(foodProduct.userId, userId))
      .orderBy(desc(foodProduct.updatedAt));
  }

  async getById(id: string, userId: string) {
    const [result] = await db
      .select()
      .from(foodProduct)
      .where(and(eq(foodProduct.id, id), eq(foodProduct.userId, userId)))
      .limit(1);

    return result ?? null;
  }

  async create(values: CreateFoodProductValues) {
    const [result] = await db.insert(foodProduct).values(values).returning();
    return result!;
  }

  async update(id: string, userId: string, values: UpdateFoodProductValues) {
    const [result] = await db
      .update(foodProduct)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(foodProduct.id, id), eq(foodProduct.userId, userId)))
      .returning();

    return result ?? null;
  }

  async delete(id: string, userId: string) {
    const [result] = await db
      .delete(foodProduct)
      .where(and(eq(foodProduct.id, id), eq(foodProduct.userId, userId)))
      .returning();

    return result ?? null;
  }
}

export const foodRepository = new FoodRepository();
