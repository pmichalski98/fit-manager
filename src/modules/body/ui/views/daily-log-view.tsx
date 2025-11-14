import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTodayDateYYYYMMDD } from "@/lib/utils";
import {
  getCaloricGoal,
  getLatestDailyLog,
  getUserDailyLog,
} from "../../actions";
import { CaloricGoalDialog } from "../components/caloric-goal-dialog";
import { DailyLogForm } from "../components/daily-log-form";

export default async function DailyLogView() {
  const todayStr = getTodayDateYYYYMMDD();

  const [{ data: todaysLog }, { data: latestLog }, { data: caloricGoal }] =
    await Promise.all([
      getUserDailyLog(todayStr),
      getLatestDailyLog(todayStr),
      getCaloricGoal(),
    ]);

  const alreadyFilledToday = Boolean(
    todaysLog?.weight != null || todaysLog?.kcal != null,
  );

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
        <DailyLogForm alreadyFilledToday={alreadyFilledToday} />
      </CardContent>
    </Card>
  );
}
