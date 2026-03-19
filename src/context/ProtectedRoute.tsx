// src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useVerifyUserQuery } from "@/rtk/slices/apiSlice";

interface Props {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const { data, isLoading, isError } = useVerifyUserQuery();

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );

  if (isError || !data?.success)
    return <Navigate to="/auth" replace />;

  const user = data.user;
  
  // If no role restrictions, allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Outlet />;
  }
  
  // If route allows both seller and buyer, allow role switching
  if (allowedRoles.includes("seller") && allowedRoles.includes("buyer")) {
    // Allow access if user is either seller or buyer
    if (user.role === "seller" || user.role === "buyer") {
      return <Outlet />;
    }
  }
  
  // For admin-only routes or single-role routes, check normally
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
