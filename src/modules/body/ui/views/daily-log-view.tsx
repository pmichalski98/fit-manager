import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTodayDateYYYYMMDD } from "@/lib/utils";
import { getCaloricGoal, getDailyLogByDate } from "../../actions";
import { CaloricGoalDialog } from "../components/caloric-goal-dialog";
import { DailyLogForm } from "../components/daily-log-form";

export default async function DailyLogView() {
  const today = getTodayDateYYYYMMDD();

  const [{ data: todayDailyLog }, { data: caloricGoal }] = await Promise.all([
    getDailyLogByDate(today),
    getCaloricGoal(),
  ]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Daily log</CardTitle>

          <CardDescription>Log today’s weight and calories.</CardDescription>
        </div>
        <CaloricGoalDialog defaultGoal={caloricGoal} />
      </CardHeader>
      <CardContent>
        <DailyLogForm caloricGoal={caloricGoal} lastDailyLog={todayDailyLog} />
      </CardContent>
    </Card>
  );
}
