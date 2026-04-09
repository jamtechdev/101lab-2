// ─── Single source of truth for category display order & names ───────────────
// Edit this list to control which categories appear on the homepage and in the
// header dropdown, and in what order.

export const SITE_CATEGORIES = [
  { name: "Machining Centers",               slug: "machining-centers" },
  { name: "Lathes (CNC & Conventional)",     slug: "lathes-cnc-conventional" },
  { name: "Milling Machines",                slug: "milling-machines" },
  { name: "Boring & Drilling Machines",      slug: "boring-drilling-machines" },
  { name: "Grinding & Finishing",            slug: "grinding-finishing" },
  { name: "Sawing Machines",                 slug: "sawing-machines" },
  { name: "Press Brakes & Shears",           slug: "press-brakes-shears" },
  { name: "Punching & Forging",              slug: "punching-forging" },
  { name: "Laser & Plasma Cutting",          slug: "laser-plasma-cutting" },
  { name: "Welding Equipment",               slug: "welding-equipment" },
  { name: "Scrap",                           slug: "scrap" },
  { name: "Material Handling",               slug: "material-handling" },
];

// How many categories to show on the homepage Browse section
export const HOME_CATEGORY_COUNT = 8;

// How many category product rows to show on the homepage
export const HOME_PRODUCT_ROWS_COUNT = 3;

/** Filter API list to only categories present in SITE_CATEGORIES, then sort by config order. */
export function sortByConfig<T extends { slug?: string; name?: string }>(apiList: T[]): T[] {
  return [...apiList]
    .filter((a) => {
      const slugA = (a.slug ?? "").toLowerCase();
      return SITE_CATEGORIES.some((s) => slugA.includes(s.slug) || s.slug.includes(slugA));
    })
    .sort((a, b) => {
      const slugA = (a.slug ?? "").toLowerCase();
      const slugB = (b.slug ?? "").toLowerCase();
      const idxA = SITE_CATEGORIES.findIndex((s) => slugA.includes(s.slug) || s.slug.includes(slugA));
      const idxB = SITE_CATEGORIES.findIndex((s) => slugB.includes(s.slug) || s.slug.includes(slugB));
      return idxA - idxB;
    });
}
