
const raw = (import.meta.env.VITE_SITE_TYPE ?? "recycle").trim();

/** Sent to batch/admin/product APIs as-is (e.g. "LabGreenbidz", "greenbidz", "recycle"). */
export const SITE_TYPE = raw;

/** For user profile/settings APIs; same value unless your backend expects different casing. */
export const SITE_TYPE_PROFILE = raw;
