import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

class UserRepository {
  async findUserById(userId: string) {
    const [row] = await db.select().from(user).where(eq(user.id, userId));
    return row ?? null;
  }

  async updateCaloricGoal(userId: string, caloricGoal: number) {
    const [row] = await db
      .update(user)
      .set({ caloricGoal, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning();
    return row ?? null;
  }

  async findCaloricGoal(userId: string) {
    const [row] = await db.select().from(user).where(eq(user.id, userId));
    return row?.caloricGoal ?? null;
  }
}
export const userRepository = new UserRepository();
