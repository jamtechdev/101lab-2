import type { LucideIcon } from "lucide-react";

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  permission: string | null;
  target?: "_blank";
  badge?: number | string | null;
  disabled?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};
