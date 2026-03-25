/**
 * Decodes HTML entities in a string (e.g. &amp; → &, &lt; → <, etc.)
 * WordPress returns category names with HTML-encoded characters.
 */
export const decodeHtml = (str: string | null | undefined): string => {
  if (!str) return str ?? "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
};
