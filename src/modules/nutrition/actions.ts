"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/user";
import { weekEndOf } from "./lib/week";
import { nutritionRepository } from "./repositories/nutrition.repo";
import { analyzeWeek } from "./services/weekly-analysis";

export async function getWeekMeals(weekStart: string) {
  const userId = await requireUserId();
  try {
    const data = await nutritionRepository.findItemsInRange(
      userId,
      weekStart,
      weekEndOf(weekStart),
    );
    return { ok: true, data };
  } catch (error) {
    console.error(error);
    return { ok: false, data: [], error: "Internal server error" };
  }
}

export async function getWeekInsight(weekStart: string) {
  const userId = await requireUserId();
  try {
    const data = await nutritionRepository.findInsight(userId, weekStart);
    return { ok: true, data };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  }
}

/** Generates (or regenerates) the analysis for a week on demand. */
export async function generateWeekInsight(weekStart: string) {
  const userId = await requireUserId();
  try {
    const data = await analyzeWeek(userId, weekStart);
    if (!data) {
      return {
        ok: false,
        data: null,
        error: "Brak zsynchronizowanych posiłków w tym tygodniu",
      };
    }
    revalidatePath("/nutrition");
    return { ok: true, data };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Analiza nie powiodła się",
    };
  }
}
