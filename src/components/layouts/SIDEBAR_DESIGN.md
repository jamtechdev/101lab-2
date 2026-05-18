# Sidebar Design System — "High-Fidelity Auction Intelligence"

Source: Stitch project `projects/14406706087516645833` ("Elegant Visual Refinement").
Applies to:
- [DashboardLayout.tsx](./DashboardLayout.tsx) (Seller)
- [BuyerDashboardLayout.tsx](./BuyerDashboardLayout.tsx) (Buyer)
- [AdminSidebar.tsx](./AdminSidebar.tsx) (Admin)

This spec covers the **full shell**: sidebar + sticky top bar + mobile slide-over + modals + the data conventions that drive nav items.

---

## 0. Scope & Decisions (read this first)

These are deliberate choices to keep all three sidebars consistent. Don't relitigate per-PR.

| # | Decision | Rationale |
|---|---|---|
| 1 | **Dark theme applies to the SIDEBAR ONLY.** Header and page content keep their existing light styling (`bg-card`, `text-foreground`, `text-muted-foreground`, etc.). | User directive 2026-05-18: "no changes should I want in sidebar only currently i can see on page main section as well only in sidebar needed." Earlier draft applied the dark theme app-wide; reverted. |
| 2 | **User profile + logout live in the top bar, NOT the sidebar.** | Current code already does this ([DashboardLayout.tsx:304-320](./DashboardLayout.tsx#L304-L320)). Sidebar footer is reserved for an optional version label / help link only. The role switcher sits **above** the nav, not in the footer (§6). |
| 3 | **Width: 280px on `lg+` (`w-[280px]` or new token `w-sidebar`).** Sweeps every consumer using `lg:pl-56`. | Stitch token, comfortable for icon + label + badge. |
| 4 | **Role switcher uses the existing [`RoleSwitcher`](../common/RoleSwitcher.tsx) component with `variant="segmented"`.** Don't re-implement inline. | One source of truth for upgrade-modal logic + socket re-join. |
| 5 | **Collapsed / icon-only variant: NOT supported.** | Out of scope; adds permutations without a stakeholder ask. |
| 6 | **Mobile slide-over uses `<div>` overlay + backdrop click + Esc to close.** No `<dialog>` semantics. | Matches current behavior; `<dialog>` would force a focus-trap rewrite. |
| 7 | **Logo is the raster `@/assets/greenbidz_logo.png` rendered with `brightness-0 invert` for dark mode.** | Single asset, no SVG rebuild; works in light contexts elsewhere. |

---

## 1. Design Tokens

### 1.1 Colors (raw values)

| Token | Hex | Purpose |
|---|---|---|
| `background` / `surface` | `#0b1326` | Sidebar + page background (deepest slate) |
| `surface-container-lowest` | `#060e20` | Deepest recess |
| `surface-container-low` | `#131b2e` | Active nav-item background |
| `surface-container` | `#171f33` | Role switcher container |
| `surface-container-high` | `#222a3d` | Hover on raised items |
| `surface-container-highest` | `#2d3449` | Popovers / dropdowns |
| `primary-container` | `#10b981` | **Brand** — active indicator bar, CTAs |
| `primary` | `#4edea3` | Accent text glow, active icon |
| `on-surface` | `#dae2fd` | Primary body / username |
| `on-surface-variant` | `#bbcabf` | Default nav-item text |
| `outline` | `#86948a` | Section-header text |
| `outline-variant` | `#3c4a42` | Subtle dividers |
| `error` | `#ffb4ab` | Destructive (logout hover) |
| `amber-500` | `#f59e0b` | Pending / restricted indicator |

Sidebar-specific shorthand:

```
sidebar bg          → #0b1326
nav default text    → #bbcabf, icon stroke 1.5
nav hover           → text #dae2fd, bg rgba(78,222,163,0.08)
nav active          → text #4edea3, icon #10b981, bg #131b2e, 2px left bar #10b981
nav restricted      → opacity 0.5, cursor not-allowed, trailing Lock icon (still clickable → opens modal)
nav disabled        → opacity 0.4, cursor not-allowed, tabIndex=-1, trailing "Soon" chip
section header      → #86948a, uppercase, tracking 0.08em
divider             → rgba(255,255,255,0.06)
```

### 1.2 Typography (Inter, all weights)

| Token | Size | Weight | Line | Tracking | Use |
|---|---|---|---|---|---|
| `headline-lg` | 32px | 700 | 40px | -0.02em | Page titles |
| `headline-md` | 24px | 600 | 32px | -0.01em | Section titles |
| `body-lg` | 16px | 400 | 24px | — | Default body |
| `body-md` | 14px | 400 | 20px | — | Dense body |
| `nav-item` | 14px | 500 | 20px | — | **Sidebar nav labels** |
| `label-caps` | 12px | 600 | 16px | 0.08em | **Section headers (uppercase)** |

i18n note: nav labels go through `t('nav.*')`. German/Japanese/Chinese strings can be longer — keep `flex-1 truncate` on the label `<span>` so they ellipsize cleanly. See §6.4.

### 1.3 Spacing (8px linear scale)

| Token | Value | Use |
|---|---|---|
| `xs` | 4px | Icon ↔ adjacent micro-gap |
| `base` | 8px | Tight gaps |
| `sm` | 12px | Nav item vertical padding |
| `md` | 24px | Section spacing / gutter |
| `lg` | 40px | Major section breaks |
| `sidebar_width` | **280px** | Fixed sidebar width |
| `header_height` | **56px** (`h-14`) | Sticky top-bar height — binding across all layouts |
| `nav_item_height` | **44px** (`h-11`) | Touch-target floor |
| `avatar_sm` | **32px** (`w-8 h-8`) | Header user avatar + role-switcher icons |
| `avatar_md` | **40px** (`w-10 h-10`) | Profile contexts (if ever shown in sidebar footer) |
| `gutter` | 24px | Horizontal padding inside sidebar |

### 1.4 Shapes / Radii

| Token | Value | Use |
|---|---|---|
| `sm` | 0.25rem (4px) | Tiny chips |
| `DEFAULT` | 0.5rem (8px) | **Nav items, buttons, inputs** |
| `md` | 0.75rem (12px) | Mid containers |
| `lg` | 1rem (16px) | **Cards, role switcher container** |
| `full` | 9999px | Pills, avatars, active indicator bar |

### 1.5 Elevation (tonal, not shadow)

- **L0 page:** `#0b1326`
- **L1 sidebar / cards:** `#131b2e` → `#171f33`
- **L2 popovers / modals:** `#222a3d` → `#2d3449`
- **Edges:** `border: 1px solid rgba(255,255,255,0.06)` on top + sides.

### 1.6 z-index stack (binding)

| Layer | z-index | Notes |
|---|---|---|
| Page content | `z-0` | Default |
| Sticky top bar | `z-30` | Below sidebar so the mobile drawer slides over it |
| Mobile backdrop | `z-40` | Covers content + header |
| Sidebar | `z-50` | Above backdrop |
| Modals / restricted dialog | `z-50` | Same as sidebar — modals are full-screen overlays so stacking conflict is acceptable; if both open simultaneously, close the sidebar first |
| Toasts / SweetAlert | `z-99999` | Above everything (already configured in [index.css:244](../../index.css#L244)) |

---

## 2. Tailwind Mapping

Add to `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      slate: {
        950: '#060e20', 900: '#0b1326', 850: '#131b2e',
        800: '#171f33', 750: '#222a3d', 700: '#2d3449',
        600: '#31394d',
      },
      brand: {
        DEFAULT: '#10b981',
        glow:    '#4edea3',
        deep:    '#003824',
        soft:    'rgba(78,222,163,0.08)',
      },
      ink: {
        DEFAULT: '#dae2fd',
        muted:   '#bbcabf',
        dim:     '#86948a',
      },
    },
    fontFamily: { sans: ['Inter','system-ui','sans-serif'] },
    fontSize: {
      'nav':        ['14px', { lineHeight: '20px', fontWeight: '500' }],
      'label-caps': ['12px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.08em' }],
    },
    width:   { sidebar: '280px' },
    padding: { sidebar: '280px' },
    borderRadius: { DEFAULT: '0.5rem', card: '1rem' },
  },
}
```

### 2.1 Token-system policy (which to reach for)

Two systems coexist; the rule is:

- **New code & all sidebar/header work → Tailwind tokens** above (`slate-*`, `brand-*`, `ink-*`). This is the design source of truth.
- **CSS variables** (`--sidebar`, `--sidebar-foreground`, `--accent`, …) in [index.css](../../index.css) are **legacy** and stay only because shadcn-derived primitives (`Button`, `Dialog`, `Input`, etc.) consume them. Don't introduce new CSS vars for sidebar/header concerns.
- Per §0 decision #1 the theme is dark-only — there is no runtime theme-switching requirement that justifies a second token system.
- If a shadcn primitive ends up inside the sidebar, override its variable mapping locally rather than editing `index.css` globally.

---

## 3. Shell Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│ Sidebar (280px, z-50)        │ Sticky Top Bar (z-30)             │
│ ┌──────────────────────────┐ │ ┌─────────────────────────────┐   │
│ │ Logo + close-X (mobile)  │ │ │ ⎘ Menu | gap | CompSel,     │   │
│ ├──────────────────────────┤ │ │           Lang, Notif, User │   │
│ │ RoleSwitcher segmented   │ │ └─────────────────────────────┘   │
│ ├──────────────────────────┤ │                                   │
│ │ Section: MARKETPLACE     │ │ <main> Page content              │
│ │   • Browse Marketplace ↗ │ │                                   │
│ │ Section: SELLING         │ │                                   │
│ │   • Dashboard         ●  │ │  (lg:pl-[280px])                  │
│ │   • List an Item         │ │                                   │
│ │   • Bids 🔒              │ │                                   │
│ │   ...                    │ │                                   │
│ │ Section: INTELLIGENCE    │ │                                   │
│ │ Section: ADMIN           │ │                                   │
│ └──────────────────────────┘ │                                   │
└──────────────────────────────────────────────────────────────────┘
Mobile backdrop (z-40, click or Esc to close)
```

---

## 4. Sidebar Container

```jsx
{/* Mobile backdrop */}
{sidebarOpen && (
  <div
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
    onClick={() => setSidebarOpen(false)}
    aria-hidden="true"
  />
)}

{/* Sidebar */}
<aside
  id="primary-nav"                       // referenced by header hamburger's aria-controls (§10)
  aria-label="Primary navigation"
  className={cn(
    "fixed top-0 left-0 z-50 h-screen w-[280px] bg-slate-900",
    "border-r border-white/[0.06]",
    "flex flex-col",
    "transition-transform duration-250 ease-out motion-reduce:transition-none",
    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
  )}
>
  {/* Logo block (§5) */}
  {/* RoleSwitcher (§6) */}
  {/* Nav (§7) */}
  {/* Optional footer (§8) — version label only; NOT user/logout */}
</aside>
```

**Esc-to-close + focus-to-close-X wiring (binding):** the layout owns the close-button ref and both effects. Bind Esc at the document level so it fires regardless of where focus lives — the backdrop and `<aside>`-scoped listeners both miss the common case of focus sitting in `<main>` content under the open drawer.

```tsx
const closeBtnRef = useRef<HTMLButtonElement>(null);

// Esc closes the drawer
useEffect(() => {
  if (!sidebarOpen) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setSidebarOpen(false);
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [sidebarOpen]);

// On open, move focus to the close-X so the user has a keyboard egress point
useEffect(() => {
  if (sidebarOpen) closeBtnRef.current?.focus();
}, [sidebarOpen]);
```

Pass `closeBtnRef` down to the close button rendered in §5. A full focus trap isn't required — Esc + backdrop click cover egress (see §13).

> **Modal-vs-drawer Esc precedence:** the `SidebarRestrictedModal` (§9) installs its own window-level Esc listener. If both the drawer and the modal are open (mobile: tap a restricted item from the drawer), Esc will fire both handlers and close both at once — that's acceptable UX. If you want to scope it per-modal later, add a ref-counted "topmost dialog" stack; for now the dual-close is fine.

---

## 5. Logo Block

```jsx
<div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
  {/* Use react-router <Link>, NOT a raw <a> — raw <a> causes a full page reload */}
  <Link to="/" aria-label="GreenBidz home" className="flex items-center gap-3">
    <img
      src={logo}
      alt="GreenBidz"
      className="h-7 w-auto brightness-0 invert"
    />
  </Link>

  {/* Mobile-only close button — ref is owned by the layout (§4) for focus-on-open */}
  <button
    ref={closeBtnRef}
    type="button"
    onClick={() => setSidebarOpen(false)}
    aria-label="Close navigation"
    className="lg:hidden text-ink-muted hover:text-ink p-1.5 rounded-DEFAULT
               focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
               focus-visible:ring-offset-slate-900"
  >
    <X className="h-5 w-5" />
  </button>
</div>
```

The raster + `brightness-0 invert` trick keeps a single asset usable on any background.

---

## 6. RoleSwitcher (segmented)

Don't re-implement. Use the shared component:

```jsx
import RoleSwitcher from "@/components/common/RoleSwitcher";

<div className="px-6 pt-4 pb-2">
  <RoleSwitcher variant="segmented" />
</div>
```

Props ([RoleSwitcher.tsx:18-20](../common/RoleSwitcher.tsx#L18-L20)):

| Prop | Type | Default | Used in |
|---|---|---|---|
| `variant` | `"default" \| "segmented"` | `"default"` | Sidebars use `"segmented"`. Default variant renders a larger "switch to seller/buyer" CTA used elsewhere. |

The component owns:
- Current role detection from `localStorage.activeView` + `jwtRole`.
- Upgrade modal for unverified sellers.
- Socket re-join on switch.
- Pending/approved/rejected request status.

**Admin sidebar:** does NOT render `RoleSwitcher` — admins don't switch roles.

---

## 7. Navigation

### 7.0 Shared helpers (extract to `components/layouts/sidebar/`)

Every layout imports these from one place. Do not redeclare per-layout.

```ts
// components/layouts/sidebar/SidebarContext.tsx
import { createContext, useContext } from "react";

interface SidebarContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}
export const SidebarContext = createContext<SidebarContextValue | null>(null);
export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
};
```

```ts
// components/layouts/sidebar/helpers.ts
import { useVerifyUserQuery } from "@/rtk/slices/apiSlice";
import { useSellerPermissions } from "@/hooks/useSellerPermissions";

/** Returns the current account status from the verify endpoint. */
export function useAccountStatus(): string | undefined {
  const { data } = useVerifyUserQuery();
  return data?.user?.accountStatus;
}

/** Active-route predicate — see §7.4 for rationale. */
export function computeIsActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;
  const roots = ["/", "/dashboard", "/buyer-dashboard", "/admin"];
  if (roots.includes(href)) return false;
  return pathname.startsWith(href + "/");
}

/** Restricted = account not approved AND route not in the allow-list. */
export function computeRestricted(href: string, accountStatus?: string): boolean {
  if (!accountStatus || accountStatus === "approved") return false;
  const allow = ["/dashboard", "/dashboard/settings", "/buyer-dashboard"];
  return !allow.includes(href);
}

/** Permission filter — hides items the user can't access. */
export function useFilterItems() {
  const { hasPermission } = useSellerPermissions();
  // KNOWN LIMITATION: reading localStorage synchronously means in-tab
  // company-mode toggles won't re-render the sidebar until the next
  // navigation. Acceptable today because CompanySelector itself triggers
  // a navigation on switch. TODO: lift `isCompanyMode` into a context
  // (e.g. CompanyProvider) once CompanySelector stops writing localStorage
  // directly, then read it via that context here.
  const isNormalSellerMode = localStorage.getItem("isCompanyMode") !== "true";

  return (items: NavItem[]) =>
    items.filter(item => {
      if (!item.permission) return true;
      if (item.permission === "settings.view" && isNormalSellerMode) return true;
      if (item.permission === "userManagement.view")
        return hasPermission("userManagement.view") || hasPermission("userManagement.edit");
      return hasPermission(item.permission);
    });
}
```

The layout component wraps its tree in `<SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>` so `NavItemLink` can call `setSidebarOpen(false)` on internal navigation without prop drilling.

### 7.1 Data shape (source of truth)

```ts
type NavItem = {
  name: string;          // already-translated label (t('nav.*'))
  href: string;          // internal route OR external URL
  icon: LucideIcon;
  permission: string | null;       // e.g. "bidding.view"; null = always visible
  target?: "_blank";               // external link (see §7.5)
  badge?: number | string | null;  // live-counted badge (see §7.6)
  disabled?: boolean;              // coming-soon items
};

type NavSection = {
  title: string;         // already-translated (t('nav.<section>'))
  items: NavItem[];
};
```

### 7.2 Section iteration + empty-section rule

```jsx
const filterItems = useFilterItems();

{navigationSections.map((section, i) => {
  const items = filterItems(section.items);
  if (items.length === 0) return null;   // hide section if permission-filter empties it

  return (
    <div key={i}>
      <SectionHeader title={section.title} />
      <div className="px-3 space-y-0.5">
        {items.map(item => <NavItemLink key={item.href} item={item} />)}
      </div>
    </div>
  );
})}
```

**Rule for the `disabled` flag:** disabled items count toward section presence. A section composed entirely of `disabled: true` items still renders — that's intentional so users see what's coming. Permission failures are different: they hide. (Permission-gated → invisible; disabled → visible-but-grayed.)

### 7.3 Section Header

```jsx
const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-3 pt-4 pb-2">
    <h3 className="text-label-caps text-ink-dim uppercase">{title}</h3>
  </div>
);
```

### 7.4 Active-route matching rule (BINDING)

Implemented by `computeIsActive(href, pathname)` in §7.0. Do **not** use `NavLink`'s default `end` behavior — it's wrong for nested routes. The helper:

```ts
function computeIsActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;
  const roots = ["/", "/dashboard", "/buyer-dashboard", "/admin"];
  if (roots.includes(href)) return false;  // root pages don't match descendants
  return pathname.startsWith(href + "/");
}
```

The root exclusions prevent `/dashboard` from lighting up under every `/dashboard/*` child.

### 7.5 NavItemLink — the seven states

Single source of truth for nav-item rendering. All three sidebars import this.

```tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock, ArrowUpRight, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { useAccountStatus, computeIsActive, computeRestricted } from "./helpers";
import { SidebarRestrictedModal } from "./SidebarRestrictedModal";
import type { NavItem } from "./types";

export function NavItemLink({ item }: { item: NavItem }) {
  const location = useLocation();
  const { setSidebarOpen } = useSidebar();
  const accountStatus = useAccountStatus();
  const [restrictedOpen, setRestrictedOpen] = useState(false);

  const isExternal   = item.target === "_blank";
  const isActive     = computeIsActive(item.href, location.pathname);
  const isRestricted = computeRestricted(item.href, accountStatus);
  const isDisabled   = !!item.disabled;

  // Precedence — disabled wins over restricted wins over active/default.
  // Restricted ALSO wins over external (a restricted account never opens an
  // external tab; the modal explains why instead).
  const className = cn(
    "group relative flex items-center gap-3 h-11 px-3 rounded-DEFAULT text-nav",
    "transition-all duration-150 ease motion-reduce:transition-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
    isDisabled                      && "opacity-40 cursor-not-allowed",
    !isDisabled && isRestricted     && "opacity-50 cursor-not-allowed",
    !isDisabled && !isRestricted && isActive  && "text-brand-glow bg-slate-850",
    !isDisabled && !isRestricted && !isActive && "text-ink-muted hover:text-ink hover:bg-brand-soft",
  );

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled)   { e.preventDefault(); return; }
    if (isRestricted) { e.preventDefault(); setRestrictedOpen(true); return; }
    if (!isExternal) setSidebarOpen(false); // auto-close mobile drawer on navigate
  };

  // External branch — only when NOT restricted (restricted overrides external).
  if (isExternal && !isRestricted && !isDisabled) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${item.name} (opens in new tab)`}
        onClick={() => setSidebarOpen(false)}
        className={className}
      >
        <NavItemInner item={item} isActive={false} external />
      </a>
    );
  }

  // Internal / restricted / disabled all go through <Link>.
  return (
    <>
      <Link
        to={isRestricted || isDisabled ? "#" : item.href}
        onClick={handleClick}
        aria-current={isActive ? "page" : undefined}
        aria-disabled={isDisabled || undefined}        // restricted items are NOT aria-disabled — they activate (open modal)
        tabIndex={isDisabled ? -1 : 0}                  // skip disabled items in keyboard tab order
        className={className}
      >
        <NavItemInner
          item={item}
          isActive={isActive}
          restricted={isRestricted}
          disabled={isDisabled}
        />
      </Link>
      {restrictedOpen && (
        <SidebarRestrictedModal
          status={accountStatus}
          onClose={() => setRestrictedOpen(false)}
        />
      )}
    </>
  );
}

function NavItemInner({
  item, isActive, restricted, disabled, external,
}: {
  item: NavItem;
  isActive: boolean;
  restricted?: boolean;
  disabled?: boolean;
  external?: boolean;
}) {
  const { t } = useTranslation();
  const Icon = item.icon;
  return (
    <>
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-brand"
        />
      )}
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isActive ? "text-brand" : "opacity-80 group-hover:opacity-100"
        )}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span className="flex-1 truncate">{item.name}</span>

      {item.badge != null && !restricted && !disabled && (
        <span className="ml-auto rounded-full bg-brand/15 text-brand-glow text-[11px] font-semibold px-2 py-0.5 shrink-0">
          {item.badge}
        </span>
      )}
      {restricted && <Lock className="h-3.5 w-3.5 opacity-50 shrink-0" aria-label="Restricted" />}
      {disabled   && (
        <span className="text-[10px] uppercase tracking-wide text-ink-dim shrink-0">
          {t('common.soon', 'Soon')}
        </span>
      )}
      {external   && <ArrowUpRight className="h-3 w-3 opacity-50 shrink-0" aria-hidden="true" />}
    </>
  );
}
```

**A11y note on `disabled`:** we use `aria-disabled="true"` + `tabIndex={-1}` + `onClick` `preventDefault` rather than `pointer-events-none`. Reason: `pointer-events-none` leaves the element keyboard-focusable but unreachable for activation — keyboard users hit a dead stop. The current pattern skips disabled items in tab order entirely.

**Precedence reminder:** `disabled > restricted > active > default`. Restricted also overrides external — a restricted account's "Browse Marketplace" opens the modal, not a new tab.

**State summary table:**

| State | Trigger | Visual | Interaction |
|---|---|---|---|
| **Default** | Otherwise | `text-ink-muted`, no bg, icon 80% | Hover available |
| **Hover** | `:hover` on default | `text-ink`, `bg-brand-soft`, icon 100% | — |
| **Active** | Current route matches §7.4 predicate | `text-brand-glow`, `bg-slate-850`, icon `text-brand`, 2px left bar | aria-current="page" |
| **Restricted** | `accountStatus !== "approved"` AND route not in allow-list | Opacity 50%, `cursor-not-allowed`, trailing Lock icon | Click → opens `RestrictedModal` instead of navigating |
| **Permission-gated** | `permission` is set AND `hasPermission(permission) === false` | **Hidden** (not rendered) | None — filtered out by `filterItems()` |
| **Disabled / coming-soon** | `item.disabled === true` | Opacity 40%, `cursor-not-allowed`, trailing `Soon` chip | `tabIndex={-1}` + `aria-disabled="true"` + click `preventDefault` (NOT `pointer-events-none` — see a11y note above) |
| **External** | `target === "_blank"` | `ArrowUpRight` trailing icon | Opens new tab; `rel="noopener noreferrer"` |

### 7.6 Badges (live counts)

When an item has a numeric badge that reflects API state (e.g. pending bids), wire it via RTK:

```jsx
const { data: bidsData } = useGetSellerBidsQuery({ userId, page: 1, limit: 1 });
const pendingBidsCount = bidsData?.pendingCount ?? 0;

// In navigationSections:
{ name: t('nav.bidsAndWinners'), href: "/dashboard/bids", icon: TrendingUp,
  permission: "bidding.view", badge: pendingBidsCount || null }
```

Convention:
- `null` / `undefined` / `0` → no badge rendered.
- Number → rounded brand pill.
- String → free text (e.g. "NEW" for a hand-picked highlight).

### 7.7 Permission filtering

Use `useFilterItems()` from §7.0 (it wraps `useSellerPermissions()` from [hooks/useSellerPermissions](../../hooks/useSellerPermissions.ts)):

```ts
const filterItems = useFilterItems();
const visible = filterItems(section.items);
```

Rule: **permission failures hide the item entirely**, not disable. If a section becomes empty after filtering, hide the whole section (§7.2). The `disabled` flag is unrelated — disabled items render visibly grayed (see §7.2 rule).

### 7.8 Scrollbar

Apply the existing `.sidebar-scroll` class from [index.css:225-241](../../index.css#L225-L241) to the `<nav>` element:

```jsx
<nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-2">
```

CSS (already defined):

```css
.sidebar-scroll { scrollbar-width: thin; scrollbar-color: hsl(var(--muted-foreground) / 0.2) transparent; }
.sidebar-scroll::-webkit-scrollbar { width: 6px; }
.sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
.sidebar-scroll::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.2); border-radius: 3px; }
.sidebar-scroll::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.35); }
```

---

## 8. Sidebar Footer (optional)

The sidebar footer is **NOT** for user profile / logout (those live in the top bar — §10). Reserve it for:

- App version label (`v2.3.1`)
- Help / docs link
- Theme indicator (if ever added)

Leave empty if nothing to show. Don't pad blank space.

---

## 9. Restricted Account State

When `useVerifyUserQuery().data.user.accountStatus` is one of:
- `"profile_incomplete"` — allow only `/dashboard`, `/dashboard/settings`, `/buyer-dashboard`
- anything other than `"approved"` (pending review) — same allow-list

All other items render as **restricted** (§7.5). Click opens the modal. Extract once into [`SidebarRestrictedModal.tsx`](./SidebarRestrictedModal.tsx) so all three layouts share it; the `computeRestricted(href, accountStatus)` predicate that gates rendering lives in §7.0 (don't duplicate the allow-list here).

```tsx
import { useEffect, useId, useRef } from "react";
import { Lock, Clock, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  status?: string;
  onClose: () => void;
}

export function SidebarRestrictedModal({ status, onClose }: Props) {
  const { t } = useTranslation();
  const titleId = useId();                     // collision-safe across multiple mounts
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const isIncomplete = status === "profile_incomplete";

  // Esc closes the modal — scoped to the modal so it works regardless of drawer state
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Move focus into the modal on open. NavItemLink should snapshot
  // document.activeElement before opening and restore it after close.
  useEffect(() => { closeBtnRef.current?.focus(); }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}  // backdrop click closes
    >
      <div
        className="bg-slate-800 rounded-card border border-white/[0.06] w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 grid place-items-center">
              {isIncomplete
                ? <Lock  className="w-4 h-4 text-amber-400" aria-hidden="true" />
                : <Clock className="w-4 h-4 text-amber-400" aria-hidden="true" />}
            </div>
            <h2 id={titleId} className="text-sm font-semibold text-ink">
              {isIncomplete
                ? t('account.restricted.incompleteTitle', 'Complete Your Profile')
                : t('account.restricted.pendingTitle',    'Account Pending Approval')}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label={t('common.close', 'Close')}
            className="text-ink-dim hover:text-ink p-1 rounded-DEFAULT
                       focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
                       focus-visible:ring-offset-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-5 text-center">
          <p className="text-sm text-ink-muted mb-5">
            {isIncomplete
              ? t('account.restricted.incompleteBody',
                  'Please complete your profile to unlock all dashboard features.')
              : t('account.restricted.pendingBody',
                  "Your account is under review. You'll be notified once approved.")}
          </p>

          {isIncomplete && (
            <button
              onClick={() => { onClose(); window.location.href = "/complete-google-profile"; }}
              className="w-full py-2.5 rounded-DEFAULT bg-brand text-white text-sm font-medium
                         hover:bg-brand/90 transition-colors mb-2"
            >
              {t('account.restricted.completeCta', 'Complete Profile')}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2 rounded-DEFAULT border border-white/[0.06] text-sm
                       text-ink-muted hover:bg-white/[0.04] transition-colors"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Caller responsibility — `NavItemLink` (§7.5) should snapshot the trigger before opening and restore focus after close:

```tsx
const triggerRef = useRef<HTMLElement | null>(null);

const openRestricted = () => {
  triggerRef.current = document.activeElement as HTMLElement | null;
  setRestrictedOpen(true);
};
const closeRestricted = () => {
  setRestrictedOpen(false);
  // Defer so React removes the modal before we move focus back
  queueMicrotask(() => triggerRef.current?.focus());
};
```

This replaces the existing inline modal at [DashboardLayout.tsx:248-287](./DashboardLayout.tsx#L248-L287) — port it into the shared file, add the i18n keys to §11.4, then delete the inline copies from all three layouts.

---

## 10. Top Bar (sticky header)

The header stays **light** per §0 decision #1 — only the sidebar is dark. Use the app's standard light tokens (`bg-card`, `border-border`, `text-foreground`, etc.). The structural rules (sticky, `z-30`, hamburger on `<lg`, ordered right cluster) still apply.

```jsx
<header className="sticky top-0 z-30 bg-card border-b border-border">
  <div className="flex items-center justify-between px-4 lg:px-6 py-3">    {/* py-3 keeps current proportions; do NOT switch to h-14 — diverges from existing pages */}
    {/* Left — mobile hamburger only (light theme) */}
    <button
      className="lg:hidden text-foreground"
      onClick={() => setSidebarOpen(true)}
      aria-label="Open navigation"
      aria-expanded={sidebarOpen}
      aria-controls="primary-nav"
    >
      <Menu className="w-5 h-5" />
    </button>

    {/* Right cluster — always present, ordered: CompanySelector, Lang, Notif, User */}
    <div className="flex items-center gap-2 ml-auto">
      <CompanySelector />          {/* multi-company users only (renders null otherwise) */}
      <LanguageSwitcher />
      <NotificationBell />
      <UserMenu />                  {/* avatar + name + logout */}
    </div>
  </div>
</header>
```

### 10.1 UserMenu

Renders inside the **light** header (§0 decision #1) — uses the app's standard `text-foreground` / `accent` tokens, NOT the slate/ink palette.

```jsx
function UserMenu() {
  const userName = localStorage.getItem("userName");
  const handleLogout = useLogoutHandler();
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
        <span className="text-xs font-semibold text-accent">
          {userName?.charAt(0).toUpperCase()}
        </span>
      </div>
      <span className="text-sm font-medium text-foreground hidden sm:block">
        {userName}
      </span>
      <button
        onClick={handleLogout}
        aria-label="Logout"
        title="Logout"
        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
```

**`useLogoutHandler` MUST preserve every side effect of the original [DashboardLayout.tsx:132-148](./DashboardLayout.tsx#L132-L148) handler — none can be dropped during extraction:**

```ts
function useLogoutHandler() {
  const [logout] = useLogoutMutation();
  return async () => {
    // TODO: replace window.confirm with a branded confirm modal (e.g. shadcn AlertDialog).
    // Blocking native prompt is an antipattern; kept here only to preserve current behavior
    // during the design-system migration. Do NOT copy this pattern into new confirm flows.
    if (!window.confirm("Are you sure you want to logout?")) return;
    try { pushLogoutEvent(); } catch {}              // 1. GTM analytics event
    try { await logout().unwrap(); } catch (e) {     // 2. RTK logout (revoke session)
      console.error("Logout failed", e);
    }
    document.cookie = "accessToken=; Max-Age=0; path=/;";    // 3a. clear cookies
    document.cookie = "refreshToken=; Max-Age=0; path=/;";   // 3b
    localStorage.clear();                            // 4. clear localStorage
    sessionStorage.clear();                          // 5. clear sessionStorage
    window.location.href = "/";                      // 6. hard redirect (NOT navigate())
  };
}
```

The hard redirect at step 6 is intentional — it forces a fresh app boot so any cached RTK state, sockets, and contexts are torn down. Do not replace with `useNavigate()`.

### 10.2 NotificationBell badge

The header bell's unread-count badge uses a **different visual** than the nav-item brand pill — they signal different things, so don't share styles:

| Context | Background | Text | When |
|---|---|---|---|
| Nav-item count (informational) | `bg-brand/15` | `text-brand-glow` | E.g. "Bids & Winners 12" — neutral count |
| **Bell unread (action required)** | `bg-error` (`#ffb4ab`) | `text-white` | Unread notifications, demands attention |

```jsx
{unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                   rounded-full bg-error text-white text-[10px] font-bold
                   grid place-items-center">
    {unreadCount > 99 ? "99+" : unreadCount}
  </span>
)}
```

### 10.3 CompanySelector

The existing [`<CompanySelector />`](../common/CompanySelector.tsx) handles multi-company users. It **renders null** when the user has only one company or isn't in company mode, so it's safe to always include in the header.

### 10.4 SellerNotificationListener

Rendered **once per layout, outside the visible tree**, near the top of the JSX:

```jsx
{userId && (
  <SellerNotificationListener
    sellerId={userId}
    onNewBid={onNewBid}
  />
)}
```

Not visible — it's a socket subscriber that pushes events to `NotificationBell`.

---

## 11. Layout per Role — Items to Render

### 11.1 Seller (DashboardLayout.tsx)

> Badge counts are fetched at the top of the layout component:
> ```ts
> const { data: bidsData } = useGetSellerBidsQuery({ userId, page: 1, limit: 1 });
> const pendingBidsCount = bidsData?.pendingCount ?? 0;
> ```

```ts
const navigationSections: NavSection[] = [
  {
    title: t('nav.marketplace'),
    items: [
      { name: t('nav.browseMarketplace'), href: "/buyer-marketplace",
        icon: Store, permission: null, target: "_blank" },
    ],
  },
  {
    title: t('nav.selling'),
    items: [
      { name: t('nav.dashboard'),       href: "/dashboard",                  icon: LayoutDashboard, permission: null },
      { name: t('nav.listAnItem'),      href: "/upload",                     icon: Package,         permission: null },
      { name: t('nav.bulkUpload'),      href: "/dashboard/bulk-upload",      icon: TableProperties, permission: null },
      { name: t('nav.myListings'),      href: "/dashboard/submissions",      icon: ClipboardList,   permission: null },
      { name: t('nav.bidsAndWinners'),  href: "/dashboard/bids",             icon: TrendingUp,      permission: "bidding.view", badge: pendingBidsCount },
      { name: t('nav.auctionGroups'),   href: "/dashboard/auction-groups",   icon: Gavel,           permission: null },
      { name: t('nav.offersOrders'),    href: "/dashboard/seller/offers-orders", icon: Tag,         permission: null },
    ],
  },
  {
    title: t('nav.intelligence'),
    items: [
      { name: t('nav.dealReports'), href: "/dashboard/reports",           icon: FileText,       permission: "reports.view" },
      { name: t('nav.chat'),        href: "/dashboard/submission/message", icon: MessageCircle, permission: "chat.view" },
    ],
  },
  {
    title: t('nav.admin'),
    items: [
      { name: t('nav.settings'), href: "/dashboard/settings", icon: Settings, permission: "settings.view" },
    ],
  },
];
```

### 11.2 Buyer (BuyerDashboardLayout.tsx)

```ts
const navigationSections: NavSection[] = [
  {
    title: t('nav.marketplace'),
    items: [
      { name: t('nav.browseMarketplace'), href: "/buyer-marketplace", icon: Store, permission: null, target: "_blank" },
    ],
  },
  {
    title: t('nav.buying'),
    items: [
      { name: t('nav.dashboard'),    href: "/buyer-dashboard",            icon: LayoutDashboard, permission: null },
      { name: t('nav.myBids'),       href: "/buyer-dashboard/bids",       icon: Hammer,          permission: null },
      { name: t('nav.wonAuctions'), href: "/buyer-dashboard/won",         icon: Trophy,          permission: null },
      { name: t('nav.watchlist'),    href: "/buyer-dashboard/watchlist",  icon: Bookmark,        permission: null },
      { name: t('nav.orders'),       href: "/buyer-dashboard/orders",     icon: Package,         permission: null },
    ],
  },
  {
    title: t('nav.intelligence'),
    items: [
      { name: t('nav.marketInsights'), href: "/buyer-dashboard/insights", icon: BarChart3,     permission: null },
      { name: t('nav.chat'),           href: "/buyer-dashboard/chat",     icon: MessageCircle, permission: null },
    ],
  },
  {
    title: t('nav.account'),
    items: [
      { name: t('nav.settings'), href: "/buyer-dashboard/settings", icon: Settings, permission: null },
    ],
  },
];
```

### 11.3 Admin (AdminSidebar.tsx)

> Badge counts come from the dashboard-stats endpoint at the top of the layout:
> ```ts
> const { data: stats } = useGetAdminDashboardStatsQuery({ year, startMonth, endMonth });
> const pendingListingApprovals = stats?.data?.pendingListingApprovals ?? 0;
> const pendingSellerUpgrades   = stats?.data?.pendingSellerUpgrades   ?? 0;
> ```

```ts
const navigationSections: NavSection[] = [
  {
    title: t('admin.sidebar.overview'),
    items: [
      { name: t('admin.sidebar.dashboard'), href: "/admin", icon: LayoutDashboard, permission: null },
    ],
  },
  {
    title: t('admin.sidebar.users'),
    items: [
      { name: t('admin.sidebar.sellers'),         href: "/admin/sellers",                 icon: Store,     permission: null },
      { name: t('admin.sidebar.buyers'),          href: "/admin/buyers",                  icon: Users,     permission: null },
      { name: t('admin.sidebar.upgradeRequests'), href: "/admin/seller-upgrade-requests", icon: UserCheck, permission: null, badge: pendingSellerUpgrades },
    ],
  },
  {
    title: t('admin.sidebar.commerce'),
    items: [
      { name: t('admin.sidebar.listings'),      href: "/admin/listings",        icon: Package,      permission: null, badge: pendingListingApprovals },
      { name: t('admin.sidebar.auctionGroups'), href: "/admin/auction-groups",  icon: Gavel,        permission: null },
      { name: t('admin.sidebar.offersOrders'),  href: "/admin/offers",          icon: ShoppingCart, permission: null },
    ],
  },
  {
    title: t('admin.sidebar.intelligence'),
    items: [
      { name: t('admin.sidebar.reports'),       href: "/admin/reports",        icon: FileText, permission: null },
      { name: t('admin.sidebar.notifications'), href: "/admin/notifications",  icon: Bell,     permission: null },
    ],
  },
  {
    title: t('admin.sidebar.system'),
    items: [
      { name: t('admin.sidebar.settings'), href: "/admin/settings", icon: Settings, permission: null },
    ],
  },
];
```

### 11.4 i18n keys

Define under `nav.*` (already partially present in [en.json](../../i18n/locales/en.json)):

```jsonc
"nav": {
  "marketplace": "Marketplace",
  "selling": "Selling",
  "buying": "Buying",
  "intelligence": "Intelligence",
  "admin": "Admin",
  "account": "Account",
  "browseMarketplace": "Browse Marketplace",
  "dashboard": "Dashboard",
  "listAnItem": "List an Item",
  "bulkUpload": "Bulk Upload",
  "myListings": "My Listings",
  "bidsAndWinners": "Bids & Winners",
  "auctionGroups": "Auction Groups",
  "offersOrders": "Offers & Orders",
  "dealReports": "Deal Reports",
  "chat": "Chat",
  "settings": "Settings",
  "myBids": "My Bids",
  "wonAuctions": "Won Auctions",
  "watchlist": "Watchlist",
  "orders": "Orders",
  "marketInsights": "Market Insights"
},
"common": {
  "soon": "Soon",
  "close": "Close"
},
"account": {
  "restricted": {
    "incompleteTitle": "Complete Your Profile",
    "incompleteBody":  "Please complete your profile to unlock all dashboard features.",
    "completeCta":     "Complete Profile",
    "pendingTitle":    "Account Pending Approval",
    "pendingBody":     "Your account is under review. You'll be notified once approved."
  }
},
"admin": {
  "sidebar": {
    "overview": "Overview",
    "users": "Users",
    "commerce": "Commerce",
    "intelligence": "Intelligence",
    "system": "System",
    "dashboard": "Dashboard",
    "sellers": "Sellers",
    "buyers": "Buyers",
    "upgradeRequests": "Upgrade Requests",
    "listings": "Listings",
    "auctionGroups": "Auction Groups",
    "offersOrders": "Offers & Orders",
    "reports": "Reports",
    "notifications": "Notifications",
    "settings": "Settings"
  }
}
```

Mirror every key in `ja.json` and `th.json`.

---

## 12. Accessibility Checklist

- [ ] `aria-label="Primary navigation"` on `<aside>`.
- [ ] `aria-current="page"` on the active nav link.
- [ ] `aria-disabled="true"` on disabled items.
- [ ] `aria-label` on logo link, hamburger, close-X, logout button.
- [ ] `aria-expanded` + `aria-controls` on the hamburger.
- [ ] `aria-hidden="true"` on backdrop and decorative icons.
- [ ] `role="dialog" aria-modal="true"` on `SidebarRestrictedModal` (§9) and the `UpgradeModal` owned by [`RoleSwitcher`](../common/RoleSwitcher.tsx) (this checklist applies to both — the upgrade modal lives inside RoleSwitcher but follows the same a11y rules).
- [ ] Touch targets ≥ 44px (nav items use `h-11`).
- [ ] Color contrast: `#bbcabf` on `#0b1326` ≈ 9.2:1 ✓ (AAA).
- [ ] Focus ring: `focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900` on all interactive elements.
- [ ] `motion-reduce:transition-none` on every animated element.
- [ ] Mobile sidebar: `Escape` closes; backdrop click closes; focus moves to close-X when opened.
- [ ] **Skip-link** at the very top of `<body>`: `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>`; main content gets `id="main-content"` and `tabIndex={-1}`.

---

## 13. Mobile Behavior

Below `lg` (1024px):
- Sidebar starts hidden (`-translate-x-full`).
- Hamburger in header opens (`translate-x-0`).
- Backdrop (`bg-black/60 backdrop-blur-sm z-40`), click-to-close, Esc-to-close.
- Width: `w-[280px]` (or `w-[85vw]` capped — both acceptable; pick `w-[280px]` for consistency).
- Transition: `transform translate-x-* 250ms ease-out`.
- Auto-close after navigation (call `setSidebarOpen(false)` on link click).
- Focus auto-moved to close-X on open; no full focus trap (acceptable trade-off — Esc + backdrop click cover egress).

---

## 14. Migration Notes

### Step 0 (do this first) — Sweep width consumers

Every page that compensates for the sidebar with `lg:pl-56` or `lg:pl-64` needs to bump to `lg:pl-[280px]`. Otherwise content sits 24px or 56px to the left of the sidebar.

```bash
# Search (cross-platform — works on Windows PowerShell and bash):
rg "lg:pl-(56|64)" 101lab-2/src -g "*.tsx"
# Replace each match with:
lg:pl-[280px]   # or lg:pl-sidebar if the Tailwind token is added
```

`rg` has no built-in `tsx` type; use `-g "*.tsx"` or `--type-add 'tsx:*.tsx' -t tsx`.

Known consumers as of this writing:
- [DashboardLayout.tsx:290](./DashboardLayout.tsx#L290) — `lg:pl-56`
- [BuyerDashboardLayout.tsx](./BuyerDashboardLayout.tsx) — check `lg:pl-*`
- [AdminSidebar.tsx](./AdminSidebar.tsx) consumers in `/admin/*` pages (e.g. [Admin.tsx](../../pages/Admin/Admin.tsx) uses `lg:pl-56`)

### Step 1 — Container

Swap sidebar classes:
```diff
- "fixed top-0 left-0 z-50 h-screen w-56 bg-sidebar border-r border-sidebar-border"
+ "fixed top-0 left-0 z-50 h-screen w-[280px] bg-slate-900 border-r border-white/[0.06]"
```

### Step 2 — Logo block

Already correct in current code; verify `brightness-0 invert` and add `aria-label` on the wrapper.

### Step 3 — Section headers

Bump from `text-[9px]` (current) to `text-label-caps` (12px) per §1.2. Existing 9px is too small for a11y.

### Step 4 — Nav items

Replace the inline `<Link>` block with the `NavItemLink` component (§7.5). This is the biggest change — extract once, share across all three layouts.

### Step 5 — Header

Layout structure is already correct in DashboardLayout (sticky, hamburger left, right cluster ordered CompanySelector → Lang → Notif → User). Per **§0 decision #1**, the header stays **light** — do **not** apply the dark slate tokens here:

```jsx
<header className="sticky top-0 z-30 bg-card border-b border-border">
  <div className="flex h-14 items-center justify-between px-4 lg:px-6">
    {/* … */}
  </div>
</header>
```

Enforce `h-14` on the inner flex container (header_height token, §1.3) instead of implicit `py-3`. Seller/buyer logout buttons keep standard light tokens (`text-muted-foreground hover:text-destructive`) because they sit in the light header, not the dark sidebar.

### Step 6 — Extract shared parts

Create:
- `components/layouts/sidebar/NavItemLink.tsx`
- `components/layouts/sidebar/SectionHeader.tsx`
- `components/layouts/sidebar/SidebarRestrictedModal.tsx`
- `components/layouts/sidebar/UserMenu.tsx`

Each layout becomes a thin wrapper that supplies its own `navigationSections` array.

---

## 15. What's Explicitly NOT in scope

- Light-mode variant.
- Collapsed / icon-only sidebar.
- Drag-to-reorder nav items.
- User-customizable shortcuts.
- `<dialog>` element for the mobile sidebar (use `<div>` overlay).
- Per-user theme overrides.
- **RTL (Arabic / Hebrew) layouts.** The 2px active-indicator bar is hard-coded `left-0`; flipping to `right-0` under `dir="rtl"` is the obvious extension but no current locale needs it. Call this out if/when an RTL locale ships.

If any of these become required later, add a new section — don't bolt them onto the existing states.

---

## 16. Implementation Progress

Durable progress log. Updated as work lands. Each item links to the relevant spec section so anyone can verify "did we actually do what we said?"

### Phase A — Foundation (no behavior change) ✅

- [x] **A1.** Tailwind tokens added per §2 — see [tailwind.config.ts](../../../tailwind.config.ts) (`slate-{600..950}`, `brand.{DEFAULT,glow,deep,soft}`, `ink.{DEFAULT,muted,dim}`, `error`, `width.sidebar`, `padding.sidebar`, `borderRadius.card`, `fontSize.nav`, `fontSize.label-caps`).
- [x] **A2.** [`components/layouts/sidebar/types.ts`](./sidebar/types.ts) — `NavItem`, `NavSection`.
- [x] **A3.** [`components/layouts/sidebar/SidebarContext.tsx`](./sidebar/SidebarContext.tsx) — context + `SidebarProvider` + `useSidebar`.
- [x] **A4.** [`components/layouts/sidebar/helpers.ts`](./sidebar/helpers.ts) — `useAccountStatus`, `computeIsActive`, `computeRestricted`, `useFilterItems`.
- [x] **A5.** [`components/layouts/sidebar/SectionHeader.tsx`](./sidebar/SectionHeader.tsx).
- [x] **A6.** [`components/layouts/sidebar/SidebarRestrictedModal.tsx`](./sidebar/SidebarRestrictedModal.tsx) — Esc handler, focus auto-move to close-X, `useId()` for `aria-labelledby`, all copy through `t()`.
- [x] **A7.** [`components/layouts/sidebar/NavItemLink.tsx`](./sidebar/NavItemLink.tsx) — seven states (default/hover/active/restricted/permission-gated/disabled/external), trigger-focus restore via `queueMicrotask`.
- [x] **A8.** [`components/layouts/sidebar/UserMenu.tsx`](./sidebar/UserMenu.tsx) + `useLogoutHandler` (preserves all six legacy side effects: confirm, GTM, RTK logout, cookies, localStorage, sessionStorage, hard redirect).
- [x] **A8b.** [`components/layouts/sidebar/index.ts`](./sidebar/index.ts) barrel re-export so layouts import from `./sidebar`.
- [x] **A9.** i18n keys added to [`en.json`](../../i18n/locales/en.json): `common.{logout,close,soon}` and `account.restricted.{incompleteTitle,incompleteBody,completeCta,pendingTitle,pendingBody}`. Existing `nav.*` keys reused.
- [x] **A10.** i18n keys mirrored: [`ja.json`](../../i18n/locales/ja.json), [`th.json`](../../i18n/locales/th.json), [`zh.json`](../../i18n/locales/zh.json) — all four locales validated as parseable JSON.

### Phase B — Seller migration (reference layout) ✅

- [x] **B1.** [`DashboardLayout.tsx`](./DashboardLayout.tsx) rewritten: sidebar width → `w-[280px]`, sidebar dark-themed (`bg-slate-900`, `border-white/[0.06]`, `text-ink-*` close button). **Header + page content stay light** per §0 decision #1. `lg:pl-56` → `lg:pl-[280px]`.
- [x] **B1b.** Shared [`NavItemLink`](./sidebar/NavItemLink.tsx) + [`SectionHeader`](./sidebar/SectionHeader.tsx) migrated off legacy `sidebar-foreground` / `accent` classes to design tokens (`brand-*`, `ink-*`, `slate-850`, `brand-soft`).
- [x] **B2.** Inline `<Link>` block in `DashboardLayout.tsx` replaced with `<NavItemLink>`.
- [x] **B3.** Inline restricted modal removed; modal now owned by `NavItemLink` via shared `SidebarRestrictedModal`.
- [x] **B4.** `handleLogout` deleted from `DashboardLayout.tsx`; logout is now via `UserMenu` → `useLogoutHandler`.
- [x] **B5.** `lg:pl-56` in `DashboardLayout.tsx` → `lg:pl-[280px]`.
- [x] **B5b.** Esc-to-close + auto-focus close-X effects wired with `closeBtnRef`.
- [x] **B5c.** `id="primary-nav"` + `aria-controls="primary-nav"` on hamburger; skip-link target `id="main-content"` + `tabIndex={-1}` on `<main>`.
- [x] **B5d.** **Typecheck passes:** `npx tsc --noEmit` exits 0.
- [ ] **B6.** Manual smoke test (browser): seller dashboard renders, nav active states correct, click restricted item opens modal, role switcher works, logout completes. *(Pending — needs user verification in dev server.)*

### Phase C — Buyer + Admin migration ✅

- [x] **C1.** [`BuyerDashboardLayout.tsx`](./BuyerDashboardLayout.tsx) migrated. Uses shared `NavItemLink` + `SectionHeader` + `SidebarRestrictedModal` (via NavItemLink). **Buyer-specific logout kept inline** — its cross-domain cookie-clear semantics differ from the seller's `useLogoutHandler`, so a unified handler is deferred. Header + user menu stay light.
- [x] **C2.** [`AdminSidebar.tsx`](./AdminSidebar.tsx) restyled with the design tokens (280px, `bg-slate-900`, `text-ink-*`, brand active-bar, `text-label-caps` section headers, h-11 nav items). **Two documented deviations from spec §0:** (a) logout stays in the sidebar footer because admin has no header user-menu, (b) keeps its own [`useAdminSidebar()`](../../context/AdminSidebarContext.tsx) context because 23 admin pages already consume it. Uses an internal `AdminNavLink` mirroring the visual states from `NavItemLink` (no `useSidebar`/restricted-modal coupling).
- [x] **C2b.** [`AdminLayout.tsx`](./AdminLayout.tsx) `lg:pl-56` → `lg:pl-[280px]`.
- [ ] **C3.** Buyer + admin manual smoke tests (browser). *(Pending user verification.)*

### Phase D — Width sweep (Step 0) ✅

- [x] **D1.** `lg:pl-56` → `lg:pl-[280px]` across all consumers. Sweep touched **27 files** (admin pages in `pages/Admin/*` + a couple others); the four layout files were already updated as part of Phases B/C. `rg "lg:pl-56" 101lab-2/src` confirms zero matches in code (only in this spec md as historical reference).
- [x] **D1b.** Fixed mojibake on 11 files corrupted by the PowerShell sweep (PS 5.1 default reads as CP1252; reversed via UTF-8-read → CP1252-encode → write raw bytes). All non-ASCII chars (em-dashes, ellipses, CJK) restored.
- [ ] **D2.** Manual smoke test: spot-check 3 admin pages. *(Pending user verification.)*

### Phase E — Cleanup

- [x] **E1.** Dead imports cleaned during the rewrites (DashboardLayout dropped `Users/Shield/Clock/Eye/Layers/Trophy/ShoppingCart/BarChart3/Lock/toast/useLogoutMutation/useVerifyUserQuery/useGetSellerBidsQuery/useSellerPermissions/CompleteProfileForm/CompanyOrganization`; BuyerDashboardLayout dropped `useState/useLocation/Building2/Lock/Clock/useVerifyUserQuery`; AdminSidebar dropped no longer needed pieces).
- [x] **E2.** Legacy `bg-sidebar` / `border-sidebar-border` / `text-sidebar-foreground/*` removed from all three layout shells + shared sidebar nav components. Confirmed: `rg "bg-sidebar|sidebar-foreground|sidebar-border" 101lab-2/src/components/layouts` — no matches in layout `*.tsx` or `sidebar/NavItemLink.tsx` / `sidebar/SectionHeader.tsx`. (`--sidebar` CSS vars remain in `index.css` for shadcn primitives only — see §2.1.)
- [ ] **E3.** Final visual diff against the Stitch screenshot. *(User to verify.)*

### Validation — final pass

- [x] `npx tsc --noEmit` exit 0.
- [x] All 4 locale JSON files (`en/ja/th/zh`) parse via `ConvertFrom-Json`.
- [x] Zero `lg:pl-56` references remain in `src/**/*.tsx`.

### Known deferrals (do not check off — track for later)

- RTL active-indicator bar flip (see §15).
- `window.confirm` → branded confirm modal in `useLogoutHandler` (TODO in §10.1).
- Lift `isCompanyMode` out of `localStorage` into a context (TODO in §7.0 `useFilterItems`).

