import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Package,
  Gavel,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Clock,
  CreditCard,
} from "lucide-react";
import { useGetBuyerBidsQuery } from "@/rtk/slices/buyerApiSlice";
import { useTranslation } from "react-i18next";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
};

/* ─── Payment Badge ──────────────────────────────────────────── */
const PaymentBadge = ({ step }: { step: number }) => {
  if (step <= 5)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <Clock className="w-3.5 h-3.5" />
        Payment Pending
      </span>
    );

  if (step === 6)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
        <CreditCard className="w-3.5 h-3.5" />
        Payment Submitted
      </span>
    );

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
      <CheckCircle2 className="w-3.5 h-3.5" />
      Payment Confirmed
    </span>
  );
};

/* ─── Pagination ─────────────────────────────────────────────── */
const Pagination = ({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="h-9 w-9 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          size="sm"
          className="h-9 min-w-9"
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="h-9 w-9 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
const WinningBids: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const buyerId = Number(localStorage.getItem("userId") || 0);
  const [page, setPage] = useState(1);

  const { data: bidsData, isLoading } = useGetBuyerBidsQuery({
    buyerId,
    page,
    limit: 10,
    status: "accepted",
  });

  const bids = Array.isArray(bidsData?.data?.data) ? bidsData.data.data : [];
  const totalPages = bidsData?.data?.pagination?.totalPages ?? 1;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-10 bg-gradient-to-b from-primary to-accent rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-warning" />
            {t("buyerDashboard.winningBids") || "Winning Bids"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("buyerDashboard.winningBidsSubtitle") || "Bids you have won in auctions"}
          </p>
        </div>
      </div>

      {/* Content */}
      {bids.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <Trophy className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">
            {t("buyerDashboard.noWinningBids") || "No winning bids yet"}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {t("buyerDashboard.noWinningBidsDesc") || "Your accepted bids will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bids.map((bid: any) => {
            const products = Array.isArray(bid?.products) ? bid.products : [];
            const firstProduct = products[0];
            const step = Number(bid.batch_step ?? 5);

            return (
              <Card
                key={bid.buyer_bid_id ?? `${bid.batch_id}-${bid.bid_date}`}
                className="border border-border hover:border-warning/40 transition-colors overflow-hidden"
              >
                <CardContent className="p-4 relative">
                  {/* ── Main Content ── */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-foreground text-sm">
                          Batch #{bid.batch_id}
                        </span>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          <Trophy className="w-3 h-3 mr-1" />
                          {t("buyerDashboard.won") || "Won"}
                        </Badge>
                        <PaymentBadge step={step} />
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {firstProduct?.title || t("buyerDashboard.noProductTitle") || "—"}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Gavel className="w-3.5 h-3.5" />
                          {t("buyer.bidAmount") || "Bid Amount"}: {bid.bid_amount ?? "-"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {t("buyerDashboard.bidDate") || "Bid Date"}: {formatDate(bid.bid_date)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                      onClick={() => navigate(`/buyer-dashboard/batch/${bid.batch_id}`)}
                    >
                      {t("buyerDashboard.viewBatch") || "View Batch"}
                    </Button>
                  </div>

                  {/* ── Products list ── */}
                  {products.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/60">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {products.map((product: any, idx: number) => {
                          const img = Array.isArray(product?.images) ? product.images[0] : undefined;
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-2"
                            >
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  className="w-10 h-10 object-cover rounded border border-border flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded border border-border bg-muted flex items-center justify-center flex-shrink-0">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {product.title || "—"}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default WinningBids;
