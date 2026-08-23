import { differenceInDays, subDays } from "date-fns";

import { formatDateYYYYMMDD, getTodayDateYYYYMMDD } from "@/lib/utils";
import {
  getDailyLogByDate,
  getGoalSettings,
  getLatestDailyLog,
  getLatestMeasurements,
} from "@/modules/body/actions";
import { QuickLogBar } from "./quick-log-bar";

export async function QuickLogSection() {
  const today = getTodayDateYYYYMMDD();

  const [
    { data: todayLog },
    { data: latestLog },
    { data: goalSettings },
    { data: lastMeasurement },
  ] = await Promise.all([
    getDailyLogByDate(today),
    getLatestDailyLog(),
    getGoalSettings(),
    getLatestMeasurements(),
  ]);

  // Computed on the server and passed down as a plain prop — computing it
  // inside the client component would risk an SSR/client hydration mismatch
  const measurementsAgeDays = lastMeasurement?.date
    ? differenceInDays(new Date(), new Date(lastMeasurement.date))
    : null;

  return (
    <QuickLogBar
      today={today}
      // "Add past entry" opens on yesterday — today is already in the bar
      defaultBackfillDate={formatDateYYYYMMDD(subDays(new Date(), 1))}
      todayLog={todayLog ?? null}
      latestLog={latestLog ?? null}
      goalSettings={goalSettings ?? null}
      lastMeasurement={lastMeasurement ?? null}
      measurementsAgeDays={measurementsAgeDays}
    />
  );
}

export function QuickLogSectionSkeleton() {
  return (
    <div className="bg-card h-[59px] animate-pulse rounded-lg border px-5 py-3.5" />
  );
}
