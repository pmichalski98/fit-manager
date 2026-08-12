"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOutIcon, Moon, Sun, UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/navigation";
import { InitialsAvatar } from "@/components/initials-avatar";
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
      <nav className="bg-background/85 fixed right-0 bottom-0 left-0 z-50 border-t pb-[max(0.5rem,var(--safe-bottom))] backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
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
                  <span className="bg-primary absolute top-0 h-[2px] w-8" />
                )}
                <item.icon
                  className="size-5"
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className={cn(
                    "text-[10px] tracking-[0.04em] uppercase",
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
            className="text-muted-foreground active:text-foreground relative flex flex-1 flex-col items-center gap-0.5 pt-1.5 transition-colors"
          >
            {isPending ? (
              <Skeleton className="size-5 rounded-[4px]" />
            ) : user?.image ? (
              <Avatar className="size-5 rounded-[4px]">
                <AvatarImage src={user.image} />
              </Avatar>
            ) : user ? (
              <InitialsAvatar
                seed={user.name ?? user.email}
                className="size-5 rounded-[4px] text-[8px]"
              />
            ) : (
              <UserIcon className="size-5" strokeWidth={1.8} />
            )}
            <span className="text-[10px] font-medium tracking-[0.04em] uppercase">
              Account
            </span>
          </button>
        </div>
      </nav>

      <Sheet open={userSheetOpen} onOpenChange={setUserSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[10px] border-t px-5 pb-[calc(var(--safe-bottom)+2.5rem)]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Account</SheetTitle>
          </SheetHeader>

          <div className="bg-input mx-auto mt-2 mb-4 h-1 w-10 rounded-full" />

          {isPending ? (
            <div className="bg-card flex items-center gap-3.5 rounded-[10px] border p-4">
              <Skeleton className="size-10" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ) : user ? (
            <div className="bg-card flex items-center gap-3.5 rounded-[10px] border p-4">
              {user.image ? (
                <Avatar className="size-10 rounded-sm">
                  <AvatarImage src={user.image} />
                </Avatar>
              ) : (
                <InitialsAvatar
                  seed={user.name ?? user.email}
                  className="size-10 text-[13px]"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">
                  {user.name}
                </p>
                <p className="text-faint truncate text-[11px]">{user.email}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-3 space-y-1">
            <button
              onClick={toggleTheme}
              className="hover:bg-secondary active:bg-secondary flex w-full items-center gap-3 rounded-sm px-3 py-3 text-xs font-semibold tracking-[0.04em] uppercase transition-colors"
            >
              <div className="bg-secondary relative flex size-8 items-center justify-center rounded-sm">
                <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              </div>
              <span>Switch theme</span>
              <span className="text-muted-foreground ml-auto font-mono text-[11px]">
                {theme}
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 active:bg-destructive/15 flex w-full items-center gap-3 rounded-sm px-3 py-3 text-xs font-semibold tracking-[0.04em] uppercase transition-colors"
            >
              <div className="bg-destructive/10 flex size-8 items-center justify-center rounded-sm">
                <LogOutIcon className="size-4" />
              </div>
              <span>Log out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
