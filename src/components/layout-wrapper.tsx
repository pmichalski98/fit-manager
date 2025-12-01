"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { AppHeader } from "./app-header";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden">
        <AppHeader />
        <div className="flex flex-1 flex-col p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
