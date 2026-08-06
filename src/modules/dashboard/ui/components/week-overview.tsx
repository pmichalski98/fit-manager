import { format, isSameDay, isSameMonth } from "date-fns";
import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { cn, formatDateYYYYMMDD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dailyLogRepository } from "@/modules/body/repositories/daily-log.repo";
import { userRepository } from "@/modules/body/repositories/user.repo";
import { sessionRepository } from "@/modules/session/repositories/session.repo";
import type { SessionSummary } from "@/modules/session/types";
import {
  average,
  formatDurationMin,
  formatSteps,
  formatVolumeKg,
  nextDayStart,
} from "../../utils";

type WeekOverviewProps = {
  monday: Date;
  sunday: Date;
  prevMonday: Date;
  prevSunday: Date;
  previousMonday: Date;
  nextMonday: Date;
  dayDates: Date[];
  dayKeys: string[];
};

type DailyLogRow = {
  date: string;
  weight: string | null;
  kcal: number | null;
  steps: number | null;
};

function sessionMeta(s: SessionSummary): string {
  const parts: string[] = [];
  const duration = formatDurationMin(s.durationMin);
  if (duration !== "—") parts.push(duration);
  if (s.type === "strength" && s.totalLoadKg != null && s.totalLoadKg > 0) {
    parts.push(`${formatVolumeKg(s.totalLoadKg)} kg`);
  }
  if (s.type === "cardio") {
    if (s.cardio?.distanceKm != null) {
      parts.push(`${s.cardio.distanceKm.toFixed(1)} km`);
    } else if (s.cardio?.kcal != null) {
      parts.push(`${s.cardio.kcal} kcal`);
    }
  }
  return parts.join(" · ");
}

export async function WeekOverview({
  monday,
  sunday,
  prevMonday,
  prevSunday,
  previousMonday,
  nextMonday,
  dayDates,
  dayKeys,
}: WeekOverviewProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

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
        weight: l.weight != null ? parseFloat(l.weight) : null,
        kcal: l.kcal ?? null,
        steps: l.steps ?? null,
      },
    ]),
  );

  const sessionsByDate = new Map<string, SessionSummary[]>();
  for (const s of sessions) {
    const key = formatDateYYYYMMDD(new Date(s.startAt));
    const arr = sessionsByDate.get(key) ?? [];
    arr.push(s);
    sessionsByDate.set(key, arr);
  }

  // Weekly aggregates
  const parseWeights = (list: DailyLogRow[]) =>
    list
      .map((l) => (l.weight != null ? parseFloat(l.weight) : NaN))
      .filter((w) => !Number.isNaN(w));
  const weekAvgWeight = average(parseWeights(logs));
  const prevWeekAvgWeight = average(parseWeights(prevLogs));
  const weightDelta =
    weekAvgWeight != null && prevWeekAvgWeight != null
      ? weekAvgWeight - prevWeekAvgWeight
      : null;
  const weekAvgKcal = average(
    logs.filter((l) => l.kcal != null).map((l) => l.kcal!),
  );
  const weekAvgSteps = average(
    logs.filter((l) => l.steps != null).map((l) => l.steps!),
  );
  const totalVolume = sessions.reduce(
    (acc, s) => acc + (s.totalLoadKg ?? 0),
    0,
  );

  const today = new Date();
  const rangeText = isSameMonth(monday, sunday)
    ? `${format(monday, "d")}–${format(sunday, "d MMM")}`
    : `${format(monday, "d MMM")} – ${format(sunday, "d MMM")}`;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <CardTitle>
          This week
          <span className="text-faint ml-1.5 font-mono text-[11px] font-semibold tracking-normal normal-case">
            {rangeText}
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="xs">
            <Link href={`?week=${formatDateYYYYMMDD(previousMonday)}`}>
              ← Prev
            </Link>
          </Button>
          <Button asChild variant="outline" size="xs">
            <Link href={`?week=${formatDateYYYYMMDD(nextMonday)}`}>Next →</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 overflow-hidden rounded-md border sm:grid-cols-7">
          {dayDates.map((d, i) => {
            const key = dayKeys[i]!;
            const log = logsByDate.get(key);
            const daySessions = sessionsByDate.get(key);
            const isToday = isSameDay(d, today);

            return (
              <div
                key={key}
                className={cn(
                  "flex min-h-[120px] flex-col gap-2 p-3",
                  i < 6 && "border-b sm:border-r sm:border-b-0",
                  isToday && "bg-accent/60",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-[0.1em] uppercase",
                    isToday ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {format(d, "EEE")}{" "}
                  <span className="text-faint font-mono">{format(d, "d")}</span>
                </span>
                <div className="flex flex-col gap-0.5 font-mono">
                  <span className="text-[15px] font-semibold">
                    {log?.weight != null && !Number.isNaN(log.weight) ? (
                      log.weight.toFixed(1)
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    {log?.kcal != null ? (
                      log.kcal
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </span>
                  <span className="text-faint text-[11px]">
                    {log?.steps != null ? formatSteps(log.steps) : "—"}
                  </span>
                </div>
                {daySessions && daySessions.length > 0 ? (
                  <div className="mt-auto flex flex-col gap-1.5">
                    {daySessions.map((s) => {
                      const isCardio = s.type === "cardio";
                      const meta = sessionMeta(s);
                      return (
                        <div
                          key={s.id}
                          className={cn(
                            "flex flex-col gap-0.5 border-l-2 pl-1.5",
                            isCardio ? "border-cardio" : "border-primary",
                          )}
                        >
                          <span
                            className={cn(
                              "truncate text-[10px] font-semibold tracking-[0.06em] uppercase",
                              isCardio ? "text-cardio" : "text-primary",
                            )}
                          >
                            {s.templateName}
                          </span>
                          {meta ? (
                            <span className="text-muted-foreground font-mono text-[10px]">
                              {meta}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="text-muted-foreground mt-3.5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px]">
          <span>
            ØW{" "}
            <span className="text-foreground">
              {weekAvgWeight != null ? `${weekAvgWeight.toFixed(1)} kg` : "—"}
            </span>
            {weightDelta != null && weightDelta !== 0 ? (
              <span className="text-primary">
                {" "}
                {weightDelta < 0 ? "▼" : "▲"}
                {Math.abs(weightDelta).toFixed(1)}
              </span>
            ) : null}
          </span>
          <span>
            ØKCAL{" "}
            <span className="text-foreground">
              {weekAvgKcal != null ? Math.round(weekAvgKcal) : "—"}
            </span>
            {caloricGoal != null ? `/${caloricGoal}` : null}
          </span>
          <span>
            ØSTEPS{" "}
            <span className="text-foreground">
              {weekAvgSteps != null ? formatSteps(weekAvgSteps) : "—"}
            </span>
          </span>
          <span>
            TRN <span className="text-foreground">{sessions.length}</span>
          </span>
          <span>
            VOL{" "}
            <span className="text-foreground">
              {totalVolume > 0 ? `${formatVolumeKg(totalVolume)} kg` : "—"}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function WeekOverviewSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-3.5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 overflow-hidden rounded-md border sm:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex min-h-[120px] flex-col gap-2 p-3",
                i < 6 && "border-b sm:border-r sm:border-b-0",
              )}
            >
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
        <div className="mt-3.5 flex gap-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
