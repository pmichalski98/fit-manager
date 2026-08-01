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

export type FitatuSyncStatus = "synced" | "empty" | "error";

export interface FitatuSyncResult {
  date: string;
  status: FitatuSyncStatus;
  macros?: FitatuDayMacros;
  error?: string;
}
