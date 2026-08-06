import { getDailyLogHistory } from "../../actions";
import { getGoalSettings } from "@/modules/body/actions";
import { HideableChart } from "./hideable-chart";
import { KcalChartGraph } from "./kcal-chart-graph";
import { MacroChartGraph } from "./macro-chart-graph";
import { StepsChartGraph } from "./steps-chart-graph";
import { WeightChartGraph } from "./weight-chart-graph";

export async function BodyCharts() {
  const [data, { data: goalSettings }] = await Promise.all([
    getDailyLogHistory(),
    getGoalSettings(),
  ]);

  if (!data || data.length === 0) {
    return null;
  }

  const caloricGoal = goalSettings?.caloricGoal ?? null;
  const stepsGoal = goalSettings?.stepsGoal ?? null;

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

  // Days with steps synced from Apple Health
  const stepsData = data
    .filter((log) => log.steps != null && log.steps > 0)
    .map((log) => ({
      date: log.date,
      steps: Number(log.steps),
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
          <WeightChartGraph data={weightData} />
        </HideableChart>
      )}

      {kcalData.length > 0 && (
        <HideableChart chartId="kcal-history">
          <KcalChartGraph data={kcalData} caloricGoal={caloricGoal} />
        </HideableChart>
      )}

      {stepsData.length > 0 && (
        <HideableChart chartId="steps-history">
          <StepsChartGraph data={stepsData} stepsGoal={stepsGoal} />
        </HideableChart>
      )}

      {macroData.length > 0 && (
        <HideableChart chartId="macro-history">
          <MacroChartGraph data={macroData} />
        </HideableChart>
      )}
    </>
  );
}
