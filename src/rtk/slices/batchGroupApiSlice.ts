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

// ─── API Slice ────────────────────────────────────────────────────────────────

export const batchGroupApi = createApi({
  reducerPath: "batchGroupApi",
  baseQuery: axiosBaseQuery,
  tagTypes: ["BatchGroups"],
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
  }),
});

export const {
  useGetBatchGroupsQuery,
  useCreateBatchGroupMutation,
  useUpdateBatchGroupMutation,
  useToggleBatchGroupMutation,
  useDeleteBatchGroupMutation,
} = batchGroupApi;
