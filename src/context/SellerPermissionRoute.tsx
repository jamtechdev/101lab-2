import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useVerifyUserQuery } from "@/rtk/slices/apiSlice";
import { useSellerPermissions } from "@/hooks/useSellerPermissions";

interface SellerPermissionRouteProps {

  permission: string | string[];
  

  requireAll?: boolean;
  

  fallbackRoute?: string;
}


const SellerPermissionRoute: React.FC<SellerPermissionRouteProps> = ({ 
  permission, 
  requireAll = false,
  fallbackRoute = "/forbidden"
}) => {
  // First check if user is authenticated and is a seller
  const { data, isLoading, isError } = useVerifyUserQuery();
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoadingProfile } = useSellerPermissions();

  // Show loading while checking authentication and permissions
  // Also wait for user data and permission data to be ready
  const isCompanyMode = localStorage.getItem("isCompanyMode") === 'true';

  // In company mode, wait for permission API to load before checking
  if (isLoading || isLoadingProfile || !data?.user) {
    console.log('SellerPermissionRoute: Loading - auth:', isLoading, 'permissions:', isLoadingProfile, 'user:', !!data?.user, 'companyMode:', isCompanyMode);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (isError || !data?.success) {
    return <Navigate to="/auth" replace />;
  }

  const user = data.user;

  // Must be a seller to access seller permission routes
  if (user.role !== "seller") {
    return <Navigate to={fallbackRoute} replace />;
  }


  const isNormalSellerMode = !isCompanyMode;

  console.log('SellerPermissionRoute: Mode check - isNormalSellerMode:', isNormalSellerMode, 'isCompanyMode:', isCompanyMode, 'userRole:', user.role);

  if (isNormalSellerMode && user.role === 'seller') {
    console.log('SellerPermissionRoute: Normal seller mode detected - granting admin access');
    return <Outlet />;
  }

  // Check permission(s)
  const hasAccess = Array.isArray(permission)
    ? (requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission))
    : hasPermission(permission);

  console.log('SellerPermissionRoute: Permission check for', permission, '- hasAccess:', hasAccess, 'userRole:', user.role, 'companyMode:', isCompanyMode);


  if (!hasAccess) {
    console.log('SellerPermissionRoute: Access denied for permission:', permission, '- redirecting to:', fallbackRoute);
    return <Navigate to={fallbackRoute} replace />;
  }

  // Permission granted, render route
  return <Outlet />;
};

export default SellerPermissionRoute;

