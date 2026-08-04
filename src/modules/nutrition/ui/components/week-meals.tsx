import { cn } from "@/lib/utils";
import type { FitatuMealItem } from "@/server/db/schema";
import { weekdayName } from "../../lib/week";

const FIBER_TARGET_G = 30;

function round(value: string | null): number | null {
  return value === null ? null : Math.round(Number.parseFloat(value));
}

function sumMacro(
  items: FitatuMealItem[],
  pick: (item: FitatuMealItem) => string | null,
): number {
  return Math.round(
    items.reduce((sum, item) => {
      const value = pick(item);
      return sum + (value === null ? 0 : Number.parseFloat(value));
    }, 0),
  );
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const list = map.get(key(item)) ?? [];
    list.push(item);
    map.set(key(item), list);
  }
  return map;
}

/** "2026-07-27" → "27.07" */
function formatDayDate(date: string): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}`;
}

export function WeekMeals({
  items,
  caloricGoal,
}: {
  items: FitatuMealItem[];
  caloricGoal: number | null;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-card rounded-[10px] border p-5">
        <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase">
          Posiłki
        </h3>
        <p className="text-muted-foreground mt-1.5 text-xs">
          Brak zsynchronizowanych posiłków w tym tygodniu.
        </p>
      </div>
    );
  }

  const days = [...groupBy(items, (item) => item.date).entries()].sort(
    ([a], [b]) => a.localeCompare(b),
  );

  return (
    <div className="space-y-3">
      {days.map(([date, dayItems]) => {
        const dayKcal = dayItems.reduce(
          (sum, item) => sum + (round(item.kcal) ?? 0),
          0,
        );
        const protein = sumMacro(dayItems, (i) => i.protein);
        const carbs = sumMacro(dayItems, (i) => i.carbs);
        const fat = sumMacro(dayItems, (i) => i.fat);
        const fiber = sumMacro(dayItems, (i) => i.fiber);
        const meals = groupBy(
          dayItems,
          (item) => item.mealName ?? item.mealKey,
        );

        return (
          <div
            key={date}
            className="bg-card overflow-hidden rounded-[10px] border"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b px-5 py-3.5">
              <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase">
                {weekdayName(date)}{" "}
                <span className="text-faint font-mono tracking-normal">
                  {formatDayDate(date)}
                </span>
              </h3>
              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px]">
                <span
                  className={cn(
                    caloricGoal == null
                      ? "text-foreground"
                      : dayKcal <= caloricGoal
                        ? "text-primary"
                        : "text-cardio",
                  )}
                >
                  {dayKcal} kcal
                </span>
                <span>
                  B <span className="text-foreground">{protein}g</span>
                </span>
                <span>
                  W <span className="text-foreground">{carbs}g</span>
                </span>
                <span>
                  T <span className="text-foreground">{fat}g</span>
                </span>
                <span>
                  BŁ{" "}
                  <span
                    className={cn(
                      fiber >= FIBER_TARGET_G
                        ? "text-foreground"
                        : "text-cardio",
                    )}
                  >
                    {fiber}g
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
              {[...meals.entries()].map(([meal, mealItems]) => (
                <div
                  key={meal}
                  className="flex flex-col gap-1.5 border-r px-5 py-3 last:border-r-0"
                >
                  <h4 className="text-primary text-[10px] font-semibold tracking-[0.1em] uppercase">
                    {meal}
                  </h4>
                  <div className="flex flex-col gap-1">
                    {mealItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-baseline justify-between gap-2.5 text-xs"
                      >
                        <span className="text-secondary-foreground min-w-0">
                          {item.name}
                          {item.brand ? ` · ${item.brand}` : ""}
                          {item.weightG ? ` ${round(item.weightG)} g` : ""}
                        </span>
                        <span className="text-faint shrink-0 font-mono text-[11px]">
                          {round(item.kcal) ?? "?"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
