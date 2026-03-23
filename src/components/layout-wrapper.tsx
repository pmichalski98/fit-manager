"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");
  const isTrainingSession = pathname?.startsWith("/training/session/");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <SidebarInset className="max-h-svh overflow-x-hidden overflow-y-auto">
        <div className={cn(
          "flex flex-1 flex-col px-4 pt-6 md:p-6 md:pb-6",
          isTrainingSession ? "pb-4" : "pb-20",
        )}>
          {children}
        </div>
      </SidebarInset>
      {!isTrainingSession && <MobileBottomNav />}
    </SidebarProvider>
  );
}
