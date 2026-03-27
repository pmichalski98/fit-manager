import { and, eq, gte, lte, sql, asc } from "drizzle-orm";
import { db } from "@/server/db";
import { mealEntry, foodProduct } from "@/server/db/schema";

export type CreateMealEntryValues = typeof mealEntry.$inferInsert;
export type UpdateMealEntryValues = Partial<
  Omit<CreateMealEntryValues, "id" | "userId" | "createdAt">
>;

class MealRepository {
  async getEntriesByDate(userId: string, date: string) {
    return db
      .select({
        entry: mealEntry,
        product: foodProduct,
      })
      .from(mealEntry)
      .innerJoin(foodProduct, eq(mealEntry.foodProductId, foodProduct.id))
      .where(and(eq(mealEntry.userId, userId), eq(mealEntry.date, date)))
      .orderBy(asc(mealEntry.mealType), asc(mealEntry.position));
  }

  async getEntriesByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ) {
    return db
      .select({
        entry: mealEntry,
        product: foodProduct,
      })
      .from(mealEntry)
      .innerJoin(foodProduct, eq(mealEntry.foodProductId, foodProduct.id))
      .where(
        and(
          eq(mealEntry.userId, userId),
          gte(mealEntry.date, startDate),
          lte(mealEntry.date, endDate),
        ),
      )
      .orderBy(asc(mealEntry.date), asc(mealEntry.mealType), asc(mealEntry.position));
  }

  async getDailyMacroSummary(userId: string, date: string) {
    const [result] = await db
      .select({
        totalKcal: sql<number>`COALESCE(SUM(${mealEntry.kcal}::numeric), 0)`,
        totalProtein: sql<number>`COALESCE(SUM(${mealEntry.protein}::numeric), 0)`,
        totalCarbs: sql<number>`COALESCE(SUM(${mealEntry.carbs}::numeric), 0)`,
        totalFat: sql<number>`COALESCE(SUM(${mealEntry.fat}::numeric), 0)`,
        totalFiber: sql<number>`COALESCE(SUM(${mealEntry.fiber}::numeric), 0)`,
      })
      .from(mealEntry)
      .where(and(eq(mealEntry.userId, userId), eq(mealEntry.date, date)));

    return result!;
  }

  async getNextPosition(userId: string, date: string, mealType: string) {
    const [result] = await db
      .select({
        maxPosition: sql<number>`COALESCE(MAX(${mealEntry.position}), -1)`,
      })
      .from(mealEntry)
      .where(
        and(
          eq(mealEntry.userId, userId),
          eq(mealEntry.date, date),
          eq(mealEntry.mealType, mealType as "breakfast" | "lunch" | "dinner" | "snack"),
        ),
      );

    return (result?.maxPosition ?? -1) + 1;
  }

  async create(values: CreateMealEntryValues) {
    const [result] = await db.insert(mealEntry).values(values).returning();
    return result!;
  }

  async update(id: string, userId: string, values: UpdateMealEntryValues) {
    const [result] = await db
      .update(mealEntry)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(mealEntry.id, id), eq(mealEntry.userId, userId)))
      .returning();

    return result ?? null;
  }

  async delete(id: string, userId: string) {
    const [result] = await db
      .delete(mealEntry)
      .where(and(eq(mealEntry.id, id), eq(mealEntry.userId, userId)))
      .returning();

    return result ?? null;
  }
}

export const mealRepository = new MealRepository();
