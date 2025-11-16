import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import * as dateFns from "date-fns";
import { getLatestMeasurements } from "../../actions";
import { MeasurementsForm } from "../components/measurements-form";

export default async function MeasurementsView() {
  const { data: latestMeasurements } = await getLatestMeasurements();

  let lastMeasurementSummary: React.ReactNode = null;

  const hasLastMeasurementDate = latestMeasurements?.date;

  const isStale =
    hasLastMeasurementDate &&
    dateFns.differenceInDays(new Date(), new Date(latestMeasurements?.date)) >
      14;

  if (hasLastMeasurementDate) {
    const lastMeasurementDiff = dateFns.formatDistanceToNow(
      latestMeasurements.date,
      { addSuffix: true },
    );

    const formattedLatestDate = dateFns.format(
      latestMeasurements.date,
      "dd MMM yyyy",
    );

    lastMeasurementSummary = (
      <Alert className="border-destructive/70 bg-destructive/10 text-destructive">
        <AlertTitle>Update your measurements</AlertTitle>
        <AlertDescription>
          <span>
            Last measurements were updated{" "}
            <span className="text-destructive font-bold">
              {lastMeasurementDiff}
            </span>
            , from{" "}
            <span className="text-destructive font-bold">
              {formattedLatestDate}
            </span>
            . Please record new measurements so your progress stays accurate.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Measurements</CardTitle>
        <CardDescription>Record your latest body measurements.</CardDescription>
      </CardHeader>
      {isStale ? (
        <div className="space-y-2 px-6 pb-3">{lastMeasurementSummary}</div>
      ) : null}
      <CardContent>
        <MeasurementsForm last={latestMeasurements} />
      </CardContent>
    </Card>
  );
}
