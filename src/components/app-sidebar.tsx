"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/navigation";
import { ThemeButton } from "@/components/theme-button";
import { SidebarUserButton } from "@/components/sidebar-user-button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  const activeStyles =
    "bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-primary border-l-2 border-primary font-semibold dark:from-primary/20 dark:via-primary/10 hover:from-primary/20 hover:via-primary/10 dark:hover:from-primary/25 dark:hover:via-primary/15";

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Fit Manager" width={39} height={39} />
          <p className="text-base font-bold tracking-tight text-foreground">
            Fitness Manager
          </p>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    className={cn(
                      "h-10 border-l-2 border-transparent transition-all duration-200",
                      "hover:from-sidebar-accent hover:via-sidebar-accent/30 hover:bg-gradient-to-r hover:to-transparent",
                      pathname === item.href && activeStyles,
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span className="text-sm font-medium tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2 border-t px-3 py-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-muted-foreground">
            Preferences
          </span>
          <ThemeButton />
        </div>
        <SidebarUserButton />
      </SidebarFooter>
    </Sidebar>
  );
}
