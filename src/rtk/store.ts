import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./slices/apiSlice";
import { productApiSlice } from "./slices/productSlice";
import { bidApiSlice } from "./slices/bidApiSlice";
import { batchApiSlice } from "./slices/batchApiSlice";
import { buyerApi } from "./slices/buyerApiSlice";
import { adminApi } from "./slices/adminApiSlice";
import { adminStatsApi } from "./slices/adminStatsApiSlice";
import { roleApi } from "./slices/roleApiSlice";
import { permissionApi } from "./slices/permissionApiSlice";
import sellerNetworkApi from "./slices/sellerNetworkSlice";

import unreadReducer from "./slices/unreadSlice";

import sellerUnreadReducer from "./slices/sellerUnreadSlice";
import { checkoutApi } from "./slices/checkoutApiSlice";
import { auctionGroupApi } from "./slices/auctionGroupApiSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    [productApiSlice.reducerPath]: productApiSlice.reducer,
    [bidApiSlice.reducerPath]: bidApiSlice.reducer,
    [batchApiSlice.reducerPath]: batchApiSlice.reducer,
    [buyerApi.reducerPath]: buyerApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [adminStatsApi.reducerPath]: adminStatsApi.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
    [permissionApi.reducerPath]: permissionApi.reducer,
    [sellerNetworkApi.reducerPath]: sellerNetworkApi.reducer,
    [checkoutApi.reducerPath]:checkoutApi.reducer,
    [auctionGroupApi.reducerPath]: auctionGroupApi.reducer,
    unread: unreadReducer,
    sellerUnread:sellerUnreadReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      apiSlice.middleware,
      productApiSlice.middleware,
      bidApiSlice.middleware,
      batchApiSlice.middleware,
      buyerApi.middleware,
      adminApi.middleware,
      adminStatsApi.middleware,
      roleApi.middleware,
      permissionApi.middleware,
      sellerNetworkApi.middleware,
      checkoutApi.middleware,
      auctionGroupApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
