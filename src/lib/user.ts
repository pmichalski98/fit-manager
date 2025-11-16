"server only";

import { headers } from "next/headers";
import { auth } from "./auth";

export async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
