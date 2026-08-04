import { getTodayDateYYYYMMDD } from "@/lib/utils";
import {
  getCaloricGoal,
  getDailyLogByDate,
  getLatestDailyLog,
  getLatestMeasurements,
} from "@/modules/body/actions";
import { QuickLogBar } from "./quick-log-bar";

export async function QuickLogSection() {
  const today = getTodayDateYYYYMMDD();

  const [
    { data: todayLog },
    { data: latestLog },
    { data: caloricGoal },
    { data: lastMeasurement },
  ] = await Promise.all([
    getDailyLogByDate(today),
    getLatestDailyLog(),
    getCaloricGoal(),
    getLatestMeasurements(),
  ]);

  return (
    <QuickLogBar
      todayLog={todayLog ?? null}
      latestLog={latestLog ?? null}
      caloricGoal={caloricGoal ?? null}
      lastMeasurement={lastMeasurement ?? null}
    />
  );
}

export function QuickLogSectionSkeleton() {
  return (
    <div className="bg-card h-[59px] animate-pulse rounded-lg border px-5 py-3.5" />
  );
}
