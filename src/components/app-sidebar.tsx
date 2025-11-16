"use client";

import { Separator } from "@/components/ui/separator";
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
import { DumbbellIcon, HeartIcon, LayoutDashboardIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserButton from "./user-button";

export function AppSidebar() {
  const pathname = usePathname();
  const firstSection = [
    {
      label: "Dashboard",
      icon: <LayoutDashboardIcon />,
      href: "/dashboard",
    },
    {
      label: "Training",
      icon: <DumbbellIcon />,
      href: "/training",
    },
    {
      label: "Body",
      icon: <HeartIcon />,
      href: "/body",
    },
  ];

  const activeStyles =
    "border-sidebar-accent/10 border-r-0 bg-linear-to-r/oklch";

  return (
    <Sidebar>
      <SidebarHeader className="text-sidebar-accent-foreground">
        <Link href="/" className="flex items-center gap-2 px-2 pt-2.75">
          <p className="text-xl font-semibold text-black dark:text-white">
            Fitness Manager
          </p>
        </Link>
      </SidebarHeader>
      <Separator className="bg-sidebar-border my-2" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {firstSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    className={cn(
                      "hover:border-sidebar-accent from-sidebar-accent via-sidebar/50 to-sidebar/50 h-10 border border-transparent from-5% via-30% hover:bg-linear-to-r/oklch",
                      pathname === item.href && activeStyles,
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      {item.icon}
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
        <Separator className="bg-sidebar-border my-2" />
      </SidebarContent>
    </Sidebar>
  );
}
