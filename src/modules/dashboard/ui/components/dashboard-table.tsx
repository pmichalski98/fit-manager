import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateYYYYMMDD } from "@/lib/utils";
import { dailyLogRepository } from "@/modules/body/repositories/daily-log.repo";
import { sessionRepository } from "@/modules/session/repositories/session.repo";
import { userRepository } from "@/modules/body/repositories/user.repo";
import {
  average,
  formatDurationMin,
  formatShortDayLabel,
  nextDayStart,
  strengthExerciseLabel,
} from "../../utils";
import type { SessionSummary } from "@/modules/session/types";

type DashboardTableProps = {
  monday: Date;
  sunday: Date;
  prevMonday: Date;
  prevSunday: Date;
  dayDates: Date[];
  dayKeys: string[];
};

export async function DashboardTable({
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
      dailyLogRepository.findDailyLogsInRange(
        userId,
        formatDateYYYYMMDD(monday),
        formatDateYYYYMMDD(sunday),
      ) as Promise<DailyLogRow[]>,
      sessionRepository.getSessionsInRange(
        userId,
        monday,
        nextDayStart(sunday),
      ),
      dailyLogRepository.findDailyLogsInRange(
        userId,
        formatDateYYYYMMDD(prevMonday),
        formatDateYYYYMMDD(prevSunday),
      ) as Promise<DailyLogRow[]>,
      userRepository.findUserById(userId),
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
    const start = new Date(s.startAt);
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
                    const durationMin: number | null | undefined =
                      it.durationMin ?? null;
                    const title = `${it.templateName} — ${formatDurationMin(
                      durationMin,
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
                      if (it.cardio.distanceKm != null) {
                        parts.push(`${it.cardio.distanceKm.toFixed(1)} km`);
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
