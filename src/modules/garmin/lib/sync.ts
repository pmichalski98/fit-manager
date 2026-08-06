import { eq } from "drizzle-orm";
import { GarminConnect } from "garmin-connect";
import { ActivityType } from "garmin-connect/dist/garmin/types/activity";

import { env } from "@/env";
import { stravaRepository } from "@/modules/strava/repositories/strava.repo";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { garminRepository } from "../repositories/garmin.repo";
import {
  DUPLICATE_SESSION_TOLERANCE_MS,
  isCyclingActivity,
  type IActivity,
} from "../types";
import { mapGarminActivityToSession } from "./garmin-mapper";

export type GarminSyncResult = {
  fetched: number;
  imported: { date: string; name: string; distanceKm: string }[];
  alreadyImported: number;
  skippedDuplicates: number;
};

async function resolveUserId(): Promise<string> {
  const syncEmail = env.GARMIN_SYNC_USER_EMAIL ?? env.FITATU_SYNC_USER_EMAIL;
  if (!syncEmail) {
    throw new Error(
      "Garmin sync is not configured: set GARMIN_SYNC_USER_EMAIL (or FITATU_SYNC_USER_EMAIL)",
    );
  }
  const [appUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, syncEmail));
  if (!appUser) throw new Error(`No app user with email ${syncEmail}`);
  return appUser.id;
}

/**
 * Fetches recent cycling activities via garmin-connect. Prefers tokens
 * persisted in garmin_account (OAuth2 is auto-refreshed from OAuth1 before
 * each request); falls back to a fresh password login when tokens are
 * missing or rejected.
 */
async function fetchActivities(
  userId: string,
  limit: number,
): Promise<IActivity[]> {
  if (!env.GARMIN_USERNAME || !env.GARMIN_PASSWORD) {
    throw new Error(
      "Garmin sync is not configured: set GARMIN_USERNAME and GARMIN_PASSWORD",
    );
  }

  const client = new GarminConnect({
    username: env.GARMIN_USERNAME,
    password: env.GARMIN_PASSWORD,
  });

  const stored = await garminRepository.findTokens(userId);
  const hasStoredTokens = !!(stored?.oauth1Token && stored.oauth2Token);
  if (hasStoredTokens) {
    client.loadToken(stored.oauth1Token!, stored.oauth2Token!);
  } else {
    await client.login();
  }

  let activities: IActivity[];
  try {
    activities = await client.getActivities(0, limit, ActivityType.Cycling);
  } catch (error) {
    if (!hasStoredTokens) throw error;
    // Stored tokens expired or were revoked — retry once with a fresh login.
    await client.login();
    activities = await client.getActivities(0, limit, ActivityType.Cycling);
  }

  const tokens = client.exportToken();
  await garminRepository.saveTokens(userId, {
    oauth1Token: tokens.oauth1,
    oauth2Token: tokens.oauth2,
  });

  return activities;
}

export async function syncGarminActivities(
  limit: number,
): Promise<GarminSyncResult> {
  const userId = await resolveUserId();
  const activities = await fetchActivities(userId, limit);
  const cycling = activities.filter(isCyclingActivity);

  const existingIds = await garminRepository.findExistingGarminActivityIds(
    cycling.map((a) => String(a.activityId)),
  );

  const result: GarminSyncResult = {
    fetched: cycling.length,
    imported: [],
    alreadyImported: existingIds.size,
    skippedDuplicates: 0,
  };

  const fresh = cycling.filter((a) => !existingIds.has(String(a.activityId)));
  if (fresh.length === 0) return result;

  const trainingTemplate =
    await stravaRepository.findOrCreateStravaTraining(userId);

  for (const activity of fresh) {
    const mapped = mapGarminActivityToSession(
      activity,
      trainingTemplate.id,
      userId,
    );

    // Same ride may already exist as a Strava-imported session from before
    // the Strava API got paywalled — match by start time, not provider id.
    const isDuplicate = await garminRepository.hasCardioSessionNear(
      userId,
      mapped.session.startAt,
      DUPLICATE_SESSION_TOLERANCE_MS,
    );
    if (isDuplicate) {
      result.skippedDuplicates++;
      continue;
    }

    await garminRepository.importGarminSession(mapped);
    result.imported.push({
      date: mapped.session.date,
      name: mapped.session.notes,
      distanceKm: mapped.cardio.distanceKm,
    });
  }

  return result;
}
