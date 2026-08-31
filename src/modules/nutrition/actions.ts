"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/user";
import { userRepository } from "@/modules/body/repositories";
import type { NutritionInsight } from "@/server/db/schema";
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

// Analyses currently in flight, keyed by `${userId}:${weekStart}`. The LLM run
// takes minutes and outlives a proxy-timed-out request, so this guards against
// a re-click starting a duplicate paid run. In-memory is enough: the app is a
// single long-lived instance, and losing the lock on restart loses the run too.
const runningAnalyses = new Set<string>();

type GenerateInsightResult =
  | { ok: true; data: NutritionInsight }
  | { ok: false; data: null; running?: boolean; error: string };

/** Generates (or regenerates) the analysis for a week on demand. */
export async function generateWeekInsight(
  weekStart: string,
): Promise<GenerateInsightResult> {
  const userId = await requireUserId();
  const key = `${userId}:${weekStart}`;
  if (runningAnalyses.has(key)) {
    return {
      ok: false,
      data: null,
      running: true,
      error: "Analiza tego tygodnia już trwa",
    };
  }

  runningAnalyses.add(key);
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
  } finally {
    runningAnalyses.delete(key);
  }
}

export async function getAutoWeeklyAnalysis() {
  const userId = await requireUserId();
  return userRepository.findAutoWeeklyAnalysis(userId);
}

/** Enables/disables the weekly-analysis cron; manual runs are unaffected. */
export async function setAutoWeeklyAnalysis(enabled: boolean) {
  const userId = await requireUserId();
  try {
    await userRepository.updateAutoWeeklyAnalysis(userId, enabled === true);
    revalidatePath("/nutrition");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Nie udało się zapisać ustawienia" };
  }
}

/**
 * Lets the client keep tracking an analysis after its own request died (the
 * run keeps going server-side). A changed `updatedAt` means a fresh insight.
 */
export async function getWeekInsightStatus(weekStart: string) {
  const userId = await requireUserId();
  const insight = await nutritionRepository.findInsight(userId, weekStart);
  return {
    running: runningAnalyses.has(`${userId}:${weekStart}`),
    updatedAt: insight?.updatedAt.toISOString() ?? null,
  };
}
