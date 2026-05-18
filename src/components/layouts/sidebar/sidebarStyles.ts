/** Shared sidebar shell + nav classes — uses app CSS vars from index.css (--sidebar, --accent). */

import { cn } from "@/lib/utils";

/** Sidebar width (px). If changed, update w-[280px], lg:pl-[280px], and lg:left-[280px] below. */
export const SIDEBAR_WIDTH_PX = 280;

export const sidebarAsideClass =
  "sidebar-shell relative fixed top-0 left-0 z-50 h-screen w-[280px] text-sidebar-foreground flex flex-col transition-transform duration-300 ease-out motion-reduce:transition-none";

export const sidebarMainOffsetClass = "lg:pl-[280px]";

export const sidebarFixedLeftClass = "lg:left-[280px]";

export const sidebarHeaderClass =
  "flex items-center justify-between px-4 py-3.5 border-b border-sidebar-border/80 shrink-0 bg-black/10";

export const sidebarRoleSwitcherWrapClass = "px-4 pt-2.5 pb-2 shrink-0";

export const sidebarNavClass = "flex-1 overflow-y-auto sidebar-scroll px-3 py-1.5";

export const sidebarCloseButtonClass =
  "lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground p-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar";

export function sidebarNavItemClass(
  isActive: boolean,
  opts?: { disabled?: boolean; restricted?: boolean }
) {
  return cn(
    "group relative flex items-center gap-2.5 h-9 px-3 rounded-lg text-sm font-medium",
    "transition-all duration-150 ease motion-reduce:transition-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
    opts?.disabled && "opacity-40 cursor-not-allowed",
    opts?.restricted && "opacity-50 cursor-not-allowed",
    !opts?.disabled &&
      !opts?.restricted &&
      isActive &&
      "text-sidebar-foreground bg-accent/10",
    !opts?.disabled &&
      !opts?.restricted &&
      !isActive &&
      "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-foreground/[0.06]"
  );
}

export function sidebarNavIconClass(isActive: boolean) {
  return cn(
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-150",
    isActive
      ? "bg-accent text-accent-foreground"
      : "bg-sidebar-foreground/[0.06] text-sidebar-foreground/75 group-hover:bg-accent/12 group-hover:text-accent"
  );
}

export const sidebarActiveBarClass =
  "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-accent";
