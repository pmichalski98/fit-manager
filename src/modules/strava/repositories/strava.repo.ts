import { db } from "@/server/db";
import {
  stravaAccount,
  training,
  trainingSession,
  trainingSessionCardio,
} from "@/server/db/schema";
import { and, count, eq, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import type { mapStravaActivityToSession } from "../lib/strava-mapper";
import { STRAVA_TRAINING_NAME } from "../types";

type MappedSession = ReturnType<typeof mapStravaActivityToSession>;

class StravaRepository {
  async findByUserId(userId: string) {
    const [account] = await db
      .select()
      .from(stravaAccount)
      .where(eq(stravaAccount.userId, userId));
    return account ?? null;
  }

  async findByAthleteId(athleteId: string) {
    const [account] = await db
      .select()
      .from(stravaAccount)
      .where(eq(stravaAccount.stravaAthleteId, athleteId));
    return account ?? null;
  }

  async upsert(
    userId: string,
    data: {
      stravaAthleteId: string;
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;
      scope: string | null;
    },
  ) {
    const [row] = await db
      .insert(stravaAccount)
      .values({ userId, ...data })
      .onConflictDoUpdate({
        target: stravaAccount.userId,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return row!;
  }

  async updateTokens(
    id: string,
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;
    },
  ) {
    await db
      .update(stravaAccount)
      .set({ ...tokens, updatedAt: new Date() })
      .where(eq(stravaAccount.id, id));
  }

  async updateWebhookSubscriptionId(
    userId: string,
    webhookSubscriptionId: string | null,
  ) {
    await db
      .update(stravaAccount)
      .set({ webhookSubscriptionId, updatedAt: new Date() })
      .where(eq(stravaAccount.userId, userId));
  }

  async delete(userId: string) {
    await db
      .delete(stravaAccount)
      .where(eq(stravaAccount.userId, userId));
  }

  async findOrCreateStravaTraining(userId: string) {
    const [existing] = await db
      .select()
      .from(training)
      .where(
        and(
          eq(training.userId, userId),
          eq(training.name, STRAVA_TRAINING_NAME),
          eq(training.type, "cardio"),
        ),
      );
    if (existing) return existing;

    const [created] = await db
      .insert(training)
      .values({
        userId,
        name: STRAVA_TRAINING_NAME,
        type: "cardio",
      })
      .onConflictDoNothing()
      .returning();

    // If conflict (race condition), fetch the existing row
    if (!created) {
      const [raced] = await db
        .select()
        .from(training)
        .where(
          and(
            eq(training.userId, userId),
            eq(training.name, STRAVA_TRAINING_NAME),
            eq(training.type, "cardio"),
          ),
        );
      return raced!;
    }

    return created;
  }

  async importStravaSession(mapped: MappedSession) {
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

      // Update training lastSessionAt if this session is more recent
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

  async stravaActivityExists(stravaActivityId: string) {
    const [existing] = await db
      .select({ id: trainingSession.id })
      .from(trainingSession)
      .where(eq(trainingSession.stravaActivityId, stravaActivityId));
    return !!existing;
  }

  async findExistingStravaActivityIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await db
      .select({ stravaActivityId: trainingSession.stravaActivityId })
      .from(trainingSession)
      .where(inArray(trainingSession.stravaActivityId, ids));
    return new Set(rows.map((r) => r.stravaActivityId!));
  }

  async countImportedSessions(userId: string) {
    const [result] = await db
      .select({ count: count() })
      .from(trainingSession)
      .where(
        and(
          eq(trainingSession.userId, userId),
          isNotNull(trainingSession.stravaActivityId),
        ),
      );
    return result?.count ?? 0;
  }
}

export const stravaRepository = new StravaRepository();
