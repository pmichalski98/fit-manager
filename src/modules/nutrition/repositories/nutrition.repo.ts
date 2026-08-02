import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/server/db";
import {
  fitatuMealItem,
  nutritionInsight,
  type NutritionSwap,
} from "@/server/db/schema";

export interface InsightInput {
  userId: string;
  weekStart: string;
  summary: string;
  observations: string[];
  swaps: NutritionSwap[];
  model: string;
}

class NutritionRepository {
  async findItemsInRange(userId: string, startDate: string, endDate: string) {
    return db
      .select()
      .from(fitatuMealItem)
      .where(
        and(
          eq(fitatuMealItem.userId, userId),
          gte(fitatuMealItem.date, startDate),
          lte(fitatuMealItem.date, endDate),
        ),
      )
      .orderBy(
        asc(fitatuMealItem.date),
        asc(fitatuMealItem.mealKey),
        asc(fitatuMealItem.position),
      );
  }

  async findInsight(userId: string, weekStart: string) {
    const [row] = await db
      .select()
      .from(nutritionInsight)
      .where(
        and(
          eq(nutritionInsight.userId, userId),
          eq(nutritionInsight.weekStart, weekStart),
        ),
      );
    return row ?? null;
  }

  async findLatestInsight(userId: string) {
    const [row] = await db
      .select()
      .from(nutritionInsight)
      .where(eq(nutritionInsight.userId, userId))
      .orderBy(desc(nutritionInsight.weekStart))
      .limit(1);
    return row ?? null;
  }

  async upsertInsight(input: InsightInput) {
    const [row] = await db
      .insert(nutritionInsight)
      .values(input)
      .onConflictDoUpdate({
        target: [nutritionInsight.userId, nutritionInsight.weekStart],
        set: {
          summary: input.summary,
          observations: input.observations,
          swaps: input.swaps,
          model: input.model,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row!;
  }
}

export const nutritionRepository = new NutritionRepository();
