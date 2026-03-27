import { env } from "@/env";
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { stravaRepository } from "@/modules/strava/repositories/strava.repo";
import type { StravaTokenResponse } from "@/modules/strava/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      `${env.BETTER_AUTH_URL}/training?strava=error`,
    );
  }

  const userId = verifyState(state);
  if (!userId) {
    return NextResponse.redirect(
      `${env.BETTER_AUTH_URL}/training?strava=error`,
    );
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      `${env.BETTER_AUTH_URL}/training?strava=error`,
    );
  }

  const data = (await tokenRes.json()) as StravaTokenResponse;

  // Save Strava account
  await stravaRepository.upsert(userId, {
    stravaAthleteId: String(data.athlete.id),
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at * 1000),
    scope: "activity:read_all",
  });

  // Auto-create "Strava Cycling" training template
  await stravaRepository.findOrCreateStravaTraining(userId);

  return NextResponse.redirect(
    `${env.BETTER_AUTH_URL}/training?strava=connected`,
  );
}

function verifyState(state: string): string | null {
  const dotIndex = state.indexOf(".");
  if (dotIndex === -1) return null;

  const userId = state.slice(0, dotIndex);
  const signature = state.slice(dotIndex + 1);

  const hmac = createHmac("sha256", env.BETTER_AUTH_SECRET);
  hmac.update(userId);
  const expected = hmac.digest("hex");

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
    return null;
  return userId;
}
