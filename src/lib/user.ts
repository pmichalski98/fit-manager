"server only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

export async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  // Pages render in parallel with the (protected) layout, so an expired
  // session must redirect here too — a throw would land in the error log
  // before the layout's redirect kicks in.
  if (!userId) redirect("/sign-in");
  return userId;
}
