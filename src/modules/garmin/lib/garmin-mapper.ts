import type { IActivity } from "../types";
import { MS_TO_KMH } from "../types";

/** Several IActivity fields are typed `unknown` upstream (power, bike cadence). */
function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function mapGarminActivityToSession(
  activity: IActivity,
  trainingId: string,
  userId: string,
) {
  // beginTimestamp is epoch millis (UTC); startTimeLocal reflects the
  // activity's timezone and is the calendar day the user expects.
  const startAt = new Date(activity.beginTimestamp);
  const dateStr = activity.startTimeLocal.slice(0, 10);
  const movingSeconds = activity.movingDuration || activity.duration;
  const elapsedSeconds = activity.elapsedDuration || activity.duration;
  const durationMin = Math.round(movingSeconds / 60);
  const cadence = asNumber(activity.averageBikingCadenceInRevPerMinute);
  const avgPower = asNumber(activity.avgPower);

  return {
    session: {
      userId,
      trainingId,
      type: "cardio" as const,
      status: "completed" as const,
      startAt,
      endAt: new Date(startAt.getTime() + elapsedSeconds * 1000),
      durationMin,
      garminActivityId: String(activity.activityId),
      date: dateStr,
      notes: activity.activityName,
    },
    cardio: {
      durationMin,
      distanceKm: (activity.distance / 1000).toFixed(2),
      kcal: activity.calories ? Math.round(activity.calories) : null,
      avgHr: activity.averageHR ? Math.round(activity.averageHR) : null,
      cadence: cadence ? Math.round(cadence) : null,
      avgSpeedKmh: (activity.averageSpeed * MS_TO_KMH).toFixed(2),
      maxSpeedKmh: activity.maxSpeed
        ? (activity.maxSpeed * MS_TO_KMH).toFixed(2)
        : null,
      avgPowerW: avgPower ? Math.round(avgPower) : null,
      notes: activity.activityName,
    },
  };
}
