import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDateYYYYMMDD } from "@/lib/utils";
import { resolveWeekContext } from "@/modules/dashboard/utils";
import { DashboardTable } from "@/modules/dashboard/ui/components/dashboard-table";
import { DashboardTableSkeleton } from "@/modules/dashboard/ui/components/dashboard-skeleton";
import { TrainingConsistency } from "@/modules/dashboard/ui/components/training-consistency";
import { BodyCharts } from "@/modules/dashboard/ui/components/body-charts";
import { ExerciseProgressChart } from "@/modules/dashboard/ui/components/exercise-progress-chart";
import { getAvailableExerciseNames } from "@/modules/dashboard/actions";

type PageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function DashboardPage(props: PageProps) {
  const { week: weekParam } = await props.searchParams;
  const {
    monday,
    sunday,
    nextMonday,
    previousMonday,
    prevMonday,
    prevSunday,
    dayDates,
    dayKeys,
  } = resolveWeekContext(weekParam);

  let availableExercises: string[] = [];
  try {
    const exercises = await getAvailableExerciseNames();
    if (Array.isArray(exercises)) {
      availableExercises = exercises;
    }
  } catch (error) {
    console.error("Failed to fetch exercises", error as Error);
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <Suspense
        fallback={
          <div className="bg-muted/20 h-[180px] w-full animate-pulse rounded-xl border" />
        }
      >
        <TrainingConsistency />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-muted/20 h-[300px] w-full animate-pulse rounded-xl border" />
            <div className="bg-muted/20 h-[300px] w-full animate-pulse rounded-xl border" />
          </div>
        }
      >
        <BodyCharts />
      </Suspense>

      <Suspense
        fallback={
          <div className="bg-muted/20 h-[300px] w-full animate-pulse rounded-xl border" />
        }
      >
        <ExerciseProgressChart availableExercises={availableExercises} />
      </Suspense>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Weekly overview (Mon–Sun)</p>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`?week=${formatDateYYYYMMDD(previousMonday)}`}>
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`?week=${formatDateYYYYMMDD(nextMonday)}`}>Next</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="?">This week</Link>
          </Button>
        </div>
      </div>

      <Suspense
        fallback={
          <DashboardTableSkeleton dayDates={dayDates} dayKeys={dayKeys} />
        }
      >
        <DashboardTable
          monday={monday}
          sunday={sunday}
          prevMonday={prevMonday}
          prevSunday={prevSunday}
          dayDates={dayDates}
          dayKeys={dayKeys}
        />
      </Suspense>
    </div>
  );
}
