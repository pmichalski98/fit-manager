import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export type DailyGoalSettings = {
  caloricGoal: number | null;
  stepsGoal: number | null;
  weeklyTrainingGoal: number | null;
  goalTrainingEnabled: boolean;
  goalStepsEnabled: boolean;
  goalWeightEnabled: boolean;
  goalKcalEnabled: boolean;
};

class UserRepository {
  async findUserById(userId: string) {
    const [row] = await db.select().from(user).where(eq(user.id, userId));
    return row ?? null;
  }

  async updateDailyGoals(userId: string, goals: DailyGoalSettings) {
    const [row] = await db
      .update(user)
      .set({ ...goals, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning();
    return row ?? null;
  }

  async findCaloricGoal(userId: string) {
    const [row] = await db
      .select({ caloricGoal: user.caloricGoal })
      .from(user)
      .where(eq(user.id, userId));
    return row?.caloricGoal ?? null;
  }

  async findGoalSettings(userId: string): Promise<DailyGoalSettings | null> {
    const [row] = await db
      .select({
        caloricGoal: user.caloricGoal,
        stepsGoal: user.stepsGoal,
        weeklyTrainingGoal: user.weeklyTrainingGoal,
        goalTrainingEnabled: user.goalTrainingEnabled,
        goalStepsEnabled: user.goalStepsEnabled,
        goalWeightEnabled: user.goalWeightEnabled,
        goalKcalEnabled: user.goalKcalEnabled,
      })
      .from(user)
      .where(eq(user.id, userId));
    return row ?? null;
  }
}
export const userRepository = new UserRepository();
