"use client";

import { format } from "date-fns";
import { MacroSummary } from "./macro-summary";
import { MealSection } from "./meal-section";
import { MEAL_TYPES, parseLocalDate, type MealType, type DaySummary, type MacroGoals } from "../schemas";
import type { MealEntry, FoodProduct } from "@/server/db/schema";

type Props = {
  date: string;
  meals: Record<string, { entry: MealEntry; product: FoodProduct }[]>;
  summary: DaySummary;
  goals: MacroGoals | null;
  enabledMealTypes?: MealType[];
  onAddProductClick: (mealType: MealType) => void;
  onAddTemplateClick: (mealType: MealType) => void;
  onSaveAsTemplate: (mealType: MealType) => void;
  onCopyMeal?: (mealType: MealType) => void;
  isToday?: boolean;
  hideHeader?: boolean;
};

export function DayColumn({
  date,
  meals,
  summary,
  goals,
  enabledMealTypes,
  onAddProductClick,
  onAddTemplateClick,
  onSaveAsTemplate,
  onCopyMeal,
  isToday = false,
  hideHeader = false,
}: Props) {
  const dateObj = parseLocalDate(date);
  const mealTypes = enabledMealTypes ?? MEAL_TYPES;

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col rounded-xl border p-3 ${
        isToday ? "border-primary/30 bg-primary/5" : "bg-card"
      }`}
    >
      {/* Day header — hidden on mobile carousel (shown in selector bar instead) */}
      {!hideHeader && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {format(dateObj, "EEEE")}
              </p>
              <p className="text-lg font-bold">{format(dateObj, "dd/MM")}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{Math.round(Number(summary.totalKcal))}</p>
              <p className="text-muted-foreground text-xs">kcal</p>
            </div>
          </div>
        </div>
      )}

      {/* Macro summary */}
      <div className={hideHeader ? "mb-3" : ""}>
        <MacroSummary
          kcal={Number(summary.totalKcal)}
          protein={Number(summary.totalProtein)}
          carbs={Number(summary.totalCarbs)}
          fat={Number(summary.totalFat)}
          fiber={Number(summary.totalFiber)}
          goals={goals}
          compact={false}
        />
      </div>

      {/* Meal sections */}
      <div className="mt-3 space-y-4">
        {mealTypes.map((mealType) => (
          <MealSection
            key={mealType}
            mealType={mealType}
            entries={meals[mealType] ?? []}
            onAddProductClick={onAddProductClick}
            onAddTemplateClick={onAddTemplateClick}
            onSaveAsTemplate={onSaveAsTemplate}
            onCopyMeal={onCopyMeal}
          />
        ))}
      </div>
    </div>
  );
}
