import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLogoutMutation } from "@/rtk/slices/apiSlice";
import { pushLogoutEvent } from "@/utils/gtm";

/**
 * Preserves every side effect of the legacy DashboardLayout handleLogout:
 *   1. GTM analytics event
 *   2. RTK logout (revoke session)
 *   3. clear access + refresh cookies
 *   4. clear localStorage
 *   5. clear sessionStorage
 *   6. hard redirect to "/" so cached RTK state, sockets, contexts tear down
 *
 * TODO: replace window.confirm with a branded confirm modal (e.g. shadcn AlertDialog).
 */
export function useLogoutHandler() {
  const [logout] = useLogoutMutation();
  return async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    try {
      pushLogoutEvent();
    } catch {}
    try {
      await logout().unwrap();
    } catch (e) {
      console.error("Logout failed", e);
    }
    document.cookie = "accessToken=; Max-Age=0; path=/;";
    document.cookie = "refreshToken=; Max-Age=0; path=/;";
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };
}

/**
 * Renders inside the light-themed header (only the sidebar is dark per the
 * current design directive), so it uses the app's standard `text-foreground`
 * / `accent` tokens — not the slate/ink palette.
 */
export function UserMenu() {
  const { t } = useTranslation();
  const userName = localStorage.getItem("userName");
  const handleLogout = useLogoutHandler();

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
        <span className="text-xs font-semibold text-accent">
          {userName?.charAt(0)?.toUpperCase()}
        </span>
      </div>
      <span className="text-sm font-medium text-foreground hidden sm:block">
        {userName}
      </span>
      <button
        onClick={handleLogout}
        aria-label={t("common.logout", "Logout")}
        title={t("common.logout", "Logout")}
        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
