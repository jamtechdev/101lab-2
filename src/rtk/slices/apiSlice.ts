import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../api/baseQuery";
import { SITE_TYPE_PROFILE } from "@/config/site";

// -------------------- Interfaces --------------------
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  company: string;
  role: "buyer" | "seller";
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}

export interface VerifyResponse {
  success: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface Category {
  term_id: number;
  name: string;
  slug: string;
  description: string;
  thumbnail_id: string;
}

// -------------------- OTP / Forgot Password Interfaces --------------------
export interface SendOtpRequest {
  email: string;
}

export interface SendOtpResponse {
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface UpdateUserSettingsRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  currentPassword?: string;
  newPassword?: string;
  language?: string;
  timezone?: string;
  currency?: string;
  userId?: string;
  experience?: string;
  companyDetail?: string;
  companyTaxIdNumber?: string;
}

export interface UpdateUserSettingsResponse {
  success: boolean;
  message: string;
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

const getTokens = () => {
  const accessToken = localStorage.getItem("accessToken") || "";
  const refreshToken = localStorage.getItem("refreshToken") || "";
  return { accessToken, refreshToken };
};

// API Slice
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery,
  endpoints: (builder) => ({
    //  User / Auth
    getUsers: builder.query<
      any,
      {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        assignedOnly?: boolean;
        userType?: string;
        companyName?: string;
        companyTaxIdNumber?: string;
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        search,
        status,
        assignedOnly,
        userType,
        companyName,
        companyTaxIdNumber,
      } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search) params.append("search", search);
        if (status) params.append("status", status);
        if (assignedOnly) params.append("assignedOnly", "true");
        if (userType) params.append("userType", userType); // Filter by buyer or seller
        if (companyName) params.append("companyName", companyName); // Filter by company name
        if (companyTaxIdNumber)
          params.append("companyTaxIdNumber", companyTaxIdNumber); // Filter by company tax ID
        return { url: `/admin/users?${params.toString()}` };
      },
    }),
    getUserById: builder.query<any, string>({
      query: (id) => ({ url: `/users/${id}` }),
    }),
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "user/login",
        method: "POST",
        data: credentials,
      }),
    }),
    signup: builder.mutation<SignupResponse, FormData>({
      query: (formData) => ({
        url: "/user/signup",
        method: "POST",
        data: formData,
      }),
    }),
    verifyUser: builder.query<VerifyResponse, void>({
      query: () => {
        const { accessToken, refreshToken } = getTokens();

        return {
          url: "/user/verify-user",
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`, // access token
            "x-refresh-token": refreshToken, // optional header for refresh token
          },
        };
      },
    }),

    logout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "/user/logout",
        method: "POST",
      }),
    }),

    // -------------------- Categories --------------------
    getCategories: builder.query<Category[], string | void>({
      query: (lang) => {
        const currentLang = lang || localStorage.getItem('language') || 'en';
        return {
          url: `/product/category?lang=${currentLang}`,
          method: "GET",
        };
      },
    }),
    getMachinesCategories: builder.query<Category[], string | void>({
      query: (lang) => {
        const rawLang = lang || localStorage.getItem('language') || 'en';
        const currentLang = rawLang === 'zh' ? 'zh-hant' : rawLang;
        return {
          url: `/product/machines/category?language=${currentLang}`,
          method: "GET",
        };
      },
    }),

    // -------------------- OTP / Forgot Password --------------------
    sendOtp: builder.mutation<SendOtpResponse, SendOtpRequest>({
      query: (body) => ({
        url: "/user/forgot-password/send-otp",
        method: "POST",
        data: body,
      }),
    }),
    verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: (body) => ({
        url: "/user/forgot-password/verify-otp",
        method: "POST",
        data: body,
      }),
    }),
    resetPassword: builder.mutation<
      ResetPasswordResponse,
      ResetPasswordRequest
    >({
      query: (body) => ({
        url: "/user/forgot-password/reset",
        method: "POST",
        data: body,
      }),
    }),

    updateUserSettings: builder.mutation<
      UpdateUserSettingsResponse,
      UpdateUserSettingsRequest
    >({
      query: (payload) => ({
        url: `/user/settings${
          payload?.userId ? `?userId=${payload.userId}&type=Recycle` : "?type=Recycle"
        }`,
        method: "PUT",
        data: payload,
      }),
    }),

    getUserProfile: builder.query<any, string>({
      query: (queryString) => {
        // queryString format: "userId" or "userId?companyTaxIdNumber=123&type=..."
        let url: string;
        if (queryString.includes("?")) {
          const [userId, params] = queryString.split("?");
          url = `/user/profile?userId=${userId}&${params}`;
        } else {
          url = `/user/profile?userId=${queryString}&type=${SITE_TYPE_PROFILE}`;
        }
        return {
          url,
          method: "GET",
        };
      },
    }),

    createUserByAdmin: builder.mutation<any, any>({
      query: (userData) => {
        const companySellerId = localStorage.getItem("userId");
        const companyName = localStorage.getItem("companyName");
        return {
          url: "/user/create-user",
          method: "POST",
          data: { ...userData, companyName, companySellerId },
        };
      },
    }),

    assignUserToCompany: builder.mutation<any, { userId: number; data: any }>({
      query: ({ userId, data }) => ({
        url: `/user/assign-user/${userId}`,
        method: "POST",
        data: data,
      }),
    }),

    getUserTypeAndRole: builder.query<any, void>({
      query: () => {
        const userId = localStorage.getItem("userId");
        const effectiveUserId = userId;

        let companyName = localStorage.getItem("companyName");
        const companySellerId = localStorage.getItem("companySellerId");
        const companyTaxIdNumber =
          localStorage.getItem("currentCompanyTaxId") ||
          localStorage.getItem("companyTaxIdNumber");

        // Fallback: Get company name from userData if not in localStorage
        if (!companyName) {
          const loginUserDataRaw = localStorage.getItem("userData");
          if (loginUserDataRaw) {
            try {
              const parsed = JSON.parse(loginUserDataRaw);
              const userDetail = parsed?.userDetail;
              if (userDetail?.company) {
                companyName = userDetail.company;
                // Store it for future use to avoid repeated parsing
                localStorage.setItem("companyName", companyName);
              }
            } catch (e) {
              console.warn(
                "Failed to parse userData for company name fallback",
                e,
              );
            }
          }
        }

        // Build query params with company context
        const params = new URLSearchParams({ userId: effectiveUserId });

        // Check if user is in company mode vs normal seller mode
        // Use a dedicated flag to track company mode (set by CompanySelector)
        const isCompanyMode = localStorage.getItem("isCompanyMode") === "true";

        if (isCompanyMode && companyName) {
          // Company mode: user has explicitly selected a company, use role-based permissions
          params.append("companyName", companyName);
        } else {
          // Normal seller mode: default state after login, use admin permissions
          params.append("companyName", "normal-user");
        }
        if (companyTaxIdNumber) {
          params.append("companyTaxIdNumber", companyTaxIdNumber);
        }

        return {
          url: `/user/user-type-role?${params.toString()}`,
          method: "GET",
        };
      },
    }),

    getUserCompanies: builder.query<any, void>({
      query: () => {
        const userId = localStorage.getItem("userId");
        return {
          url: `/assign-user/companies/${userId}`,
          method: "GET",
        };
      },
    }),

    updateUserStatus: builder.mutation<any, { userId: number; status: string }>(
      {
        query: ({ userId, status }) => ({
          url: `/admin/users/status`,
          method: "PUT",
          data: { userId, status },
        }),
      },
    ),

    getPendingRoleRequests: builder.query<any, void>({
      query: () => {
        const userId = localStorage.getItem("userId");
        return {
          url: `/user/role-requests/pending?userId=${userId}`,
          method: "GET",
        };
      },
    }),

    updateRoleRequestStatus: builder.mutation<
      { success: boolean; message: string },
      { userId: number; companyName: string; status: "approved" | "rejected" }
    >({
      query: ({ userId, companyName, status }) => ({
        url: `/user/role-requests/${userId}/${companyName}/status`,
        method: "PUT",
        data: { status },
      }),
    }),


    createSellerAutoApprovalRequest: builder.mutation<
      { success: boolean; data?: any; message: string },
      { requested_start_date?: string; requested_end_date?: string }
    >({
      query: (body = {}) => ({
        url: `/seller-auto-approval/request?seller_id=${localStorage.getItem("userId")}`,
        method: "POST",
        data: body,
      }),
    }),


  }),
});

//   Hooks
export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useLoginMutation,
  useSignupMutation,
  useVerifyUserQuery,
  useLogoutMutation,
  useGetCategoriesQuery,
  useGetMachinesCategoriesQuery,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useUpdateUserSettingsMutation,
  useGetUserProfileQuery,
  useCreateUserByAdminMutation,
  useAssignUserToCompanyMutation,
  useGetUserTypeAndRoleQuery,
  useGetUserCompaniesQuery,
  useUpdateUserStatusMutation,
  useGetPendingRoleRequestsQuery,
  useUpdateRoleRequestStatusMutation,
  useCreateSellerAutoApprovalRequestMutation,
} = apiSlice;
