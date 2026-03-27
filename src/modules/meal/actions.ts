"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/user";
import { db } from "@/server/db";
import { dailyLog, user, mealEntry, mealTemplate, mealTemplateItem } from "@/server/db/schema";
import { mealRepository } from "./repositories/meal.repo";
import { foodRepository } from "../food/repositories/food.repo";
import {
  addMealEntrySchema,
  updateMealEntrySchema,
  macroGoalsSchema,
  type AddMealEntryInput,
  type MacroGoalsInput,
  type DaySummary,
} from "./schemas";

function computeMacros(
  product: { kcalPer100g: string; proteinPer100g: string; carbsPer100g: string; fatPer100g: string; fiberPer100g: string | null },
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

export async function addMealEntry(input: AddMealEntryInput) {
  const userId = await requireUserId();

  try {
    const parsed = addMealEntrySchema.parse(input);

    const product = await foodRepository.getById(parsed.foodProductId, userId);
    if (!product) return { ok: false as const, error: "Product not found" };

    const macros = computeMacros(product, parsed.amountG);
    const position = await mealRepository.getNextPosition(
      userId,
      parsed.date,
      parsed.mealType,
    );

    const entry = await mealRepository.create({
      userId,
      date: parsed.date,
      mealType: parsed.mealType,
      foodProductId: parsed.foodProductId,
      amountG: String(parsed.amountG),
      notes: parsed.notes ?? null,
      position,
      ...macros,
    });

    // Sync daily log
    await syncDailyLogFromMeals(userId, parsed.date);

    revalidatePath("/food");
    return { ok: true as const, data: entry };
  } catch (error) {
    console.error("Add meal entry error:", error);
    return { ok: false as const, error: "Failed to add meal entry" };
  }
}

export async function updateMealEntry(id: string, input: unknown) {
  const userId = await requireUserId();

  try {
    const parsed = updateMealEntrySchema.parse(input);

    // If amount changed, recompute macros
    if (parsed.amountG != null) {
      // Get the current entry to find the product
      const entries = await db.query.mealEntry.findFirst({
        where: (me, { and, eq }) => and(eq(me.id, id), eq(me.userId, userId)),
      });
      if (!entries) return { ok: false as const, error: "Entry not found" };

      const product = await foodRepository.getById(entries.foodProductId, userId);
      if (!product) return { ok: false as const, error: "Product not found" };

      const macros = computeMacros(product, parsed.amountG);
      const result = await mealRepository.update(id, userId, {
        amountG: String(parsed.amountG),
        notes: parsed.notes,
        ...macros,
      });

      if (result) await syncDailyLogFromMeals(userId, entries.date);

      revalidatePath("/food");
      return { ok: true as const, data: result };
    }

    const result = await mealRepository.update(id, userId, {
      notes: parsed.notes,
    });
    if (!result) return { ok: false as const, error: "Entry not found" };

    revalidatePath("/food");
    return { ok: true as const, data: result };
  } catch (error) {
    console.error("Update meal entry error:", error);
    return { ok: false as const, error: "Failed to update meal entry" };
  }
}

export async function deleteMealEntry(id: string) {
  const userId = await requireUserId();

  try {
    // Get the entry first to know the date for syncing
    const entry = await db.query.mealEntry.findFirst({
      where: (me, { and, eq }) => and(eq(me.id, id), eq(me.userId, userId)),
    });
    if (!entry) return { ok: false as const, error: "Entry not found" };

    await mealRepository.delete(id, userId);
    await syncDailyLogFromMeals(userId, entry.date);

    revalidatePath("/food");
    return { ok: true as const };
  } catch (error) {
    console.error("Delete meal entry error:", error);
    return { ok: false as const, error: "Failed to delete meal entry" };
  }
}

export async function getMealPlanForDays(startDate: string, days: number) {
  const userId = await requireUserId();

  const dates: string[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]!);
  }

  const endDate = dates[dates.length - 1]!;
  const entries = await mealRepository.getEntriesByDateRange(
    userId,
    startDate,
    endDate,
  );

  // Group by date and meal type
  const plan: Record<string, Record<string, typeof entries>> = {};
  for (const date of dates) {
    plan[date] = { breakfast: [], lunch: [], dinner: [], snack: [] };
  }

  for (const row of entries) {
    const date = row.entry.date;
    const mealType = row.entry.mealType;
    if (plan[date]?.[mealType]) {
      plan[date][mealType].push(row);
    }
  }

  // Get macro summaries for all days in parallel
  const summaryResults = await Promise.all(
    dates.map((date) => mealRepository.getDailyMacroSummary(userId, date)),
  );
  const summaries: Record<string, DaySummary> = {};
  for (let i = 0; i < dates.length; i++) {
    summaries[dates[i]!] = summaryResults[i]!;
  }

  return { dates, plan, summaries };
}

export async function saveMealAsTemplate(
  name: string,
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | null,
  items: { foodProductId: string; amountG: number }[],
) {
  const userId = await requireUserId();

  try {
    const [template] = await db
      .insert(mealTemplate)
      .values({ userId, name, mealType })
      .returning();

    if (!template) throw new Error("Failed to create template");

    if (items.length > 0) {
      await db.insert(mealTemplateItem).values(
        items.map((item, i) => ({
          templateId: template.id,
          foodProductId: item.foodProductId,
          amountG: String(item.amountG),
          position: i,
        })),
      );
    }

    revalidatePath("/food");
    return { ok: true as const, data: template };
  } catch (error) {
    console.error("Save meal template error:", error);
    return { ok: false as const, error: "Failed to save template" };
  }
}

export async function getMealTemplates() {
  const userId = await requireUserId();

  return db.query.mealTemplate.findMany({
    where: (mt, { eq }) => eq(mt.userId, userId),
    with: {
      items: {
        with: {
          product: true,
        },
        orderBy: (mti, { asc }) => [asc(mti.position)],
      },
    },
    orderBy: (mt, { desc }) => [desc(mt.updatedAt)],
  });
}

export async function applyMealTemplate(
  templateId: string,
  date: string,
  mealType: "breakfast" | "lunch" | "dinner" | "snack",
) {
  const userId = await requireUserId();

  try {
    const template = await db.query.mealTemplate.findFirst({
      where: (mt, { and, eq }) =>
        and(eq(mt.id, templateId), eq(mt.userId, userId)),
      with: {
        items: {
          with: { product: true },
          orderBy: (mti, { asc }) => [asc(mti.position)],
        },
      },
    });

    if (!template) return { ok: false as const, error: "Template not found" };

    // Batch insert all items in a transaction to avoid position race conditions
    const startPosition = await mealRepository.getNextPosition(userId, date, mealType);

    if (template.items.length > 0) {
      await db.insert(mealEntry).values(
        template.items.map((item, i) => {
          const amountG = Number(item.amountG);
          const macros = computeMacros(item.product, amountG);
          return {
            userId,
            date,
            mealType,
            foodProductId: item.foodProductId,
            amountG: String(amountG),
            position: startPosition + i,
            ...macros,
          };
        }),
      );
    }

    await syncDailyLogFromMeals(userId, date);

    revalidatePath("/food");
    return { ok: true as const };
  } catch (error) {
    console.error("Apply meal template error:", error);
    return { ok: false as const, error: "Failed to apply template" };
  }
}

export async function deleteMealTemplate(templateId: string) {
  const userId = await requireUserId();

  try {
    const template = await db.query.mealTemplate.findFirst({
      where: (mt, { and, eq }) =>
        and(eq(mt.id, templateId), eq(mt.userId, userId)),
    });
    if (!template) return { ok: false as const, error: "Template not found" };

    await db.delete(mealTemplate).where(eq(mealTemplate.id, templateId));

    revalidatePath("/food");
    return { ok: true as const };
  } catch (error) {
    console.error("Delete meal template error:", error);
    return { ok: false as const, error: "Failed to delete template" };
  }
}

export async function updateMacroGoals(input: MacroGoalsInput) {
  const userId = await requireUserId();

  try {
    const parsed = macroGoalsSchema.parse(input);

    await db
      .update(user)
      .set({
        caloricGoal: parsed.caloricGoal,
        proteinGoal: parsed.proteinGoal,
        carbsGoal: parsed.carbsGoal,
        fatGoal: parsed.fatGoal,
        fiberGoal: parsed.fiberGoal,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    revalidatePath("/food");
    return { ok: true as const };
  } catch (error) {
    console.error("Update macro goals error:", error);
    return { ok: false as const, error: "Failed to update goals" };
  }
}

export async function getMacroGoals() {
  const userId = await requireUserId();

  const [result] = await db
    .select({
      caloricGoal: user.caloricGoal,
      proteinGoal: user.proteinGoal,
      carbsGoal: user.carbsGoal,
      fatGoal: user.fatGoal,
      fiberGoal: user.fiberGoal,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return result ?? null;
}

async function syncDailyLogFromMeals(userId: string, date: string) {
  try {
    const summary = await mealRepository.getDailyMacroSummary(userId, date);
    const kcal = Math.round(Number(summary.totalKcal));

    // Upsert daily log
    const existing = await db.query.dailyLog.findFirst({
      where: (dl, { and, eq }) =>
        and(eq(dl.userId, userId), eq(dl.date, date)),
    });

    if (existing) {
      await db
        .update(dailyLog)
        .set({ kcal, updatedAt: new Date() })
        .where(eq(dailyLog.id, existing.id));
    } else {
      await db.insert(dailyLog).values({
        userId,
        date,
        kcal,
      });
    }
  } catch (error) {
    console.error("Sync daily log error:", error);
  }
}
