import { ChevronDownIcon, CreditCardIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaSpinner } from "react-icons/fa";
import GeneratedAvatar from "@/components/generated.avatar";
import { ThemeButton } from "@/components/theme-button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

export default function UserButton() {
  const { data: session, isPending, error } = authClient.useSession();
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
      <Skeleton className="flex h-[54px] w-full items-center justify-center">
        <FaSpinner className="size-4 animate-spin" />
      </Skeleton>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="border-border/10 flex w-full items-center justify-between gap-1 overflow-hidden rounded-lg border bg-white/5 p-3 px-4 py-2 hover:bg-white/10">
          <Avatar>
            {user.image ? (
              <AvatarImage src={user.image} />
            ) : (
              <GeneratedAvatar seed={user.name ?? user.email} />
            )}
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden text-left">
            <p className="w-full truncate text-sm">{user.name}</p>
            <p className="w-full truncate text-xs">{user.email}</p>
          </div>
          <ChevronDownIcon className="size-4 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72" align="end">
          <DropdownMenuLabel className="flex justify-between">
            <div className="flex flex-col gap-1">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-sm font-normal">
                {user.email}
              </span>
            </div>
            <ThemeButton />
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="">
            <DropdownMenuItem className="flex justify-between">
              Billing
              <CreditCardIcon />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex justify-between"
              onClick={handleLogout}
            >
              Logout
              <LogOutIcon />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
