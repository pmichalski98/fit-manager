import { ThemeButton } from "./theme-button";
import { SidebarTrigger } from "./ui/sidebar";
import UserButton from "./user-button";

export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex items-center gap-2">
        <ThemeButton />
        <UserButton />
      </div>
    </header>
  );
}
