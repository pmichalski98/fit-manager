import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { getTodayDateYYYYMMDD } from "@/lib/utils";
import { weekStartOf } from "@/modules/nutrition/lib/week";
import NutritionView from "@/modules/nutrition/ui/views/nutrition-view";

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const currentWeekStart = weekStartOf(getTodayDateYYYYMMDD());
  const weekStart =
    week && /^\d{4}-\d{2}-\d{2}$/.test(week)
      ? weekStartOf(week)
      : currentWeekStart;

  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight md:text-2xl">
          Nutrition
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Posiłki z Fitatu i tygodniowa analiza AI.
        </p>
      </div>

      <Suspense
        key={weekStart}
        fallback={<Skeleton className="h-[400px] w-full max-w-4xl" />}
      >
        <NutritionView
          weekStart={weekStart}
          isCurrentWeek={weekStart === currentWeekStart}
        />
      </Suspense>
    </div>
  );
}
