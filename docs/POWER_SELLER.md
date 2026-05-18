# Power Seller — admin-controlled premium tier

**Status:** Frontend + backend landed 2026-05-18. **No DB schema changes** — uses WordPress `jos_usermeta` for storage. Admin restart required after pulling backend changes.

## What it is

A platform-admin-granted flag that marks a seller as "Power Seller." Orthogonal to the three existing role layers in [ROLE_BASED_MENU_APPROACH.md §2.1](./ROLE_BASED_MENU_APPROACH.md). A fourth layer:

| Layer | Values | Lives in |
|---|---|---|
| Platform role | `admin` / `seller` / `buyer` | JWT |
| UI mode | `seller` / `buyer` | localStorage |
| Company sub-role | `admin` / `product_manager` / `product_viewer` | DB |
| **Seller tier** (NEW) | `is_power_seller: boolean` | DB column (TBD) |

Perks the tier unlocks are **not defined yet** — this PR only adds the flag and the admin toggle. Perks (higher limits, lower fees, badge, exclusive features) are TBD and gate against `useSellerPermissions().isPowerSeller`.

## What landed in the frontend

| File | Change |
|---|---|
| [src/rtk/slices/apiSlice.ts](../src/rtk/slices/apiSlice.ts) | Added `setSellerPowerStatus` mutation → `PUT /admin/sellers/:id/power-seller`, exported `useSetSellerPowerStatusMutation`. |
| [src/context/AuthContext.tsx](../src/context/AuthContext.tsx) | `AuthUser.is_power_seller?: boolean` so `/user/verify-user` response can carry it. |
| [src/hooks/useSellerPermissions.ts](../src/hooks/useSellerPermissions.ts) | Returns `isPowerSeller` boolean. Source priority: AuthContext (verify-user) → `user-type-role` API. |
| [src/pages/Admin/AdminSellersDetails.tsx](../src/pages/Admin/AdminSellersDetails.tsx) | Reads `seller.is_power_seller` from the existing `useGetBatchesBySellerQuery` response; renders a Crown badge next to the seller name + a "Grant / Revoke" toggle card with confirm dialog and toast. |

## Backend implementation (landed)

**Safety stance:** the User model wraps the WordPress `jos_users` table. Touching that table with `ALTER TABLE` would risk conflicts with WordPress upgrades and is hard to reverse. Instead the flag is stored as a `jos_usermeta` row — the canonical WordPress extension mechanism. **No `ALTER TABLE`. No new tables. Fully reversible.**

### Storage

| Table | meta_key | meta_value |
|---|---|---|
| `jos_usermeta` | `is_power_seller` | `"1"` (active) or `"0"` (revoked) |

To revoke for all users (e.g. nuking the feature): `DELETE FROM jos_usermeta WHERE meta_key = 'is_power_seller';` — leaves all other user data untouched.

### Endpoint

```
PUT /api/v1/admin/sellers/:id/power-seller
  body: { is_power_seller: boolean }
  response: { success: true, message, data: { user_id, is_power_seller } }
```

Implementation: [101recycle-greenbidz-backend/controller/powerSellerController.js](../../101recycle-greenbidz-backend/controller/powerSellerController.js). Mounted on the existing `adminRouter` ([routes/adminRoute.js](../../101recycle-greenbidz-backend/routes/adminRoute.js)). Existing admin auth (whatever protects the rest of `/api/v1/admin`) applies automatically.

### How the flag surfaces to the frontend

No echo work was needed. [`getAdminUserFullDetailsService`](../../101recycle-greenbidz-backend/services/Admin/AdminService.js) already spreads the entire `jos_usermeta` map into `response.user.meta` (`meta: { ...meta, pw_user_status }`). So writing `is_power_seller` to a meta row makes it appear automatically as `user.meta.is_power_seller` on the very next `GET /admin/users/:id/full-details`.

The frontend reads `meta?.is_power_seller === "1"` ([AdminUserDetails.tsx:259](../src/pages/Admin/AdminUserDetails.tsx)).

### To deploy

1. Pull `101recycle-greenbidz-backend` changes.
2. Restart the Node server. **No migration to run.**
3. Pull `101lab-2` changes and reload the browser. Admin → Sellers → Details → "Make Power Seller" button works.

### What about `useSellerPermissions` / `AuthContext`?

`AuthUser.is_power_seller?: boolean` is still defined in [AuthContext.tsx](../src/context/AuthContext.tsx) and `useSellerPermissions().isPowerSeller` is still exposed, but they're currently `false` for everyone because:

- `/user/verify-user` doesn't echo meta to the top-level.
- `/user/user-type-role` doesn't either.

When you want power sellers to *see* perks (not just have admins set the flag), the cleanest follow-up is to add **one line** to whichever service generates the verify-user response:

```js
is_power_seller: userMeta?.is_power_seller === "1",
```

That's the next phase — call out perks first, then wire propagation.

## Open product decisions (deferred)

- **Perks** — what specifically does Power Seller unlock? Higher listing quotas, lower commission, badge on listings, priority features? Pending product input.
- **Self-service request flow** — should sellers apply (like the existing `/seller-upgrade/request` for buyer→seller), or admin-grant-only? Currently admin-grant-only.
- **Auto-grant criteria** — e.g. after N successful sales. Not in v1.
- **Downgrade UX** — Revoke button works; question is whether the seller gets notified.

## Open frontend follow-ups

- Show the Crown badge on **public** seller-facing pages (marketplace search results, listing detail page) once perks include visibility.
- Add a `/admin/sellers` list-page filter for `is_power_seller`.
- The admin toggle currently does `window.location.reload()` on success — replace with `invalidatesTags` on the relevant RTK query once the seller-details endpoint is tagged.
