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
      <Skeleton className="flex h-[54px] w-21 items-center justify-center">
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
        <DropdownMenuTrigger className="dark:bg-input/30 dark:hover:bg-input/50 not-visited:hover:bg-accent/10 flex items-center justify-between gap-1 overflow-hidden rounded-lg border p-3 px-4 py-1.5">
          <Avatar>
            {" "}
            {user.image ? (
              <AvatarImage src={user.image} />
            ) : (
              <GeneratedAvatar seed={user.name ?? user.email} />
            )}
          </Avatar>

          <ChevronDownIcon className="size-4 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52" align="end">
          <DropdownMenuLabel className="flex justify-between">
            <div className="flex flex-col gap-1">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-sm font-normal">
                {user.email}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="">
            <DropdownMenuItem
              className="hover:bg-accent/10 flex cursor-pointer justify-between"
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
