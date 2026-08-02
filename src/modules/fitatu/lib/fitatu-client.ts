import { env } from "@/env";
import type { FitatuDayResponse, FitatuLoginResponse } from "../types";

// Unofficial API used by the Fitatu web app itself. Endpoints reverse-engineered
// by https://github.com/karolswitala/fitatu-mcp and https://github.com/Jezue/fitatu_library
// Auth works on any regional host, but diary data lives only on the cluster
// matching the account's locale (ROLE_LOCALE_* in the JWT) — other clusters
// return an empty day scaffold instead of an error.
const FITATU_DEFAULT_LOCALE = "pl-pl";
const fitatuApiBase = (locale: string) => `https://${locale}.fitatu.com/api`;

// "api-secret" is the Fitatu web app's own application secret. If it rotates,
// grab the current value from DevTools (any authenticated request on fitatu.com).
const DEFAULT_API_SECRET = "PYRXtfs88UDJMuCCrNpLV";

const REQUEST_TIMEOUT_MS = 20_000;

export class FitatuAuthError extends Error {}

function baseHeaders(): Record<string, string> {
  return {
    accept: "application/json; version=v3",
    "api-key": "FITATU-MOBILE-APP",
    "api-secret": env.FITATU_API_SECRET ?? DEFAULT_API_SECRET,
    "app-os": "FITATU-WEB",
    "app-version": "4.5.4",
    "app-uuid": "64c2d1b0-c8ad-11e8-8956-0242ac120008",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "content-type": "application/json",
  };
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 3) return null;
  try {
    const json = Buffer.from(parts[1]!, "base64url").toString("utf-8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Maps e.g. ROLE_LOCALE_EN_GB -> "en-gb" (the account's data cluster). */
function extractLocaleFromToken(token: string): string | null {
  const roles = decodeJwtPayload(token)?.roles;
  if (!Array.isArray(roles)) return null;
  for (const role of roles) {
    const match = /^ROLE_LOCALE_([A-Z]{2})_([A-Z]{2})$/.exec(String(role));
    if (match) return `${match[1]!.toLowerCase()}-${match[2]!.toLowerCase()}`;
  }
  return null;
}

function extractUserIdFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  for (const key of ["user_id", "uid", "id", "sub"]) {
    const value = payload[key];
    if (value !== undefined && value !== null && /^\d+$/.test(String(value))) {
      return String(value);
    }
  }
  return null;
}

export class FitatuClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private userId: string | null = null;
  private locale: string = FITATU_DEFAULT_LOCALE;

  constructor(
    private readonly username: string,
    private readonly password: string,
  ) {}

  async login(): Promise<void> {
    const res = await fetch(`${fitatuApiBase(FITATU_DEFAULT_LOCALE)}/login`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({
        _username: this.username,
        _password: this.password,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new FitatuAuthError(`Fitatu login failed: ${res.status}`);
    }

    const data = (await res.json()) as FitatuLoginResponse;
    const token = data.token ?? data.access_token;
    if (!token) {
      throw new FitatuAuthError("Fitatu login response has no token");
    }

    this.token = token;
    this.refreshToken = data.refresh_token ?? data.refreshToken ?? null;
    this.userId = extractUserIdFromToken(token);
    this.locale = extractLocaleFromToken(token) ?? FITATU_DEFAULT_LOCALE;

    if (!this.userId) {
      throw new FitatuAuthError("Could not determine Fitatu user id from JWT");
    }
  }

  private async tryRefresh(): Promise<boolean> {
    if (!this.refreshToken) return false;

    // The refresh endpoint's expected payload key is not stable across app
    // versions, so try the known variants in order.
    const variants = [
      { refresh_token: this.refreshToken },
      { refreshToken: this.refreshToken },
      { token: this.refreshToken },
    ];

    for (const payload of variants) {
      const res = await fetch(
        `${fitatuApiBase(FITATU_DEFAULT_LOCALE)}/token/refresh`,
        {
          method: "POST",
          headers: baseHeaders(),
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
      if (!res.ok) continue;

      const data = (await res.json()) as FitatuLoginResponse;
      const token = data.token ?? data.access_token;
      if (!token) continue;

      this.token = token;
      this.refreshToken =
        data.refresh_token ?? data.refreshToken ?? this.refreshToken;
      this.userId = extractUserIdFromToken(token) ?? this.userId;
      this.locale = extractLocaleFromToken(token) ?? this.locale;
      return true;
    }
    return false;
  }

  /** Fetches the diet plan for a single day (YYYY-MM-DD). */
  async getDay(date: string): Promise<FitatuDayResponse> {
    if (!this.token || !this.userId) {
      await this.login();
    }

    const doFetch = () =>
      fetch(
        `${fitatuApiBase(this.locale)}/diet-and-activity-plan/${this.userId}/day/${date}`,
        {
          headers: {
            ...baseHeaders(),
            authorization: `Bearer ${this.token}`,
            "api-cluster": `${this.locale}${this.userId}`,
          },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );

    let res = await doFetch();
    if (res.status === 401) {
      if (!(await this.tryRefresh())) {
        await this.login();
      }
      res = await doFetch();
    }

    if (!res.ok) {
      throw new Error(`Fitatu get day ${date} failed: ${res.status}`);
    }

    return (await res.json()) as FitatuDayResponse;
  }
}
