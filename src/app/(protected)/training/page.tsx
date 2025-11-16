import { TrainingForm } from "@/modules/training/ui/components/training-form";
import { TrainingsSkeleton } from "@/modules/training/ui/components/trainings-skeleton";
import { TrainingsView } from "@/modules/training/ui/views/trainings-view";
import { Suspense } from "react";

export default async function TrainingPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Training</h1>
          <p className="text-muted-foreground">
            Create a new training template.
          </p>
        </div>
        <TrainingForm />
      </div>
      <h2 className="text-2xl font-semibold">Your trainings</h2>

      <Suspense fallback={<TrainingsSkeleton />}>
        <TrainingsView />
      </Suspense>
    </div>
  );
}
