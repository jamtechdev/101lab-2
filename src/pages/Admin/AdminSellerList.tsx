import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import AdminHeader from "./AdminHeader";
import { Loader } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/rtk/store";
import { resetSellerUnread } from "@/rtk/slices/sellerUnreadSlice";

const apiUrl = import.meta.env.VITE_PRODUCTION_URL;

interface Seller {
    ID: number;
    display_name: string;
    user_email: string;
    user_login: string;
    batch_id?: number;
}

export default function AdminSellerList() {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate()
    const [error, setError] = useState("");

    const { t } = useTranslation();
    const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();

    const dispatch = useDispatch()




    const unreadMap = useSelector((state: RootState) => state.sellerUnread);





    const getSellerUnreadCount = (sellerId: number) => {
        let total = 0;

        Object.entries(unreadMap).forEach(([key, count]) => {
            const [id] = key.split("_"); // "534_285" → ["534", "285"]

            if (Number(id) === sellerId) {
                total += count;
            }
        });

        return total;
    };


    const handleClick = async (sellerId) => {
        try {
            
            //  await axios.put(`${apiUrl}notifications/read_by_batch`, {
            //                 batchId: buyer.batch_id,
            //                 buyerId: buyer.ID,
            //                 sellerId: sellerId,
            //             });

            dispatch(resetSellerUnread({ sellerId: sellerId }));
            navigate(`/admin/sellers/chat/${sellerId}`);


        } catch(e){
         
        }

    }






    const fetchSellers = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(`${apiUrl}chat/admin/seller`);
            console.log("res", response);

            setSellers(response?.data?.data?.data || []);
        } catch (err: any) {
            console.error(err);
            setError("Failed to fetch seller list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSellers();
    }, []);


    if (error) return <div className="text-red-500">{error}</div>;


    

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-background">
            <AdminSidebar activePath="/admin/sellers/chat" />

            <div
                className={cn(
                    "transition-all duration-300 min-h-screen flex flex-col overflow-hidden",
                    // Desktop: margin based on sidebar collapsed state
                    sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
                    // Mobile: no margin (sidebar is overlay)
                    "ml-0"
                )}
            >

                {loading &&
                    <div className="flex items-center justify-center mx-auto">


                        <Loader />
                    </div>
                }

                <AdminHeader />

                <div className="flex-1 overflow-y-auto p-4 lg:p-6">



                    <h1 className="text-2xl font-bold mb-4">Seller List</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {sellers.map((seller) => (
                            <div
                                key={seller.ID}
                                className="border rounded-lg p-4 shadow hover:shadow-md transition cursor-pointer"
                                onClick={() => {
                                    handleClick(seller.ID)

                                }}
                            >
                                <h2 className="font-semibold text-lg">{seller?.display_name}</h2>
                                {getSellerUnreadCount(seller.ID) > 0 && (
                                    <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                        {getSellerUnreadCount(seller.ID)}
                                    </span>
                                )}
                                <p className="text-sm text-gray-600">{seller.user_email}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
