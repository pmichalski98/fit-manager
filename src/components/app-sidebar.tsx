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
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  DumbbellIcon,
  HeartIcon,
  ImageIcon,
  LayoutDashboardIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const { openMobile, setOpenMobile, isMobile } = useSidebar();
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
    {
      label: "Photo",
      icon: <ImageIcon />,
      href: "/photo",
    },
  ];

  const activeStyles =
    "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent text-primary border-l-2 border-primary font-medium dark:from-primary/20 dark:via-primary/10 hover:from-primary/15 hover:via-primary/10 dark:hover:from-primary/25 dark:hover:via-primary/15";

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Fit Manager" width={39} height={39} />
          <p className="text-base font-semibold tracking-tight text-black dark:text-white">
            Fitness Manager
          </p>
        </Link>
      </SidebarHeader>
      <Separator className="bg-sidebar-border" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {firstSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    className={cn(
                      "h-10 border-l-2 border-transparent transition-all duration-200",
                      "hover:from-sidebar-accent hover:via-sidebar-accent/30 hover:bg-gradient-to-r hover:to-transparent",
                      pathname === item.href && activeStyles,
                    )}
                    onClick={() => {
                      if (isMobile && openMobile) {
                        setOpenMobile(false);
                      }
                    }}
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
        <Separator className="bg-sidebar-border" />
      </SidebarContent>
    </Sidebar>
  );
}
