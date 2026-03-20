import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { store } from "./rtk/store";
import { LoginModalProvider } from "./context/LoginModalContext";

import Landing from "./pages/landing/Landing";
import Factories from "./pages/landing/Factories";
import Resellers from "./pages/landing/Resellers";
import ContactInquiryTest from "./pages/Test/ContactInquiryTest";
import Auth from "./pages/auth/Auth";
import ForgotPassword from "./pages/auth/ForgotPassword";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Submissions from "./pages/dashboard/Submissions";
import BatchView from "./pages/dashboard/BatchView";
import Reports from "./pages/dashboard/Reports";
import Settings from "./pages/dashboard/Settings";
import ProductListingMain from "./pages/product-listing/ProductListingMain";
import InspectionReport from "./pages/dashboard/InspectionReport";
import Confirmation from "./pages/dashboard/Confirmation";
import PrivateProducts from "./pages/dashboard/PrivateProducts";
import BrowseListings from "./pages/Seller/BrowseListings.js";
import CompanyUserManagement from "./pages/Seller/CompanyUserManagement.js";
import SellerNetworkManagement from "./pages/Seller/SellerNetworkManagement.js";

import SellerBidDashboard from "./pages/dashboard/SellerBidDashboard";
import BuyerBidsList from "./pages/dashboard/BuyerBidsList";

import SellerChatTest from "./pages/chat/SellerChatTest";
import BuyerChatTest from "./pages/chat/BuyerBatchChat";
import BuyerAllChatList from "./pages/chat/BuyerAllChatList";

import BuyerSettingPage from "./pages/dashboard/BuyerSettingPage";
import Unauthorized403 from "./pages/auth/Unauthorized403";
import NotFound from "./pages/NotFound";


import AdminSellers from "./pages/Admin/AdminSellers.js";
import AdminSellerList from "./pages/Admin/AdminSellerList.js";
import AdminChat from "./pages/Admin/AdminChat.js";
import AdminAnalytics from "./pages/Admin/AdminAnalytics.js";
import AdminSettings from "./pages/Admin/AdminSettings.js";
import AdminSellersDetails from "./pages/Admin/AdminSellersDetails.js";
import EmailTypesPage from "./pages/Admin/Email/EmailTypesPage.js";
import TypeDetailsModal from "./pages/Admin/Email/TypeDetailsModal";
import PermissionDashboard from "./pages/Admin/PermissionDashboard.js";
import CompanyPermissionManagement from "./pages/Admin/CompanyPermissionManagement.js";
import UserRoleManagement from "./pages/Admin/UserRoleManagement.js";
import AdminUsersManagement from "./pages/Admin/UserManagement";
import AdminUserDetails from "./pages/Admin/AdminUserDetails";
import AdminAutoApproval from "./pages/Admin/AdminAutoApproval";
import AdminCommission from "./pages/Admin/AdminCommission.js";

import AIChat from "./pages/buyer/AiChat";

import GuestRoute from "./context/GuestRoute";
import SellerPermissionRoute from "./context/SellerPermissionRoute";

import SellerNotificationListener from "./components/common/SellerNotificationListener";

import { initBuyerSocket } from "./socket/initBuyerSocket";
import { initSellerSocket } from "./socket/initSellerSocket";
import { initAdminSocket } from "./socket/initAdminSocket";
import { getSocket } from "./services/socket";

import WebRTCDemo from "./Test/WebRTCDemo.js";
import PendingRoleRequests from "./pages/dashboard/PendingRoleRequests";
import BrowserListingDetail from "./pages/Seller/BrowserListingDetail";
import CompanyOrganization from "./components/common/CompanyOrganization";
import BuyerLayout from "./pages/buyer/BuyerLayout";
import BuyerDashboardLayout from "./components/layouts/BuyerDashboardLayout";
import BuyerMarketplace from "./pages/marketplace/BuyerMarketplace";
import BuyerDashboard from "./pages/dashboard/BuyerDashboard";
import ListingDetail from "./pages/marketplace/ListingDetail";
import BuyerBatchDetails from "./pages/marketplace/BuyerBatchDetails";
import ProtectedRoute from "./context/ProtectedRoute";
import SellerChatPageList from "./pages/chat/SellerChatList.js";
import BuyerOffers from "./pages/offer/BuyerOffer";
import BuyerOrders from "./pages/order/BuyerOrder";
import WinningBids from "./pages/buyer/WinningBids";
import MyOrders from "./pages/buyer/MyOrders";
import OrderHistory from "./pages/buyer/OrderHistory";
import MyInspections from "./pages/buyer/MyInspections";
import MyBids from "./pages/buyer/MyBids";
import SellerMyInspections from "./pages/Seller/buying/SellerMyInspections.js";
import SellerMyBids from "./pages/Seller/buying/SellerMyBids";
import SellerWinningBids from "./pages/Seller/buying/SellerWinningBids";
import SellerMyOrders from "./pages/Seller/buying/SellerMyOrders";
import SellerBuyingBatchDetails from "./pages/Seller/buying/SellerBuyingBatchDetails";
import SellerBatchMessageList from "./pages/Seller/BatchChatList";
import Checkout from "./pages/Seller/Checkout";
import SellerOffersReceived from "./pages/Seller/offers/SellerOffersReceived.js";
import SellerOrdersReceived from "./pages/Seller/orders/SellerOrdersReceived.js";
import SellerOrder from "./pages/order/SellerOrder.js";
import SellerOffer from "./pages/offer/SellerOffer.js";
import SearchPage from "./pages/dashboard/SearchPage";
import CheckoutPage from "./pages/Seller/Checkout.js"
import SellerMarketplace from "./pages/Seller/SellerMarketplace.js";
import SellerListingDetail from "./pages/Seller/SellerListingDetail.js";
import AdminRoute from "./context/AdminRoute.js";
import Admin from "./pages/Admin/Admin.js";
import AdminListings from "./pages/Admin/AdminListings.js";
import AdminBatchDetails from "./pages/Admin/AdminBatchDetails.js";
import AdminBuyers from "./pages/Admin/AdminBuyers.js";
import BuyerDetails from "./pages/Admin/AdminBuyerDetails.js";
import AutoApprovalPage from "./pages/dashboard/AutoApprovalPage";
import Marketplace from "./pages/marketplace/Marketplace";
import TestRendeer from "./Test/TestRendeer.jsx";
import SellerBatchDetails from "./pages/dashboard/SellerBatchDetails";
import SellerLandingPage from "./pages/sellerLanding/SellerLandingPage.js";
import DirectSalesPage from "./pages/DirectSalesPage/DirectSalesPage.js";
import MyLots from "./pages/buyer/MyLots";

const queryClient = new QueryClient();

const App = () => {
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const role = localStorage.getItem("userRole");

    if (role === "seller") {
      initSellerSocket();
    } else if (role === "admin") {
      initAdminSocket();
    } else {
      initBuyerSocket();
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("userRole");

    if (userId && role) {
      socket.connect();
      socket.emit("joinRooms", { user_id: userId, role }, (res) => {
        console.log("Rejoin rooms:", res);
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Provider store={store}>
          <SellerNotificationListener sellerId={userId} isSeller={true} />

          <BrowserRouter>
            <LoginModalProvider>
            <Routes>
              {/* PUBLIC */}
              <Route path="/" element={<Landing />} />
              <Route path="/factories" element={<Factories />} />
               <Route path="/resellers" element={<Resellers />} />
               <Route path="/sell-with-greenbidz" element={<SellerLandingPage/>} />
               <Route path="/direct-sales" element={<DirectSalesPage/>} />
               <Route path="/contact-inquiry-test" element={<ContactInquiryTest />} />

              <Route element={<GuestRoute />}>
                <Route path="/auth" element={<Auth />} />
              </Route>

              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* PUBLIC MARKETPLACE */}
              <Route path="/buyer-marketplace" element={<Marketplace />} />
              <Route path="/buyer-marketplace/:id" element={<ListingDetail />} />
              <Route path="/buyer-marketplace/details/:name" element={<BrowserListingDetail />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/my-lots" element={<MyLots />} />

              {/* DASHBOARD (seller + buyer) */}
              <Route element={<ProtectedRoute allowedRoles={["seller", "buyer"]} />}>

                <Route path="/dashboard" element={<DashboardHome />} />
                <Route path="/dashboard/products" element={<PrivateProducts />} />
                <Route path="/dashboard/browse" element={<BrowseListings />} />
                <Route path="/dashboard/browse/:name" element={<BrowserListingDetail />} />
                <Route path="/dashboard/seller-network" element={<SellerNetworkManagement />} />

                {/* <Route element={<SellerPermissionRoute permission="product.view" />}> */}
                  <Route path="/dashboard/submissions" element={<Submissions />} />
                  <Route path="/dashboard/auto-approval" element={<AutoApprovalPage />} />
                  <Route path="/batch/:batchId" element={<BatchView />} />
                {/* </Route> */}

                <Route element={<SellerPermissionRoute permission="chat.view" />}>
                  <Route path="/seller-chat-test" element={<SellerChatTest />} />
                  <Route path="/buyer-chat-test" element={<BuyerChatTest />} />
                </Route>

                <Route path="/dashboard/bids" element={<SellerBidDashboard />} />
                <Route path="/dashboard/bid/batch/:batchId" element={<BuyerBidsList />} />

                <Route path="/dashboard/reports" element={<Reports />} />

                <Route path="/dashboard/settings" element={<Settings />} />
                <Route path="/dashboard/submission/message" element={<SellerChatPageList />} />


                <Route element={<SellerPermissionRoute permission="userManagement.edit" />}>
                  <Route path="/dashboard/permissions" element={<PermissionDashboard />} />
                </Route>

                <Route element={<SellerPermissionRoute permission="userManagement.view" />}>
                  <Route path="/dashboard/users" element={<CompanyUserManagement />} />
                </Route>
                {/* 
                <Route element={<SellerPermissionRoute permission="product.add" />}> */}
                <Route path="/upload" element={<ProductListingMain />} />
                <Route path="/upload/batch/:batchId" element={<SellerBatchDetails />} />

                {/* Seller Marketplace */}
                <Route path="/dashboard/marketplace" element={<SellerMarketplace />} />
                <Route path="/dashboard/marketplace/:id" element={<SellerListingDetail />} />
                <Route path="/dashboard/marketplace/details/:name" element={<BrowserListingDetail />} />

                {/* </Route> */}

                <Route element={<SellerPermissionRoute permission="steps.step4" />}>
                  <Route path="/inspection-report" element={<InspectionReport/>} />
                </Route>

                <Route element={<SellerPermissionRoute permission="steps.step8" />}>
                  <Route path="/confirmation" element={<Confirmation />} />
                </Route>

                <Route path="/dashboard/buyer-dashboard" element={<BuyerDashboard />} />

                <Route path="/pending-permission" element={<PendingRoleRequests />} />
                <Route path="/dashboard/company-organization" element={<CompanyOrganization />} />
                <Route path="/dashboard/checkout" element={<Checkout />} />
                <Route path="/dashboard/offers" element={<BuyerOffers />} />
                <Route path="/dashboard/orders" element={<BuyerOrders />} />
                <Route path="/dashboard/buyer-dashboard/batch/:batchId" element={<BuyerBatchDetails />} />

                <Route path="/dashboard/seller/offers" element={<SellerOffer />} />
                <Route path="/dashboard/seller/orders" element={<SellerOrder />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />

                {/* Seller BUYING section */}
                <Route path="/dashboard/buying/inspections" element={<SellerMyInspections />} />
                <Route path="/dashboard/buying/bids" element={<SellerMyBids />} />
                <Route path="/dashboard/buying/winning-bids" element={<SellerWinningBids />} />
                <Route path="/dashboard/buying/orders" element={<SellerMyOrders />} />
                <Route path="/dashboard/buying/batch/:batchId" element={<SellerBuyingBatchDetails />} />

              </Route>


              {/* BUYER PROTECTED ROUTES - Allow role switching */}
              <Route element={<ProtectedRoute allowedRoles={["seller", "buyer"]} />}>

                {/* Buyer Dashboard routes - with sidebar layout */}
                <Route element={<BuyerDashboardLayout />}>
                  <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
                  <Route path="/buyer-dashboard/batch/:batchId" element={<BuyerBatchDetails />} />
                  <Route path="/buyer/inspections" element={<MyInspections />} />
                  <Route path="/buyer/bids" element={<MyBids />} />
                  <Route path="/buyer/winning-bids" element={<WinningBids />} />
                  <Route path="/buyer/orders" element={<MyOrders />} />
                  <Route path="/buyer/order-history" element={<OrderHistory />} />
                  <Route path="/buyer/profile-setting" element={<BuyerSettingPage />} />
                  <Route path="/buyer/chat/message" element={<BuyerAllChatList />} />
                </Route>

                {/* Buyer Marketplace + other routes - no sidebar */}
                <Route element={<BuyerLayout/>}>
                  <Route path="/buyer-chat-test" element={<BuyerChatTest />} />
                  <Route path="/buyer/company-organization" element={<CompanyOrganization />} />
                  <Route path="/buyer/checkout" element={<Checkout />} />
                </Route>

              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/listings" element={<AdminListings />} />
                <Route path="/admin/listings/:batchId" element={<AdminBatchDetails />} />
                <Route path="/admin/buyers" element={<AdminBuyers />} />
                <Route path="/admin/users" element={<AdminUsersManagement />} />
                <Route path="/admin/users/:userId" element={<AdminUserDetails />} />
                <Route path="/admin/buyers/:id" element={<BuyerDetails />} />
                <Route path="/admin/sellers" element={<AdminSellers />} />
                <Route path="/admin/sellers/chat" element={<AdminSellerList />} />
                <Route path="/admin/sellers/chat/:sellerId" element={<AdminChat />} />
                <Route path="/admin/sellers/:id" element={<AdminSellersDetails />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/auto-approval" element={<AdminAutoApproval />} />
                <Route path="/admin/commission" element={<AdminCommission />} />
                <Route path="/admin/settings/email" element={<EmailTypesPage />} />
                <Route path="/admin/email-types/:typeId" element={<TypeDetailsModal />} />
              </Route>


              {/* MISC */}
              <Route path="/ai/chat1" element={<AIChat />} />
              <Route path="/test" element={<TestRendeer />} />


              {/* ERRORS */}
              <Route path="/forbidden" element={<Unauthorized403 />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </LoginModalProvider>
          </BrowserRouter>
        </Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
