import {
  DumbbellIcon,
  HeartIcon,
  ImageIcon,
  LayoutDashboardIcon,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboardIcon, href: "/dashboard" },
  { label: "Training", icon: DumbbellIcon, href: "/training" },
  { label: "Body", icon: HeartIcon, href: "/body" },
  { label: "Photo", icon: ImageIcon, href: "/photo" },
] as const;
