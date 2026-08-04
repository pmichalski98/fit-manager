"use client";

import { ChevronUpIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { InitialsAvatar } from "@/components/initials-avatar";
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
      <div className="flex items-center gap-2.5 rounded-sm p-2">
        <Skeleton className="size-[30px]" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group hover:bg-secondary flex w-full items-center gap-2.5 rounded-sm p-2 text-left transition-colors focus-visible:outline-none">
        {user.image ? (
          <Avatar className="size-[30px] rounded-sm">
            <AvatarImage src={user.image} />
          </Avatar>
        ) : (
          <InitialsAvatar seed={user.name ?? user.email} />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs leading-tight font-semibold">
            {user.name}
          </p>
          <p className="text-faint truncate text-[10px] leading-tight">
            {user.email}
          </p>
        </div>
        <ChevronUpIcon className="text-faint size-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
        side="top"
        align="start"
        sideOffset={8}
      >
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOutIcon className="size-3.5" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
