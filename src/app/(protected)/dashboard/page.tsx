import { Suspense } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  findSessionsInRangeWithSummaries,
  type SessionSummary,
} from "@/modules/training/repositories/session.repo";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function formatDateYYYYMMDD(d: Date) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

function getWeekRange(today: Date) {
  const day = today.getDay(); // 0=Sun..6=Sat
  const mondayOffset = day === 0 ? -6 : 1 - day; // move to Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function nextDayStart(d: Date) {
  const n = new Date(d);
  n.setDate(n.getDate() + 1);
  n.setHours(0, 0, 0, 0);
  return n;
}

function formatShortDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDuration(sec: number | null | undefined) {
  if (!sec || sec <= 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}m`;
}

function strengthExerciseLabel(ex: {
  name: string;
  setCount: number;
  avgReps: number;
  avgWeightKg: number | null;
}) {
  const weightPart =
    ex.avgWeightKg != null ? `${ex.avgWeightKg.toFixed(1)}kg` : "";
  return weightPart
    ? `${ex.name} ${ex.setCount}x${ex.avgReps}x${weightPart}`
    : `${ex.name} ${ex.setCount}x${ex.avgReps}`;
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

type PageProps = {
  searchParams: Promise<{ week?: string }>;
};

type WeekContext = {
  monday: Date;
  sunday: Date;
  nextMonday: Date;
  previousMonday: Date;
  prevMonday: Date;
  prevSunday: Date;
  dayDates: Date[];
  dayKeys: string[];
};

function resolveWeekContext(weekParam?: string): WeekContext {
  let base = new Date();
  if (weekParam) {
    const parts = weekParam.split("-");
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      if (
        Number.isFinite(y) &&
        Number.isFinite(m) &&
        Number.isFinite(d) &&
        y >= 1970 &&
        m >= 1 &&
        m <= 12 &&
        d >= 1 &&
        d <= 31
      ) {
        base = new Date(y, m - 1, d);
        base.setHours(0, 0, 0, 0);
      }
    }
  }
  const { monday, sunday } = getWeekRange(base);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  nextMonday.setHours(0, 0, 0, 0);
  const previousMonday = new Date(monday);
  previousMonday.setDate(monday.getDate() - 7);
  previousMonday.setHours(0, 0, 0, 0);
  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);
  prevMonday.setHours(0, 0, 0, 0);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevMonday.getDate() + 6);
  prevSunday.setHours(23, 59, 59, 999);

  const dayDates: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const dayKeys = dayDates.map(formatDateYYYYMMDD);

  return {
    monday,
    sunday,
    nextMonday,
    previousMonday,
    prevMonday,
    prevSunday,
    dayDates,
    dayKeys,
  };
}

export default async function TrainingPage(props: PageProps) {
  const { week: weekParam } = await props.searchParams;
  const {
    monday,
    sunday,
    nextMonday,
    previousMonday,
    prevMonday,
    prevSunday,
    dayDates,
    dayKeys,
  } = resolveWeekContext(weekParam);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Weekly overview (Mon–Sun)</p>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`?week=${formatDateYYYYMMDD(previousMonday)}`}>
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`?week=${formatDateYYYYMMDD(nextMonday)}`}>Next</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="?">This week</Link>
          </Button>
        </div>
      </div>

      <Suspense
        fallback={
          <DashboardTableSkeleton dayDates={dayDates} dayKeys={dayKeys} />
        }
      >
        <DashboardTable
          monday={monday}
          sunday={sunday}
          prevMonday={prevMonday}
          prevSunday={prevSunday}
          dayDates={dayDates}
          dayKeys={dayKeys}
        />
      </Suspense>
    </div>
  );
}

type DashboardTableSkeletonProps = {
  dayDates: Date[];
  dayKeys: string[];
};

function DashboardTableSkeleton({
  dayDates,
  dayKeys,
}: DashboardTableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Metric</TableHead>
          {dayDates.map((d, idx) => (
            <TableHead key={idx}>{formatShortDayLabel(d)}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableHead>Weight</TableHead>
          {dayKeys.map((k) => (
            <TableCell key={`w-skeleton-${k}`}>Loading…</TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableHead>Calories</TableHead>
          {dayKeys.map((k) => (
            <TableCell key={`c-skeleton-${k}`}>Loading…</TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableHead>Trainings</TableHead>
          {dayKeys.map((k) => (
            <TableCell key={`t-skeleton-${k}`}>Loading…</TableCell>
          ))}
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead>Weight (avg)</TableHead>
          <TableCell colSpan={7}>Loading…</TableCell>
        </TableRow>
        <TableRow>
          <TableHead>Calories (avg)</TableHead>
          <TableCell colSpan={7}>Loading…</TableCell>
        </TableRow>
        <TableRow>
          <TableHead>Trainings (count)</TableHead>
          <TableCell colSpan={7}>Loading…</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

type DashboardTableProps = {
  monday: Date;
  sunday: Date;
  prevMonday: Date;
  prevSunday: Date;
  dayDates: Date[];
  dayKeys: string[];
};

async function DashboardTable({
  monday,
  sunday,
  prevMonday,
  prevSunday,
  dayDates,
  dayKeys,
}: DashboardTableProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  type DailyLogRow = {
    date: string;
    weight: string | null;
    kcal: number | null;
  };
  let logs: DailyLogRow[] = [];
  let prevLogs: DailyLogRow[] = [];
  let sessions: SessionSummary[] = [];
  let caloricGoal: number | null = null;
  if (userId) {
    const [logsRes, sessionsRes, prevLogsRes, userRow] = await Promise.all([
      findDailyLogsInRange(
        userId,
        formatDateYYYYMMDD(monday),
        formatDateYYYYMMDD(sunday),
      ) as Promise<DailyLogRow[]>,
      findSessionsInRangeWithSummaries(userId, monday, nextDayStart(sunday)),
      findDailyLogsInRange(
        userId,
        formatDateYYYYMMDD(prevMonday),
        formatDateYYYYMMDD(prevSunday),
      ) as Promise<DailyLogRow[]>,
      findUserById(userId),
    ]);
    logs = logsRes;
    sessions = sessionsRes;
    prevLogs = prevLogsRes;
    caloricGoal = (userRow?.caloricGoal as number | null) ?? null;
  }

  const logsByDate = new Map(
    logs.map((l) => [
      l.date,
      {
        weight:
          typeof l.weight === "string"
            ? parseFloat(l.weight)
            : (l.weight as unknown as number | null),
        kcal: l.kcal ?? null,
      },
    ]),
  );

  // Weekly aggregates
  const weekWeights: number[] = [];
  const weekKcals: number[] = [];
  for (const l of logs) {
    if (l.weight != null) {
      const w = parseFloat(l.weight);
      if (!Number.isNaN(w)) weekWeights.push(w);
    }
    if (l.kcal != null) weekKcals.push(l.kcal);
  }
  const prevWeekWeights: number[] = [];
  for (const l of prevLogs) {
    if (l.weight != null) {
      const w = parseFloat(l.weight);
      if (!Number.isNaN(w)) prevWeekWeights.push(w);
    }
  }
  const weekAvgWeight = average(weekWeights);
  const prevWeekAvgWeight = average(prevWeekWeights);
  const weightDelta =
    weekAvgWeight != null && prevWeekAvgWeight != null
      ? weekAvgWeight - prevWeekAvgWeight
      : null;
  const weekAvgKcal = average(weekKcals);
  const trainingsCount = sessions.length;

  const sessionsByDate = new Map<string, SessionSummary[]>();
  for (const s of sessions) {
    const start = new Date(s.startAt as Date);
    const key = formatDateYYYYMMDD(start);
    const arr = sessionsByDate.get(key) ?? [];
    arr.push(s);
    sessionsByDate.set(key, arr);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Metric</TableHead>
          {dayDates.map((d, idx) => (
            <TableHead key={idx}>{formatShortDayLabel(d)}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableHead>Weight</TableHead>
          {dayKeys.map((k) => {
            const l = logsByDate.get(k);
            const val =
              l?.weight != null && !Number.isNaN(l.weight)
                ? `${l.weight.toFixed(1)} kg`
                : "—";
            return <TableCell key={`w-${k}`}>{val}</TableCell>;
          })}
        </TableRow>
        <TableRow>
          <TableHead>Calories</TableHead>
          {dayKeys.map((k) => {
            const l = logsByDate.get(k);
            const val = l?.kcal != null ? `${l.kcal} kcal` : "—";
            return <TableCell key={`c-${k}`}>{val}</TableCell>;
          })}
        </TableRow>
        <TableRow>
          <TableHead>Trainings</TableHead>
          {dayKeys.map((k) => {
            const items = sessionsByDate.get(k);
            if (!items || items.length === 0) {
              return <TableCell key={`t-${k}`}>—</TableCell>;
            }
            return (
              <TableCell key={`t-${k}`}>
                <div className="flex flex-col gap-2">
                  {items.map((it: SessionSummary) => {
                    const durationSec: number | null | undefined =
                      it.durationSec ?? null;
                    const title = `${it.templateName} — ${formatDuration(
                      durationSec,
                    )}`;
                    if (it.type === "strength" && it.strength) {
                      return (
                        <div key={it.id} className="space-y-1">
                          <div className="font-medium">{title}</div>
                          <div className="text-muted-foreground">
                            {it.strength.exercises.map(
                              (
                                ex: {
                                  name: string;
                                  setCount: number;
                                  avgReps: number;
                                  avgWeightKg: number | null;
                                },
                                i: number,
                              ) => (
                                <div key={`${it.id}-ex-${i}`}>
                                  {strengthExerciseLabel(ex)}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      );
                    }
                    if (it.type === "cardio" && it.cardio) {
                      const parts: string[] = [];
                      if (it.cardio.distanceM != null) {
                        parts.push(
                          `${(it.cardio.distanceM / 1000).toFixed(1)} km`,
                        );
                      }
                      if (it.cardio.kcal != null) {
                        parts.push(`${it.cardio.kcal} kcal`);
                      }
                      return (
                        <div key={it.id} className="space-y-1">
                          <div className="font-medium">{title}</div>
                          {parts.length ? (
                            <div className="text-muted-foreground">
                              {parts.join(", ")}
                            </div>
                          ) : null}
                        </div>
                      );
                    }
                    return (
                      <div key={it.id} className="font-medium">
                        {title}
                      </div>
                    );
                  })}
                </div>
              </TableCell>
            );
          })}
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead>Weight (avg)</TableHead>
          <TableCell colSpan={7}>
            <div className="flex items-center gap-3">
              <span>
                {weekAvgWeight != null ? `${weekAvgWeight.toFixed(1)} kg` : "—"}
              </span>
              {weightDelta != null ? (
                <span
                  className={
                    weightDelta < 0
                      ? "text-green-600 dark:text-green-500"
                      : weightDelta > 0
                        ? "text-red-600 dark:text-red-500"
                        : "text-muted-foreground"
                  }
                >
                  {weightDelta < 0 ? "↓" : weightDelta > 0 ? "↑" : "±"}
                  {Math.abs(weightDelta).toFixed(1)} kg vs prev
                </span>
              ) : (
                <span className="text-muted-foreground">
                  no previous week data
                </span>
              )}
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableHead>Calories (avg)</TableHead>
          <TableCell colSpan={7}>
            <div className="flex items-center gap-3">
              <span
                className={
                  caloricGoal != null && weekAvgKcal != null
                    ? weekAvgKcal < caloricGoal
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500"
                    : ""
                }
              >
                {weekAvgKcal != null ? `${Math.round(weekAvgKcal)} kcal` : "—"}
              </span>
              {caloricGoal != null ? (
                <span className="text-muted-foreground">
                  goal {caloricGoal} kcal
                </span>
              ) : (
                <span className="text-muted-foreground">no goal set</span>
              )}
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableHead>Trainings (count)</TableHead>
          <TableCell colSpan={7}>
            <span>{trainingsCount}</span>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
