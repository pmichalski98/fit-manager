import { db } from "@/server/db";
import { dailyLog } from "@/server/db/schema";
import { sql } from "drizzle-orm";
import { mealRepository } from "./repositories/meal.repo";

export function computeMacros(
  product: {
    kcalPer100g: string;
    proteinPer100g: string;
    carbsPer100g: string;
    fatPer100g: string;
    fiberPer100g: string | null;
  },
  amountG: number,
) {
  const factor = amountG / 100;
  return {
    kcal: String(Math.round(Number(product.kcalPer100g) * factor * 10) / 10),
    protein: String(Math.round(Number(product.proteinPer100g) * factor * 100) / 100),
    carbs: String(Math.round(Number(product.carbsPer100g) * factor * 100) / 100),
    fat: String(Math.round(Number(product.fatPer100g) * factor * 100) / 100),
    fiber: product.fiberPer100g
      ? String(Math.round(Number(product.fiberPer100g) * factor * 100) / 100)
      : null,
  };
}

export async function syncDailyLogFromMeals(userId: string, date: string) {
  try {
    const summary = await mealRepository.getDailyMacroSummary(userId, date);
    const kcal = Math.round(Number(summary.totalKcal));

    await db
      .insert(dailyLog)
      .values({ userId, date, kcal })
      .onConflictDoUpdate({
        target: [dailyLog.userId, dailyLog.date],
        set: { kcal, updatedAt: sql`now()` },
      });
  } catch (error) {
    console.error("[meal] Sync daily log error:", error);
  }
}
