// src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useVerifyUserQuery } from "@/rtk/slices/apiSlice";

interface Props {
  allowedRoles?: string[];
}

// Routes that are seller-only (buyers should not access)
const SELLER_ONLY_PATHS = ["/dashboard"];

const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const location = useLocation();
  const { data, isLoading, isError } = useVerifyUserQuery();

  console.log("data is",data);
  

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );

  if (isError || !data?.success)
    return <Navigate to="/auth" replace />;

  const user = data.user;
  // jwtRole is the immutable role from login token
  // activeView is what the seller has toggled to (buyer/seller view)
  const jwtRole = user.role; // from server verify — always accurate
  const activeView = localStorage.getItem("activeView") || jwtRole;
  
  // If no role restrictions, allow access
  if (!allowedRoles || allowedRoles.length === 0) {
  
    return <Outlet />;
  }

  if(data?.success  && data?.user?.role === "admin"){
    return  <Navigate to="/admin" replace />;
  }
  
  // If route allows both seller and buyer
  if (allowedRoles.includes("seller") && allowedRoles.includes("buyer")) {
    if (jwtRole === "seller" || jwtRole === "buyer") {
      // Pure buyers trying to access seller-only paths → redirect to buyer dashboard
      const isSellerOnlyPath = SELLER_ONLY_PATHS.some(
        (p) => location.pathname === p || location.pathname.startsWith(p + "/")
      );
      if (jwtRole === "buyer" && isSellerOnlyPath) {
        return <Navigate to="/buyer-dashboard" replace />;
      }
      return <Outlet />;
    }
  }
  
  // For admin-only routes or single-role routes, check normally
  if (!allowedRoles.includes(jwtRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
