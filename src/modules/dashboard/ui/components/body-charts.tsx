import { getDailyLogHistory } from "../../actions";
import { HideableChart } from "./hideable-chart";
import { KcalChartGraph } from "./kcal-chart-graph";
import { MacroChartGraph } from "./macro-chart-graph";
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

  // Days with at least one macro logged (synced from Fitatu)
  const macroData = data
    .filter(
      (log) =>
        (log.proteinG ?? 0) > 0 || (log.carbsG ?? 0) > 0 || (log.fatG ?? 0) > 0,
    )
    .map((log) => ({
      date: log.date,
      protein: log.proteinG ?? null,
      carbs: log.carbsG ?? null,
      fat: log.fatG ?? null,
    }));

  // Rendered inside the dashboard's shared chart grid — no wrapper here,
  // so hiding a chart lets the remaining cards flow next to each other
  return (
    <>
      {weightData.length > 0 && (
        <HideableChart chartId="weight-history">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Weight History</CardTitle>
            </CardHeader>
            <CardContent>
              <WeightChartGraph data={weightData} />
            </CardContent>
          </Card>
        </HideableChart>
      )}

      {kcalData.length > 0 && (
        <HideableChart chartId="kcal-history">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Caloric Intake History</CardTitle>
            </CardHeader>
            <CardContent>
              <KcalChartGraph data={kcalData} />
            </CardContent>
          </Card>
        </HideableChart>
      )}

      {macroData.length > 0 && (
        <HideableChart chartId="macro-history">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Macros History</CardTitle>
            </CardHeader>
            <CardContent>
              <MacroChartGraph data={macroData} />
            </CardContent>
          </Card>
        </HideableChart>
      )}
    </>
  );
}
