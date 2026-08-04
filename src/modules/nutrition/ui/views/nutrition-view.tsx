import { getCaloricGoal } from "@/modules/body/actions";
import { getWeekInsight, getWeekMeals } from "../../actions";
import { WeekMeals } from "../components/week-meals";
import { WeeklyInsightCard } from "../components/weekly-insight-card";

export default async function NutritionView({
  weekStart,
}: {
  weekStart: string;
}) {
  const [{ data: items }, { data: insight }, goalResult] = await Promise.all([
    getWeekMeals(weekStart),
    getWeekInsight(weekStart),
    getCaloricGoal(),
  ]);
  const caloricGoal = goalResult.data ?? null;

  return (
    <div className="max-w-5xl space-y-4">
      <WeeklyInsightCard
        weekStart={weekStart}
        insight={insight}
        hasMeals={items.length > 0}
      />

      <WeekMeals items={items} caloricGoal={caloricGoal} />
    </div>
  );
}
