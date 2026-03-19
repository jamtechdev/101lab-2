// @ts-nocheck
import React from "react";
import {
    useGetPendingRoleRequestsQuery,
    useUpdateRoleRequestStatusMutation,
} from "@/rtk/slices/apiSlice";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const PendingRoleRequests: React.FC = () => {
    const { data, isLoading, refetch } = useGetPendingRoleRequestsQuery();
    const [updateStatus, { isLoading: isUpdating }] = useUpdateRoleRequestStatusMutation();
    const handleStatus = async (
       data: any,
        status: "approved" | "rejected"
    ) => {
        try {
            
            console.log("data is",data);
            const userId = localStorage.getItem("userId");
            if (!userId) {
                toast.error("User ID not found");
                return;
            }

            const companySellerId=data?.company_seller_id;
            const companyName=data?.company_name;
            const role=data?.role?.role_id;

            if (!userId) {
                toast.error("User ID not found");
                return;
            }
            const response = await updateStatus({ userId: Number(userId), companyName, status }).unwrap();
            toast.success(`Request ${status}`);

            // If approved, store userId + companySellerId + company_name + role in localStorage
            // if (status === "approved" && response?.data) {
            //     const approvedData = response.data;
            //     localStorage.setItem("userId", approvedData.user_id.toString());
            //     localStorage.setItem("companySellerId", approvedData.company_seller_id.toString());
            //     localStorage.setItem("companyName", approvedData.company_name);
            //     localStorage.setItem("roleName", approvedData.role.role_name);
            //     localStorage.setItem("roleKey", approvedData.role.role_key);
            // }

            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || "Something went wrong");
        }
    };

    if (isLoading)  return (
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-accent-light rounded-full animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            ></div>
          </div>
        </div>
      );

    // if (!data || data.data.length === 0) return <div>No pending role requests</div>;

    return (
        <DashboardLayout>
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Pending Role Requests</h2>
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Company</th>
                            <th className="border p-2 text-left">Requested Role</th>
                            <th className="border p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {((Array.isArray(data) ? data : (data as any)?.data) || []).map((req: any) => (
                            <tr key={req.id}>
                                <td className="border p-2">{req.company_name}</td>
                                <td className="border p-2">{req.role.role_name}</td>
                                <td className="border p-2 space-x-2 text-center">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        disabled={isUpdating}
                                        onClick={() => handleStatus(req, "approve")}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={isUpdating}
                                        onClick={() => handleStatus(data, "reject")}
                                    >
                                        Reject
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
};

export default PendingRoleRequests;

