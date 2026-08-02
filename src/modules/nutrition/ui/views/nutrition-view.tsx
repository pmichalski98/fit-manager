import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getWeekInsight, getWeekMeals } from "../../actions";
import { addDays, weekEndOf } from "../../lib/week";
import { WeekMeals } from "../components/week-meals";
import { WeeklyInsightCard } from "../components/weekly-insight-card";

export default async function NutritionView({
  weekStart,
  isCurrentWeek,
}: {
  weekStart: string;
  isCurrentWeek: boolean;
}) {
  const [{ data: items }, { data: insight }] = await Promise.all([
    getWeekMeals(weekStart),
    getWeekInsight(weekStart),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/nutrition?week=${addDays(weekStart, -7)}`}>
            <ChevronLeftIcon className="size-4" />
            Poprzedni
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild={!isCurrentWeek}
          disabled={isCurrentWeek}
        >
          {isCurrentWeek ? (
            <span>
              Następny
              <ChevronRightIcon className="size-4" />
            </span>
          ) : (
            <Link href={`/nutrition?week=${addDays(weekStart, 7)}`}>
              Następny
              <ChevronRightIcon className="size-4" />
            </Link>
          )}
        </Button>
      </div>

      <WeeklyInsightCard
        weekStart={weekStart}
        weekEnd={weekEndOf(weekStart)}
        insight={insight}
        hasMeals={items.length > 0}
      />

      <WeekMeals items={items} />
    </div>
  );
}
