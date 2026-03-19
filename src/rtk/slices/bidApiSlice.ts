// bidApiSlice.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../api/baseQuery";
import { SITE_TYPE } from "@/config/site";

// --- Types ---
export interface StartBidRequest {
  batch_id: number;
  type: "make_offer" | "fixed_price";
  start_date: string;
  end_date: string;
  target_price: number;
  location: string;
  notes: {
    required_docs: string;
    inspection_needed: boolean;
  };
  language: string;
}

export interface StartBidResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Offer types
export interface SubmitOfferRequest {
  batch_id: number;
  buyer_id: number;
  offer_quantity: number;
  seller_id: number;
  company_name: string;
  contact_person?: string;
  country?: string;
  amount?: number;
  notes?: string;
  type?: "recycle" | "other";
  document_image?: File;
  lang?: string;
}

export interface SubmitOfferResponse {
  success: boolean;
  message: string;
  data: {
    offer: any;
  };
}

export interface GetOffersResponse {
  success: boolean;
  message: string;
  data: {
    offers: any[];
    total: number;
  };
}

export interface BuyerBid {
  buyer_bid_id: number;
  bid_id: number;
  buyer_id: number;
  company_name: string;
  contact_person: string;
  country: string;
  amount: string;
  submitted_at: string;
  status: string;
  notes: string;
  quotation_types?: string[];
  weight_quotations?: Record<string, string | number> | null;
  document_image?: string | null;
  document_image_url?: string | null;
  buyer?: {
    ID: number;
    user_login: string;
    user_email: string;
    display_name: string;
    phone?: string;
    company?: string;
    country?: string;
    address?: string;
    experience?: string;
    companyDetail?: string;
    meta?: Record<string, string>;
  };
}

export interface GetBuyerBidsResponse {
  success: boolean;
  message: string;
  data: {
    batch_id: string;
    bid_id: number;
    buyer_bids: BuyerBid[];
  };
}

// --- Types ---
// --- Types ---
export interface WinnerData {
  buyer_bid_id: number;
  bid_id: number;
  buyer_id: number;
  company_name: string;
  contact_person: string;
  country: string;
  currency?: string;
  amount: string | number;
  status: string;
  submitted_at: string;
}

export interface PaymentDetails {
  payment_id: number;
  payment_method: string;
  transaction_number: string;
  payment_proof: string;
  updatedAt: string;
  createdAt: string;
}

export interface GetPaymentByBatchResponse {
  success: boolean;
  message: string;
  data: PaymentDetails[]; // Array of payment details
}

export interface GetWinnerResponse {
  success: boolean;
  message: string;
  data: {
    bid_id: number;
    batch_id: number;
    winner: WinnerData;
    buyerDetails: any;
    payment_details: any | null;
  } | null;
}

export interface MarkWinnerResponse {
  success: boolean;
  message: string;
}

// --- Payment Types ---
export interface PaymentRequest {
  buyer_bid_id: number;
  payment_method: string;
  transaction_number: string;
  amount: number;
  status?: string;
}

export interface UpdatePaymentRequest {
  payment_method: string;
  transaction_number: string;
  payment_proof?: string;
  account_holder_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: any;
}

// --- Report Types ---
export interface ReportBidItem {
  buyer_bid_id: number;
  company_name: string;
  amount: string | number;
  status: string;
  submitted_at: string;
  payment_status: string | null;
}

export interface ReportWinningCompany {
  buyer_bid_id: number;
  company_name: string;
  amount: string | number;
  payment_status: string;
  payment_amount: number | null;
  pickup_date?: string | null;
  pickup_time?: string | null;
  is_delivery?: boolean;
  pickup_status?: string | null;
  country?: string | null;
  email?: string | null;
}

export interface BatchReport {
  batch_id: number | string;
  inspection_participants: number;
  total_bids_received: number;
  winning_amount: number | null;
  winning_company: ReportWinningCompany | null;
  bids: ReportBidItem[];
  pickup_scheduled?: boolean;
  pickup_status?: "scheduled" | "confirmed" | "completed";
  pickup_date?: string | null;
  pickup_time?: string | null;
  inspection_companies?: any[];
  buyerDetails?: any;
  companies_registered?: number;
  companies_attended?: number;
  transaction_completed?: boolean;
}

export interface GetReportResponse {
  success: boolean;
  report: BatchReport;
}

export interface UpdatePickupRequest {
  buyer_bid_id: number;
  pickup_date: string | null;
  pickup_time: string | null;
  is_delivery: boolean;
  batchId: string;
  confirmSchedule?: boolean;
  completePickup?: boolean;
  completeTransaction?: boolean;
  confirmPickup?: boolean;
}

export interface UpdatePickupResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Place Bid Buyer Portal Interface
export interface PlaceBidRequest {
  batch_id: number;
  buyer_id: number;
  company_name: string;
  contact_person: string;
  country: string;
  amount: number;
  notes: string;
}

export interface PlaceBidResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface CheckBidRequest {
  batch_id: number;
  buyer_id: number;
}

export interface CheckBidResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface BuyerOffer {
  offer_id: number;
  batch_id: number;
  buyer_id: number;
  seller_id: number;
  company_name: string;
  amount: number;
  offer_quantity: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  seller?: {
    seller_id: number;
    company_name: string;
  };
}

export interface GetUserOffersResponse {
  success: boolean;
  message: string;
  data: {
    offers: BuyerOffer[];
    total: number;
  };
}

export interface SellerOffer {
  offer_id: number;
  batch_id: number;
  buyer_id: number;
  seller_id: number;
  company_name: string;
  amount: number;
  offer_quantity: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  buyer?: {
    buyer_id: number;
    company_name: string;
    contact_person?: string;
    country?: string;
  };
}

export interface GetSellerOffersResponse {
  success: boolean;
  stats?: any;
  data: SellerOffer[];
}

// --- Bid API Slice ---
export const bidApiSlice = createApi({
  reducerPath: "bidApi",
  baseQuery: axiosBaseQuery,
  tagTypes: ["Bids", "Offers"],
  endpoints: (builder) => ({
    startBid: builder.mutation<StartBidResponse, StartBidRequest>({
      query: (body) => ({
        url: "/bid/create",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: body,
      }),
      invalidatesTags: ["Bids"],
    }),

    updateBid: builder.mutation<StartBidResponse, StartBidRequest>({
      query: (body) => ({
        url: "/bid/update",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        data: body,
      }),
      invalidatesTags: ["Bids"],
    }),

    getBuyerBids: builder.query<GetBuyerBidsResponse, string>({
      query: (batch_id) => ({
        url: `/buyer/bid/batch/${batch_id}?type=greenbidz`,
        method: "GET",
      }),
      providesTags: ["Bids"],
    }),

    // Mark Winner of a Batch
    markWinnerForBatch: builder.mutation<
      MarkWinnerResponse,
      { batch_id: number; buyer_bid_id: number }
    >({
      query: ({ batch_id, buyer_bid_id }) => {
        // Extract language from localStorage, default to 'en'
        const language = localStorage.getItem("language") || "en";

        return {
          url: `/buyer/bid/win/${batch_id}/${buyer_bid_id}?lang=${language}&type=${SITE_TYPE}`,
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: { lang: language },
        };
      },
      invalidatesTags: ["Bids"],
    }),

    getWinnerForBatch: builder.query<GetWinnerResponse, number>({
      query: (batch_id) => ({
        url: `/buyer/bid/winner/${batch_id}`,
        method: "GET",
      }),
      providesTags: ["Bids"],
    }),

    getPaymentsByBatch: builder.query<
      GetPaymentByBatchResponse,
      number | string
    >({
      query: (batch_id) => ({
        url: `/buyer/payment/batch/${batch_id}?type=${SITE_TYPE}`,
        method: "GET",
      }),
      providesTags: ["Bids"],
    }),

    addPaymentForWinner: builder.mutation<PaymentResponse, PaymentRequest>({
      query: (body) => ({
        url: "/winner/create",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: body,
      }),
      invalidatesTags: ["Bids"],
    }),

    updatePayment: builder.mutation<
      PaymentResponse,
      { payment_id: number; data: UpdatePaymentRequest }
    >({
      query: ({ payment_id, data }) => ({
        url: `/buyer/payment/${payment_id}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        data: data,
      }),
      invalidatesTags: ["Bids"],
    }),

    getBatchReport: builder.query<GetReportResponse, number | string>({
      query: (batch_id) => ({
        url: `/report/${batch_id}`,
        method: "GET",
      }),
      providesTags: ["Bids"],
    }),

    updatePickupForWinner: builder.mutation<
      UpdatePickupResponse,
      UpdatePickupRequest
    >({
      query: ({
        buyer_bid_id,
        pickup_date,
        pickup_time,
        is_delivery,
        batchId,
        confirmSchedule,
        completePickup,
        confirmPickup,

        completeTransaction,
      }) => {
        // Extract language from localStorage (default: en)
        const language = localStorage.getItem("language") || "en";

        return {
          url: `/winner/${buyer_bid_id}/pickup?lang=${language}`,
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          data: {
            pickup_date,
            pickup_time,
            is_delivery,
            batchId,
            confirmSchedule,
            completePickup,
            confirmPickup,
            completeTransaction,
          },
        };
      },
      invalidatesTags: ["Bids"],
    }),

    placeBid: builder.mutation<PlaceBidResponse, FormData>({
      query: (formData) => ({
        url: `/buyer/bid/place`,
        method: "POST",
        data: formData,
      }),
      invalidatesTags: ["Bids"],
    }),

    checkBidStatus: builder.mutation<CheckBidResponse, CheckBidRequest>({
      query: (body) => ({
        url: `/buyer/bid/check`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: body,
      }),
      invalidatesTags: ["Bids"],
    }),

    getBatchExcel: builder.query<Blob, string>({
      query: (batchId) => ({
        url: `/reports/batch/${batchId}/excel?type=${SITE_TYPE}`,
        method: "GET",
        responseType: "blob", // important
      }),
    }),

    // Offer endpoints
    submitOffer: builder.mutation<SubmitOfferResponse, FormData>({
      query: (formData) => ({
        url: `/offer/submit`,
        method: "POST",
        data: formData,
      }),
      invalidatesTags: ["Offers"],
    }),

    getOffersForBatch: builder.query<GetOffersResponse, number>({
      query: (batchId) => ({
        url: `/offer/batch/${batchId}`,
        method: "GET",
      }),
      providesTags: ["Offers"],
    }),

    getUserOffers: builder.query<
      { success: boolean; data: any[] },
      { buyer_id: string }
    >({
      query: ({ buyer_id }) => ({
        url: `/offer/user`,
        method: "GET",
        params: { buyer_id, type: SITE_TYPE },
      }),
      providesTags: ["Offers"],
    }),

    getOwnerOffers: builder.query<
      GetSellerOffersResponse,
      { sellerID: string }
    >({
      query: ({ sellerID }) => ({
        url: `/offer/seller?sellerID=${sellerID}`,
        method: "GET",
      }),
      // optionally remove providesTags for simplicity
    }),

    updateOfferStatus: builder.mutation<
      { success: boolean; message: string },
      { offer_id: number; status: "accepted" | "rejected", lang:string }
    >({
      query: ({ offer_id, status,lang }) => ({
        url: `/offer/${offer_id}/status`,
        method: "PATCH",
        data: { status,lang},
      }),
      invalidatesTags: ["Offers"], // Refetch owner offers after update
    }),
  }),



});

export const {
  useStartBidMutation,
  useUpdateBidMutation,
  useGetBuyerBidsQuery,
  useMarkWinnerForBatchMutation,
  useGetWinnerForBatchQuery,
  useAddPaymentForWinnerMutation,
  useUpdatePaymentMutation,
  useGetBatchReportQuery,
  useUpdatePickupForWinnerMutation,
  usePlaceBidMutation,
  useCheckBidStatusMutation,
  useLazyGetBatchExcelQuery,
  useGetPaymentsByBatchQuery,
  useSubmitOfferMutation,
  useGetOffersForBatchQuery,
  useGetUserOffersQuery,
  useGetOwnerOffersQuery,
  useUpdateOfferStatusMutation,
} = bidApiSlice;
