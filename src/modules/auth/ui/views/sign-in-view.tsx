"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { REDIRECT_URL } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { DumbbellIcon, OctagonAlertIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { z } from "zod";

const SignInSchema = z.object({
  email: z.email(),
  password: z.string().nonempty({ message: "Password is required" }),
});

type SignInFormValues = z.infer<typeof SignInSchema>;

export default function SignInView() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSocialSignIn = (provider: "github" | "google") => {
    setError(null);
    setIsLoading(true);
    void authClient.signIn.social(
      { provider, callbackURL: REDIRECT_URL },
      {
        onSuccess: () => {
          setIsLoading(false);
        },
        onError: ({ error }) => {
          setIsLoading(false);
          setError(error.message);
        },
      },
    );
  };

  const onSubmit = (data: SignInFormValues) => {
    setError(null);
    setIsLoading(true);
    void authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: () => {
          setIsLoading(false);
          router.push(REDIRECT_URL);
        },
        onError: ({ error }) => {
          setIsLoading(false);
          setError(error.message);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-[22px] font-bold tracking-tight">
                    Welcome back
                  </h1>
                  <p className="text-muted-foreground mt-1 text-[11px] font-medium tracking-[0.08em] uppercase">
                    Login to your account
                  </p>
                </div>
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="JohnDoe@gmail.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="********"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {!!error && (
                    <div className="border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-2.5 rounded-sm border px-3.5 py-2.5 text-xs">
                      <OctagonAlertIcon className="size-3.5 shrink-0" />
                      {error}
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
                <div className="after:border-border relative text-center after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-faint relative z-10 px-2 text-[10px] font-semibold tracking-[0.1em] uppercase">
                    Or continue with
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                    onClick={() => onSocialSignIn("google")}
                  >
                    <FaGoogle className="size-3.5" />
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                    onClick={() => onSocialSignIn("github")}
                  >
                    <FaGithub className="size-3.5" />
                    Github
                  </Button>
                </div>
                <div className="text-secondary-foreground text-center text-xs">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="text-primary underline underline-offset-4"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          </Form>
          <div className="bg-background hidden flex-col items-center justify-center gap-4 border-l md:flex">
            <span className="bg-primary flex size-16 items-center justify-center rounded-[14px]">
              <DumbbellIcon
                className="text-primary-foreground size-9"
                strokeWidth={2.5}
              />
            </span>
            <p className="text-[13px] font-bold tracking-[0.06em] uppercase">
              Fit Manager
            </p>
            <p className="text-faint font-mono text-[11px]">
              train · eat · track
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-faint *:[a]:hover:text-primary text-center text-[11px] text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>
      </div>
    </div>
  );
}
