import type {
  FitatuDayItem,
  FitatuDayMacros,
  FitatuDayResponse,
} from "../types";

function toNumber(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function toNullableNumber(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/** Sums kcal and macros across all meal items of a Fitatu day response. */
export function aggregateDayMacros(day: FitatuDayResponse): FitatuDayMacros {
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;
  let itemCount = 0;

  for (const meal of Object.values(day.dietPlan ?? {})) {
    for (const item of meal?.items ?? []) {
      kcal += toNumber(item.energy);
      protein += toNumber(item.protein);
      carbs += toNumber(item.carbohydrate);
      fat += toNumber(item.fat);
      fiber += toNumber(item.fiber);
      itemCount += 1;
    }
  }

  return {
    kcal: Math.round(kcal),
    proteinG: Math.round(protein),
    carbsG: Math.round(carbs),
    fatG: Math.round(fat),
    fiberG: Math.round(fiber),
    itemCount,
  };
}

/**
 * Flattens the day's meal buckets into individual logged products.
 * Items without a name carry no signal for the analysis, so they are dropped.
 */
export function extractDayItems(day: FitatuDayResponse): FitatuDayItem[] {
  const items: FitatuDayItem[] = [];

  for (const [mealKey, meal] of Object.entries(day.dietPlan ?? {})) {
    (meal?.items ?? []).forEach((item, index) => {
      const name = item.name?.trim();
      if (!name) return;

      items.push({
        mealKey,
        mealName: meal?.mealName ?? null,
        name,
        brand: item.brand?.trim() ?? null,
        measureName: item.measureName?.trim() ?? null,
        measureQuantity: toNullableNumber(item.measureQuantity),
        weightG: toNullableNumber(item.weight),
        kcal: toNullableNumber(item.energy),
        protein: toNullableNumber(item.protein),
        carbs: toNullableNumber(item.carbohydrate),
        fat: toNullableNumber(item.fat),
        fiber: toNullableNumber(item.fiber),
        eaten: item.eaten ?? true,
        position: index,
      });
    });
  }

  return items;
}
