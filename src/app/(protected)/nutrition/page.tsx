import { Suspense } from "react";
import { format } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getTodayDateYYYYMMDD } from "@/lib/utils";
import {
  addDays,
  parseDate,
  weekEndOf,
  weekStartOf,
} from "@/modules/nutrition/lib/week";
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
  const weekEnd = weekEndOf(weekStart);
  const isCurrentWeek = weekStart === currentWeekStart;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Nutrition</h1>
          <p className="text-muted-foreground mt-1 text-[11px] font-medium tracking-[0.08em] uppercase">
            Posiłki z Fitatu · tygodniowa analiza AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/nutrition?week=${addDays(weekStart, -7)}`}>
              <ChevronLeftIcon />
              Poprzedni
            </Link>
          </Button>
          <span className="px-1 font-mono text-[11px]">
            {format(parseDate(weekStart), "d MMM")} –{" "}
            {format(parseDate(weekEnd), "d MMM")}
          </span>
          {isCurrentWeek ? (
            <Button variant="outline" size="sm" disabled>
              Następny
              <ChevronRightIcon />
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/nutrition?week=${addDays(weekStart, 7)}`}>
                Następny
                <ChevronRightIcon />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Suspense
        key={weekStart}
        fallback={<Skeleton className="h-[400px] w-full" />}
      >
        <NutritionView weekStart={weekStart} />
      </Suspense>
    </div>
  );
}
