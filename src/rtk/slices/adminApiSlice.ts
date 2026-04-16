// src/rtk/slices/adminApiSlice.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../api/baseQuery";
import { SITE_TYPE } from "@/config/site";

/* ---------- USER TYPES ---------- */
export type AdminUserStatus = "active" | "deactive" | "approved" | "pending";

export interface UserItem {
  user_id: number;
  name: string;
  email: string;
  registered_at: string;
  status: AdminUserStatus;
  member_id: string | null;
  company?: string | null;
  phone?: string | null;
  address?: string | null;
  documents?: {
    waste_disposal_permit?: string | null;
    business_reg_certificate?: string | null;
  };
}

export interface UserStats {
  total_users: number;
}

export interface UserResponse {
  success: boolean;
  data: UserItem[];
  stats: UserStats;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminUserDetails {
  user_id: number;
  user_login: string;
  name: string;
  email: string;
  registered_at: string;
  status: "active" | "deactive" | "pending" | "approved" | string;
  member_id: string | null;
  user_type: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  company: string | null;
  companyTaxIdNumber: string | null;
  documents: {
    waste_disposal_permit?: string | null;
    business_reg_certificate?: string | null;
  };
  meta: Record<string, any>;
}

export interface AdminUserDetailsResponse {
  success: boolean;
  message: string;
  data: AdminUserDetails;
}

export interface UpdateUserStatusPayload {
  userId: number;
  status: "approved" | "pending";
}

export interface UpdateUserStatusResponse {
  success: boolean;
  message: string;
}

/* ---------- SELLER TYPES ---------- */
export interface SellerItem {
  seller_id: number;
  company_name: string;
  email: string;
  phone: string | null;
  total_listings: number;
  total_sold: number;
  total_live: number;
  total_inactive: number;
  total_sales: number;
  total_sales_amount: string;
  currency: string;
}

export interface SellerStats {
  total_sellers: number;
  new_this_month: number;
  total_listings: number;
}

export interface SellerResponse {
  success: boolean;
  message: string;
  stats: SellerStats;
  data: SellerItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/* ---------- BUYER TYPES ---------- */
export interface BuyerItem {
  buyer_id: number;
  company_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  total_bids: number;
  pending_bids: number;
  accepted_bids: number;
  rejected_bids: number;
  total_purchases: number;
  total_amount_purchases: string;
  currency: string;
}

export interface BuyerStats {
  total_buyers: number;
  new_this_month: number;
  total_purchases: number;
}

export interface BuyerResponse {
  success: boolean;
  message: string;
  stats: BuyerStats;
  data: BuyerItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/* ---------- BATCH TYPES ---------- */

export interface BatchProduct {
  title: string;
  images: string[];
  category: string;
  post_date?: string;
}

export interface BatchSellerMeta {
  role?: string;
  company?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  company_name?: string;
  member_id?: string;
  greenbidz_company?: string;
  greenbidz_address_street?: string;
  greenbidz_address_city?: string;
  greenbidz_address_district?: string;
  greenbidz_address_postal_code?: string;
  greenbidz_address_country?: string;
  [key: string]: string | undefined;
}

export interface BatchSeller {
  ID: number;
  user_login: string;
  user_email: string;
  user_nicename: string;
  display_name: string;
  meta: BatchSellerMeta;
}

export interface BatchBid {
  bid_id: number;
  currency: string;
  end_date: string;
  start_date: string;
  status: string;
  target_price: string;
  type: string;
}

export interface BatchItem {
  batch_id: number;
  batch_number: number;
  seller_id: number;
  commission_percent?: number | null;
  seller: BatchSeller;
  status: string;
  step: number;
  approval_status?: "pending" | "approved";
  products: BatchProduct[];
  total_products: number;
  bid: BatchBid | null;
  total_bids: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BatchStats {
  total_listings: number;
  sold: number;
  published: number;
  live_for_bids: number;
  inspection_schedule: number;
  pending_approval_total?: number;
  pending_approval_today?: number;
}

export interface AdminBatchResponse {
  success: boolean;
  message: string;
  stats: BatchStats;
  data: BatchItem[];
  pagination: {
    total_batches: number;
    total_pages: number;
    current_page: number;
    limit: number;
  };
}

export interface DeleteBatchResponse {
  success: boolean;
  message: string;
}

/* ---------- BATCH DETAILS TYPES ---------- */

export interface BatchDetailsBatch {
  batch_id: number;
  status: string;
  seller_id: number;
  product_ids: number[];
  commission_percent?: number | null;
}

export interface BatchDetailsSeller {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
}

export interface BatchDetailsProductImage {
  url: string;
  type: string;
}

export interface BatchDetailsProduct {
  product_id: number;
  title: string;
  description: string;
  images: BatchDetailsProductImage[];
  category: string;
}

export interface InspectionScheduleSlot {
  time: string;
}

export interface InspectionSchedule {
  date: string;
  slots: InspectionScheduleSlot[];
}

export interface InspectionRegistrationBuyer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
}

export interface InspectionRegistration {
  registration_id: number;
  company_name: string;
  date: string;
  slot: string;
  selected: boolean;
  skipped: boolean;
  buyer: InspectionRegistrationBuyer;
}

export interface BatchDetailsInspection {
  schedule: InspectionSchedule[];
  inspectionRegistration: InspectionRegistration[];
}

export interface BuyerBidBuyer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

export interface BuyerBidPayment {
  amount: string;
  status: string;
}

export interface BuyerBid {
  amount: string;
  status: string;
  submitted_at: string;
  notes: string;
  buyer: BuyerBidBuyer;
  payment: BuyerBidPayment | null;
}

export interface BatchDetailsBidding {
  type: string;
  start_date: string;
  end_date: string;
  current_price: string;
  target_price: string;
  location: string;
  status: string;
  currency: string;
  buyer_bids: BuyerBid[];
  total_biddings: number;
}

export interface WinnerBuyer {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
}

export interface BatchDetailsWinner {
  amount: string;
  buyer: WinnerBuyer;
  payment_status: string;
}

export interface PaymentDetailBuyer {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
}

export interface PaymentDetail {
  amount: string;
  payment_method: string;
  transaction_number: string;
  paid_at: string;
  pickup_date: string | null;
  pickup_time: string | null;
  is_delivery: boolean;
  buyer: PaymentDetailBuyer;
  payment_status: string;
}

export interface BatchDetailsData {
  batch: BatchDetailsBatch;
  seller: BatchDetailsSeller;
  products: BatchDetailsProduct[];
  products_total: number;
  inspection: BatchDetailsInspection;
  bidding: BatchDetailsBidding;
  winners: BatchDetailsWinner;
  total_biddings: number;
  paymentDetail: PaymentDetail | null;
}

export interface BatchDetailsResponse {
  success: boolean;
  message: string;
  data: BatchDetailsData;
}

/* ---------------- EMAIL SEND TYPES ---------------- */
/* ---------------- EMAIL SEND TYPES ---------------- */
export interface EmailTypeItem {
  id: number;
  type_name: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  users?: EmailUserItem[];
  subjects?: EmailSubjectItem[];
  messages?: EmailMessageItem[];
}

export interface EmailUserItem {
  id: number;
  email: string;
  is_active: boolean;
  type_id: number;
  createdAt: string;
  updatedAt: string;
  messages?: EmailMessageItem[];
}

export interface EmailMessageItem {
  id: number;
  subject: string;
  body: string;
  is_active: boolean;
  user_id: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSubjectItem {
  id: number;
  subject: string;
  is_active: boolean;
  type_id: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTypeResponse {
  success: boolean;
  message: string;
  data: EmailTypeItem[];
}

export interface EmailUserResponse {
  success: boolean;
  message: string;
  data: EmailUserItem[];
}

export interface EmailMessageResponse {
  success: boolean;
  message: string;
  data: EmailMessageItem[];
}

/* ---------- AUTO-APPROVAL RULE TYPES ---------- */
export interface AutoApprovalRuleItem {
  id: number;
  start_date: string;
  end_date: string;
  site_id: number | null;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AutoApprovalRulesResponse {
  success: boolean;
  data: AutoApprovalRuleItem[];
}

/* ---------- SELLER AUTO-APPROVAL REQUEST (seller requests with dates; admin can edit, approve, or turn off) ---------- */
export interface SellerAutoApprovalRequestItem {
  id: number;
  seller_id: number;
  status: "pending" | "approved" | "rejected";
  requested_start_date: string | null;
  requested_end_date: string | null;
  start_date: string | null;
  end_date: string | null;
  reviewed_at: string | null;
  revoked_at: string | null;
  createdAt: string;
  updatedAt: string;
  seller?: {
    ID: number;
    user_email: string;
    display_name: string;
    user_nicename: string;
  };
}

export interface SellerAutoApprovalRequestsResponse {
  success: boolean;
  data: SellerAutoApprovalRequestItem[];
}

/* ---------- COMMISSION RULES ---------- */
export type CommissionScope = "global" | "seller" | "batch";

export interface CommissionRuleItem {
  id: number;
  scope: CommissionScope;
  seller_id: number | null;
  batch_id: number | null;
  percent: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  seller?: {
    ID: number;
    display_name: string;
    user_email: string;
    user_nicename: string;
  } | null;
  batch?: {
    id: number;
    batch_name: string;
    seller_id: number;
    status: string;
  } | null;
}

export interface CommissionRulesResponse {
  success: boolean;
  data: CommissionRuleItem[];
}

export interface CreateCommissionRulePayload {
  scope: CommissionScope;
  percent: number;
  seller_id?: number;
  batch_id?: number;
}

export interface UpdateCommissionRulePayload {
  percent?: number;
  is_active?: boolean;
}

/* ---------- ADMIN AUCTION GROUP TYPES ---------- */
export interface AdminAuctionGroupItem {
  group_id: number;
  title: string;
  title_en?: string;
  title_zh?: string;
  title_ja?: string;
  title_th?: string;
  slug?: string;
  description?: string;
  description_en?: string;
  description_zh?: string;
  country: string;
  languages: string[];
  site_id: number;
  seller_id: number;
  status: "active" | "inactive";
  approval_status: "pending" | "approved";
  featured_type: "none" | "featured" | "highlighted" | "both";
  auction_count: number;
  createdAt: string;
  updatedAt: string;
}

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: axiosBaseQuery,
  tagTypes: [
    "Sellers",
    "Buyers",
    "Batches",
    "EmailTypes",
    "EmailUsers",
    "EmailMessages",
    "Users",
    "AutoApprovalRules",
    "SellerAutoApprovalRequests",
    "CommissionRules",
    "AdminAuctionGroups",
    "ProductRequests",
  ],

  endpoints: (builder) => ({
    /* ---------------- GET SELLERS ---------------- */
    getSellers: builder.query<
      SellerResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        return {
          url: `/admin/seller?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Sellers"],
    }),

    /* ---------------- GET BUYERS ---------------- */
    getBuyers: builder.query<BuyerResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        return {
          url: `/admin/buyer?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Buyers"],
    }),

    /* ---------------- GET ADMIN BATCHES ---------------- */
    getAdminBatches: builder.query<
      AdminBatchResponse,
      { page?: number; limit?: number; type?: string; dateFrom?: string; dateTo?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, type, dateFrom, dateTo, sort }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (type) params.set("type", type);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (sort) params.set("sort", sort);

        return {
          url: `/admin/batches?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Batches"],
    }),

    /* ---------------- DELETE BATCH ---------------- */
    deleteBatch: builder.mutation<DeleteBatchResponse, number>({
      query: (batchId) => ({
        url: `/admin/batches/${batchId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Batches"],
    }),

    /* ---------------- APPROVE BATCH (makes it visible to buyers) ---------------- */
    approveBatch: builder.mutation<
      { success: boolean; message: string; data: BatchItem },
      number
    >({
      query: (batchId) => ({
        url: `/admin/batches/${batchId}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Batches"],
    }),

    /* ---------------- GET BATCH DETAILS ---------------- */
    getBatchDetails: builder.query<BatchDetailsResponse, number>({
      query: (batchId) => ({
        url: `/admin/batch/${batchId}/details`,
        method: "GET",
      }),
      providesTags: (_result, _error, batchId) => [
        { type: "Batches", id: batchId },
      ],
    }),

    /* ---------------- EMAIL ENDPOINTS ---------------- */
    getEmailTypes: builder.query<EmailTypeResponse, void>({
      query: () => ({ url: `/email/types`, method: "GET" }),
      providesTags: ["EmailTypes"],
    }),

    createEmailType: builder.mutation<
      EmailTypeItem,
      { type_name: string; is_active?: boolean }
    >({
      query: (body) => ({ url: `/email/types`, method: "POST", data: body }),
      invalidatesTags: ["EmailTypes"],
    }),

    updateEmailType: builder.mutation<
      EmailTypeItem,
      { id: number; data: Partial<EmailTypeItem> }
    >({
      query: ({ id, data }) => ({
        url: `/email/types/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: ["EmailTypes"],
    }),

    deleteEmailType: builder.mutation<
      { success: boolean; message: string },
      number
    >({
      query: (id) => ({ url: `/email/types/${id}`, method: "DELETE" }),
      invalidatesTags: ["EmailTypes"],
    }),

    /* ---------- EMAIL USERS ---------- */
    getEmailUsers: builder.query<EmailUserResponse, number>({
      query: (typeId) => ({
        url: `/email/types/${typeId}/users`,
        method: "GET",
      }),
      providesTags: ["EmailUsers"],
    }),

    createEmailUser: builder.mutation<
      EmailUserItem,
      { typeId: number; email: string; is_active?: boolean }
    >({
      query: ({ typeId, ...body }) => ({
        url: `/email/types/${typeId}/users`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["EmailUsers"],
    }),

    updateEmailUser: builder.mutation<
      EmailUserItem,
      { userId: number; data: Partial<EmailUserItem> }
    >({
      query: ({ userId, data }) => ({
        url: `/email/users/${userId}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: ["EmailUsers"],
    }),

    deleteEmailUser: builder.mutation<
      { success: boolean; message: string },
      number
    >({
      query: (userId) => ({ url: `/email/users/${userId}`, method: "DELETE" }),
      invalidatesTags: ["EmailUsers"],
    }),

    /* ---------- EMAIL MESSAGES ---------- */
    getEmailMessages: builder.query<EmailMessageResponse, number>({
      query: (typeId) => ({
        url: `/email/types/${typeId}/messages`,
        method: "GET",
      }),
      providesTags: ["EmailMessages"],
    }),

    createEmailMessage: builder.mutation<
      EmailMessageItem,
      { typeId: number; subject: string; body: string }
    >({
      query: ({ typeId, ...body }) => ({
        url: `/email/types/${typeId}/messages`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["EmailMessages"],
    }),

    updateEmailMessage: builder.mutation<
      EmailMessageItem,
      { messageId: number; data: Partial<EmailMessageItem> }
    >({
      query: ({ messageId, data }) => ({
        url: `/email/messages/${messageId}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: ["EmailMessages"],
    }),

    deleteEmailMessage: builder.mutation<
      { success: boolean; message: string },
      number
    >({
      query: (messageId) => ({
        url: `/email/messages/${messageId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EmailMessages"],
    }),


    getUsers: builder.query<
      BuyerResponse,
      {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        userType?: string; // "seller" | "buyer"
        sort?: string; // "newest" | "oldest"
      }
    >({
      query: ({ page = 1, limit = 10, ...filters }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          ...Object.entries(filters)
            .filter(([_, value]) => value !== undefined && value !== "")
            .reduce(
              (acc, [key, value]) => ({ ...acc, [key]: String(value) }),
              {}
            ),
        });

        return {
          url: `/admin/users?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Users"],
    }),

    getAdminUserDetails: builder.query<AdminUserDetailsResponse, number>({
      query: (userId) => ({
        url: `/admin/users/${userId}/full-details`,
        method: "GET",
      }),
    }),

    updateUserStatus: builder.mutation<
      UpdateUserStatusResponse,
      UpdateUserStatusPayload
    >({
      query: ({ userId, status }) => ({
        url: `/admin/users/status`,
        method: "PUT",
        data: { userId, status },
      }),
      invalidatesTags: ["Users"],
    }),

    deleteUsers: builder.mutation<{ success: boolean; message: string }, { userIds: number[] }>({
      query: ({ userIds }) => ({
        url: `/admin/users`,
        method: "DELETE",
        data: { userIds },
      }),
      invalidatesTags: ["Users"],
    }),

    /* ---------------- AUTO-APPROVAL RULES (enable listing without admin approve until expiry date) ---------------- */
    getAutoApprovalRules: builder.query<AutoApprovalRulesResponse, void>({
      query: () => ({
        url: `/admin/auto-approval-rules`,
        method: "GET",
      }),
      providesTags: ["AutoApprovalRules"],
    }),
    createAutoApprovalRule: builder.mutation<
      { success: boolean; data: AutoApprovalRuleItem },
      { start_date: string; end_date: string; site_id?: number | null; is_active?: boolean }
    >({
      query: (body) => ({
        url: `/admin/auto-approval-rules`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["AutoApprovalRules"],
    }),
    updateAutoApprovalRule: builder.mutation<
      { success: boolean; data: AutoApprovalRuleItem },
      { id: number; start_date?: string; end_date?: string; site_id?: number | null; is_active?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/auto-approval-rules/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["AutoApprovalRules"],
    }),
    deleteAutoApprovalRule: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `/admin/auto-approval-rules/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AutoApprovalRules"],
    }),

    /* ---------------- SELLER AUTO-APPROVAL REQUESTS (seller requests; admin approves with date range / expiry) ---------------- */
    getSellerAutoApprovalRequests: builder.query<SellerAutoApprovalRequestsResponse, string | void>({
      query: (status) => ({
        url: status ? `/admin/seller-auto-approval-requests?status=${status}` : `/admin/seller-auto-approval-requests`,
        method: "GET",
      }),
      providesTags: ["SellerAutoApprovalRequests"],
    }),
    approveSellerAutoApprovalRequest: builder.mutation<
      { success: boolean; data: SellerAutoApprovalRequestItem; message: string },
      { id: number; start_date: string; end_date: string }
    >({
      query: ({ id, start_date, end_date }) => ({
        url: `/admin/seller-auto-approval-requests/${id}/approve`,
        method: "PATCH",
        data: { start_date, end_date },
      }),
      invalidatesTags: ["SellerAutoApprovalRequests"],
    }),
    rejectSellerAutoApprovalRequest: builder.mutation<
      { success: boolean; data: SellerAutoApprovalRequestItem; message: string },
      number
    >({
      query: (id) => ({
        url: `/admin/seller-auto-approval-requests/${id}/reject`,
        method: "PATCH",
      }),
      invalidatesTags: ["SellerAutoApprovalRequests"],
    }),
    updateSellerAutoApprovalExpiry: builder.mutation<
      { success: boolean; data: SellerAutoApprovalRequestItem; message: string },
      { id: number; end_date: string }
    >({
      query: ({ id, end_date }) => ({
        url: `/admin/seller-auto-approval-requests/${id}/expiry`,
        method: "PATCH",
        data: { end_date },
      }),
      invalidatesTags: ["SellerAutoApprovalRequests"],
    }),
    revokeSellerAutoApprovalRequest: builder.mutation<
      { success: boolean; data: SellerAutoApprovalRequestItem; message: string },
      number
    >({
      query: (id) => ({
        url: `/admin/seller-auto-approval-requests/${id}/revoke`,
        method: "PATCH",
      }),
      invalidatesTags: ["SellerAutoApprovalRequests"],
    }),

    /* ---------------- COMMISSION RULES ---------------- */
    getCommissionRules: builder.query<
      CommissionRulesResponse,
      { scope?: CommissionScope } | void
    >({
      query: (params?: { scope?: CommissionScope }) => {
        const scope = params?.scope;
        const url = scope
          ? `/admin/commission-rules?scope=${scope}`
          : `/admin/commission-rules`;
        return { url, method: "GET" };
      },
      providesTags: ["CommissionRules"],
    }),
    createCommissionRule: builder.mutation<
      { success: boolean; data: CommissionRuleItem; message: string },
      CreateCommissionRulePayload
    >({
      query: (body) => ({
        url: `/admin/commission-rules`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["CommissionRules"],
    }),
    updateCommissionRule: builder.mutation<
      { success: boolean; data: CommissionRuleItem; message: string },
      { id: number } & UpdateCommissionRulePayload
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/commission-rules/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["CommissionRules"],
    }),
    getEffectiveCommission: builder.query<
      { success: boolean; data: { seller_id?: number; batch_id?: number; percent: number } },
      { seller_id?: number; batch_id?: number }
    >({
      query: ({ seller_id, batch_id }) => {
        const params = new URLSearchParams();
        if (seller_id != null) params.append("seller_id", String(seller_id));
        if (batch_id != null) params.append("batch_id", String(batch_id));
        return {
          url: `/admin/commission-rules/effective?${params.toString()}`,
          method: "GET",
        };
      },
    }),

    /* ---------------- ADMIN AUCTION GROUPS ---------------- */
    getAdminAuctionGroups: builder.query<
      { success: boolean; data: AdminAuctionGroupItem[] },
      { approval_status?: "pending" | "approved" | "all"; site_id?: string }
    >({
      query: ({ approval_status = "all", site_id = "recycle" } = {}) => ({
        url: `/admin/auction-groups?approval_status=${approval_status}&site_id=${site_id}`,
        method: "GET",
      }),
      providesTags: ["AdminAuctionGroups"],
    }),

    approveAuctionGroup: builder.mutation<
      { success: boolean; message: string; data: AdminAuctionGroupItem },
      number
    >({
      query: (groupId) => ({
        url: `/admin/auction-groups/${groupId}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["AdminAuctionGroups"],
    }),

    /* ---------------- PRODUCT REQUESTS ---------------- */
    submitProductRequest: builder.mutation<
      { success: boolean; message: string; data: any },
      { name: string; email: string; phone?: string; category?: string; search_query?: string; message?: string; user_id?: string | null }
    >({
      query: (body) => ({
        url: "/product-request",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["ProductRequests"],
    }),

    getAdminProductRequests: builder.query<
      { success: boolean; data: any[]; total: number; page: number; totalPages: number },
      { status?: string; page?: number; limit?: number }
    >({
      query: ({ status, page = 1, limit = 20 } = {}) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status) params.append("status", status);
        return { url: `/product-request/admin?${params.toString()}`, method: "GET" };
      },
      providesTags: ["ProductRequests"],
    }),

    updateProductRequestStatus: builder.mutation<
      { success: boolean; message: string; data: any },
      { id: number; status?: string; admin_notes?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/product-request/${id}/status`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: ["ProductRequests"],
    }),
  }),
});

export const {
  useGetSellersQuery,
  useLazyGetSellersQuery,
  useGetBuyersQuery,
  useLazyGetBuyersQuery,
  useGetAdminBatchesQuery,
  useDeleteBatchMutation,
  useApproveBatchMutation,
  useGetBatchDetailsQuery,

  useGetEmailTypesQuery,
  useCreateEmailTypeMutation,
  useUpdateEmailTypeMutation,
  useDeleteEmailTypeMutation,

  /* ---------- EMAIL USERS ---------- */
  useGetEmailUsersQuery,
  useCreateEmailUserMutation,
  useUpdateEmailUserMutation,
  useDeleteEmailUserMutation,

  /* ---------- EMAIL MESSAGES ---------- */
  useGetEmailMessagesQuery,
  useCreateEmailMessageMutation,
  useUpdateEmailMessageMutation,
  useDeleteEmailMessageMutation,

  /* ---------- NEW USER HOOKS ---------- */
  useGetUsersQuery,
  useLazyGetUsersQuery,
  useGetAdminUserDetailsQuery,
  useUpdateUserStatusMutation,
  useDeleteUsersMutation,

  /* ---------- AUTO-APPROVAL RULES ---------- */
  useGetAutoApprovalRulesQuery,
  useCreateAutoApprovalRuleMutation,
  useUpdateAutoApprovalRuleMutation,
  useDeleteAutoApprovalRuleMutation,

  /* ---------- SELLER AUTO-APPROVAL REQUESTS ---------- */
  useGetSellerAutoApprovalRequestsQuery,
  useApproveSellerAutoApprovalRequestMutation,
  useRejectSellerAutoApprovalRequestMutation,
  useUpdateSellerAutoApprovalExpiryMutation,
  useRevokeSellerAutoApprovalRequestMutation,

  /* ---------- COMMISSION RULES ---------- */
  useGetCommissionRulesQuery,
  useCreateCommissionRuleMutation,
  useUpdateCommissionRuleMutation,
  useGetEffectiveCommissionQuery,

  /* ---------- ADMIN AUCTION GROUPS ---------- */
  useGetAdminAuctionGroupsQuery,
  useApproveAuctionGroupMutation,

  /* ---------- PRODUCT REQUESTS ---------- */
  useSubmitProductRequestMutation,
  useGetAdminProductRequestsQuery,
  useUpdateProductRequestStatusMutation,
} = adminApi;
