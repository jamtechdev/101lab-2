import { Navigate, Outlet } from "react-router-dom";
import { AdminSidebarProvider } from "./AdminSidebarContext";
import { useVerifyUserQuery } from "@/rtk/slices/apiSlice";

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (let cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) return value;
  }
  return null;
}

const AdminRoute = () => {
    const { data, isLoading, isError } = useVerifyUserQuery(undefined, { refetchOnMountOrArgChange: true });

    const accessToken = getCookie("accessToken");
    const refreshToken = getCookie("refreshToken");



    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isError || !data?.success) {
        return <Navigate to="/auth" replace />;
    }

    const user = data.user;

    if (!user.role || user.role !== "admin") {
        return <Navigate to="/forbidden" replace />;
    }

    return (
        <AdminSidebarProvider>
            <Outlet />
        </AdminSidebarProvider>
    );
};

export default AdminRoute;

