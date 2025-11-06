import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DailyLogForm } from "@/modules/body/ui/components/daily-log-form";
import { MeasurementsForm } from "@/modules/body/ui/components/measurements-form";
import type {
  DailyLogFormValues,
  MeasurementsFormValues,
} from "@/modules/body/schemas";
import { CaloricGoalDialog } from "@/modules/body/ui/components/caloric-goal-dialog";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  findDailyLogByUserAndDate,
  findLatestDailyLogOnOrBefore,
} from "@/modules/body/repositories/daily-log.repo";
import { findLatestMeasurementsOnOrBefore } from "@/modules/body/repositories/measurements.repo";
import { findUserById } from "@/modules/body/repositories";

function formatDateYYYYMMDD(d: Date) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

export default async function BodyView() {
  const today = new Date();
  const todayStr = formatDateYYYYMMDD(today);

  // session
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  let caloricGoal: number | null = null;
  let todaysLog: Awaited<ReturnType<typeof findDailyLogByUserAndDate>> = null;
  let latestLog: Awaited<ReturnType<typeof findLatestDailyLogOnOrBefore>> =
    null;
  let latestMeas: Awaited<ReturnType<typeof findLatestMeasurementsOnOrBefore>> =
    null;

  if (userId) {
    const user = await findUserById(userId);
    caloricGoal = user?.caloricGoal ?? null;
    todaysLog = await findDailyLogByUserAndDate(userId, todayStr);
    latestLog = await findLatestDailyLogOnOrBefore(userId, todayStr);
    latestMeas = await findLatestMeasurementsOnOrBefore(userId, todayStr);
  }

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

  const measurementsDefault: MeasurementsFormValues = {
    date: todayStr,
    neck: undefined,
    chest: undefined,
    waist: undefined,
    bellybutton: undefined,
    hips: undefined,
    biceps: undefined,
    thigh: undefined,
    notes: "",
  };

  const lastMeasurements: Partial<MeasurementsFormValues> & { date?: string } =
    {
      date: latestMeas?.date,
      neck: latestMeas?.neck ? parseFloat(latestMeas.neck) : undefined,
      chest: latestMeas?.chest ? parseFloat(latestMeas.chest) : undefined,
      waist: latestMeas?.waist ? parseFloat(latestMeas.waist) : undefined,
      bellybutton: latestMeas?.bellybutton
        ? parseFloat(latestMeas.bellybutton)
        : undefined,
      hips: latestMeas?.hips ? parseFloat(latestMeas.hips) : undefined,
      biceps: latestMeas?.biceps ? parseFloat(latestMeas.biceps) : undefined,
      thigh: latestMeas?.thigh ? parseFloat(latestMeas.thigh) : undefined,
    };

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

        <Card>
          <CardHeader>
            <CardTitle>Measurements</CardTitle>
            <CardDescription>
              Record your latest body measurements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MeasurementsForm
              defaultValues={measurementsDefault}
              last={lastMeasurements}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
