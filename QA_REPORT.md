# Green-Bidz Platform — QA / Bug Report
**Project:** 101lab-2 (Green-Bidz Frontend)  
**Date:** April 17, 2026  
**Reviewer:** Claude Code (Automated Static Analysis + Flow Review)  
**Files Analyzed:** 240+ source files  

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 5 |
| 🟠 High | 8 |
| 🟡 Medium | 7 |
| 🟢 Low | 5 |
| **Total** | **25** |

---

## 🔴 CRITICAL Issues

---

### BUG-001 — SVG Files Not Rejected in Image Upload (XSS Vector)

**File:** `src/pages/dashboard/BulkUpload.tsx` — Lines 335–336  
**Category:** Security / File Upload  
**Severity:** Critical  

**Description:**  
Image validation only checks `blob.type.startsWith("image/")`. SVG files have MIME type `image/svg+xml`, which passes this check. SVG files can contain embedded `<script>` tags and malicious JavaScript, making this an XSS attack vector.

**Steps to Reproduce:**
1. Create an SVG file with embedded JavaScript: `<svg><script>alert('XSS')</script></svg>`
2. Host it at a URL and put it in the bulk upload spreadsheet's image column
3. Observe: the file passes validation and gets uploaded

**Expected:** SVG files are rejected with message "File type not supported. Please use JPG, PNG, or WebP."  
**Actual:** SVG file is accepted and uploaded without warning

**Current Code:**
```tsx
if (!blob.type.startsWith("image/")) continue; // SVG passes this check!
```

**Fix:**
```tsx
const BLOCKED_TYPES = ["image/svg+xml", "image/svg", "image/x-svg"];
if (!blob.type.startsWith("image/") || BLOCKED_TYPES.includes(blob.type)) {
  // Show: "File type not supported. Allowed: JPG, PNG, WebP, GIF."
  continue;
}
```

---

### BUG-002 — Same SVG Issue in Seller Listing Step1 and Offer Modal

**Files:**  
- `src/components/steps/Step1.tsx` — Line 371 (`accept="image/*,video/*"`)  
- `src/pages/Seller/MakeBiddingOfferModal.tsx` — Line 238 (`accept="image/*,.pdf,.doc,.docx"`)  
- `src/pages/dashboard/UploadMethod.tsx` — Lines 496–497  

**Category:** Security / File Upload  
**Severity:** Critical  

**Description:**  
Same SVG bypass issue exists in at least 3 other upload components. All use `accept="image/*"` or `file.type.startsWith('image/')` without explicitly blocking SVG.

**Steps to Reproduce:**
1. Go to Seller listing creation → Step 1
2. Upload an SVG file as the product image
3. Observe: file is accepted

**Expected:** Consistent rejection of SVG across all upload points  
**Actual:** SVG accepted in all these locations

---

### BUG-003 — userId Not Null-Checked Before Bulk Upload

**File:** `src/pages/dashboard/BulkUpload.tsx` — Lines 368, 557, 598  
**Category:** Data Integrity / Auth  
**Severity:** Critical  

**Description:**  
`userId` is read from `localStorage.getItem("userId")` without a null check. If a user's session expires or localStorage is cleared mid-session, `userId` becomes `null`. The string `"null"` or an empty string is then sent as `post_author_id` in every product upload, causing all products to be created with no owner.

**Steps to Reproduce:**
1. Start a bulk upload with products queued
2. Open DevTools → Application → Clear localStorage
3. Click "Upload" or allow ongoing upload to continue
4. Observe: products are created with no valid author ID

**Expected:** Upload stops with "Session expired, please log in again."  
**Actual:** Products created with empty/null author ID silently

**Current Code:**
```tsx
const userId = localStorage.getItem("userId"); // can be null
formData.append("post_author_id", userId || ""); // sends ""
```

**Fix:**
```tsx
const userId = localStorage.getItem("userId");
if (!userId) {
  toastError("Session expired. Please log in again.");
  return;
}
```

---

### BUG-004 — Tokens Not Cleared on Auth Failure in ProtectedRoute

**File:** `src/context/ProtectedRoute.tsx` — Lines 26–27  
**Category:** Security / Session Management  
**Severity:** Critical  

**Description:**  
When the user-verification API returns an error or `success: false`, the route redirects to `/auth`. However, stale JWT tokens are NOT cleared from localStorage. This means a sophisticated attacker could still use the stale tokens for API calls directly, bypassing the redirect.

**Steps to Reproduce:**
1. Log in as a user
2. Invalidate the session server-side (e.g., force-expire token)
3. Navigate to a protected route
4. Observe: redirect to `/auth` happens BUT `localStorage.accessToken` still exists

**Expected:** Redirect + clear all auth tokens from localStorage  
**Actual:** Redirect only; tokens persist

**Current Code:**
```tsx
if (isError || !data?.success)
  return <Navigate to="/auth" replace />;
  // ← Tokens NOT cleared
```

**Fix:**
```tsx
if (isError || !data?.success) {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
  return <Navigate to="/auth" replace />;
}
```

---

### BUG-005 — Socket Join Failure Not Handled After Login

**File:** `src/pages/Auth/Auth.tsx` — Lines 207–210  
**Category:** Real-time / Data Loss  
**Severity:** Critical  

**Description:**  
After login, a socket room-join event is emitted. If the join fails (`res.success === false`), there is no error handling. The user appears logged in but will not receive any real-time notifications (bids, messages, auction updates), potentially missing critical events without any indication.

**Steps to Reproduce:**
1. Log in when the WebSocket server is under load or partially down
2. Observe: login succeeds, user is redirected to dashboard
3. Socket room join fails silently — no bids or messages arrive

**Expected:** Show a warning "Real-time updates unavailable. Please refresh."  
**Actual:** Silently fails; user misses all real-time events

**Current Code:**
```tsx
socket.emit("joinRooms", { user_id: userId, role }, (res) => {
  if (res.success) console.log("Socket rooms joined successfully");
  // ← No else branch
});
```

---

## 🟠 HIGH Issues

---

### BUG-006 — No File Size Limit on Uploaded Images

**File:** `src/pages/dashboard/BulkUpload.tsx` — Lines 330–344  
**Category:** Performance / DoS  
**Severity:** High  

**Description:**  
Images fetched from URLs during bulk upload have no size limit. A malicious or accidental URL pointing to a 500MB file will be fully downloaded into memory before any check occurs, causing browser tab crash or server-side memory exhaustion.

**Fix:**
```tsx
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const blob = await response.blob();
if (blob.size > MAX_SIZE) {
  // Notify: "Image at row X exceeds 10MB limit and was skipped."
  continue;
}
```

---

### BUG-007 — Silent Failure When Image Fetch Fails (CORS/Network)

**File:** `src/pages/dashboard/BulkUpload.tsx` — Lines 340–341  
**Category:** UX / Error Handling  
**Severity:** High  

**Description:**  
When an image URL fails to fetch (CORS block, 404, timeout), the error is silently caught and the image is skipped. The user has no idea why the product has no image.

**Steps to Reproduce:**
1. Put a broken or CORS-blocked image URL in the bulk upload sheet
2. Upload the sheet
3. Observe: product is created but with no image and no error shown

**Expected:** "Row 3: Image URL failed to load (CORS or invalid URL). Product created without image."  
**Actual:** Silent failure — product created, no feedback

**Current Code:**
```tsx
} catch {
  /* CORS or network */
}
```

---

### BUG-008 — Batch Creation Failure Not Communicated to User

**File:** `src/pages/dashboard/BulkUpload.tsx` — Lines 606–608  
**Category:** UX / Data Integrity  
**Severity:** High  

**Description:**  
If batch/auction group linking fails after a product is created, the product exists but is not linked to any auction. The upload is marked as "success" but the product is in an orphaned state.

**Expected:** "Product created but failed to link to auction group. Please assign it manually."  
**Actual:** Upload shows success; product is unlinked silently

---

### BUG-009 — No Password Strength Requirements

**File:** `src/pages/Auth/Auth.tsx` — Line 121  
**Category:** Security / Auth  
**Severity:** High  

**Description:**  
Password validation only requires 6+ characters. Passwords like `aaaaaa` or `123456` are accepted.

**Fix:**
```tsx
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,}$/;
if (!PASSWORD_REGEX.test(formData.password)) {
  // "Password must be 8+ chars with uppercase, number, and special character."
}
```

---

### BUG-010 — Generic API Errors Not Mapped to User-Friendly Messages

**File:** `src/rtk/api/baseQuery.ts` — Lines 38–44  
**Category:** UX / Error Handling  
**Severity:** High  

**Description:**  
All API errors fall back to a single generic message. A `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`, and a network timeout all look the same to the user.

**Fix:**
```tsx
const STATUS_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "Session expired. Please log in again.",
  403: "You don't have permission to perform this action.",
  404: "The requested resource was not found.",
  429: "Too many requests. Please wait and try again.",
  500: "Server error. Please try again later.",
};
const message = STATUS_MESSAGES[status] || data?.message || "Something went wrong.";
```

---

### BUG-011 — Potential Crash: `batch.seller_id` Used Without Null Check

**File:** `src/pages/Seller/Checkout.tsx` — Line 135  
**Category:** Runtime Crash / Data  
**Severity:** High  

**Description:**  
`batch.seller_id` is used without checking if `batch` is a fully loaded object. If the `batch` API returns an empty object or fails, this will throw a `TypeError: Cannot read properties of undefined`.

**Expected:** Graceful loading state or error message  
**Actual:** Potential white screen / uncaught TypeError

---

### BUG-012 — Debug `console.log` Statements Left in Production Code

**Files:**  
- `src/pages/Marketplace/BulkMarketplace.tsx` — Lines 63, 126–127  
- `src/context/SellerPermissionRoute.tsx` — Lines 33, 56, 68, 72  

**Category:** Security / Code Quality  
**Severity:** High  

**Description:**  
Several files contain debug `console.log` statements (some with emoji 🔍) that expose internal state, user IDs, and permission data in browser DevTools. This is an information leakage risk in production.

**Fix:** Remove all debug logs before deployment.

---

### BUG-013 — Refresh Token Flow Not Implemented

**File:** `src/rtk/api/baseQuery.ts`  
**Category:** Auth / UX  
**Severity:** High  

**Description:**  
When the `accessToken` expires, API calls silently fail with 401. There is no automatic token refresh using `refreshToken`. Users are not redirected to login — requests just fail with generic errors.

**Expected:** Auto-refresh token → retry request → seamless experience  
**Actual:** Silent 401 failures until user manually navigates to `/auth`

---

## 🟡 MEDIUM Issues

---

### BUG-014 — OTP Expiration Time Not Shown to User

**File:** `src/pages/Auth/Auth.tsx` / `ForgotPassword.tsx` — OTP screen  
**Category:** UX  
**Severity:** Medium  

**Description:**  
After entering email for OTP verification, the user sees an OTP input but has no indication of how long the code is valid. If they take too long, the code expires and they get a generic error.

**Fix:** Show a countdown timer: "Code expires in 4:32"

---

### BUG-015 — Category ID Not Validated Against Available Category List

**File:** `src/pages/dashboard/BulkUpload.tsx` — Line 530  
**Category:** Data Integrity  
**Severity:** Medium  

**Description:**  
Category validation only checks `if (!categoryId)`. It does not verify that `categoryId` is a valid ID from the loaded `apiCategories` list. A stale or manually entered category ID could pass validation and create products with invalid categories.

---

### BUG-016 — Company Mode Permission Check Bypasses Loading State

**File:** `src/context/SellerPermissionRoute.tsx` — Lines 32–39  
**Category:** Authorization  
**Severity:** Medium  

**Description:**  
While `isLoadingProfile` is true (permissions API still loading), the route renders its children and grants access. A slow connection could allow a user to access a page they should not have access to.

**Fix:** Show a loading spinner while permissions are being validated.

---

### BUG-017 — `isCompanyMode` Permission Can Be Tampered via localStorage

**File:** `src/context/SellerPermissionRoute.tsx` — Line 33  
**Category:** Authorization  
**Severity:** Medium  

**Description:**  
`isCompanyMode` is read from localStorage. Any user can open DevTools and set `localStorage.isCompanyMode = "true"` to bypass the individual/company toggle check client-side.

**Fix:** The server should be the authoritative source of company mode status and enforce permissions on each API call.

---

### BUG-018 — Checkout Shipping Address Has No Format Validation

**File:** `src/pages/Seller/Checkout.tsx` — Line 123  
**Category:** Data Quality  
**Severity:** Medium  

**Description:**  
Shipping address validation only checks `if (shippingAddress.trim())`. A user can enter a single character and proceed. No city, country, or postal code validation exists.

---

### BUG-019 — Product Numeric Fields Not Validated as Numbers

**File:** `src/pages/dashboard/BulkUpload.tsx` — Bulk row processing  
**Category:** Data Integrity  
**Severity:** Medium  

**Description:**  
Fields like quantity, price, and weight are read from the spreadsheet and sent to the API without validating they are valid numbers. A user entering "abc" in the quantity field will submit invalid data.

**Fix:**
```tsx
const quantity = Number(row.quantity);
if (isNaN(quantity) || quantity <= 0) {
  rowErrors.push(`Row ${index}: Quantity must be a positive number`);
}
```

---

### BUG-020 — No Account Lockout After Failed Login Attempts

**File:** `src/pages/Auth/Auth.tsx` — Login handler  
**Category:** Security  
**Severity:** Medium  

**Description:**  
No rate limiting or lockout mechanism exists on the frontend. A brute-force script can attempt unlimited password combinations. This should also be handled server-side, but the frontend should show warnings after 3–5 failed attempts.

---

## 🟢 LOW Issues

---

### BUG-021 — No Error Shown When Category API Fails to Load

**File:** `src/pages/dashboard/BulkUpload.tsx` — Line 374  
**Category:** UX  
**Severity:** Low  

**Description:**  
If the category API fails, the dropdown silently falls back to an empty or hardcoded list with no notification to the user.

---

### BUG-022 — Hardcoded WhatsApp Message in English Only

**File:** `src/pages/Seller/Checkout.tsx` — Line 57  
**Category:** Localization  
**Severity:** Low  

**Description:**  
The pre-filled WhatsApp message is hardcoded in English: `"Hello 👋, I would like to place..."`. If the platform supports multiple languages, this should be localized.

---

### BUG-023 — Permission API Not Cached — Fetched on Every Route Change

**File:** `src/context/SellerPermissionRoute.tsx`  
**Category:** Performance  
**Severity:** Low  

**Description:**  
Seller permissions are re-fetched from the API every time the user navigates to a protected route. This results in unnecessary API calls and a brief permission-loading delay on each navigation.

---

### BUG-024 — Max Image URL Limit (10) Not Clearly Communicated

**File:** `src/pages/dashboard/BulkUpload.tsx` — Line 286  
**Category:** UX  
**Severity:** Low  

**Description:**  
Only the first 10 image URLs per product are processed. There is no visible indication in the UI or template that this limit exists.

---

### BUG-025 — `AdminRoute.tsx` Has Duplicate Token-Check Logic

**File:** `src/context/AdminRoute.tsx` — Lines 5–12  
**Category:** Code Quality  
**Severity:** Low  

**Description:**  
`AdminRoute` implements its own custom `getCookie()` function and checks both cookies and localStorage for tokens, duplicating logic already in `ProtectedRoute`. This inconsistency could lead to split behavior if one implementation is updated but not the other.

---

## Prioritized Fix Roadmap

### Sprint 1 — Immediate (Security & Crashes)
| Bug | Action |
|-----|--------|
| BUG-001, BUG-002 | Block SVG MIME type in all upload components |
| BUG-003 | Add userId null-check before all API submissions |
| BUG-004 | Clear tokens on ProtectedRoute auth failure |
| BUG-012 | Remove all debug console.logs |

### Sprint 2 — High Priority (Quality & UX)
| Bug | Action |
|-----|--------|
| BUG-005 | Handle socket join failure |
| BUG-006 | Add 10MB file size limit |
| BUG-007 | Show error row when image URL fails to fetch |
| BUG-008 | Notify user of partial batch link failure |
| BUG-009 | Enforce password strength |
| BUG-010 | Map HTTP status codes to user-friendly messages |
| BUG-011 | Add null check for `batch.seller_id` |
| BUG-013 | Implement refresh token auto-retry |

### Sprint 3 — Medium (Robustness)
| Bug | Action |
|-----|--------|
| BUG-014 | Add OTP countdown timer |
| BUG-015 | Validate categoryId against loaded list |
| BUG-016 | Block route during permission loading |
| BUG-019 | Validate numeric fields in bulk upload rows |
| BUG-020 | Warn after repeated failed login attempts |

### Sprint 4 — Low (Polish)
- BUG-017: Server-side enforcement of company mode
- BUG-018: Address format validation
- BUG-021–BUG-025: UX and performance improvements

---

*End of Report — Green-Bidz QA Audit, April 17, 2026*
