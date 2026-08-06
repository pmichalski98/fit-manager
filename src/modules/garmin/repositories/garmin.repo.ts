import { db } from "@/server/db";
import {
  garminAccount,
  training,
  trainingSession,
  trainingSessionCardio,
} from "@/server/db/schema";
import { and, eq, gte, inArray, isNull, lt, lte, or } from "drizzle-orm";
import type {
  IOauth1Token,
  IOauth2Token,
} from "garmin-connect/dist/garmin/types";
import type { mapGarminActivityToSession } from "../lib/garmin-mapper";

type MappedSession = ReturnType<typeof mapGarminActivityToSession>;

export type GarminTokens = {
  oauth1Token: IOauth1Token | null;
  oauth2Token: IOauth2Token | null;
};

class GarminRepository {
  async findTokens(userId: string): Promise<GarminTokens | null> {
    const [account] = await db
      .select()
      .from(garminAccount)
      .where(eq(garminAccount.userId, userId));
    if (!account) return null;
    return {
      oauth1Token: (account.oauth1Token as IOauth1Token) ?? null,
      oauth2Token: (account.oauth2Token as IOauth2Token) ?? null,
    };
  }

  async saveTokens(
    userId: string,
    tokens: { oauth1Token: IOauth1Token; oauth2Token: IOauth2Token },
  ) {
    await db
      .insert(garminAccount)
      .values({ userId, ...tokens })
      .onConflictDoUpdate({
        target: garminAccount.userId,
        set: { ...tokens, updatedAt: new Date() },
      });
  }

  async findExistingGarminActivityIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await db
      .select({ garminActivityId: trainingSession.garminActivityId })
      .from(trainingSession)
      .where(inArray(trainingSession.garminActivityId, ids));
    return new Set(rows.map((r) => r.garminActivityId!));
  }

  /**
   * Detects the same ride already imported from another provider (Strava era):
   * any cardio session of this user starting within the tolerance window.
   */
  async hasCardioSessionNear(
    userId: string,
    startAt: Date,
    toleranceMs: number,
  ) {
    const [existing] = await db
      .select({ id: trainingSession.id })
      .from(trainingSession)
      .where(
        and(
          eq(trainingSession.userId, userId),
          eq(trainingSession.type, "cardio"),
          gte(
            trainingSession.startAt,
            new Date(startAt.getTime() - toleranceMs),
          ),
          lte(
            trainingSession.startAt,
            new Date(startAt.getTime() + toleranceMs),
          ),
        ),
      )
      .limit(1);
    return !!existing;
  }

  async importGarminSession(mapped: MappedSession) {
    return await db.transaction(async (tx) => {
      const [session] = await tx
        .insert(trainingSession)
        .values(mapped.session)
        .returning();
      if (!session) throw new Error("Failed to insert training session");

      await tx.insert(trainingSessionCardio).values({
        sessionId: session.id,
        ...mapped.cardio,
      });

      await tx
        .update(training)
        .set({ lastSessionAt: session.startAt })
        .where(
          and(
            eq(training.id, mapped.session.trainingId),
            or(
              isNull(training.lastSessionAt),
              lt(training.lastSessionAt, session.startAt),
            ),
          ),
        );

      return session;
    });
  }
}

export const garminRepository = new GarminRepository();
