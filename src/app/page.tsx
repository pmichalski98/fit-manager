import { auth } from "@/lib/auth";
import { REDIRECT_URL } from "@/lib/constants";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user) {
    return redirect(REDIRECT_URL);
  }
  return <main></main>;
}
