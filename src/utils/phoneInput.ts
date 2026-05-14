export function sanitizePhoneInput(raw: string, maxLength = 20): string {
  if (!raw) return "";
  let s = raw.replace(/[^\d\s+]/g, "");
  s = s.replace(/(?!^)\+/g, "");
  s = s.replace(/\s{2,}/g, " ");
  return s.slice(0, maxLength);
}
