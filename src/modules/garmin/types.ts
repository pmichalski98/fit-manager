import type { IActivity } from "garmin-connect/dist/garmin/types/activity";

export type { IActivity };

export const MS_TO_KMH = 3.6;

// Garmin activity taxonomy: "cycling" (typeId 2) is the parent category of
// every bike subtype, so subtypes carry parentTypeId 2.
const CYCLING_PARENT_TYPE_ID = 2;

const CYCLING_TYPE_KEYS = new Set([
  "cycling",
  "road_biking",
  "mountain_biking",
  "gravel_cycling",
  "cyclocross",
  "downhill_biking",
  "track_cycling",
  "recumbent_cycling",
  "indoor_cycling",
  "virtual_ride",
  "e_bike_fitness",
  "e_bike_mountain",
  "bmx",
]);

export function isCyclingActivity(activity: IActivity): boolean {
  return (
    CYCLING_TYPE_KEYS.has(activity.activityType.typeKey) ||
    activity.activityType.parentTypeId === CYCLING_PARENT_TYPE_ID
  );
}

/**
 * Window for cross-provider dedup: a Garmin activity whose start lies within
 * this range of an existing cardio session (e.g. one imported from Strava
 * before the API got paywalled) is the same ride recorded by the same device.
 */
export const DUPLICATE_SESSION_TOLERANCE_MS = 3 * 60 * 1000;
