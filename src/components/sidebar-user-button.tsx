"use client";

import { ChevronUpIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaSpinner } from "react-icons/fa";
import GeneratedAvatar from "@/components/generated.avatar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

export function SidebarUserButton() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const router = useRouter();

  const handleLogout = () => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <Skeleton className="size-8 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring">
        {user.image ? (
          <Avatar className="size-8 ring-1 ring-sidebar-border">
            <AvatarImage src={user.image} />
          </Avatar>
        ) : (
          <GeneratedAvatar
            seed={user.name ?? user.email}
            className="size-8 ring-1 ring-sidebar-border"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">
            {user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground leading-tight">
            {user.email}
          </p>
        </div>
        <ChevronUpIcon className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
        side="top"
        align="start"
        sideOffset={8}
      >
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onClick={handleLogout}
        >
          <LogOutIcon className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
