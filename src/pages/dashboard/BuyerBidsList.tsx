import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetBuyerBidsQuery } from "@/rtk/slices/bidApiSlice";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Users, CheckCircle2, Clock, XCircle, Award,
  Mail, Phone, MapPin, Building2, ChevronDown, ChevronUp,
  FileText, Scale, Package,
} from "lucide-react";
import { format } from "date-fns";

type FilterStatus = "all" | "accepted" | "pending" | "rejected";

const BuyerBidsList = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetBuyerBidsQuery(batchId);

  
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Status config built with translated labels
  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    accepted: {
      label: t("buyerBidsList.statusAccepted"),
      color: "bg-green-100 text-green-800 border-green-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    pending: {
      label: t("buyerBidsList.statusPending"),
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: <Clock className="w-3 h-3" />,
    },
    rejected: {
      label: t("buyerBidsList.statusRejected"),
      color: "bg-red-100 text-red-800 border-red-200",
      icon: <XCircle className="w-3 h-3" />,
    },
  };

  if (isLoading)
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );

  if (isError)
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <XCircle className="w-12 h-12 text-destructive" />
          <p className="text-muted-foreground">{t("buyerBidsList.loadError")}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> {t("buyerBidsList.goBack")}
          </Button>
        </div>
      </DashboardLayout>
    );

  const allBids = data?.data?.buyer_bids || [];
  const total = allBids.length;
  const accepted = allBids.filter((b) => b.status === "accepted").length;
  const pending = allBids.filter((b) => b.status === "pending").length;
  const rejected = allBids.filter((b) => b.status === "rejected").length;

  const filtered = filter === "all" ? allBids : allBids.filter((b) => b.status === filter);
  const winnerBid = allBids.find((b) => b.status === "accepted");

  const filterTabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all", label: t("buyerBidsList.allBids"), count: total },
    { key: "accepted", label: t("buyerBidsList.statusAccepted"), count: accepted },
    { key: "pending", label: t("buyerBidsList.statusPending"), count: pending },
    { key: "rejected", label: t("buyerBidsList.statusRejected"), count: rejected },
  ];

  const tableTitle =
    filter === "all"
      ? t("buyerBidsList.allBids")
      : `${filter.charAt(0).toUpperCase() + filter.slice(1)} ${t("buyerBidsList.bids")}`;

  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> {t("buyerBidsList.back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("buyerBidsList.title")} <span className="text-primary">#{batchId}</span>
            </h1>
            {/* <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/upload?step=${batch?.batch_step}&batchId=${batch.batch_id}&finalStep=${batch?.batch_step}`);
              }}
              className="font-semibold text-lg text-accent hover:text-accent-dark underline hover:no-underline transition-colors cursor-pointer"
            >
              {t('sellerBidDashboard.batchPrefix')}{batch.batch_id}
            </button> */}
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("buyerBidsList.subtitle")}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{total}</p>
                  <p className="text-xs text-muted-foreground">{t("buyerBidsList.totalBids")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{accepted}</p>
                  <p className="text-xs text-muted-foreground">{t("buyerBidsList.statusAccepted")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pending}</p>
                  <p className="text-xs text-muted-foreground">{t("buyerBidsList.statusPending")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rejected}</p>
                  <p className="text-xs text-muted-foreground">{t("buyerBidsList.statusRejected")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Winner highlight */}
        {winnerBid && (
          <Card className="border-green-400 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    {t("buyerBidsList.winner")}: {winnerBid.company_name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {winnerBid.buyer?.display_name} &bull; {winnerBid.buyer?.user_email} &bull;{" "}
                    {t("buyerBidsList.winningBid")}: ${Number(winnerBid.amount).toLocaleString()}
                  </p>
                </div>
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                  ${Number(winnerBid.amount).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {filterTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab.key)}
              className="gap-2"
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.key ? "bg-white/20" : "bg-muted"
                }`}>
                {tab.count}
              </span>
            </Button>
          ))}
        </div>

        {/* Bids table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {tableTitle}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filtered.length}{" "}
                {filtered.length !== 1 ? t("buyerBidsList.results") : t("buyerBidsList.result")})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <Users className="w-8 h-8" />
                <p>{t("buyerBidsList.noBidsFound")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>{t("buyerBidsList.company")}</TableHead>
                    <TableHead>{t("buyerBidsList.buyer")}</TableHead>
                    <TableHead>{t("buyerBidsList.country")}</TableHead>
                    <TableHead>{t("buyerBidsList.type")}</TableHead>
                    <TableHead className="text-right">{t("buyerBidsList.amount")}</TableHead>
                    <TableHead>{t("buyerBidsList.submitted")}</TableHead>
                    <TableHead>{t("buyerBidsList.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered
                    .slice()
                    .sort((a, b) => Number(b.amount) - Number(a.amount))
                    .map((bid) => {
                      const isExpanded = expandedId === bid.buyer_bid_id;
                      const statusCfg = statusConfig[bid.status] || statusConfig.pending;
                      const isWinner = bid.status === "accepted";

                      return (
                        <>
                          <TableRow
                            key={bid.buyer_bid_id}
                            className={`cursor-pointer hover:bg-muted/50 transition-colors ${isWinner ? "bg-green-50/50 dark:bg-green-900/10" : ""
                              }`}
                            onClick={() => setExpandedId(isExpanded ? null : bid.buyer_bid_id)}
                          >
                            <TableCell>
                              {isExpanded
                                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {isWinner && <Award className="w-4 h-4 text-green-600 shrink-0" />}
                                <span className="font-medium">{bid.company_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {bid.buyer?.display_name || bid.contact_person || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {bid.country || bid.buyer?.country || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {bid.quotation_types?.includes("whole_item") && (
                                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                    <Package className="w-3 h-3" /> {t("buyerBidsList.wholeItem")}
                                  </span>
                                )}
                                {bid.quotation_types?.includes("weight_based") && (
                                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                    <Scale className="w-3 h-3" /> {t("buyerBidsList.weightBased")}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {bid.quotation_types?.includes("whole_item")
                                ? `$${Number(bid.amount).toLocaleString()}`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(bid.submitted_at), "MMM d, yyyy")}
                              <div className="text-xs">{format(new Date(bid.submitted_at), "h:mm a")}</div>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${statusCfg.color}`}>
                                {statusCfg.icon} {statusCfg.label}
                              </span>
                            </TableCell>
                          </TableRow>

                          {/* Expanded buyer details */}
                          {isExpanded && (
                            <TableRow key={`${bid.buyer_bid_id}-expanded`} className="bg-muted/30">
                              <TableCell colSpan={8} className="py-4 px-6">
                                <div className="grid md:grid-cols-3 gap-6">

                                  {/* Buyer info */}
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                      {t("buyerBidsList.buyerDetails")}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                      <span>{bid.buyer?.company || bid.company_name || "-"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                                      <a href={`mailto:${bid.buyer?.user_email}`} className="text-primary hover:underline">
                                        {bid.buyer?.user_email || "-"}
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                                      <span>{bid.buyer?.phone || bid.buyer?.meta?.billing_phone || "-"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                                      <span>{bid.buyer?.country || bid.country || "-"}</span>
                                    </div>
                                    {bid.buyer?.experience && (
                                      <div className="text-sm text-muted-foreground">
                                        {t("buyerBidsList.experience")}: {bid.buyer.experience} {t("buyerBidsList.years")}
                                      </div>
                                    )}
                                  </div>

                                  {/* Bid details */}
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                      {t("buyerBidsList.bidDetails")}
                                    </p>
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">{t("buyerBidsList.bidId")}: </span>
                                      <span className="font-mono font-medium">#{bid.buyer_bid_id}</span>
                                    </div>
                                    {bid.quotation_types?.includes("whole_item") && (
                                      <div className="text-sm">
                                        <span className="text-muted-foreground">{t("buyerBidsList.wholeItemPrice")}: </span>
                                        <span className="font-semibold">${Number(bid.amount).toLocaleString()}</span>
                                      </div>
                                    )}
                                    {bid.quotation_types?.includes("weight_based") && bid.weight_quotations && (
                                      <div className="text-sm">
                                        <p className="text-muted-foreground mb-1">{t("buyerBidsList.weightQuotations")}:</p>
                                        <div className="space-y-1 ml-2">
                                          {Object.entries(bid.weight_quotations ?? {}).map(([key, value]) => (
                                            <div key={key} className="flex justify-between">
                                              <span className="text-muted-foreground">{key}:</span>
                                              <span className="font-medium">{String(value)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {bid.notes && (
                                      <div className="text-sm">
                                        <span className="text-muted-foreground">{t("buyerBidsList.notes")}: </span>
                                        <span>{bid.notes}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Document & company info */}
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                      {t("buyerBidsList.documentsInfo")}
                                    </p>
                                    {bid.document_image_url ? (
                                      <a
                                        href={bid.document_image_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                      >
                                        <FileText className="w-4 h-4" /> {t("buyerBidsList.viewDocument")}
                                      </a>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">{t("buyerBidsList.noDocument")}</p>
                                    )}
                                    {bid.buyer?.companyDetail && (
                                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-4">
                                        {bid.buyer.companyDetail}
                                      </p>
                                    )}
                                  </div>

                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default BuyerBidsList;
