import {
  DumbbellIcon,
  LayoutDashboardIcon,
  PersonStandingIcon,
  SaladIcon,
  TrendingUpIcon,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboardIcon, href: "/dashboard" },
  { label: "Training", icon: DumbbellIcon, href: "/training" },
  { label: "Nutrition", icon: SaladIcon, href: "/nutrition" },
  { label: "Progress", icon: TrendingUpIcon, href: "/progress" },
  { label: "Body", icon: PersonStandingIcon, href: "/body" },
] as const;
