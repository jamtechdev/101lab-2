// src/rtk/slices/permissionApiSlice.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../api/baseQuery";

// Interfaces
export interface UserRole {
  id: number;
  user_id: number;
  company_seller_id?: number;
  company_name: string;
  role_id: number;
  is_active: number;
  assigned_by?: number;
  assigned_at: string;
  created_at?: string;
  updated_at?: string;
  role?: {
    role_id: number;
    role_key: string;
    role_name: string;
    is_active: number;
  };
}

export interface AssignUserRoleRequest {
  userId: number;
  roleId: number;
  companyName: string;
  companySellerId?: number;
  assignedBy: number;
}

export interface UpdateUserRoleRequest {
  roleId?: number;
  companyName?: string;
  companySellerId?: number;
  assignedBy?: number;
}

export interface BuyerUser {
  user_id: number;
  user_login: string;
  user_email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  user_type: string;
  user_status: string;
}

export interface SearchBuyersResponse extends ApiResponse<{
  users: BuyerUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {}

export interface CompanyRolePermission {
  id: number;
  company_tax_id: string;
  role_id: number;
  permission_key: string;
  is_allowed: number;
  updated_at: string;
}

export interface SetCompanyPermissionRequest {
  companyIdentifier: string;
  roleId: number;
  permissionKey: string;
  isAllowed: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface UserRolesListResponse extends ApiResponse<UserRole[]> {}
export interface CompanyPermissionsListResponse extends ApiResponse<CompanyRolePermission[]> {}

export const permissionApi = createApi({
  reducerPath: "permissionApi",
  baseQuery: axiosBaseQuery,
  tagTypes: ["UserRoles", "CompanyPermissions"],
  endpoints: (builder) => ({
    // Assign role to user
    assignUserRole: builder.mutation<ApiResponse<UserRole>, AssignUserRoleRequest>({
      query: (roleData) => ({
        url: "/user-roles",
        method: "POST",
        data: roleData,
      }),
      invalidatesTags: ["UserRoles"],
    }),

    // Get user roles
    getUserRoles: builder.query<UserRolesListResponse, number>({
      query: (userId) => ({
        url: `/user-roles/${userId}`,
        method: "GET",
      }),
      providesTags: ["UserRoles"],
    }),

    // Update user role
    updateUserRole: builder.mutation<ApiResponse<UserRole>, { id: number; data: UpdateUserRoleRequest }>({
      query: ({ id, data }) => ({
        url: `/user-roles/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: ["UserRoles"],
    }),

    // Remove user role
    removeUserRole: builder.mutation<ApiResponse<UserRole>, number>({
      query: (roleId) => ({
        url: `/user-roles/${roleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserRoles"],
    }),

    // Set company role permission
    setCompanyRolePermission: builder.mutation<ApiResponse<CompanyRolePermission>, SetCompanyPermissionRequest>({
      query: (permissionData) => ({
        url: "/company-role-permissions",
        method: "POST",
        data: permissionData,
      }),
      invalidatesTags: ["CompanyPermissions"],
    }),

    // Get company role permissions
    getCompanyRolePermissions: builder.query<
      CompanyPermissionsListResponse,
      { companyIdentifier: string; roleId: number }
    >({
      query: ({ companyIdentifier, roleId }) => ({
        url: `/company-role-permissions?companyIdentifier=${companyIdentifier}&roleId=${roleId}`,
        method: "GET",
      }),
      providesTags: ["CompanyPermissions"],
    }),

    // Get company role permissions (alternative endpoint)
    getCompanyPermissions: builder.query<
      CompanyPermissionsListResponse,
      { companyIdentifier: string; roleId?: number }
    >({
      query: ({ companyIdentifier, roleId }) => ({
        url: "/company-role-permissions",
        method: "GET",
        params: { companyIdentifier, roleId },
      }),
      providesTags: ["CompanyPermissions"],
    }),

    // Search buyers for role assignment
    searchBuyers: builder.query<SearchBuyersResponse, { search?: string; page?: number; limit?: number }>({
      query: ({ search, page = 1, limit = 10 }) => ({
        url: "/user/search-buyers",
        method: "GET",
        params: { search, page, limit },
      }),
    }),

    // Search all users (buyers and sellers) for role assignment
    searchAllUsers: builder.query<SearchBuyersResponse, { search?: string; page?: number; limit?: number }>({
      query: ({ search, page = 1, limit = 10 }) => ({
        url: "/user/search-users",
        method: "GET",
        params: { search, page, limit },
      }),
    }),

    // Get user roles for a company
    getCompanyUserRoles: builder.query<UserRolesListResponse, string>({
      query: (companyName) => ({
        url: `/user-roles/company/${encodeURIComponent(companyName)}`,
        method: "GET",
      }),
      providesTags: ["UserRoles"],
    }),
  }),
});

// Export hooks
export const {
  useAssignUserRoleMutation,
  useUpdateUserRoleMutation,
  useGetUserRolesQuery,
  useGetCompanyUserRolesQuery,
  useRemoveUserRoleMutation,
  useSetCompanyRolePermissionMutation,
  useGetCompanyRolePermissionsQuery,
  useGetCompanyPermissionsQuery,
  useSearchBuyersQuery,
  useSearchAllUsersQuery,
} = permissionApi;

