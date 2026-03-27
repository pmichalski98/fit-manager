import { env } from "@/env";
import { stravaRepository } from "../repositories/strava.repo";
import type { StravaAccount } from "@/server/db/schema";
import type { StravaActivity, StravaTokenResponse } from "../types";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
const MAX_PAGES = 50; // Safety limit: 50 pages × 200 = 10,000 activities max

export class StravaClient {
  private account: StravaAccount;

  constructor(account: StravaAccount) {
    this.account = account;
  }

  private async ensureValidToken(): Promise<string> {
    const now = Date.now();
    const expiresAt = this.account.expiresAt.getTime();

    if (expiresAt - now > TOKEN_REFRESH_BUFFER_MS) {
      return this.account.accessToken;
    }

    const res = await fetch(`${STRAVA_API_BASE}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: this.account.refreshToken,
      }),
    });

    if (!res.ok) {
      throw new Error(`Strava token refresh failed: ${res.status}`);
    }

    const data = (await res.json()) as StravaTokenResponse;

    const newTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * 1000),
    };

    await stravaRepository.updateTokens(this.account.id, newTokens);

    this.account = { ...this.account, ...newTokens };
    return this.account.accessToken;
  }

  private async request<T>(path: string): Promise<T> {
    const token = await this.ensureValidToken();
    const res = await fetch(`${STRAVA_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Strava API error: ${res.status} ${path}`);
    }

    return res.json() as Promise<T>;
  }

  async getActivities(
    page: number,
    perPage = 200,
  ): Promise<StravaActivity[]> {
    return this.request<StravaActivity[]>(
      `/athlete/activities?page=${page}&per_page=${perPage}`,
    );
  }

  async getActivity(id: number): Promise<StravaActivity> {
    return this.request<StravaActivity>(`/activities/${id}`);
  }

  async getAllActivities(): Promise<StravaActivity[]> {
    const all: StravaActivity[] = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      const batch = await this.getActivities(page);
      if (batch.length === 0) break;
      all.push(...batch);
      page++;
    }

    return all;
  }
}
