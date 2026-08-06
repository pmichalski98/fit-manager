import { format } from "date-fns";
import { CheckIcon } from "lucide-react";
import { headers } from "next/headers";
import { Fragment } from "react";

import { auth } from "@/lib/auth";
import { cn, getTodayDateYYYYMMDD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dailyLogRepository } from "@/modules/body/repositories/daily-log.repo";
import { userRepository } from "@/modules/body/repositories/user.repo";
import { DailyGoalsDialog } from "@/modules/body/ui/components/daily-goals-dialog";
import { sessionRepository } from "@/modules/session/repositories/session.repo";
import type { SessionSummary } from "@/modules/session/types";
import {
  evaluateDailyGoals,
  KCAL_TOLERANCE,
  type DayGoalResult,
  type GoalCriterionKey,
} from "../../lib/daily-goals";
import { formatDurationMin, formatSteps, nextDayStart } from "../../utils";

const HISTORY_DAYS = 365;
const GRID_DAYS = 14;

const CRITERION_LABELS: Record<GoalCriterionKey, string> = {
  training: "Training",
  steps: "Steps",
  weight: "Weight",
  kcal: "Kcal",
};

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function DailyGoalsPanel() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;

  const today = getTodayDateYYYYMMDD();
  const startDate = shiftDate(today, -(HISTORY_DAYS - 1));
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [settings, logs, distribution, todaySessions] = await Promise.all([
    userRepository.findGoalSettings(userId),
    dailyLogRepository.findDailyLogsInRange(userId, startDate, today),
    sessionRepository.getSessionDistribution(
      userId,
      new Date(`${startDate}T00:00:00`),
    ),
    sessionRepository.getSessionsInRange(
      userId,
      todayStart,
      nextDayStart(todayStart),
    ),
  ]);

  if (!settings) return null;

  const evaluation = evaluateDailyGoals({
    settings,
    logs,
    sessionDates: distribution.map((s) => s.date),
    startDate,
    today,
  });

  const setGoalsButton = (
    <DailyGoalsDialog settings={settings}>
      <Button type="button" variant="outline" size="xs">
        Set goals
      </Button>
    </DailyGoalsDialog>
  );

  if (evaluation.activeCriteria.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daily goals</CardTitle>
          {setGoalsButton}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Set your goals to start tracking daily completes and streaks.
          </p>
        </CardContent>
      </Card>
    );
  }

  const todayResult = evaluation.days[evaluation.days.length - 1]!;
  const gridDays = evaluation.days.slice(-GRID_DAYS);
  const monthName = format(new Date(), "MMMM");

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <CardTitle>
          Daily goals
          <span className="text-primary ml-2 font-mono text-[11px] font-semibold tracking-normal">
            streak: {evaluation.streak}{" "}
            {evaluation.streak === 1 ? "day" : "days"}
          </span>
        </CardTitle>
        {setGoalsButton}
      </CardHeader>
      <CardContent>
        <div className="grid items-start gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <TodayChecklist
            todayResult={todayResult}
            todaySessions={todaySessions}
            evaluation={evaluation}
            settings={{
              stepsGoal: settings.stepsGoal,
              caloricGoal: settings.caloricGoal,
              weeklyTrainingGoal: settings.weeklyTrainingGoal,
            }}
            todaySteps={logs.find((l) => l.date === today)?.steps ?? null}
            todayWeight={logs.find((l) => l.date === today)?.weight ?? null}
            todayKcal={logs.find((l) => l.date === today)?.kcal ?? null}
            weekTrainedCount={countWeekSessions(evaluation.days)}
          />

          <div className="min-w-0">
            <span className="label-caps">Last {GRID_DAYS} days</span>
            <div className="mt-3 overflow-x-auto">
              <GoalsGrid
                days={gridDays}
                today={today}
                activeCriteria={evaluation.activeCriteria}
              />
            </div>
            <p className="text-muted-foreground mt-3.5 font-mono text-[11px]">
              {evaluation.monthCompletePct != null ? (
                <>
                  <span className="text-foreground">
                    {evaluation.monthCompletePct}%
                  </span>{" "}
                  days complete in {monthName}
                </>
              ) : (
                "no data this month"
              )}
              {" · "}longest streak:{" "}
              <span className="text-foreground">
                {evaluation.longestStreak}{" "}
                {evaluation.longestStreak === 1 ? "day" : "days"}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Completed sessions in the current ISO week, derived from evaluated days. */
function countWeekSessions(days: DayGoalResult[]): number {
  let count = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i]!;
    if (day.trained) count++;
    const weekdayIdx = (new Date(`${day.date}T12:00:00Z`).getUTCDay() + 6) % 7;
    if (weekdayIdx === 0) break;
  }
  return count;
}

function TodayChecklist({
  todayResult,
  todaySessions,
  evaluation,
  settings,
  todaySteps,
  todayWeight,
  todayKcal,
  weekTrainedCount,
}: {
  todayResult: DayGoalResult;
  todaySessions: SessionSummary[];
  evaluation: { activeCriteria: GoalCriterionKey[] };
  settings: {
    stepsGoal: number | null;
    caloricGoal: number | null;
    weeklyTrainingGoal: number | null;
  };
  todaySteps: number | null;
  todayWeight: string | null;
  todayKcal: number | null;
  weekTrainedCount: number;
}) {
  const details: Record<GoalCriterionKey, string> = {
    training: todayResult.trained
      ? todaySessions
          .map((s) => {
            const duration = formatDurationMin(s.durationMin);
            return duration === "—"
              ? s.templateName
              : `${s.templateName} · ${duration}`;
          })
          .join(", ")
      : `${weekTrainedCount}/${settings.weeklyTrainingGoal ?? 0} this week`,
    steps:
      todaySteps != null
        ? `${formatSteps(todaySteps)} / ${formatSteps(settings.stepsGoal ?? 0)}`
        : "no data yet",
    weight: todayWeight != null ? `${todayWeight} kg` : "no entry",
    kcal:
      todayKcal != null
        ? `${todayKcal} / ${settings.caloricGoal} ±${KCAL_TOLERANCE * 100}%`
        : "no entry",
  };

  const labels: Record<GoalCriterionKey, string> = {
    training: "Training",
    steps: "Steps",
    weight: "Weight logged",
    kcal: "Calories on target",
  };

  return (
    <div className="flex flex-col">
      <span className="label-caps">
        Today · {format(new Date(), "EEE d MMM")}
      </span>
      <div className="mt-3 flex flex-col">
        {evaluation.activeCriteria.map((key, i) => {
          const met = todayResult.criteria[key] === true;
          // A rest day passes the training criterion without a session —
          // show it as pending rather than done.
          const checked = key === "training" ? todayResult.trained : met;
          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-3 py-2.5",
                i > 0 && "border-t",
              )}
            >
              <span
                className={cn(
                  "grid size-[18px] shrink-0 place-content-center rounded-[4px] border",
                  checked
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-input bg-input-bg",
                )}
              >
                {checked ? <CheckIcon className="size-3.5" /> : null}
              </span>
              <span
                className={cn(
                  "text-[12px] font-semibold tracking-[0.05em] uppercase",
                  checked ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {labels[key]}
              </span>
              <span
                className={cn(
                  "ml-auto text-right font-mono text-[11px]",
                  key === "training" && todayResult.trained
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {details[key]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoalsGrid({
  days,
  today,
  activeCriteria,
}: {
  days: DayGoalResult[];
  today: string;
  activeCriteria: GoalCriterionKey[];
}) {
  return (
    <div
      className="grid w-full min-w-[420px] items-center gap-x-1 gap-y-1.5"
      style={{
        gridTemplateColumns: `auto repeat(${days.length}, minmax(0, 1fr))`,
      }}
    >
      <span />
      {days.map((day) => (
        <span
          key={day.date}
          className={cn(
            "text-center font-mono text-[9px]",
            day.date === today
              ? "text-foreground font-bold"
              : "text-muted-foreground",
          )}
        >
          {day.date.slice(8)}
        </span>
      ))}

      {activeCriteria.map((key) => (
        <Fragment key={key}>
          <span className="label-caps pr-2 text-[10px]">
            {CRITERION_LABELS[key]}
          </span>
          {days.map((day) => {
            const met = day.criteria[key] === true;
            const isToday = day.date === today;
            // Rest days that merely keep the weekly goal reachable get a
            // muted fill so real sessions stand out.
            const strong = key === "training" ? day.trained : met;
            const soft = key === "training" && met && !day.trained;
            return (
              <span
                key={day.date}
                className={cn(
                  "mx-auto h-3.5 w-full max-w-[22px] rounded-[3px]",
                  strong
                    ? "bg-primary"
                    : soft
                      ? "bg-primary/20"
                      : isToday && !met
                        ? "border-input border bg-transparent"
                        : "bg-input-bg",
                )}
              />
            );
          })}
        </Fragment>
      ))}

      <span className="label-caps pr-2 text-[10px]">Complete</span>
      {days.map((day) => (
        <span
          key={day.date}
          className="grid h-3.5 place-content-center text-center font-mono text-[10px]"
        >
          {day.complete ? (
            <CheckIcon className="text-primary size-3" />
          ) : (
            <span
              className={cn(
                day.date === today ? "text-muted-foreground" : "text-faint",
              )}
            >
              {day.metCount}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export function DailyGoalsPanelSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-7 w-20" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-28" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
