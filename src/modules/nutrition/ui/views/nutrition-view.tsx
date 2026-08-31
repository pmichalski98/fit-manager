import { getCaloricGoal } from "@/modules/body/actions";
import {
  getAutoWeeklyAnalysis,
  getWeekInsight,
  getWeekMeals,
} from "../../actions";
import { WeekMeals } from "../components/week-meals";
import { WeeklyInsightCard } from "../components/weekly-insight-card";

export default async function NutritionView({
  weekStart,
}: {
  weekStart: string;
}) {
  const [{ data: items }, { data: insight }, goalResult, autoAnalysis] =
    await Promise.all([
      getWeekMeals(weekStart),
      getWeekInsight(weekStart),
      getCaloricGoal(),
      getAutoWeeklyAnalysis(),
    ]);
  const caloricGoal = goalResult.data ?? null;

  return (
    <div className="max-w-5xl space-y-4">
      <WeeklyInsightCard
        weekStart={weekStart}
        insight={insight}
        hasMeals={items.length > 0}
        autoAnalysis={autoAnalysis}
      />

      <WeekMeals items={items} caloricGoal={caloricGoal} />
    </div>
  );
}
