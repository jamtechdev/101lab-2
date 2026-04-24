import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../api/baseQuery";
import { SITE_TYPE } from "@/config/site";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BatchGroup {
  group_id: number;
  title: string;
  description: string | null;
  batch_ids: number[];
  batch_count: number;
  is_active: boolean;
  site_id: number;
  seller_id: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchGroupRequest {
  title: string;
  description?: string;
  batch_ids: number[];
  seller_id: number;
  site_id: string;
}

export interface UpdateBatchGroupRequest {
  group_id: number;
  seller_id: number;
  title?: string;
  description?: string;
  batch_ids?: number[];
}

export interface ToggleBatchGroupRequest {
  group_id: number;
  seller_id: number;
}

export interface DeleteBatchGroupRequest {
  group_id: number;
  seller_id: number;
}

export interface BatchGroupTag {
  tag_id: number;
  group_id: number;
  tag_name: string;
  tag_icon: string;
  content_en: string;
  content_zh: string;
  content_ja: string;
  content_th: string;
  sort_order: number;
}

// ─── API Slice ────────────────────────────────────────────────────────────────

export const batchGroupApi = createApi({
  reducerPath: "batchGroupApi",
  baseQuery: axiosBaseQuery,
  tagTypes: ["BatchGroups", "BatchGroupTags"],
  endpoints: (builder) => ({

    // GET /batch-group?seller_id=&site_id=
    getBatchGroups: builder.query<
      { success: boolean; data: BatchGroup[] },
      { seller_id: number; site_id?: string }
    >({
      query: ({ seller_id, site_id }) => ({
        url: `/batch-group`,
        method: "GET",
        params: { seller_id, site_id: site_id ?? SITE_TYPE },
      }),
      providesTags: ["BatchGroups"],
    }),

    // POST /batch-group
    createBatchGroup: builder.mutation<
      { success: boolean; data: BatchGroup },
      CreateBatchGroupRequest
    >({
      query: (body) => ({
        url: `/batch-group`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["BatchGroups"],
    }),

    // PUT /batch-group/:group_id
    updateBatchGroup: builder.mutation<
      { success: boolean; data: BatchGroup },
      UpdateBatchGroupRequest
    >({
      query: ({ group_id, ...body }) => ({
        url: `/batch-group/${group_id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: ["BatchGroups"],
    }),

    // PATCH /batch-group/:group_id/toggle
    toggleBatchGroup: builder.mutation<
      { success: boolean; data: BatchGroup },
      ToggleBatchGroupRequest
    >({
      query: ({ group_id, seller_id }) => ({
        url: `/batch-group/${group_id}/toggle`,
        method: "PATCH",
        data: { seller_id },
      }),
      invalidatesTags: ["BatchGroups"],
    }),

    // DELETE /batch-group/:group_id
    deleteBatchGroup: builder.mutation<
      { success: boolean; message: string },
      DeleteBatchGroupRequest
    >({
      query: ({ group_id, seller_id }) => ({
        url: `/batch-group/${group_id}`,
        method: "DELETE",
        data: { seller_id },
      }),
      invalidatesTags: ["BatchGroups"],
    }),

    // ── Tags ──────────────────────────────────────────────────────────────
    getBatchGroupTags: builder.query<{ success: boolean; data: BatchGroupTag[] }, number>({
      query: (groupId) => ({ url: `/batch-group/${groupId}/tags`, method: "GET" }),
      providesTags: (_r, _e, groupId) => [{ type: "BatchGroupTags", id: groupId }],
    }),

    createBatchGroupTag: builder.mutation<
      { success: boolean; data: BatchGroupTag },
      { group_id: number; tag_name: string; content: string; source_lang?: string }
    >({
      query: ({ group_id, ...body }) => ({
        url: `/batch-group/${group_id}/tags`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_r, _e, { group_id }) => [{ type: "BatchGroupTags", id: group_id }],
    }),

    deleteBatchGroupTag: builder.mutation<{ success: boolean }, { groupId: number; tagId: number }>({
      query: ({ groupId, tagId }) => ({
        url: `/batch-group/${groupId}/tags/${tagId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { groupId }) => [{ type: "BatchGroupTags", id: groupId }],
    }),
  }),
});

export const {
  useGetBatchGroupsQuery,
  useCreateBatchGroupMutation,
  useUpdateBatchGroupMutation,
  useToggleBatchGroupMutation,
  useDeleteBatchGroupMutation,
  useGetBatchGroupTagsQuery,
  useCreateBatchGroupTagMutation,
  useDeleteBatchGroupTagMutation,
} = batchGroupApi;
