export interface FitatuLoginResponse {
  token?: string;
  access_token?: string;
  refresh_token?: string;
  refreshToken?: string;
  [key: string]: unknown;
}

export interface FitatuPlanItem {
  planDayDietItemId?: number;
  foodType?: string;
  productId?: number;
  recipeId?: number;
  name?: string | null;
  brand?: string | null;
  measureName?: string | null;
  measureQuantity?: number | string | null;
  weight?: number | string | null;
  eaten?: boolean;
  energy?: number | string | null;
  protein?: number | string | null;
  fat?: number | string | null;
  carbohydrate?: number | string | null;
  fiber?: number | string | null;
  sugars?: number | string | null;
  salt?: number | string | null;
}

export interface FitatuMealBucket {
  mealName?: string;
  mealTime?: string;
  items?: FitatuPlanItem[];
}

export interface FitatuDayResponse {
  dietPlan?: Record<string, FitatuMealBucket>;
}

/** Aggregated totals for a single day, rounded to integers. */
export interface FitatuDayMacros {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  itemCount: number;
}

/** A single logged product, flattened out of the day's meal buckets. */
export interface FitatuDayItem {
  mealKey: string;
  mealName: string | null;
  name: string;
  brand: string | null;
  measureName: string | null;
  measureQuantity: number | null;
  weightG: number | null;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  eaten: boolean;
  position: number;
}

export type FitatuSyncStatus = "synced" | "empty" | "error";

export interface FitatuSyncResult {
  date: string;
  status: FitatuSyncStatus;
  macros?: FitatuDayMacros;
  error?: string;
}
