// @ts-nocheck
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Gavel, ShoppingBag, Tag } from "lucide-react";
import { SellerAuctionBidsPanel } from "./SellerBidDashboard";
import { SellerBuyNowOrdersPanel, SellerNegotiatedOffersPanel } from "./SellerOffersOrders";

const TAB_IDS = ["auction-bids", "negotiated-offers", "buy-now-orders"] as const;
type BuyerActivityTab = (typeof TAB_IDS)[number];

function parseTab(raw: string | null): BuyerActivityTab {
  if (raw === "negotiated-offers" || raw === "buy-now-orders") return raw;
  return "auction-bids";
}

export default function SellerBuyerActivity() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));
  const sellerId = localStorage.getItem("userId") || "";

  const setTab = (tab: BuyerActivityTab) => {
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4 lg:p-6 animate-in fade-in-50 duration-500">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-7 bg-gradient-to-b from-accent to-accent-light rounded-full" />
            <h1 className="text-3xl font-bold text-foreground">{t("buyerActivity.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-3">{t("buyerActivity.subtitle")}</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setTab(v as BuyerActivityTab)}>
          <div className="bg-muted/30 border border-border rounded-t-lg">
            <TabsList className="h-auto w-full justify-start bg-transparent p-0 px-2 gap-1 flex-wrap">
              <TabsTrigger
                value="auction-bids"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium gap-2 bg-transparent",
                  "data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  "data-[state=inactive]:text-muted-foreground hover:text-foreground transition-colors"
                )}
              >
                <Gavel className="h-4 w-4" />
                {t("buyerActivity.tabs.auctionBids")}
              </TabsTrigger>
              <TabsTrigger
                value="negotiated-offers"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium gap-2 bg-transparent",
                  "data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  "data-[state=inactive]:text-muted-foreground hover:text-foreground transition-colors"
                )}
              >
                <Tag className="h-4 w-4" />
                {t("buyerActivity.tabs.negotiatedOffers")}
              </TabsTrigger>
              <TabsTrigger
                value="buy-now-orders"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium gap-2 bg-transparent",
                  "data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  "data-[state=inactive]:text-muted-foreground hover:text-foreground transition-colors"
                )}
              >
                <ShoppingBag className="h-4 w-4" />
                {t("buyerActivity.tabs.buyNowOrders")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="auction-bids" className="mt-0 border border-t-0 border-border rounded-b-lg overflow-hidden bg-background">
            <SellerAuctionBidsPanel />
          </TabsContent>

          <TabsContent value="negotiated-offers" className="mt-0 border border-t-0 border-border rounded-b-lg overflow-hidden bg-background">
            <SellerNegotiatedOffersPanel sellerId={sellerId} />
          </TabsContent>

          <TabsContent value="buy-now-orders" className="mt-0 border border-t-0 border-border rounded-b-lg overflow-hidden bg-background">
            <SellerBuyNowOrdersPanel sellerId={Number(sellerId)} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
