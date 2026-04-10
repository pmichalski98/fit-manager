"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOutIcon, Moon, Sun, UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/navigation";
import GeneratedAvatar from "@/components/generated.avatar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const [userSheetOpen, setUserSheetOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <nav className="bg-background/90 fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 pb-2 backdrop-blur-2xl md:hidden">
        <div
          className="mx-auto flex max-w-md items-stretch justify-around"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 pt-1.5 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground",
                )}
              >
                {isActive && (
                  <span className="absolute top-0 h-[2px] w-8 rounded-full bg-primary" />
                )}
                <item.icon
                  className={cn("size-5", isActive && "drop-shadow-[0_0_6px_var(--color-primary)]")}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className={cn(
                    "text-[10px]",
                    isActive ? "font-semibold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setUserSheetOpen(true)}
            className="relative flex flex-1 flex-col items-center gap-0.5 pt-1.5 text-muted-foreground transition-colors active:text-foreground"
          >
            {isPending ? (
              <Skeleton className="size-5 rounded-full" />
            ) : user?.image ? (
              <Avatar className="size-5 ring-1 ring-border">
                <AvatarImage src={user.image} />
              </Avatar>
            ) : user ? (
              <GeneratedAvatar
                seed={user.name ?? user.email}
                className="size-5 ring-1 ring-border"
              />
            ) : (
              <UserIcon className="size-5" strokeWidth={1.8} />
            )}
            <span className="text-[10px] font-medium">Account</span>
          </button>
        </div>
      </nav>

      <Sheet open={userSheetOpen} onOpenChange={setUserSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-border/50 px-6 pb-[calc(var(--safe-bottom)+2.5rem)]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Account</SheetTitle>
          </SheetHeader>

          <div className="mx-auto mb-4 mt-2 h-1 w-10 rounded-full bg-muted" />

          {isPending ? (
            <div className="flex items-center gap-4 rounded-2xl bg-muted/40 p-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-4 rounded-2xl bg-muted/40 p-4">
              {user.image ? (
                <Avatar className="size-12 ring-2 ring-primary/20">
                  <AvatarImage src={user.image} />
                </Avatar>
              ) : (
                <GeneratedAvatar
                  seed={user.name ?? user.email}
                  className="size-12 ring-2 ring-primary/20"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-3 space-y-1">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors hover:bg-muted/60 active:bg-muted"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Sun className="size-[18px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute size-[18px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              </div>
              <span>Switch theme</span>
              <span className="ml-auto text-xs text-muted-foreground capitalize">
                {theme}
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/15"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
                <LogOutIcon className="size-[18px]" />
              </div>
              <span>Log out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
