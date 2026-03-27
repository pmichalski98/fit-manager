import { stravaRepository } from "../repositories/strava.repo";
import { isCyclingActivity, type StravaActivity } from "../types";
import { mapStravaActivityToSession } from "./strava-mapper";

export async function importSingleActivity(
  activity: StravaActivity,
  userId: string,
): Promise<"imported" | "skipped" | "not_cycling"> {
  if (!isCyclingActivity(activity)) return "not_cycling";

  const exists = await stravaRepository.stravaActivityExists(
    String(activity.id),
  );
  if (exists) return "skipped";

  const stravaTraining =
    await stravaRepository.findOrCreateStravaTraining(userId);
  const mapped = mapStravaActivityToSession(
    activity,
    stravaTraining.id,
    userId,
  );
  await stravaRepository.importStravaSession(mapped);
  return "imported";
}
