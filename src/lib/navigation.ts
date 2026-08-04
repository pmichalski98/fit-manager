import {
  DumbbellIcon,
  ImageIcon,
  LayoutDashboardIcon,
  SaladIcon,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboardIcon, href: "/dashboard" },
  { label: "Training", icon: DumbbellIcon, href: "/training" },
  { label: "Nutrition", icon: SaladIcon, href: "/nutrition" },
  { label: "Photo", icon: ImageIcon, href: "/photo" },
] as const;
