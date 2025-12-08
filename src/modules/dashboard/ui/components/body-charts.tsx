import { getDailyLogHistory } from "../../actions";
import { KcalChartGraph } from "./kcal-chart-graph";
import { WeightChartGraph } from "./weight-chart-graph";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";

export async function BodyCharts() {
  const data = await getDailyLogHistory();

  if (!data || data.length === 0) {
    return null;
  }

  // Filter out entries without kcal
  const kcalData = data
    .filter(
      (log) => log.kcal !== null && log.kcal !== undefined && log.kcal > 0,
    )
    .map((log) => ({
      date: log.date,
      kcal: Number(log.kcal),
    }));

  // Filter out entries without weight
  const weightData = data
    .filter((log) => log.weight !== null && log.weight !== undefined)
    .map((log) => ({
      date: log.date,
      weight: Number(log.weight),
    }));

  return (
    <div className="grid gap-10 md:grid-cols-2">
      {weightData.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Weight History</CardTitle>
          </CardHeader>
          <CardContent>
            <WeightChartGraph data={weightData} />
          </CardContent>
        </Card>
      )}

      {kcalData.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Caloric Intake History</CardTitle>
          </CardHeader>
          <CardContent>
            <KcalChartGraph data={kcalData} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
