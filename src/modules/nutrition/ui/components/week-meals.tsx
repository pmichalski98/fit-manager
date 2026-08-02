import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FitatuMealItem } from "@/server/db/schema";
import { weekdayName } from "../../lib/week";

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

function DayMacros({ items }: { items: FitatuMealItem[] }) {
  const macros = [
    { label: "Białko", value: sumMacro(items, (i) => i.protein) },
    { label: "Węgle", value: sumMacro(items, (i) => i.carbs) },
    { label: "Tłuszcz", value: sumMacro(items, (i) => i.fat) },
    { label: "Błonnik", value: sumMacro(items, (i) => i.fiber) },
  ];

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 border-t pt-4">
      {macros.map((macro) => (
        <div key={macro.label} className="flex items-baseline gap-1.5">
          <span className="text-muted-foreground text-xs">{macro.label}</span>
          <span className="text-sm font-medium tabular-nums">
            {macro.value} g
          </span>
        </div>
      ))}
    </div>
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

export function WeekMeals({ items }: { items: FitatuMealItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posiłki</CardTitle>
          <CardDescription>
            Brak zsynchronizowanych posiłków w tym tygodniu.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const days = [...groupBy(items, (item) => item.date).entries()].sort(
    ([a], [b]) => a.localeCompare(b),
  );

  return (
    <div className="space-y-4">
      {days.map(([date, dayItems]) => {
        const dayKcal = dayItems.reduce(
          (sum, item) => sum + (round(item.kcal) ?? 0),
          0,
        );
        const meals = groupBy(
          dayItems,
          (item) => item.mealName ?? item.mealKey,
        );

        return (
          <Card key={date}>
            <CardHeader>
              <CardTitle className="text-base">
                {weekdayName(date)}{" "}
                <span className="text-muted-foreground font-normal">
                  {date}
                </span>
              </CardTitle>
              <CardDescription>{dayKcal} kcal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...meals.entries()].map(([meal, mealItems]) => (
                <div key={meal} className="space-y-1">
                  <h3 className="text-sm font-medium capitalize">{meal}</h3>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    {mealItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap justify-between gap-x-4"
                      >
                        <span>
                          {item.name}
                          {item.brand ? ` · ${item.brand}` : ""}
                          {item.weightG ? ` — ${round(item.weightG)} g` : ""}
                        </span>
                        <span className="tabular-nums">
                          {round(item.kcal) ?? "?"} kcal
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <DayMacros items={dayItems} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
