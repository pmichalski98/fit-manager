import type { FitatuDayMacros, FitatuDayResponse } from "../types";

function toNumber(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
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
