"use server";

import { env } from "@/env";
import { requireUserId } from "@/lib/user";
import { revalidatePath } from "next/cache";
import { StravaClient } from "./lib/strava-client";
import { mapStravaActivityToSession } from "./lib/strava-mapper";
import { stravaRepository } from "./repositories/strava.repo";
import { isCyclingActivity } from "./types";

const STRAVA_SUBSCRIPTIONS_URL =
  "https://www.strava.com/api/v3/push_subscriptions";

interface StravaSubscription {
  id: number;
  callback_url: string;
  created_at: string;
  updated_at: string;
}

function subscriptionParams() {
  return new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID!,
    client_secret: env.STRAVA_CLIENT_SECRET!,
  });
}

function requireStravaEnv() {
  if (!env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) {
    return { ok: false as const, error: "Strava env vars not configured" };
  }
  return null;
}

export async function getStravaConnectionStatus() {
  const userId = await requireUserId();
  const account = await stravaRepository.findByUserId(userId);

  if (!account) {
    return { connected: false as const };
  }

  const importedCount = await stravaRepository.countImportedSessions(userId);

  return {
    connected: true as const,
    athleteId: account.stravaAthleteId,
    importedCount,
    webhookActive: !!account.webhookSubscriptionId,
  };
}

export async function enableStravaWebhook() {
  const userId = await requireUserId();

  const envError = requireStravaEnv();
  if (envError) return envError;

  if (!env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return { ok: false, error: "Strava webhook verify token not configured" };
  }

  const account = await stravaRepository.findByUserId(userId);
  if (!account) return { ok: false, error: "Strava not connected" };

  // Check if already subscribed locally
  if (account.webhookSubscriptionId) {
    return { ok: true, data: { alreadyActive: true } };
  }

  const callbackUrl = `${env.BETTER_AUTH_URL}/api/strava/webhook`;

  const res = await fetch(STRAVA_SUBSCRIPTIONS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      callback_url: callbackUrl,
      verify_token: env.STRAVA_WEBHOOK_VERIFY_TOKEN,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      ok: false,
      error: `Strava webhook registration failed: ${body}`,
    };
  }

  const data = (await res.json()) as { id: number };
  await stravaRepository.updateWebhookSubscriptionId(
    userId,
    String(data.id),
  );

  return { ok: true, data: { alreadyActive: false } };
}

export async function disableStravaWebhook() {
  const userId = await requireUserId();

  const envError = requireStravaEnv();
  if (envError) return envError;

  const account = await stravaRepository.findByUserId(userId);
  if (!account) return { ok: false, error: "Strava not connected" };

  if (!account.webhookSubscriptionId) {
    return { ok: true };
  }

  const params = subscriptionParams();
  const del = await fetch(
    `${STRAVA_SUBSCRIPTIONS_URL}/${account.webhookSubscriptionId}?${params}`,
    { method: "DELETE" },
  );

  if (!del.ok) {
    const body = await del.text();
    return {
      ok: false,
      error: `Failed to delete subscription: ${body}`,
    };
  }

  await stravaRepository.updateWebhookSubscriptionId(userId, null);

  return { ok: true };
}

export async function importStravaActivities() {
  const userId = await requireUserId();
  const account = await stravaRepository.findByUserId(userId);

  if (!account) {
    return { ok: false, error: "Strava not connected" };
  }

  const stravaTraining =
    await stravaRepository.findOrCreateStravaTraining(userId);
  const client = new StravaClient(account);

  const allActivities = await client.getAllActivities();

  // Filter to cycling only
  const cyclingActivities = allActivities.filter(isCyclingActivity);

  // Batch check which ones already exist
  const activityIds = cyclingActivities.map((a) => String(a.id));
  const existingIds =
    await stravaRepository.findExistingStravaActivityIds(activityIds);

  let imported = 0;
  let skipped = 0;

  for (const activity of cyclingActivities) {
    if (existingIds.has(String(activity.id))) {
      skipped++;
      continue;
    }

    const mapped = mapStravaActivityToSession(
      activity,
      stravaTraining.id,
      userId,
    );
    await stravaRepository.importStravaSession(mapped);
    imported++;
  }

  revalidatePath("/training");
  revalidatePath("/dashboard");

  return { ok: true, data: { imported, skipped } };
}

export async function disconnectStrava() {
  const userId = await requireUserId();
  const account = await stravaRepository.findByUserId(userId);

  if (!account) {
    return { ok: false, error: "Strava not connected" };
  }

  // Revoke access on Strava's side
  try {
    await fetch("https://www.strava.com/oauth/deauthorize", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        access_token: account.accessToken,
      }),
    });
  } catch {
    // Continue even if deauth fails — we still remove locally
  }

  await stravaRepository.delete(userId);

  revalidatePath("/training");
  return { ok: true };
}
