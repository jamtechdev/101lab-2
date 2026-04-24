import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../api/baseQuery';
import { SITE_TYPE } from '@/config/site';

// Possible checkout statuses
export type CheckoutStatus =
  | 'pending'
  | 'confirmed'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface Checkout {
  checkout_id: number;
  batch_id: number;
  product_id: number;
  seller_id: number;
  buyer_id: number;
  quantity: number;
  price_per_unit: number;
  currency: string;
  shipping_address: string;
  message: string;
  status: CheckoutStatus;
  payment_status: 'pending' | 'manual_received' | 'success' | 'failed';
  payment_method?: string;
  manual_payment_note?: string;
  created_at: string;
  updated_at: string;
  buyer?: any;
  batch?: any;
}

export interface CheckoutPaginatedResponse {
  success: boolean;
  orders: Checkout[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const checkoutApi = createApi({
  reducerPath: 'checkoutApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Checkout', 'BuyerCheckouts', 'SellerCheckouts'],
  endpoints: (builder) => ({

    /** Create a new checkout */
    createCheckout: builder.mutation<Checkout, Partial<Checkout>>({
      query: (checkoutData) => ({
        url: '/checkouts',
        method: 'POST',
        data: checkoutData,
      }),
    }),

    /** Get all checkouts for a buyer */
    getBuyerCheckouts: builder.query<Checkout[], { buyerId: number }>({
      query: ({ buyerId }) => ({
        url: `/checkouts/buyer/${buyerId}`,
      }),
      transformResponse: (response: { success: boolean; data: Checkout[] }) => response.data,
    }),

    /** Get all checkouts for a seller (paginated) */
    getSellerCheckouts: builder.query<CheckoutPaginatedResponse, { sellerId: number; page?: number; limit?: number; status?: CheckoutStatus }>({
      query: ({ sellerId, page = 1, limit = 10, status }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status) params.set("status", status);
        return { url: `/checkouts/seller/${sellerId}?${params.toString()}` };
      },
      providesTags: ['SellerCheckouts'],
    }),

    /** Get a single checkout by ID */
    getCheckoutById: builder.query<Checkout, number>({
      query: (checkoutId) => ({
        url: `/checkouts/${checkoutId}`,
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: Checkout }) => response.data,
    }),

    /** Update checkout status */
    updateCheckoutStatus: builder.mutation<Checkout, { checkoutId: number; status: CheckoutStatus }>({
      query: ({ checkoutId, status }) => ({
        url: `/checkouts/${checkoutId}/status`,
        method: 'PATCH',
        data: { status },
      }),
    }),

    /** Manual payment received */
     ManualPaymentReceived: builder.mutation<
      Checkout,
      { checkoutId: number; note?: string; payment_method?: string }
    >({
      query: ({ checkoutId, note, payment_method }) => ({
        url: `/checkouts/${checkoutId}/manual-payment`,
        method: 'PATCH',
        data: { note, payment_method },
      }),
    }),

  }),
});

export const {
  useCreateCheckoutMutation,
  useGetBuyerCheckoutsQuery,
  useGetSellerCheckoutsQuery,
  useGetCheckoutByIdQuery,
  useUpdateCheckoutStatusMutation,

  useManualPaymentReceivedMutation,
} = checkoutApi;
