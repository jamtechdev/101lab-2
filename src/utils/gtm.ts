// GTM / GA4 dataLayer utility — 101lab
// Only update this file when adding/changing tracking fields.

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

const SITE_TYPE = "101lab" as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function calculateDaysSince(isoDate: string | null | undefined): number {
  if (!isoDate) return 0;
  const ms = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return days < 0 ? 0 : days;
}

function initDataLayer() {
  window.dataLayer = window.dataLayer || [];
}

function getBaseUserFields() {
  const u = getSessionUser();
  return {
    user_id:   String(u?.user_id ?? ""),
    user_role: u?.user_role ?? "",
    site_type: SITE_TYPE,
  };
}

// ── User object builder ───────────────────────────────────────────────────────

export interface GA4UserObject {
  user_id: string | number;
  user_role: string;
  site_type: string;
  account_status: string;
  registration_date: string | null;
  days_since_registration: number;
  phone_verified: boolean;
  login_count: number;
  last_login_date: string | null;
  days_since_last_login: number;
  is_returning_user: boolean;
  total_bids_placed: number;
  total_offers_made: number;
  watchlist_count: number;
  interested_categories: string; // comma-separated
  deal_type_preference: string;
}

export function buildLoginUserObject(result: any): GA4UserObject {
  const user      = result?.data?.data?.user ?? {};
  const analytics = result?.data?.analytics ?? {};

  const registrationDate = analytics.registration_date ?? null;
  const lastLoginDate    = analytics.last_login_date ?? null;

  return {
    user_id:                  String(user.id ?? ""),
    user_role:                user.role ?? "",
    site_type:                SITE_TYPE,
    account_status:           analytics.account_status ?? "unknown",
    registration_date:        registrationDate,
    days_since_registration:  calculateDaysSince(registrationDate),
    phone_verified:           analytics.phone_verified ?? false,
    login_count:              analytics.login_count ?? 1,
    last_login_date:          lastLoginDate,
    days_since_last_login:    calculateDaysSince(lastLoginDate),
    is_returning_user:        analytics.is_returning_user ?? false,
    total_bids_placed:        analytics.total_bids_placed ?? 0,
    total_offers_made:        analytics.total_offers_made ?? 0,
    watchlist_count:          analytics.watchlist_count ?? 0,
    interested_categories:    Array.isArray(analytics.interested_categories)
                                ? analytics.interested_categories.join(",")
                                : (analytics.interested_categories ?? ""),
    deal_type_preference:     analytics.deal_type_preference ?? "both",
  };
}

// ── login ─────────────────────────────────────────────────────────────────────

export function pushLoginEvent(
  result: any,
  method: "email" | "google" | "phone" = "email"
): void {
  try {
    initDataLayer();

    const userObj = buildLoginUserObject(result);

    window.dataLayer.push({ user: undefined });

    window.dataLayer.push({
      event:  "login",
      method,
      ...userObj,
    });

    try {
      sessionStorage.setItem("ga4_user", JSON.stringify(userObj));
      sessionStorage.setItem("ga4_login_time", String(Date.now()));
    } catch {
      // sessionStorage may be blocked in some privacy modes
    }
  } catch (err) {
    console.warn("[GTM] pushLoginEvent failed:", err);
  }
}

// ── Session helpers ───────────────────────────────────────────────────────────

export function getSessionUser(): GA4UserObject | null {
  try {
    const raw = sessionStorage.getItem("ga4_user");
    return raw ? (JSON.parse(raw) as GA4UserObject) : null;
  } catch {
    return null;
  }
}

export function clearSessionUser(): void {
  try {
    sessionStorage.removeItem("ga4_user");
    sessionStorage.removeItem("ga4_login_time");
  } catch { /* ignore */ }
}

// ── logout ────────────────────────────────────────────────────────────────────

export function pushLogoutEvent(): void {
  try {
    initDataLayer();
    const base = getBaseUserFields();
    let session_duration_seconds: number | null = null;
    try {
      const t = sessionStorage.getItem("ga4_login_time");
      if (t) session_duration_seconds = Math.floor((Date.now() - Number(t)) / 1000);
    } catch { /* ignore */ }

    window.dataLayer.push({
      event: "logout",
      ...base,
      session_duration_seconds,
    });

    clearSessionUser();
  } catch (err) {
    console.warn("[GTM] pushLogoutEvent failed:", err);
  }
}

// ── page_view ─────────────────────────────────────────────────────────────────

export function pushPageViewEvent(path: string, title?: string): void {
  try {
    initDataLayer();
    const base = getBaseUserFields();
    window.dataLayer.push({
      event:      "page_view",
      page_path:  path,
      page_title: title || document.title,
      ...base,
    });
  } catch (err) {
    console.warn("[GTM] pushPageViewEvent failed:", err);
  }
}

// ── user_signup ───────────────────────────────────────────────────────────────

export function pushSignupEvent(userRole: string): void {
  try {
    initDataLayer();
    window.dataLayer.push({
      event:     "user_signup",
      method:    "email",
      user_role: userRole,
      site_type: SITE_TYPE,
    });
  } catch (err) {
    console.warn("[GTM] pushSignupEvent failed:", err);
  }
}

// ── role_selected ─────────────────────────────────────────────────────────────

export function pushRoleSelectedEvent(role: string): void {
  try {
    initDataLayer();
    window.dataLayer.push({
      event:         "role_selected",
      selected_role: role,
      site_type:     SITE_TYPE,
    });
  } catch (err) {
    console.warn("[GTM] pushRoleSelectedEvent failed:", err);
  }
}

// ── view_listing ──────────────────────────────────────────────────────────────

export interface ListingViewParams {
  batch_id:        number | string;
  batch_number?:   number | string;
  batch_title?:    string;
  batch_category?: string;
  batch_status?:   string;
  item_count?:     number;
  seller_id?:      number | string;
}

export function pushViewListingEvent(params: ListingViewParams): void {
  try {
    initDataLayer();
    const base = getBaseUserFields();
    window.dataLayer.push({
      event: "view_listing",
      ...params,
      ...base,
    });
  } catch (err) {
    console.warn("[GTM] pushViewListingEvent failed:", err);
  }
}

// ── place_bid ─────────────────────────────────────────────────────────────────

export interface PlaceBidParams {
  batch_id:     number | string;
  batch_number?: number | string;
  bid_amount:   number;
  currency:     string;
  bid_type?:    string;
}

export function pushPlaceBidEvent(params: PlaceBidParams): void {
  try {
    initDataLayer();
    const base = getBaseUserFields();
    window.dataLayer.push({
      event: "place_bid",
      ...params,
      ...base,
    });
  } catch (err) {
    console.warn("[GTM] pushPlaceBidEvent failed:", err);
  }
}

// ── make_offer ────────────────────────────────────────────────────────────────

export interface MakeOfferParams {
  batch_id:        number | string;
  offer_amount:    number;
  offer_quantity?: number;
  currency?:       string;
}

export function pushMakeOfferEvent(params: MakeOfferParams): void {
  try {
    initDataLayer();
    const base = getBaseUserFields();
    window.dataLayer.push({
      event: "make_offer",
      ...params,
      ...base,
    });
  } catch (err) {
    console.warn("[GTM] pushMakeOfferEvent failed:", err);
  }
}

// ── search ────────────────────────────────────────────────────────────────────

export function pushSearchEvent(
  search_term: string,
  results_count: number,
  filters_applied?: string
): void {
  try {
    initDataLayer();
    const base = getBaseUserFields();
    window.dataLayer.push({
      event:           "search",
      search_term,
      results_count,
      filters_applied: filters_applied ?? null,
      ...base,
    });
  } catch (err) {
    console.warn("[GTM] pushSearchEvent failed:", err);
  }
}

// ── interests_saved ───────────────────────────────────────────────────────────

export function pushInterestsSavedEvent(
  categories: string[],
  action: "add" | "remove"
): void {
  try {
    initDataLayer();
    const base = getBaseUserFields();
    window.dataLayer.push({
      event:          "interests_saved",
      categories:     categories.join(","),
      category_count: categories.length,
      action,
      ...base,
    });
  } catch (err) {
    console.warn("[GTM] pushInterestsSavedEvent failed:", err);
  }
}

// ── form_interact (first-touch per named form) ────────────────────────────────

const _touchedForms = new Set<string>();

export function pushFormInteractEvent(formName: string, fieldName: string): void {
  try {
    if (_touchedForms.has(formName)) return;
    _touchedForms.add(formName);
    initDataLayer();
    const base = getBaseUserFields();
    window.dataLayer.push({
      event:       "form_interact",
      form_name:   formName,
      first_field: fieldName,
      ...base,
    });
  } catch (err) {
    console.warn("[GTM] pushFormInteractEvent failed:", err);
  }
}

export function resetFormInteract(formName: string): void {
  _touchedForms.delete(formName);
}

// ===== GA4 SPEC v1 EVENTS (added) =====

// ── session_id ────────────────────────────────────────────────────────────────

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = sessionStorage.getItem("ga4_session_id");
    if (existing) return existing;
    let sid: string;
    try {
      sid = (crypto as any)?.randomUUID
        ? (crypto as any).randomUUID()
        : "sid-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
    } catch {
      sid = "sid-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
    }
    try {
      sessionStorage.setItem("ga4_session_id", sid);
    } catch { /* ignore */ }
    return sid;
  } catch {
    return "sid-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
  }
}

// ── utm params ────────────────────────────────────────────────────────────────

export interface UtmParams {
  utm_source:   string | null;
  utm_medium:   string | null;
  utm_campaign: string | null;
  utm_content:  string | null;
}

export function parseUtmParams(): UtmParams {
  const empty: UtmParams = {
    utm_source:   null,
    utm_medium:   null,
    utm_campaign: null,
    utm_content:  null,
  };
  if (typeof window === "undefined") return empty;
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl: UtmParams = {
      utm_source:   params.get("utm_source"),
      utm_medium:   params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content:  params.get("utm_content"),
    };
    const hasAny =
      fromUrl.utm_source   !== null ||
      fromUrl.utm_medium   !== null ||
      fromUrl.utm_campaign !== null ||
      fromUrl.utm_content  !== null;

    if (hasAny) {
      try {
        sessionStorage.setItem("ga4_utm", JSON.stringify(fromUrl));
      } catch { /* ignore */ }
      return fromUrl;
    }

    try {
      const raw = sessionStorage.getItem("ga4_utm");
      if (raw) return JSON.parse(raw) as UtmParams;
    } catch { /* ignore */ }

    return empty;
  } catch {
    return empty;
  }
}

// ── device_type ───────────────────────────────────────────────────────────────

export function getDeviceType(): "mobile" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  try {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      ? "mobile"
      : "desktop";
  } catch {
    return "desktop";
  }
}

// ── site_entry ────────────────────────────────────────────────────────────────

export function pushSiteEntryEvent(params: {
  page_type: "landing" | "home" | "listing" | "search";
}): void {
  if (typeof window === "undefined") return;
  try {
    try {
      if (sessionStorage.getItem("ga4_site_entry_fired")) return;
    } catch { /* ignore */ }

    initDataLayer();
    const utm = parseUtmParams();
    const traffic_source =
      (typeof document !== "undefined" && document.referrer) || "direct";

    window.dataLayer.push({
      event:          "site_entry",
      site_type:      SITE_TYPE,
      page_type:      params.page_type,
      traffic_source,
      utm_source:     utm.utm_source,
      utm_medium:     utm.utm_medium,
      utm_campaign:   utm.utm_campaign,
      utm_content:    utm.utm_content,
      device_type:    getDeviceType(),
      session_id:     getOrCreateSessionId(),
    });

    try {
      sessionStorage.setItem("ga4_site_entry_fired", "1");
    } catch { /* ignore */ }
  } catch (err) {
    console.warn("[GTM] pushSiteEntryEvent failed:", err);
  }
}

// ── add_to_wishlist ───────────────────────────────────────────────────────────

export function pushAddToWishlistEvent(params: {
  listing_id:       string | number;
  listing_title:    string;
  listing_category: string;
  price?:           number;
  currency?:        string;
}): void {
  if (typeof window === "undefined") return;
  try {
    initDataLayer();
    const base = getBaseUserFields();
    const currency = params.currency || "INR";
    const price    = params.price    || 0;

    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event:            "add_to_wishlist",
      ...base,
      site_type:        SITE_TYPE,
      user_id:          String(base.user_id ?? ""),
      listing_id:       String(params.listing_id),
      listing_title:    params.listing_title,
      listing_category: params.listing_category,
      ecommerce: {
        currency,
        value: price,
        items: [{
          item_id:       String(params.listing_id),
          item_name:     params.listing_title,
          item_category: params.listing_category,
          price,
          quantity:      1,
        }],
      },
    });
  } catch (err) {
    console.warn("[GTM] pushAddToWishlistEvent failed:", err);
  }
}

// ── listing_created ───────────────────────────────────────────────────────────

export function pushListingCreatedEvent(params: {
  listing_id:              string | number;
  listing_title:           string;
  listing_category:        string;
  listing_subcategory?:    string;
  asking_price:            number;
  deal_type:               "bidding" | "make_offer";
  is_first_listing?:       boolean;
  sellers_listing_number?: number;
  images_uploaded?:        number;
  currency?:               string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const dedupeKey = "ga4_listing_created_" + String(params.listing_id);
    try {
      if (sessionStorage.getItem(dedupeKey)) return;
    } catch { /* ignore */ }

    initDataLayer();
    const base = getBaseUserFields();
    const currency = params.currency || "INR";

    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event:                  "listing_created",
      ...base,
      site_type:              SITE_TYPE,
      user_id:                String(base.user_id ?? ""),
      listing_id:             params.listing_id,
      listing_title:          params.listing_title,
      listing_category:       params.listing_category,
      listing_subcategory:    params.listing_subcategory,
      asking_price:           params.asking_price,
      deal_type:              params.deal_type,
      is_first_listing:       params.is_first_listing,
      sellers_listing_number: params.sellers_listing_number,
      images_uploaded:        params.images_uploaded,
      currency,
      ecommerce: {
        currency,
        value: params.asking_price,
        items: [{
          item_id:       String(params.listing_id),
          item_name:     params.listing_title,
          item_category: params.listing_category,
          price:         params.asking_price,
          quantity:      1,
        }],
      },
    });

    try {
      sessionStorage.setItem(dedupeKey, "1");
    } catch { /* ignore */ }
  } catch (err) {
    console.warn("[GTM] pushListingCreatedEvent failed:", err);
  }
}

// ── purchase ──────────────────────────────────────────────────────────────────

export function pushPurchaseEvent(params: {
  transaction_id:   string;
  transaction_type: "bid_won" | "offer_accepted";
  offer_rounds?:    number | null;
  value:            number;
  currency?:        string;
  items: Array<{
    item_id:        string | number;
    item_name:      string;
    item_category?: string;
    price:          number;
    quantity?:      number;
  }>;
}): void {
  if (typeof window === "undefined") return;
  try {
    const dedupeKey = "ga4_purchase_" + params.transaction_id;
    try {
      if (sessionStorage.getItem(dedupeKey)) return;
    } catch { /* ignore */ }

    initDataLayer();
    const base = getBaseUserFields();
    const currency = params.currency || "INR";
    const offer_rounds =
      params.offer_rounds !== undefined
        ? params.offer_rounds
        : (params.transaction_type === "bid_won" ? null : undefined);

    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event:            "purchase",
      ...base,
      site_type:        SITE_TYPE,
      user_id:          String(base.user_id ?? ""),
      transaction_type: params.transaction_type,
      offer_rounds,
      ecommerce: {
        transaction_id: params.transaction_id,
        value:          params.value,
        currency,
        items: params.items.map((it) => ({
          item_id:       String(it.item_id),
          item_name:     it.item_name,
          item_category: it.item_category,
          price:         it.price,
          quantity:      it.quantity ?? 1,
        })),
      },
    });

    try {
      sessionStorage.setItem(dedupeKey, "1");
    } catch { /* ignore */ }
  } catch (err) {
    console.warn("[GTM] pushPurchaseEvent failed:", err);
  }
}

// ── listing_sold ──────────────────────────────────────────────────────────────

export function pushListingSoldEvent(params: {
  transaction_id:         string;
  listing_id:             string | number;
  listing_category:       string;
  sold_price:             number;
  asking_price:           number;
  days_to_sell:           number;
  total_bids_received:    number;
  total_offers_received:  number;
  deal_type:              "bidding" | "make_offer";
  currency?:              string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const dedupeKey = "ga4_sold_" + String(params.listing_id);
    try {
      if (sessionStorage.getItem(dedupeKey)) return;
    } catch { /* ignore */ }

    initDataLayer();
    const base = getBaseUserFields();
    const currency = params.currency || "INR";

    window.dataLayer.push({
      event:                  "listing_sold",
      ...base,
      site_type:              SITE_TYPE,
      user_id:                String(base.user_id ?? ""),
      transaction_id:         params.transaction_id,
      listing_id:             params.listing_id,
      listing_category:       params.listing_category,
      sold_price:             params.sold_price,
      asking_price:           params.asking_price,
      days_to_sell:           params.days_to_sell,
      total_bids_received:    params.total_bids_received,
      total_offers_received:  params.total_offers_received,
      deal_type:              params.deal_type,
      currency,
    });

    try {
      sessionStorage.setItem(dedupeKey, "1");
    } catch { /* ignore */ }
  } catch (err) {
    console.warn("[GTM] pushListingSoldEvent failed:", err);
  }
}

// ── offer_received ────────────────────────────────────────────────────────────

export function pushOfferReceivedEvent(params: {
  listing_id:    string | number;
  offer_id:      string | number;
  offer_amount:  number;
  asking_price:  number;
  offer_round:   number;
  currency?:     string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const dedupeKey = "ga4_offer_viewed_" + String(params.offer_id);
    try {
      if (sessionStorage.getItem(dedupeKey)) return;
    } catch { /* ignore */ }

    initDataLayer();
    const base = getBaseUserFields();
    const currency = params.currency || "INR";

    window.dataLayer.push({
      event:        "offer_received",
      ...base,
      site_type:    SITE_TYPE,
      user_id:      String(base.user_id ?? ""),
      listing_id:   params.listing_id,
      offer_id:     params.offer_id,
      offer_amount: params.offer_amount,
      asking_price: params.asking_price,
      offer_round:  params.offer_round,
      currency,
    });

    try {
      sessionStorage.setItem(dedupeKey, "1");
    } catch { /* ignore */ }
  } catch (err) {
    console.warn("[GTM] pushOfferReceivedEvent failed:", err);
  }
}

// ── counter_offer ─────────────────────────────────────────────────────────────

export function pushCounterOfferEvent(params: {
  listing_id:     string | number;
  offer_id:       string | number;
  counter_amount: number;
  original_offer: number;
  asking_price:   number;
  offer_round:    number;
  currency?:      string;
}): void {
  if (typeof window === "undefined") return;
  try {
    initDataLayer();
    const base = getBaseUserFields();
    const currency = params.currency || "INR";

    window.dataLayer.push({
      event:          "counter_offer",
      ...base,
      site_type:      SITE_TYPE,
      user_id:        String(base.user_id ?? ""),
      listing_id:     params.listing_id,
      offer_id:       params.offer_id,
      counter_amount: params.counter_amount,
      original_offer: params.original_offer,
      asking_price:   params.asking_price,
      offer_round:    params.offer_round,
      currency,
    });
  } catch (err) {
    console.warn("[GTM] pushCounterOfferEvent failed:", err);
  }
}
