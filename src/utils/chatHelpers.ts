/**
 * Stable avatar color hashed from a user ID so each user gets the same
 * colored avatar across all chat surfaces. Palette stays within the brand
 * green family so the inbox feels cohesive.
 */
const AVATAR_PALETTE = [
  "bg-emerald-700",
  "bg-teal-700",
  "bg-green-700",
  "bg-lime-700",
  "bg-cyan-700",
  "bg-emerald-800",
  "bg-teal-800",
];

export function avatarColor(idLike: string | number | null | undefined): string {
  const s = String(idLike ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export function avatarInitial(name?: string | null): string {
  if (!name) return "?";
  const t = name.trim();
  return t.length ? t.charAt(0).toUpperCase() : "?";
}

/**
 * Inbox-style relative time:
 *   < 60s        → "now"
 *   < 60m        → "12m"
 *   < 24h        → "3h"
 *   yesterday    → "Yesterday"
 *   < 7d         → "Mon"
 *   same year    → "Apr 12"
 *   else         → "Apr 12, 2024"
 */
export function formatInboxTime(iso?: string | number | Date | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return `${diffHr}h`;
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return "Yesterday";
  }
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Date divider label used inside a message thread.
 */
export function formatThreadDivider(iso?: string | number | Date | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, now)) return "Today";
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}
