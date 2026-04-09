import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../api/baseQuery";
import { SITE_TYPE } from "@/config/site";

// ---------- Types ----------

export interface AuctionGroup {
  group_id: number;
  title: string;
  slug?: string;
  description?: string;
  country: string;
  languages: string[];
  site_id: string;
  seller_id: number;
  created_at: string;
  updated_at: string;
  auction_count?: number;
}

export interface AuctionGroupHomeItem {
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
  description_ja?: string;
  description_th?: string;
  country: string;
  languages: string[];
  location: string;
  batchCount: number;
  batch_ids: number[];
  previewImages: string[];
  earliestBidStartDate: string | null;
  earliestBidEndDate: string | null;
  hasActiveBid: boolean;
  featured_type?: 'none' | 'featured' | 'highlighted' | 'both';
}

export interface AuctionBatchInfo {
  batch_id: number;
  title?: string;
  category?: string;
}

export interface AuctionItem {
  auction_id: number;
  group_id: number;
  batch_ids: number[];
  batches?: AuctionBatchInfo[];
  created_at: string;
}

export interface CreateAuctionGroupRequest {
  title: string;
  slug?: string;
  description?: string;
  country: string;
  languages: string[];
  seller_id: number;
  site_id: string;
}

export interface UpdateAuctionGroupRequest {
  group_id: number;
  title?: string;
  slug?: string;
  description?: string;
  country?: string;
  languages?: string[];
}

// ---------- API Slice ----------

export const auctionGroupApi = createApi({
  reducerPath: "auctionGroupApi",
  baseQuery: axiosBaseQuery,
  tagTypes: ["AuctionGroups", "AuctionItems"],

  endpoints: (builder) => ({
    // Public: auction groups with preview images for the home/landing page
    getAuctionGroupsHome: builder.query<
      { success: boolean; data: AuctionGroupHomeItem[] },
      { site_id?: string }
    >({
      query: ({ site_id } = {}) => ({
        url: `/auction-group/home?site_id=${site_id ?? SITE_TYPE}`,
        method: "GET",
      }),
      providesTags: ["AuctionGroups"],
    }),

    // List all auction groups for a seller
    getAuctionGroups: builder.query<
      { success: boolean; data: AuctionGroup[] },
      { seller_id: number; site_id?: string }
    >({
      query: ({ seller_id, site_id }) => ({
        url: `/auction-group?seller_id=${seller_id}&site_id=${site_id ?? SITE_TYPE}`,
        method: "GET",
      }),
      providesTags: ["AuctionGroups"],
    }),

    // Create a new auction group
    createAuctionGroup: builder.mutation<
      { success: boolean; data: AuctionGroup },
      CreateAuctionGroupRequest
    >({
      query: (body) => ({
        url: `/auction-group`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["AuctionGroups"],
    }),

    // Update an auction group
    updateAuctionGroup: builder.mutation<
      { success: boolean; data: AuctionGroup },
      UpdateAuctionGroupRequest
    >({
      query: ({ group_id, ...body }) => ({
        url: `/auction-group/${group_id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: ["AuctionGroups"],
    }),

    // Delete an auction group
    deleteAuctionGroup: builder.mutation<{ success: boolean }, number>({
      query: (group_id) => ({
        url: `/auction-group/${group_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AuctionGroups"],
    }),

    // Get a single auction group by ID or slug
    getAuctionGroupDetail: builder.query<
      { success: boolean; data: AuctionGroupHomeItem },
      { group_identifier: string | number; site_id?: string }
    >({
      query: ({ group_identifier, site_id }) => ({
        url: `/auction-group/${group_identifier}?site_id=${site_id ?? SITE_TYPE}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { group_identifier }) => [
        { type: "AuctionGroups", id: group_identifier },
      ],
    }),

    // Get all auctions within a group
    getAuctionsInGroup: builder.query<
      { success: boolean; data: AuctionItem[] },
      number
    >({
      query: (group_id) => ({
        url: `/auction-group/${group_id}/auction`,
        method: "GET",
      }),
      providesTags: (_result, _error, group_id) => [
        { type: "AuctionItems", id: group_id },
      ],
    }),

    // Add an auction (with multiple batches) to a group
    addAuctionToGroup: builder.mutation<
      { success: boolean; data: AuctionItem },
      { group_id: number; batch_ids: number[] }
    >({
      query: ({ group_id, batch_ids }) => ({
        url: `/auction-group/${group_id}/auction`,
        method: "POST",
        data: { batch_ids },
      }),
      invalidatesTags: (_result, _error, { group_id }) => [
        { type: "AuctionItems", id: group_id },
        "AuctionGroups",
      ],
    }),

    // Replace ALL batches for a group in one call (used by edit flow)
    replaceGroupBatches: builder.mutation<
      { success: boolean; data: AuctionItem | null },
      { group_id: number; batch_ids: number[] }
    >({
      query: ({ group_id, batch_ids }) => ({
        url: `/auction-group/${group_id}/batches`,
        method: "PUT",
        data: { batch_ids },
      }),
      invalidatesTags: (_result, _error, { group_id }) => [
        { type: "AuctionItems", id: group_id },
        "AuctionGroups",
      ],
    }),

    // Delete an auction from a group
    deleteAuctionFromGroup: builder.mutation<
      { success: boolean },
      { group_id: number; auction_id: number }
    >({
      query: ({ group_id, auction_id }) => ({
        url: `/auction-group/${group_id}/auction/${auction_id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { group_id }) => [
        { type: "AuctionItems", id: group_id },
        "AuctionGroups",
      ],
    }),
  }),
});

export const {
  useGetAuctionGroupsHomeQuery,
  useGetAuctionGroupsQuery,
  useGetAuctionGroupDetailQuery,
  useCreateAuctionGroupMutation,
  useUpdateAuctionGroupMutation,
  useDeleteAuctionGroupMutation,
  useGetAuctionsInGroupQuery,
  useAddAuctionToGroupMutation,
  useDeleteAuctionFromGroupMutation,
  useReplaceGroupBatchesMutation,
} = auctionGroupApi;
