import type { DailyGoalSettings } from "@/modules/body/repositories/user.repo";

export const KCAL_TOLERANCE = 0.05;

export type GoalCriterionKey = "training" | "steps" | "weight" | "kcal";

export type DayGoalResult = {
  date: string;
  /** A completed session exists on this date. */
  trained: boolean;
  /** Pass/fail per active criterion (only active keys are present). */
  criteria: Partial<Record<GoalCriterionKey, boolean>>;
  metCount: number;
  totalCount: number;
  complete: boolean;
};

export type DailyGoalsEvaluation = {
  /** Ascending, one entry per day, ending at `today`. */
  days: DayGoalResult[];
  activeCriteria: GoalCriterionKey[];
  /** Consecutive complete days ending today (or yesterday while today is pending). */
  streak: number;
  longestStreak: number;
  /** Share of complete days in the current calendar month, 0–100. */
  monthCompletePct: number | null;
};

type LogRow = {
  date: string;
  weight: string | null;
  kcal: number | null;
  steps: number | null;
};

type EvaluateInput = {
  settings: DailyGoalSettings;
  logs: LogRow[];
  /** Dates (YYYY-MM-DD) of completed sessions; duplicates count as separate sessions. */
  sessionDates: string[];
  /** First day of the evaluated window (YYYY-MM-DD). */
  startDate: string;
  /** Last day of the evaluated window, i.e. today (YYYY-MM-DD). */
  today: string;
};

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday-based weekday index (Mon = 0 … Sun = 6). */
function isoWeekdayIndex(date: string): number {
  return (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
}

/**
 * Evaluates the daily-goal criteria for every day of the window.
 *
 * The training criterion is weekly: a day without a session still passes as
 * long as the weekly training goal remains reachable within its ISO week
 * (sessions done so far + one per remaining day >= goal). Criteria whose goal
 * value is missing are treated as inactive, like disabled ones.
 */
export function evaluateDailyGoals({
  settings,
  logs,
  sessionDates,
  startDate,
  today,
}: EvaluateInput): DailyGoalsEvaluation {
  const weeklyGoal = settings.weeklyTrainingGoal ?? 0;

  const activeCriteria: GoalCriterionKey[] = [];
  if (settings.goalTrainingEnabled && weeklyGoal > 0)
    activeCriteria.push("training");
  if (settings.goalStepsEnabled && settings.stepsGoal != null)
    activeCriteria.push("steps");
  if (settings.goalWeightEnabled) activeCriteria.push("weight");
  if (settings.goalKcalEnabled && settings.caloricGoal != null)
    activeCriteria.push("kcal");

  const logsByDate = new Map(logs.map((l) => [l.date, l]));
  const sessionsByDate = new Map<string, number>();
  for (const date of sessionDates) {
    sessionsByDate.set(date, (sessionsByDate.get(date) ?? 0) + 1);
  }

  const days: DayGoalResult[] = [];
  let weekSessionCount = 0;

  for (let date = startDate; date <= today; date = shiftDate(date, 1)) {
    const weekdayIdx = isoWeekdayIndex(date);
    if (weekdayIdx === 0) weekSessionCount = 0;

    const sessionsToday = sessionsByDate.get(date) ?? 0;
    weekSessionCount += sessionsToday;
    const trained = sessionsToday > 0;

    const log = logsByDate.get(date);
    const criteria: Partial<Record<GoalCriterionKey, boolean>> = {};

    if (activeCriteria.includes("training")) {
      const remainingDays = 6 - weekdayIdx;
      criteria.training =
        trained || weekSessionCount + remainingDays >= weeklyGoal;
    }
    if (activeCriteria.includes("steps")) {
      criteria.steps =
        log?.steps != null && log.steps >= (settings.stepsGoal ?? 0);
    }
    if (activeCriteria.includes("weight")) {
      const weight = log?.weight != null ? parseFloat(log.weight) : NaN;
      criteria.weight = !Number.isNaN(weight);
    }
    if (activeCriteria.includes("kcal")) {
      const goal = settings.caloricGoal ?? 0;
      criteria.kcal =
        log?.kcal != null && Math.abs(log.kcal - goal) <= goal * KCAL_TOLERANCE;
    }

    const metCount = Object.values(criteria).filter(Boolean).length;
    const totalCount = activeCriteria.length;
    days.push({
      date,
      trained,
      criteria,
      metCount,
      totalCount,
      complete: totalCount > 0 && metCount === totalCount,
    });
  }

  // Streak: walk back from today, skipping today while it is still pending.
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i]!;
    if (day.date === today && !day.complete) continue;
    if (!day.complete) break;
    streak++;
  }

  let longestStreak = 0;
  let run = 0;
  for (const day of days) {
    if (day.complete) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else if (day.date !== today) {
      run = 0;
    }
  }

  const monthStart = `${today.slice(0, 8)}01`;
  const monthDays = days.filter(
    (d) => d.date >= monthStart && (d.date !== today || d.complete),
  );
  const monthCompletePct =
    monthDays.length > 0
      ? Math.round(
          (monthDays.filter((d) => d.complete).length / monthDays.length) * 100,
        )
      : null;

  return { days, activeCriteria, streak, longestStreak, monthCompletePct };
}
