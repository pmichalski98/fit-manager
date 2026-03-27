import { env } from "@/env";
import { auth } from "@/lib/auth";
import { createHmac } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Strava not configured" },
      { status: 500 },
    );
  }

  const state = signState(session.user.id);
  const callbackUrl = `${env.BETTER_AUTH_URL}/api/strava/auth/callback`;

  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "activity:read_all",
    approval_prompt: "auto",
    state,
  });

  return NextResponse.redirect(
    `https://www.strava.com/oauth/authorize?${params.toString()}`,
  );
}

function signState(userId: string): string {
  const hmac = createHmac("sha256", env.BETTER_AUTH_SECRET);
  hmac.update(userId);
  const signature = hmac.digest("hex");
  return `${userId}.${signature}`;
}
