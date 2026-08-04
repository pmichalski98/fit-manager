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
import { DumbbellIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="bg-primary flex size-[30px] shrink-0 items-center justify-center rounded-sm">
            <DumbbellIcon
              className="text-primary-foreground size-[17px]"
              strokeWidth={2.5}
            />
          </span>
          <p className="text-foreground text-[13px] font-bold tracking-[0.06em] uppercase">
            Fit Manager
          </p>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    className={cn(
                      "text-secondary-foreground h-[38px] gap-2.5 rounded-sm px-2.5 text-xs font-semibold tracking-[0.04em] uppercase transition-colors",
                      "hover:bg-secondary hover:text-foreground",
                      pathname === item.href &&
                        "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className="size-[15px]" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2 border-t p-3">
        <div className="flex items-center justify-between px-1.5">
          <span className="label-caps">Preferences</span>
          <ThemeButton />
        </div>
        <SidebarUserButton />
      </SidebarFooter>
    </Sidebar>
  );
}
