import type { FitatuMealItem } from "@/server/db/schema";

/** One meal as logged on one day (e.g. Monday's lunch). */
export interface MealInstance {
  date: string;
  slot: string;
  items: FitatuMealItem[];
  kcal: number;
}

/** The same meal cooked/eaten on several days — meal prep shows up here. */
export interface MealGroup {
  /** Stable identity: the normalized set of product names. */
  key: string;
  slot: string;
  instances: MealInstance[];
  /** One line per ingredient, with the typical amount across occurrences. */
  ingredients: GroupedIngredient[];
  avgKcal: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  avgFiber: number;
}

export interface GroupedIngredient {
  name: string;
  brand: string | null;
  avgGrams: number | null;
  minGrams: number | null;
  maxGrams: number | null;
}

function num(value: string | null): number {
  return value === null ? 0 : (Number.parseFloat(value) ?? 0);
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Identity of a meal = the set of products in it, ignoring amounts.
 * Meal prep is rarely gram-identical across days, so quantities must not
 * split one meal into several "different" ones.
 */
function mealKey(items: FitatuMealItem[]): string {
  return [...new Set(items.map((item) => normalizeName(item.name)))]
    .sort()
    .join(" + ");
}

function toInstances(items: FitatuMealItem[]): MealInstance[] {
  const byMeal = new Map<string, FitatuMealItem[]>();

  for (const item of items) {
    const slot = item.mealName ?? item.mealKey;
    const key = `${item.date}::${slot}`;
    const list = byMeal.get(key) ?? [];
    list.push(item);
    byMeal.set(key, list);
  }

  return [...byMeal.entries()].map(([key, mealItems]) => ({
    date: key.split("::")[0]!,
    slot: key.split("::")[1]!,
    items: mealItems,
    kcal: mealItems.reduce((sum, item) => sum + num(item.kcal), 0),
  }));
}

function buildIngredients(instances: MealInstance[]): GroupedIngredient[] {
  const byName = new Map<string, { item: FitatuMealItem; grams: number[] }>();

  for (const instance of instances) {
    for (const item of instance.items) {
      const key = normalizeName(item.name);
      const entry = byName.get(key) ?? { item, grams: [] };
      if (item.weightG !== null) entry.grams.push(num(item.weightG));
      byName.set(key, entry);
    }
  }

  return [...byName.values()].map(({ item, grams }) => ({
    name: item.name,
    brand: item.brand,
    avgGrams: grams.length > 0 ? Math.round(average(grams)) : null,
    minGrams: grams.length > 0 ? Math.round(Math.min(...grams)) : null,
    maxGrams: grams.length > 0 ? Math.round(Math.max(...grams)) : null,
  }));
}

/**
 * Collapses a week of logged items into distinct meals. A meal eaten on five
 * days becomes one group with five occurrences instead of five copies — the
 * pattern the model should reason about, at a fraction of the tokens.
 */
export function groupMeals(items: FitatuMealItem[]): MealGroup[] {
  const groups = new Map<string, MealInstance[]>();

  for (const instance of toInstances(items)) {
    const key = mealKey(instance.items);
    groups.set(key, [...(groups.get(key) ?? []), instance]);
  }

  return [...groups.entries()]
    .map(([key, instances]) => {
      const perInstance = (pick: (item: FitatuMealItem) => number) =>
        average(
          instances.map((instance) =>
            instance.items.reduce((sum, item) => sum + pick(item), 0),
          ),
        );

      return {
        key,
        // The slot a meal usually occupies; meal prep sometimes shifts around.
        slot: instances[0]!.slot,
        instances,
        ingredients: buildIngredients(instances),
        avgKcal: Math.round(perInstance((item) => num(item.kcal))),
        avgProtein: Math.round(perInstance((item) => num(item.protein))),
        avgCarbs: Math.round(perInstance((item) => num(item.carbs))),
        avgFat: Math.round(perInstance((item) => num(item.fat))),
        avgFiber: Math.round(perInstance((item) => num(item.fiber))),
      };
    })
    .sort((a, b) => b.instances.length - a.instances.length);
}
