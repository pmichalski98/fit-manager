"use client";

import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
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
      <SidebarHeader className="px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Fit Manager"
            width={40}
            height={40}
            className="shrink-0"
          />
          <p className="text-base font-semibold tracking-tight text-black dark:text-white">
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
