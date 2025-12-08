import { ThemeButton } from "./theme-button";
import { SidebarTrigger } from "./ui/sidebar";
import UserButton from "./user-button";
import Link from "next/link";
import Image from "next/image";

export function AppHeader() {
  return (
    <header className="bg-background sticky top-4 z-50 mt-4 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Link href="/" className="md:hidden">
          <Image src="/logo.png" alt="Fit Manager" width={32} height={32} />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ThemeButton />
        <UserButton />
      </div>
    </header>
  );
}
