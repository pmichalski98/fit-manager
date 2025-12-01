import { getDailyLogHistory } from "../../actions";
import { KcalChartGraph } from "./kcal-chart-graph";
import { WeightChartGraph } from "./weight-chart-graph";

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
    <div className="grid gap-4 md:grid-cols-2">
      {weightData.length > 0 && (
        <div className="space-y-4 overflow-hidden rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold">Weight History</h3>
          <div className="h-[300px] w-full">
            <WeightChartGraph data={weightData} />
          </div>
        </div>
      )}

      {kcalData.length > 0 && (
        <div className="space-y-4 overflow-hidden rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold">Caloric Intake History</h3>
          <div className="h-[300px] w-full">
            <KcalChartGraph data={kcalData} />
          </div>
        </div>
      )}
    </div>
  );
}
