import { StravaConnectCard } from "@/modules/strava/ui/strava-connect-card";
import { CreateTrainingDialog } from "@/modules/training/ui/components/create-training-dialog";
import { TrainingsSkeleton } from "@/modules/training/ui/components/trainings-skeleton";
import { TrainingsView } from "@/modules/training/ui/views/trainings-view";
import { Suspense } from "react";

export default async function TrainingPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-2xl">
            Training
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Build training templates and start sessions from them.
          </p>
        </div>
        <CreateTrainingDialog />
      </div>

      <Suspense fallback={<TrainingsSkeleton />}>
        <TrainingsView />
      </Suspense>

      <StravaConnectCard />
    </div>
  );
}
