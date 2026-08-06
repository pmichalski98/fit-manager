import { Suspense } from "react";
import { BodyCharts } from "@/modules/progress/ui/components/body-charts";
import { ExerciseProgressChart } from "@/modules/progress/ui/components/exercise-progress-chart";
import {
  ChartsMenu,
  ChartVisibilityProvider,
  HideableChart,
} from "@/modules/progress/ui/components/hideable-chart";
import {
  TrainingConsistency,
  TrainingConsistencySkeleton,
} from "@/modules/progress/ui/components/training-consistency";
import { VolumeProgressChart } from "@/modules/progress/ui/components/volume-progress-chart";
import { ExportDialog } from "@/modules/export/ui/components/export-dialog";
import {
  getAvailableExerciseNames,
  getStrengthTrainings,
} from "@/modules/progress/actions";

export default async function ProgressPage() {
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
    console.error("Failed to fetch progress data", error as Error);
  }

  return (
    <ChartVisibilityProvider>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">Progress</h1>
            <p className="text-muted-foreground mt-1 font-mono text-[11px] font-medium tracking-[0.08em] uppercase">
              Long-term trends · body & training charts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportDialog />
            <ChartsMenu />
          </div>
        </div>

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
      </div>
    </ChartVisibilityProvider>
  );
}
