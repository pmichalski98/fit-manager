import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function findUserById(id: string) {
  const [row] = await db.select().from(user).where(eq(user.id, id));
  return row ?? null;
}

export async function updateCaloricGoal(
  id: string,
  caloricGoal: number | null,
) {
  const [row] = await db
    .update(user)
    .set({ caloricGoal, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning();
  return row;
}
