import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Eye, TrendingUp, TrendingDown, X } from "lucide-react";
import { useGetSellerBidsQuery } from "@/rtk/slices/batchApiSlice";
import SellerNotificationListener from "../../components/common/SellerNotificationListener"


const Bids = () => {
  const navigate = useNavigate();
  // Use companySellerId for data (company-level), fallback to userId
  const companySellerIdStr = localStorage.getItem("companySellerId") || localStorage.getItem("userId");
  const companySellerId = companySellerIdStr ? Number(companySellerIdStr) : 0;

  const { data, isLoading, isError ,refetch } = useGetSellerBidsQuery(
    { userId: companySellerId || 0, page: 1, limit: 10 },
    { skip: !companySellerId }
  );

  const [selectedBids, setSelectedBids] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (bids: any[]) => {
    setSelectedBids(bids);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBids([]);
    setIsModalOpen(false);
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );

  if (isError || !data) return <p>Error fetching batches.</p>;


  const batches = (data as any)?.batches || (data as any)?.data || (Array.isArray(data) ? data : []);

  // Dynamic stats
  const total_active_bids = batches.filter((b) => b.status === "live_for_bids").length;
  const highest_current_bid = Math.max(...batches.map((b) => b.highest_bid || 0));
  const total_bid_value = batches.reduce((sum, b) => sum + (b.total_bid_value || 0), 0);

  return (
    <DashboardLayout  onNewBid={() => refetch()}   >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">進行中競標 Active Bids</h1>
            <p className="text-muted-foreground mt-1">
              監控您提交項目的即時競標活動 Monitor live bidding activity on your submissions
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">活躍競標總數 Total Active Bids</p>
              <p className="text-3xl font-bold text-foreground">{total_active_bids}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">最高出價 Highest Current Bid</p>
              <p className="text-3xl font-bold text-foreground">${highest_current_bid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">總競標價值 Total Bid Value</p>
              <p className="text-3xl font-bold text-foreground">${total_bid_value.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Bids Table */}
        <Card>
          <CardHeader>
            <CardTitle>即時競標活動 Live Bidding Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">批次編號 Batch ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">類別 Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">發布日期 Post Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">競標截止 Bid End Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">最高出價 Highest Bid</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">最低出價 Lowest Bid</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">出價總數 Total Bids</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">操作 Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => {
                    const postDate = batch.post_date ? new Date(batch.post_date).toLocaleDateString() : "-";
                    const bidEndDate = batch.bid_end_date ? new Date(batch.bid_end_date).toLocaleDateString() : "-";

                    return (
                      <tr key={batch.batch_id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">BATCH-{batch.batch_number}</td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">{batch.category}</td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">{postDate}</td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">{bidEndDate}</td>
                        <td className="py-3 px-4 text-foreground font-semibold text-sm">${batch.highest_bid || 0}</td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">${batch.lowest_bid || 0}</td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">{batch.total_bids}</td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal(batch.bids)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            查看 Bids
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg w-3/4 max-w-2xl p-6 relative">
              <Button
                variant="ghost"
                className="absolute top-4 right-4"
                onClick={closeModal}
              >
                <X className="w-5 h-5" />
              </Button>
              <h2 className="text-xl font-bold mb-4">Bid Details</h2>
              {selectedBids.length > 0 ? (
                <table className="w-full border border-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="py-2 px-3 border-b">Buyer Company</th>
                      <th className="py-2 px-3 border-b">Amount</th>
                      <th className="py-2 px-3 border-b">Submitted At</th>
                      <th className="py-2 px-3 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBids.map((bid) =>
                      bid.buyer_bids.length > 0 ? (
                        bid.buyer_bids.map((buyer) => (
                          <tr key={buyer.buyer_bid_id}>
                            <td className="py-2 px-3 border-b">{buyer.company_name}</td>
                            <td className="py-2 px-3 border-b">${buyer.amount}</td>
                            <td className="py-2 px-3 border-b">{new Date(buyer.submitted_at).toLocaleString()}</td>
                            <td className="py-2 px-3 border-b">{buyer.status}</td>
                          </tr>
                        ))
                      ) : (
                        <tr key={bid.bid_id}>
                          <td colSpan={4} className="py-2 px-3 text-center">
                            No bids yet
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              ) : (
                <p>No bids yet</p>
              )}
            </div>
          </div>
        )}
      </div>


    </DashboardLayout>
  );
};

export default Bids;
