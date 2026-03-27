import { env } from "@/env";
import { importSingleActivity } from "@/modules/strava/lib/import-activity";
import { StravaClient } from "@/modules/strava/lib/strava-client";
import { stravaRepository } from "@/modules/strava/repositories/strava.repo";
import type { StravaWebhookEvent } from "@/modules/strava/types";
import { NextResponse, type NextRequest } from "next/server";

// Strava subscription verification (one-time handshake)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = searchParams.get("hub.verify_token");

  if (
    mode === "subscribe" &&
    verifyToken === env.STRAVA_WEBHOOK_VERIFY_TOKEN &&
    challenge
  ) {
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Strava event handler
export async function POST(request: NextRequest) {
  const event = (await request.json()) as StravaWebhookEvent;

  // Only handle activity creates (ignore updates/deletes — user's data stays)
  if (event.object_type !== "activity" || event.aspect_type !== "create") {
    return NextResponse.json({ ok: true });
  }

  // Validate subscription_id against our stored subscription
  const account = await stravaRepository.findByAthleteId(
    String(event.owner_id),
  );
  if (!account) {
    return NextResponse.json({ ok: true });
  }

  if (
    !account.webhookSubscriptionId ||
    String(event.subscription_id) !== account.webhookSubscriptionId
  ) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 403 });
  }

  // Fire and forget — Strava expects 200 within 2 seconds
  void handleActivityCreate(event, account.userId).catch(console.error);

  return NextResponse.json({ ok: true });
}

async function handleActivityCreate(
  event: StravaWebhookEvent,
  userId: string,
) {
  const account = await stravaRepository.findByAthleteId(
    String(event.owner_id),
  );
  if (!account) return;

  const client = new StravaClient(account);
  const activity = await client.getActivity(event.object_id);

  await importSingleActivity(activity, userId);
}
