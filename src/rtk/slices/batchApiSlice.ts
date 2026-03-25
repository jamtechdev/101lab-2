import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../api/baseQuery";
import { SITE_TYPE } from "@/config/site";

// ---------- Types ----------
export interface Batch {
  batchId: number;
  batchNumber: number;
  category: string;
  batchDate: string;
  inspectionBidDate: string | null;
  itemsCount: number;
  value: number;
  bids: number;
  status: string;
  bid_start_date: string;
  bid_end_date: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProductDetailResponse {
  success: boolean;
  message: string;
  data: Product & {
    slug?: string;
    image1?: string | null;
    document1?: string | null;
    documents?: any[];
    batch: {
      batch_id: number;
      batch_number: number;
      product_ids: number[];
      status: string;
      seller_id: number;
      visibility: string;
      approval_status?: string;
      step?: number;
      createdAt: string;
      updatedAt?: string;
      inspections?: any[];
      bids?: any[];
    };
    inspection?: any | null;
    biddingDetails?: any;
    sellerData?: any;
    winnerPayment?: any | null;
    userOffer?: any | null;
    userBids?: any[];
    remainingBidCount?: number;
    buyerOffer?: { offers: any[]; offerCount: number };
  };
}

export interface FetchBatchesResponse {
  success: boolean;
  message: string;
  data: Batch[];
  pagination: PaginationInfo;
}

export interface CategorySummaryItem {
  slug: string;
  name: string;
  count: number;
  previewImages: string[];
  earliestBidStartDate: string | null;
  earliestBidEndDate: string | null;
  hasActiveBid: boolean;
  hasUpcomingBid: boolean;
  earliestUpcomingStartDate: string | null;
}

export interface FetchBatchesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  batchId?: number;
  status?: string;
  sort?: "newest" | "oldest" | "closing_soon";
  highlighted?: boolean;
  bidFilter?: "closing_soon" | "upcoming" | "ended" | "custom";
  bidDate?: string;
  lang?: string;
  type?: string;
  country?: string;
  condition?: string;
}

export interface BrowseListingsParams {
  type?: string;
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  condition?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  main_seller_id?: string;
  user_id?: string;
}

export interface BrowseListingsResponse {
  success: boolean;
  message: string;
  data: {
    products: BrowseProduct[];
    total: number;
    pagination: PaginationInfo;
    site_id: number;
    total_batches: number;
    applied_filters: any;
  };
}

export interface BrowseProduct {
  product_id: number;
  title: string;
  slug: string;
  description: string;
  status: string;
  meta: any[];
  attachments: {
    id: number;
    url: string;
    type: string;
  }[];
  documents: {
    id: number;
    url: string;
    type: string;
  }[];
  image1: string | null;
  document1: string | null;
  categories: {
    term_taxonomy_id: number;
    taxonomy: string;
    parent: number;
    term: string | null;
    term_id: number | null;
    term_slug: string | null;
  }[];
}

export interface ProductMeta {
  meta_id: number;
  post_id: number;
  meta_key: string;
  meta_value: string;
}

export interface ProductCategory {
  object_id: number;
  term_taxonomy_id: number;
  term_order: number;
}

export interface Product {
  product_id: number;
  title: string;
  description: string;
  status: string;
  meta: ProductMeta[];
  attachments: {
    id: number;
    url: string;
    type: string;
  }[];
  categories: {
    term_taxonomy_id: number;
    taxonomy: string;
    term: string;
    term_id: number;
    term_slug: string;
  }[];
}

export interface FetchBatchByIdResponse {
  success: boolean;
  data: Product[];
}

export interface SellerBidResponse {
  success: boolean;
  data: {
    batch_id: number;
    status: string;
    products: {
      product_id: number;
      title: string;
      description: string;
      images: string[];
    }[];
    bidding?: {
      start_date: string;
      end_date: string;
    };
  }[];
}

// ---------- API Slice ----------
export const batchApiSlice = createApi({
  reducerPath: "batchApi",
  baseQuery: axiosBaseQuery,
  tagTypes: ["Batches", "Dashboard"],

  endpoints: (builder) => ({
    // Get all batches with pagination
    getBatches: builder.query<FetchBatchesResponse, FetchBatchesParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        const p = params as FetchBatchesParams | undefined;
        if (p?.page) queryParams.append("page", p.page.toString());
        if (p?.limit) queryParams.append("limit", p.limit.toString());
        if (p?.search) queryParams.append("search", p.search);
        if (p?.category) queryParams.append("category", p.category);
        if (p?.batchId) queryParams.append("batchId", p.batchId.toString());
        if (p?.status) queryParams.append("status", p.status);
        if (p?.sort) queryParams.append("sort", p.sort);
        if (p?.highlighted) queryParams.append("highlighted", "true");
        if (p?.bidFilter) queryParams.append("bidFilter", p.bidFilter);
        if (p?.bidDate) queryParams.append("bidDate", p.bidDate);
        if (p?.lang) queryParams.append("lang", p.lang);
        if (p?.country) queryParams.append("country", p.country);
        if (p?.condition) queryParams.append("condition", p.condition);
        queryParams.append("type", p?.type ?? SITE_TYPE);
        const queryString = queryParams.toString();
        return {
          url: `/batch/fetch?${queryString}`,
          method: "GET",
        };
      },
      providesTags: ["Batches"],
    }),

    // Get a single batch by ID
    getBatchById: builder.query<FetchBatchByIdResponse, number>({
      query: (batchId) => ({
        url: `/batch/${batchId}/products?type=${SITE_TYPE}`,
        method: "GET",
      }),
      providesTags: (_result, _error, batchId) => [
        { type: "Batches", id: batchId },
      ],
    }),

    skipInspectionForCompany: builder.mutation<
      { success: boolean; message: string },
      number
    >({
      query: (batchId) => ({
        url: `/inspection/company/${batchId}/skip`,
        method: "PUT",
      }),
      invalidatesTags: (_result, _error, batchId) => [
        { type: "Batches", id: batchId },
        "Batches",
      ],
    }),

        skipFullInspectionForCompany: builder.mutation<
      { success: boolean; message: string },
      { batchId: number; inspection: boolean }
    >({
      query: ({ batchId, inspection }) => ({
        url: `/inspection/company/${batchId}/skip?inspection=${inspection}`,
        method: "PUT",
      }),
      invalidatesTags: (_result, _error, { batchId }) => [
        { type: "Batches", id: batchId },
        "Batches",
      ],
    }),

    getSellerBids: builder.query<
      SellerBidResponse,
      { userId: number | string; page: number; limit: number }
    >({
      query: ({ userId, page, limit }) => ({
        url: `/buyer/bid/seller/${userId}?page=${page}&limit=${limit}&type=${SITE_TYPE}`,
        method: "GET",
      }),
      providesTags: (_result, _error, params) => [
        { type: "Batches", id: params.userId },
      ],
    }),

    getSellerDashboard: builder.query<any, number>({
      query: (sellerId) => ({
        url: `/dashboard/${sellerId}?type=${SITE_TYPE}`,
        method: "GET",
      }),
      providesTags: (_result, _error, sellerId) => [
        { type: "Dashboard", id: sellerId },
      ],
    }),

    getCarbonAvoided: builder.query<{ success: boolean; totalCarbonAvoided: number }, number>({
      query: (sellerId) => ({
        url: `/stats/carbon-avoided?sellerId=${sellerId}&type=${SITE_TYPE}`,
        method: "GET",
      }),
      providesTags: (_result, _error, sellerId) => [
        { type: "Dashboard", id: `carbon-${sellerId}` },
      ],
    }),

    getSellerReport: builder.query<
      { success: boolean; message: string; data: any[] },
      {
        page: number;
        limit: number;
        status?: string;
        sellerId?: number | string;
      }
    >({
      query: ({ page, limit, status, sellerId }) => {
        let queryParams = `?page=${page}&limit=${limit}&type=${SITE_TYPE}`;
        if (status) queryParams += `&status=${status}`;
        if (sellerId) queryParams += `&sellerId=${sellerId}`;
        return {
          url: `/admin/batches${queryParams}`,
          method: "GET",
        };
      },
      providesTags: (_result, _error, _arg) => ["Batches"],
    }),

    // Browse listings for buyers
    browseListings: builder.query<BrowseListingsResponse, BrowseListingsParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();

        queryParams.append("type", SITE_TYPE);
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.category) queryParams.append("category", params.category);
        if (params.search) queryParams.append("search", params.search);
        if (params.condition) queryParams.append("condition", params.condition);
        if (params.location) queryParams.append("location", params.location);
        if (params.minPrice) queryParams.append("minPrice", params.minPrice);
        if (params.maxPrice) queryParams.append("maxPrice", params.maxPrice);
        if (params.sort) queryParams.append("sort", params.sort);
        if (params.main_seller_id) queryParams.append("main_seller_id", params.main_seller_id);
        if (params.user_id) queryParams.append("userId", params.user_id);

        const queryString = queryParams.toString();
        return {
          url: `/batch/products/all${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Batches"],
    }),

    // Get network batches for organization (user must be part of network)
    getNetworkBatches: builder.query<BrowseListingsResponse, BrowseListingsParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();

        queryParams.append("type", SITE_TYPE);
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.category) queryParams.append("category", params.category);
        if (params.search) queryParams.append("search", params.search);
        if (params.condition) queryParams.append("condition", params.condition);
        if (params.location) queryParams.append("location", params.location);
        if (params.minPrice) queryParams.append("minPrice", params.minPrice);
        if (params.maxPrice) queryParams.append("maxPrice", params.maxPrice);
        if (params.sort) queryParams.append("sort", params.sort);
        if (params.main_seller_id) queryParams.append("main_seller_id", params.main_seller_id);
        queryParams.append("userId", localStorage.getItem("userId"));

        const queryString = queryParams.toString();
        return {
          url: `/batch/products/network${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Batches"],
    }),

    // Category summary for landing page sections — one call returns all categories
    // with batch count + up to 4 preview images (replaces per-card individual calls)
    getCategorySummary: builder.query<
      { success: boolean; data: CategorySummaryItem[] },
      { status?: string; highlighted?: boolean; sort?: string; lang?: string }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        queryParams.append("type", SITE_TYPE);
        if (params.status) queryParams.append("status", params.status);
        if (params.highlighted) queryParams.append("highlighted", "true");
        if (params.sort) queryParams.append("sort", params.sort);
        
        // Add language parameter
        const currentLang = params.lang || localStorage.getItem('language') || 'en';
        queryParams.append("lang", currentLang);
        
        return {
          url: `/batch/categories-summary?${queryParams}`,
          method: "GET",
        };
      },
      providesTags: ["Batches"],
    }),

    // Toggle highlight (featured) status on a batch
    toggleHighlight: builder.mutation<{ success: boolean; data: { batchId: number; is_highlighted: boolean } }, number>({
      query: (batchId) => ({
        url: `/batch/${batchId}/highlight`,
        method: "PUT",
      }),
      invalidatesTags: ["Batches"],
    }),

    // Get batch and product details by product slug
    getBatchByProductSlug: builder.query<ProductDetailResponse, { productSlug: string; type?: string; buyerId?: number }>({
      query: ({ productSlug, type, buyerId }) => {
        const queryParams = new URLSearchParams();
        queryParams.append("type", type || SITE_TYPE);
        // if (buyerId) queryParams.append("buyer_id", buyerId.toString());

        const queryString = queryParams.toString();
        return {
          url: `/product/slug/${productSlug}${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Batches"],
    }),
  }),
});



export const {
  useGetBatchesQuery,
  useGetBatchByIdQuery,
  useSkipInspectionForCompanyMutation,
  useSkipFullInspectionForCompanyMutation,
  useGetSellerDashboardQuery,
  useGetCarbonAvoidedQuery,
  useGetSellerBidsQuery,
  useGetSellerReportQuery,
  useBrowseListingsQuery,
  useGetNetworkBatchesQuery,
  useGetBatchByProductSlugQuery,
  useToggleHighlightMutation,
  useGetCategorySummaryQuery,
} = batchApiSlice;
