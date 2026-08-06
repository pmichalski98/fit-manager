import { subDays } from "date-fns";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { auth } from "@/lib/auth";
import { cn, formatDateYYYYMMDD } from "@/lib/utils";
import { dailyLogRepository } from "@/modules/body/repositories/daily-log.repo";
import { userRepository } from "@/modules/body/repositories/user.repo";
import { sessionRepository } from "@/modules/session/repositories/session.repo";
import { average, nextDayStart } from "../../utils";

type KpiStripProps = {
  monday: Date;
  sunday: Date;
  prevMonday: Date;
  prevSunday: Date;
};

type DailyLogRow = {
  date: string;
  weight: string | null;
  kcal: number | null;
};

function parseWeights(logs: DailyLogRow[]): number[] {
  const weights: number[] = [];
  for (const l of logs) {
    if (l.weight != null) {
      const w = parseFloat(l.weight);
      if (!Number.isNaN(w)) weights.push(w);
    }
  }
  return weights;
}

function TrendSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => 2 + 68 * (i / (values.length - 1));
  const y = (v: number) => 19 - 15 * ((v - min) / span);

  const points = values
    .map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const lastX = x(values.length - 1).toFixed(1);
  const lastY = y(values[values.length - 1]!).toFixed(1);

  return (
    <svg viewBox="0 0 72 22" className="h-[22px] w-[72px] shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={1.5}
        opacity={0.8}
      />
      <circle cx={lastX} cy={lastY} r={2} fill="var(--chart-1)" />
    </svg>
  );
}

function KpiCell({
  label,
  value,
  unit,
  delta,
  spark,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  delta: ReactNode;
  spark?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5 px-5 py-4", className)}>
      <span className="label-caps">{label}</span>
      <span className="flex items-end justify-between gap-2">
        <span className="font-mono text-[26px] leading-none font-semibold">
          {value}
          {unit ? (
            <span className="text-muted-foreground text-[13px]"> {unit}</span>
          ) : null}
        </span>
        {spark}
      </span>
      <span className="text-muted-foreground font-mono text-[11px]">
        {delta}
      </span>
    </div>
  );
}

export async function KpiStrip({
  monday,
  sunday,
  prevMonday,
  prevSunday,
}: KpiStripProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) return null;

  const [logs, prevLogs, trendLogs, sessions, prevSessions, userRow] =
    await Promise.all([
      dailyLogRepository.findDailyLogsInRange(
        userId,
        formatDateYYYYMMDD(monday),
        formatDateYYYYMMDD(sunday),
      ) as Promise<DailyLogRow[]>,
      dailyLogRepository.findDailyLogsInRange(
        userId,
        formatDateYYYYMMDD(prevMonday),
        formatDateYYYYMMDD(prevSunday),
      ) as Promise<DailyLogRow[]>,
      dailyLogRepository.findDailyLogsInRange(
        userId,
        formatDateYYYYMMDD(subDays(sunday, 29)),
        formatDateYYYYMMDD(sunday),
      ) as Promise<DailyLogRow[]>,
      sessionRepository.getSessionsInRange(
        userId,
        monday,
        nextDayStart(sunday),
      ),
      sessionRepository.getSessionsInRange(
        userId,
        prevMonday,
        nextDayStart(prevSunday),
      ),
      userRepository.findUserById(userId),
    ]);

  const caloricGoal = (userRow?.caloricGoal as number | null) ?? null;

  // Weight
  const weekAvgWeight = average(parseWeights(logs));
  const prevWeekAvgWeight = average(parseWeights(prevLogs));
  const weightTrend = parseWeights(trendLogs);
  const weightDelta =
    weekAvgWeight != null && prevWeekAvgWeight != null
      ? weekAvgWeight - prevWeekAvgWeight
      : null;

  // Calories
  const weekAvgKcal = average(
    logs.filter((l) => l.kcal != null).map((l) => l.kcal!),
  );
  const kcalDiff =
    weekAvgKcal != null && caloricGoal != null
      ? Math.round(weekAvgKcal) - caloricGoal
      : null;

  // Trainings
  const strengthCount = sessions.filter((s) => s.type === "strength").length;
  const cardioCount = sessions.filter((s) => s.type === "cardio").length;

  // Volume
  const sumVolume = (list: typeof sessions) =>
    list.reduce((acc, s) => acc + (s.totalLoadKg ?? 0), 0);
  const volume = sumVolume(sessions);
  const prevVolume = sumVolume(prevSessions);
  const volumePct =
    volume > 0 && prevVolume > 0
      ? ((volume - prevVolume) / prevVolume) * 100
      : null;

  return (
    <div className="bg-card grid grid-cols-2 overflow-hidden rounded-lg border lg:grid-cols-4">
      <KpiCell
        label="Weight · wk avg"
        value={weekAvgWeight != null ? weekAvgWeight.toFixed(1) : "—"}
        unit="kg"
        spark={<TrendSparkline values={weightTrend} />}
        className="border-r border-b lg:border-b-0"
        delta={
          weightDelta != null ? (
            <span className={weightDelta !== 0 ? "text-primary" : undefined}>
              {weightDelta < 0 ? "▼" : weightDelta > 0 ? "▲" : "±"}{" "}
              {Math.abs(weightDelta).toFixed(1)} kg vs prev week
            </span>
          ) : (
            "no prev week data"
          )
        }
      />
      <KpiCell
        label="Calories · day avg"
        value={weekAvgKcal != null ? String(Math.round(weekAvgKcal)) : "—"}
        unit="kcal"
        className="border-b lg:border-r lg:border-b-0"
        delta={
          caloricGoal != null ? (
            <>
              goal {caloricGoal}
              {kcalDiff != null ? (
                <>
                  {" · "}
                  <span
                    className={kcalDiff > 0 ? "text-cardio" : "text-primary"}
                  >
                    {kcalDiff > 0 ? "+" : "−"}
                    {Math.abs(kcalDiff)}
                  </span>
                </>
              ) : null}
            </>
          ) : (
            "no goal set"
          )
        }
      />
      <KpiCell
        label="Trainings · week"
        value={String(sessions.length)}
        className="border-r"
        delta={
          sessions.length > 0 ? (
            <>
              {strengthCount} strength ·{" "}
              <span className={cardioCount > 0 ? "text-cardio" : undefined}>
                {cardioCount} cardio
              </span>
            </>
          ) : (
            "no sessions"
          )
        }
      />
      <KpiCell
        label="Volume · week"
        value={volume > 0 ? String(Math.round(volume)) : "—"}
        unit="kg"
        delta={
          volumePct != null ? (
            <span className="text-primary">
              {volumePct >= 0 ? "▲ +" : "▼ "}
              {Math.abs(volumePct).toFixed(1)}% vs prev
            </span>
          ) : (
            "no prev week data"
          )
        }
      />
    </div>
  );
}

export function KpiStripSkeleton() {
  return (
    <div className="bg-card grid grid-cols-2 overflow-hidden rounded-lg border lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex h-[104px] animate-pulse flex-col gap-1.5 px-5 py-4",
            i === 0 && "border-r border-b lg:border-b-0",
            i === 1 && "border-b lg:border-r lg:border-b-0",
            i === 2 && "border-r",
          )}
        />
      ))}
    </div>
  );
}
