import { Skeleton } from "@/components/ui/skeleton";
import DailyLogView from "@/modules/body/ui/views/daily-log-view";
import MeasurementsView from "@/modules/body/ui/views/measurements-view";
import { Suspense } from "react";

export default async function BodyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Body</h1>
        <p className="text-muted-foreground">
          Track your body measurements and progress here.
        </p>
      </div>

      <div className="grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
          <DailyLogView />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
          <MeasurementsView />
        </Suspense>
      </div>
    </div>
  );
}
