// src/rtk/slices/roleApiSlice.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../api/baseQuery";

// Interfaces
export interface Role {
  role_id: number;
  role_key: string;
  role_name: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRoleRequest {
  role_key: string;
  role_name: string;
}

export interface UpdateRoleRequest {
  role_key?: string;
  role_name?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface RolesListResponse extends ApiResponse<Role[]> {}

export const roleApi = createApi({
  reducerPath: "roleApi",
  baseQuery: axiosBaseQuery,
  tagTypes: ["Roles"],
  endpoints: (builder) => ({
    // Get all roles
    getRoles: builder.query<RolesListResponse, void>({
      query: () => ({
        url: "/roles",
        method: "GET",
      }),
      providesTags: ["Roles"],
    }),

    // Create new role
    createRole: builder.mutation<ApiResponse<Role>, CreateRoleRequest>({
      query: (roleData) => ({
        url: "/roles",
        method: "POST",
        data: roleData,
      }),
      invalidatesTags: ["Roles"],
    }),

    // Update role
    updateRole: builder.mutation<ApiResponse<Role>, { id: number; roleData: UpdateRoleRequest }>({
      query: ({ id, roleData }) => ({
        url: `/roles/${id}`,
        method: "PUT",
        data: roleData,
      }),
      invalidatesTags: ["Roles"],
    }),

    // Deactivate role
    deactivateRole: builder.mutation<ApiResponse<Role>, number>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Roles"],
    }),
  }),
});

// Export hooks
export const {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeactivateRoleMutation,
} = roleApi;

