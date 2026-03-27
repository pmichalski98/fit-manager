export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  athlete: StravaAthlete;
}

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  max_watts?: number;
  kilojoules?: number;
  calories?: number;
  device_watts?: boolean;
  trainer: boolean;
  commute: boolean;
}

export interface StravaWebhookEvent {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  owner_id: number;
  subscription_id: number;
  event_time: number;
  updates?: Record<string, string>;
}

export const STRAVA_TRAINING_NAME = "Strava Cycling";

export const MS_TO_KMH = 3.6;

export const CYCLING_SPORT_TYPES = [
  "Ride",
  "MountainBikeRide",
  "EBikeRide",
  "VirtualRide",
  "GravelRide",
] as const;

export function isCyclingActivity(activity: StravaActivity): boolean {
  return (CYCLING_SPORT_TYPES as readonly string[]).includes(
    activity.sport_type,
  );
}
