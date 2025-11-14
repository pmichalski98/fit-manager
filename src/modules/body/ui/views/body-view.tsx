import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import DailyLogView from "./daily-log-view";
import MeasurementsView from "./measurements-view";

export default async function BodyView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Body</h1>
        <p className="text-muted-foreground">
          Track your body measurements and progress here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
