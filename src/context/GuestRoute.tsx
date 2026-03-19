import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useVerifyUserQuery } from "@/rtk/slices/apiSlice";

const GuestRoute: React.FC = () => {
    const { data, isLoading, isError, error } = useVerifyUserQuery();

    if (isLoading)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );

    // If API returns success, user is logged in
    if (data?.success && data.user) {
        const role = data.user.role;
        if (role === "seller") return <Navigate to="/dashboard" replace />;
        if (role === "buyer") return <Navigate to="/buyer-dashboard" replace />;
        return <Navigate to="/forbidden" replace />;
    }


    if (isError) {
  
        const status = (error as any)?.status;
        if (status === 401) return <Outlet />;
        // For other errors, you might show an error page
        return <div>Something went wrong. Please try again later.</div>;
    }

    // Default fallback
    return <Outlet />;
};

export default GuestRoute;
