import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { REDIRECT_URL } from "@/lib/constants";
import SignUpView from "@/modules/auth/ui/views/sign-up-view";

export default async function SignUpPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user) {
    redirect(REDIRECT_URL);
  }
  return <SignUpView />;
}
