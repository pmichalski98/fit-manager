import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTodayDateYYYYMMDD } from "@/lib/utils";
import { getLatestMeasurements } from "../../actions";
import { MeasurementsForm } from "../components/measurements-form";

export default async function MeasurementsView() {
  const todayStr = getTodayDateYYYYMMDD();
  const { data: latestMeasurements } = await getLatestMeasurements(todayStr);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Measurements</CardTitle>
        <CardDescription>Record your latest body measurements.</CardDescription>
      </CardHeader>
      <CardContent>
        <MeasurementsForm last={latestMeasurements} />
      </CardContent>
    </Card>
  );
}
