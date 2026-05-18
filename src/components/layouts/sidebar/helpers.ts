// @ts-nocheck
import { useVerifyUserQuery } from "@/rtk/slices/apiSlice";
import { useSellerPermissions } from "@/hooks/useSellerPermissions";
import type { NavItem } from "./types";

/** Returns the current account status from the verify endpoint. */
export function useAccountStatus(): string | undefined {
  const { data } = useVerifyUserQuery();
  return data?.user?.accountStatus;
}

/** Active-route predicate. Root section pages don't match descendants. */
export function computeIsActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;
  const roots = ["/", "/dashboard", "/buyer-dashboard", "/admin"];
  if (roots.includes(href)) return false;
  return pathname.startsWith(href + "/");
}

/**
 * Admin nav: only the most specific matching path is active (e.g. Messages
 * at /admin/sellers/chat must not also highlight Sellers at /admin/sellers).
 */
export function computeAdminNavIsActive(
  itemPath: string,
  pathname: string,
  allPaths: string[]
): boolean {
  if (pathname === itemPath) return true;

  if (itemPath === "/admin") {
    return pathname === "/admin";
  }

  if (!pathname.startsWith(itemPath + "/")) {
    return false;
  }

  const matchesPath = (p: string) =>
    pathname === p || (p !== "/admin" && pathname.startsWith(p + "/"));

  const bestMatch = allPaths
    .filter(matchesPath)
    .sort((a, b) => b.length - a.length)[0];

  return bestMatch === itemPath;
}

/**
 * Restricted = account not approved AND route not in the allow-list.
 *
 * Allow-list covers BOTH seller and buyer "safe" routes — dashboards,
 * settings, the public buyer marketplace — so pending accounts can still
 * configure their profile and browse.
 */
export function computeRestricted(href: string, accountStatus?: string): boolean {
  if (!accountStatus || accountStatus === "approved") return false;
  const allow = [
    "/dashboard",
    "/dashboard/buyer-activity",
    "/dashboard/settings",
    "/buyer-dashboard",
    "/buyer/profile-setting",
    "/buyer-marketplace",
    "/my-lots",
    "/buyer/chat/message",
  ];
  return !allow.includes(href);
}

/**
 * Permission filter — hides items the user can't access.
 *
 * KNOWN LIMITATION: reads `isCompanyMode` from localStorage synchronously, so
 * in-tab company-mode toggles won't re-render the sidebar until the next
 * navigation. Acceptable today because CompanySelector itself triggers a
 * navigation on switch. TODO: lift `isCompanyMode` into a context once
 * CompanySelector stops writing localStorage directly.
 */
export function useFilterItems() {
  const { hasPermission } = useSellerPermissions();
  const isNormalSellerMode = localStorage.getItem("isCompanyMode") !== "true";

  return (items: NavItem[]) =>
    items.filter((item) => {
      if (!item.permission) return true;
      if (item.permission === "settings.view" && isNormalSellerMode) return true;
      if (item.permission === "userManagement.view")
        return hasPermission("userManagement.view") || hasPermission("userManagement.edit");
      return hasPermission(item.permission);
    });
}
