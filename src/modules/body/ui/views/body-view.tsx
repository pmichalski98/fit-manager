import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCaloricGoal,
  getLatestDailyLog,
  getLatestMeasurements,
  getUserDailyLog,
} from "@/modules/body/actions";
import { MeasurementsForm } from "../components/measurements-form";
import { getTodayDateYYYYMMDD } from "@/lib/utils";
import type { DailyLogFormValues } from "../../schemas";
import { CaloricGoalDialog } from "../components/caloric-goal-dialog";
import { DailyLogForm } from "../components/daily-log-form";
import MeasurementsView from "./measurements-view";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function BodyView() {
  const todayStr = getTodayDateYYYYMMDD();

  const { data: caloricGoal } = await getCaloricGoal();

  const [{ data: todaysLog }, { data: latestLog }] = await Promise.all([
    getUserDailyLog(todayStr),
    getLatestDailyLog(todayStr),
  ]);

  const dailyDefault: DailyLogFormValues = {
    date: todayStr,
    weight:
      todaysLog?.weight != null
        ? parseFloat(todaysLog.weight)
        : latestLog?.weight != null
          ? parseFloat(latestLog.weight)
          : undefined,
    kcal: todaysLog?.kcal ?? caloricGoal ?? undefined,
  };

  const dailyHints: { kcal?: string } = {};
  if (todaysLog?.kcal != null) {
    dailyHints.kcal = `Using today’s saved calories`;
  } else if (caloricGoal != null) {
    dailyHints.kcal = `Using your caloric goal`;
  }
  const alreadyFilledToday = Boolean(
    todaysLog?.weight != null || todaysLog?.kcal != null,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Body</h1>
        <p className="text-muted-foreground">
          Track your body measurements and progress here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Daily log</CardTitle>
              <CardDescription>
                Log today’s weight and calories.
              </CardDescription>
            </div>
            <CaloricGoalDialog defaultGoal={caloricGoal} />
          </CardHeader>
          <CardContent>
            <DailyLogForm
              defaultValues={dailyDefault}
              hints={dailyHints}
              alreadyFilledToday={alreadyFilledToday}
            />
          </CardContent>
        </Card>

        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
          <MeasurementsView />
        </Suspense>
      </div>
    </div>
  );
}
