import type { StravaActivity } from "../types";
import { MS_TO_KMH } from "../types";

export function mapStravaActivityToSession(
  activity: StravaActivity,
  trainingId: string,
  userId: string,
) {
  const startDate = new Date(activity.start_date);
  const dateStr = startDate.toISOString().split("T")[0]!;
  const durationMin = Math.round(activity.moving_time / 60);

  return {
    session: {
      userId,
      trainingId,
      type: "cardio" as const,
      status: "completed" as const,
      startAt: startDate,
      endAt: new Date(startDate.getTime() + activity.elapsed_time * 1000),
      durationMin,
      stravaActivityId: String(activity.id),
      date: dateStr,
      notes: activity.name,
    },
    cardio: {
      durationMin,
      distanceKm: (activity.distance / 1000).toFixed(2),
      kcal: activity.calories ? Math.round(activity.calories) : null,
      avgHr: activity.average_heartrate
        ? Math.round(activity.average_heartrate)
        : null,
      cadence: activity.average_cadence
        ? Math.round(activity.average_cadence)
        : null,
      avgSpeedKmh: (activity.average_speed * MS_TO_KMH).toFixed(2),
      maxSpeedKmh: activity.max_speed
        ? (activity.max_speed * MS_TO_KMH).toFixed(2)
        : null,
      avgPowerW: activity.average_watts
        ? Math.round(activity.average_watts)
        : null,
      notes: activity.name,
    },
  };
}
