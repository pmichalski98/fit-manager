import { Suspense } from "react";
import { format, getISOWeek } from "date-fns";
import {
  QuickLogSection,
  QuickLogSectionSkeleton,
} from "@/modules/dashboard/ui/components/quick-log-section";
import {
  KpiStrip,
  KpiStripSkeleton,
} from "@/modules/dashboard/ui/components/kpi-strip";
import {
  MeasurementsCard,
  MeasurementsCardSkeleton,
} from "@/modules/dashboard/ui/components/measurements-card";
import { resolveWeekContext } from "@/modules/dashboard/utils";
import {
  WeekOverview,
  WeekOverviewSkeleton,
} from "@/modules/dashboard/ui/components/week-overview";
import {
  TrainingConsistency,
  TrainingConsistencySkeleton,
} from "@/modules/dashboard/ui/components/training-consistency";
import { BodyCharts } from "@/modules/dashboard/ui/components/body-charts";
import { ExerciseProgressChart } from "@/modules/dashboard/ui/components/exercise-progress-chart";
import {
  ChartsMenu,
  ChartVisibilityProvider,
  HideableChart,
} from "@/modules/dashboard/ui/components/hideable-chart";
import { VolumeProgressChart } from "@/modules/dashboard/ui/components/volume-progress-chart";
import { ExportDialog } from "@/modules/export/ui/components/export-dialog";
import {
  getAvailableExerciseNames,
  getStrengthTrainings,
} from "@/modules/dashboard/actions";

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
  let strengthTrainings: { id: string; name: string }[] = [];
  try {
    const [exercises, trainings] = await Promise.all([
      getAvailableExerciseNames(),
      getStrengthTrainings(),
    ]);
    if (Array.isArray(exercises)) {
      availableExercises = exercises;
    }
    strengthTrainings = trainings;
  } catch (error) {
    console.error("Failed to fetch dashboard data", error as Error);
  }

  const now = new Date();

  return (
    <ChartVisibilityProvider>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1 font-mono text-[11px] font-medium tracking-[0.08em] uppercase">
              {format(now, "EEE · d MMM yyyy")} · week {getISOWeek(now)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportDialog />
            <ChartsMenu />
          </div>
        </div>

        <Suspense fallback={<QuickLogSectionSkeleton />}>
          <QuickLogSection />
        </Suspense>

        <Suspense fallback={<KpiStripSkeleton />}>
          <KpiStrip
            monday={monday}
            sunday={sunday}
            prevMonday={prevMonday}
            prevSunday={prevSunday}
          />
        </Suspense>

        <HideableChart chartId="training-activity">
          <Suspense fallback={<TrainingConsistencySkeleton />}>
            <TrainingConsistency />
          </Suspense>
        </HideableChart>

        <div className="grid items-start gap-4 md:grid-cols-2">
          <Suspense
            fallback={
              <>
                <div className="bg-muted/20 h-[300px] w-full animate-pulse rounded-xl border" />
                <div className="bg-muted/20 h-[300px] w-full animate-pulse rounded-xl border" />
              </>
            }
          >
            <BodyCharts />
          </Suspense>

          <HideableChart chartId="exercise-progress">
            <ExerciseProgressChart availableExercises={availableExercises} />
          </HideableChart>

          <HideableChart chartId="training-volume">
            <VolumeProgressChart strengthTrainings={strengthTrainings} />
          </HideableChart>
        </div>

        <Suspense fallback={<MeasurementsCardSkeleton />}>
          <MeasurementsCard />
        </Suspense>

        <Suspense fallback={<WeekOverviewSkeleton />}>
          <WeekOverview
            monday={monday}
            sunday={sunday}
            prevMonday={prevMonday}
            prevSunday={prevSunday}
            previousMonday={previousMonday}
            nextMonday={nextMonday}
            dayDates={dayDates}
            dayKeys={dayKeys}
          />
        </Suspense>
      </div>
    </ChartVisibilityProvider>
  );
}
