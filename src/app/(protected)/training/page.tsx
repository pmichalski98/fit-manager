import { Skeleton } from "@/components/ui/skeleton";
import { TrainingForm } from "@/modules/training/ui/components/training-form";
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
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <TrainingsView />
      </Suspense>
    </div>
  );
}
