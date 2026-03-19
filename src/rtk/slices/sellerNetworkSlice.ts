import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../api/baseQuery";

// Interfaces
interface SellerNetworkResponse {
    success: boolean;
    message: string;
    data: any;
}

interface AddSellersToNetworkRequest {
    sellerIds: number[];
}

interface UpdateNetworkStatusRequest {
    networkId: number;
    status: "pending" | "active" | "inactive" | "suspended";
}

interface AcceptInvitationRequest {
    networkId: number;
}

interface AdminApproveRequest {
    networkId: number;
    action: "approve" | "reject";
    reason?: string;
}

interface AvailableSellersResponse {
    success: boolean;
    message: string;
    data: Array<{
        seller_id: number;
        seller_email: string;
        seller_name: string;
        is_main_seller: boolean;
        type: "main" | "network";
        network_id?: number;
        added_at?: string;
    }>;
}

const sellerNetworkApi = createApi({
    reducerPath: "sellerNetworkApi",
    baseQuery: axiosBaseQuery,
    tagTypes: ["SellerNetwork", "AvailableSellers"],

    endpoints: (builder) => ({
        // Add sellers to network
        addSellersToNetwork: builder.mutation<
            SellerNetworkResponse,
            AddSellersToNetworkRequest
        >({
            query: (data) => {
                const userId = localStorage.getItem("userId");
                return {
                    url: `/seller-network/add-sellers?userId=${userId}`,
                    method: "POST",
                    data,
                };
            },
            invalidatesTags: ["SellerNetwork"],
        }),

        // Get seller's network (as main seller)
        getSellerNetwork: builder.query<
            SellerNetworkResponse,
            { mainSellerId: number; status?: string }
        >({
            query: ({ mainSellerId, status }) => ({
                url: `/seller-network/seller/${mainSellerId}/network`,
                method: "GET",
                params: status ? { status } : {},
            }),
            providesTags: ["SellerNetwork"],
        }),

        // Get networks where seller belongs
        getSellerNetworks: builder.query<
            SellerNetworkResponse,
            { sellerId: number; status?: string }
        >({
            query: ({ sellerId, status }) => ({
                url: `/seller-network/seller/${sellerId}/networks`,
                method: "GET",
                params: status ? { status } : {},
            }),
            providesTags: ["SellerNetwork"],
        }),

        // Available sellers to add
        getAvailableSellers: builder.query<AvailableSellersResponse, number>({
            query: (mainSellerId) => ({
                url: `/seller-network/available-sellers/${mainSellerId}`,
                method: "GET",
            }),
            providesTags: ["AvailableSellers"],
        }),

        // Update network status
        updateNetworkStatus: builder.mutation<
            SellerNetworkResponse,
            UpdateNetworkStatusRequest
        >({
            query: ({ networkId, status }) => {
                const userId=localStorage.getItem("userId")
                return {
                url: `/seller-network/status/${networkId}?userId=${userId}`,
                method: "PUT",
                data: { status },
                }
            },
            invalidatesTags: ["SellerNetwork"],
        }),

        // Accept invitation
        acceptNetworkInvitation: builder.mutation<
            SellerNetworkResponse,
            AcceptInvitationRequest
        >({
            query: ({ networkId }) => {
                const userId = localStorage.getItem("userId");
                return {
                    url: `/seller-network/accept/${networkId}?userId=${userId}`,
                    method: "PUT",
                };
            },
            invalidatesTags: ["SellerNetwork"],
        }),

        // Admin approve / reject
        adminApproveSellerInvitation: builder.mutation<
            SellerNetworkResponse,
            AdminApproveRequest
        >({
            query: ({ networkId, action, reason }) => {
                const userId = localStorage.getItem("userId");
                return {
                    url: `/seller-network/approve/${networkId}?userId=${userId}`,
                    method: "PUT",
                    data: { action, reason },
                };
            },
            invalidatesTags: ["SellerNetwork"],
        }),

        // Admin → pending sellers
        getPendingSellers: builder.query<SellerNetworkResponse, void>({
            query: () => {
                const userId = localStorage.getItem("userId");
                return {
                    url: `/seller-network/pending-sellers?userId=${userId}`,
                    method: "GET",
                };
            },
            providesTags: ["SellerNetwork"],
        }),

        // Seller → pending invitations
        getPendingInvitations: builder.query<SellerNetworkResponse, void>({
            query: () => {
                const userId = localStorage.getItem("userId");
                return {
                    url: `/seller-network/pending-invitations?userId=${userId}`,
                    method: "GET",
                };
            },
            providesTags: ["SellerNetwork"],
        }),

        // Remove seller from network
        removeSellerFromNetwork: builder.mutation<
            SellerNetworkResponse,
            number
        >({
            query: (networkId) => {
                const userId = localStorage.getItem("userId");
                return {
                    url: `/seller-network/${networkId}?userId=${userId}`,
                    method: "DELETE",
                };
            },
            invalidatesTags: ["SellerNetwork"],
        }),

        // Current user's main network
        getMySellerNetwork: builder.query<
            SellerNetworkResponse,
            { status?: string }
        >({
            query: (params) => {
                const userId = localStorage.getItem("userId");
                const queryParams: any = {};

                if (userId) queryParams.userId = userId;
                if (params.status?.trim()) queryParams.status = params.status;

                return {
                    url: "/seller-network/my-network",
                    method: "GET",
                    params: queryParams,
                };
            },
            providesTags: ["SellerNetwork"],
        }),

        // Current user's joined networks
        getMySellerNetworks: builder.query<
            SellerNetworkResponse,
            { status?: string }
        >({
            query: (params) => {
                const userId = localStorage.getItem("userId");

                return {
                    url: "/seller-network/my-networks",
                    method: "GET",
                    params: {
                        ...params,     // keeps optional status
                        userId,    
                    },
                };
            },
            providesTags: ["SellerNetwork"],
        }),

    }),
});


export const {
    useAddSellersToNetworkMutation,
    useGetSellerNetworkQuery,
    useGetSellerNetworksQuery,
    useGetAvailableSellersQuery,
    useUpdateNetworkStatusMutation,
    useAcceptNetworkInvitationMutation,
    useAdminApproveSellerInvitationMutation,
    useGetPendingSellersQuery,
    useGetPendingInvitationsQuery,
    useRemoveSellerFromNetworkMutation,
    useGetMySellerNetworkQuery,
    useGetMySellerNetworksQuery,
} = sellerNetworkApi;

export default sellerNetworkApi;
