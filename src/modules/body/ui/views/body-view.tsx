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

function formatDateYYYYMMDD(d: Date) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

export default async function BodyView() {
  const today = new Date();
  const todayStr = formatDateYYYYMMDD(today);

  const dailyDefault: DailyLogFormValues = {
    date: todayStr,
    weight: undefined,
    kcal: undefined,
  };

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
          <CardHeader>
            <CardTitle>Daily log</CardTitle>
            <CardDescription>Log today’s weight and calories.</CardDescription>
          </CardHeader>
          <CardContent>
            <DailyLogForm defaultValues={dailyDefault} />
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
            <MeasurementsForm defaultValues={measurementsDefault} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
