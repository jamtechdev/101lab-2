
const fromEnv = (import.meta.env.VITE_SITE_TYPE ?? "").trim();

// Auto-detect from domain
const detectFromDomain = (): string => {
  if (typeof window === "undefined") return "machines";
  const host = window.location.hostname.toLowerCase();
  if (host.includes("101it")) return "LabGreenbidz";
  if (host.includes("101machines")) return "machines";
  return "machines"; // default
};

// DEV ONLY: ?site=lab saves to sessionStorage so it works across all pages
// Visit once: http://localhost:8080/?site=lab  → all pages use LabGreenbidz
// Visit once: http://localhost:8080/?site=machines → reset back
const detectFromUrlParam = (): string | null => {
  if (typeof window === "undefined") return null;
  if (!import.meta.env.DEV) return null; // disabled in production

  const params = new URLSearchParams(window.location.search);
  const site = params.get("site");

  if (site === "lab") {
    sessionStorage.setItem("dev_site_type", "LabGreenbidz");
    return "LabGreenbidz";
  }
  if (site === "machines") {
    sessionStorage.removeItem("dev_site_type");
    return "machines";
  }

  // No param in URL — check if saved in session
  return sessionStorage.getItem("dev_site_type");
};

// Priority: URL param / session (DEV only) → .env → domain → default
const raw = detectFromUrlParam() || fromEnv || detectFromDomain();

/** Sent to batch/admin/product APIs as-is (e.g. "LabGreenbidz", "machines"). */
export const SITE_TYPE = raw;

/** For user profile/settings APIs; same value. */
export const SITE_TYPE_PROFILE = raw;
