import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().url(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    DATABASE_URL: z.string().url(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    AWS_S3_BUCKET_NAME: z.string(),
    STRAVA_CLIENT_ID: z.string().optional(),
    STRAVA_CLIENT_SECRET: z.string().optional(),
    STRAVA_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
    FITATU_USERNAME: z.string().optional(),
    FITATU_PASSWORD: z.string().optional(),
    FITATU_API_SECRET: z.string().optional(),
    FITATU_SYNC_SECRET: z.string().optional(),
    FITATU_SYNC_USER_EMAIL: z.string().email().optional(),
    HEALTH_EXPORT_SECRET: z.string().optional(),
    HEALTH_EXPORT_USER_EMAIL: z.string().email().optional(),
    OPENAI_API_KEY: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
    STRAVA_WEBHOOK_VERIFY_TOKEN: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN,
    FITATU_USERNAME: process.env.FITATU_USERNAME,
    FITATU_PASSWORD: process.env.FITATU_PASSWORD,
    FITATU_API_SECRET: process.env.FITATU_API_SECRET,
    FITATU_SYNC_SECRET: process.env.FITATU_SYNC_SECRET,
    FITATU_SYNC_USER_EMAIL: process.env.FITATU_SYNC_USER_EMAIL,
    HEALTH_EXPORT_SECRET: process.env.HEALTH_EXPORT_SECRET,
    HEALTH_EXPORT_USER_EMAIL: process.env.HEALTH_EXPORT_USER_EMAIL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
