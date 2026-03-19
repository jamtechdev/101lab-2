// @ts-nocheck
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Package,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowUpRight,
  Calendar,
  FileText,
  Sparkles,
  Clock,
  Image as ImageIcon,
  Tag
} from "lucide-react";

import { useGetSellerBidsQuery } from "@/rtk/slices/batchApiSlice";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const PLACEHOLDER_IMG = "/placeholder.png";

const SellerBidDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Use companySellerId for data (company-level), fallback to userId
  const userId = localStorage.getItem("companySellerId") || localStorage.getItem("userId");
  const [page, setPage] = useState(1);
  const limit = 10;


  const { data, isLoading, isError } = useGetSellerBidsQuery({
    userId,
    page,
    limit,
  },
    // {
    //   pollingInterval: 1000,
    // }

  );


  const sellerBids = data?.data || [];
  const summary = data?.summary || {};
  const dashboardData = data?.dashboardSummary || {}


  // Expand/collapse logic
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (id: number) => {
    const updated = new Set(expanded);
    updated.has(id) ? updated.delete(id) : updated.add(id);
    setExpanded(updated);
  };

  const safeArray = <T,>(arr: any): T[] => (Array.isArray(arr) ? arr : []);

  // Summary items
  const summaryItems = [
    {
      key: "total",
      label: t('sellerBidDashboard.totalBids'),
      value: dashboardData.total_bids,
      icon: Package,
      color: "info",
      iconBg: "bg-info/10",
      iconColor: "text-info",
    },
    {
      key: "pending",
      label: t('sellerBidDashboard.activeBids'),
      value: dashboardData.pending,
      icon: TrendingUp,
      color: "accent",
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
    },
    {
      key: "accepted",
      label: t('sellerBidDashboard.acceptedBids'),
      value: dashboardData.accepted,
      icon: CheckCircle2,
      color: "success",
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      key: "rejected",
      label: t('sellerBidDashboard.rejected'),
      value: dashboardData.rejected,
      icon: XCircle,
      color: "destructive",
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
    },
  ];

  const maxValue = Math.max(...summaryItems.map((i) => i.value ?? 0));

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-7 bg-gradient-to-b from-accent to-accent-light rounded-full"></div>
              <h1 className="text-3xl font-bold text-foreground">{t('sellerBidDashboard.title')}</h1>

            </div>
            <p className="text-sm text-muted-foreground ml-3">
              {t('sellerBidDashboard.subtitle')}
            </p>
          </div>
        </div>

        {/* SUMMARY SECTION */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryItems.map((item, index) => {
              const Icon = item.icon;
              const isHighlight = item.value === maxValue && maxValue > 0;
              const getHoverClass = () => {
                switch (item.color) {
                  case 'info': return 'hover:bg-info/5';
                  case 'accent': return 'hover:bg-accent/5';
                  case 'success': return 'hover:bg-success/5';
                  case 'destructive': return 'hover:bg-destructive/5';
                  default: return '';
                }
              };

              return (
                <Card
                  key={item.key}
                  className={`group relative overflow-hidden border-border/50 hover:border-border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${getHoverClass()}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="relative p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                      {item.label}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.iconBg} ${item.iconColor} group-hover:scale-110 transition-transform duration-300 shadow-sm flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className={`text-3xl font-bold group-hover:scale-105 transition-transform duration-300 ${isHighlight ? "text-accent" : "text-foreground"
                        }`}>
                        {item.value ?? 0}
                      </h3>
                      {isHighlight && (
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse ml-auto"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ---------------- LOADING ---------------- */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-accent-light rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">{t('sellerBidDashboard.loading')}</p>
          </div>
        )}

        {/* ---------------- ERROR ---------------- */}
        {isError && (
          <Card className="border-border/50">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t('sellerBidDashboard.errorTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('sellerBidDashboard.errorMessage')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---------------- EMPTY ---------------- */}
        {!isLoading && sellerBids.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t('sellerBidDashboard.noBidsTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('sellerBidDashboard.noBidsMessage')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---------------- LIST ---------------- */}
        {sellerBids.map((batch: any) => {
          const products = safeArray<any>(batch.products);
          const firstProduct = products[0] || null;
          const firstImage = firstProduct?.images?.[0] ?? PLACEHOLDER_IMG;
          const isExpanded = expanded.has(batch.batch_id);
          const productCount = products.length;
          const totalBids = batch.summary?.total ?? 0;
          const acceptedBids = batch.summary?.accepted ?? 0;
          const pendingBids = batch.summary?.pending ?? 0;

          return (
            <Card
              key={batch.batch_id}
              className="border-border/50 hover:border-border transition-all duration-200 hover:shadow-md group"
            >
              <CardContent className="p-0">
                {/* HEADER */}
                <div
                  className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => toggle(batch.batch_id)}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* LEFT SECTION - Main Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* PRODUCT IMAGE */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={firstImage}
                          alt="product"
                          className="w-20 h-20 object-cover rounded-lg border border-border/50 group-hover:border-accent transition-colors"
                        />
                        {productCount > 1 && (
                          <div className="absolute -top-2 -right-2 bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                            {productCount}
                          </div>
                        )}
                      </div>

                      {/* MAIN INFO */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/upload?step=${batch?.batch_step}&batchId=${batch.batch_id}&finalStep=${batch?.batch_step}`);
                            }}
                            className="font-semibold text-lg text-accent hover:text-accent-dark underline hover:no-underline transition-colors cursor-pointer"
                          >
                            {t('sellerBidDashboard.batchPrefix')}{batch.batch_id}
                          </button>
                          <Badge
                            variant="outline"
                            className="bg-accent/10 text-accent border-accent/20 text-xs"
                          >
                            {batch.status}
                          </Badge>
                        </div>

                        <p className="text-sm text-foreground font-medium line-clamp-1">
                          {firstProduct?.title || t('sellerBidDashboard.noProductTitle')}
                        </p>

                        {/* Detailed Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                            <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">{t('sellerBidDashboard.products')}</div>
                              <div className="text-sm font-semibold text-foreground">{productCount}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                            <TrendingUp className="w-4 h-4 text-accent flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">{t('sellerBidDashboard.totalBids')}</div>
                              <div className="text-sm font-semibold text-accent">{totalBids}</div>
                            </div>
                          </div>

                          {acceptedBids > 0 && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10">
                              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs text-muted-foreground">Accepted</div>
                                <div className="text-sm font-semibold text-success">{acceptedBids}</div>
                              </div>
                            </div>
                          )}

                          {pendingBids > 0 && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10">
                              <Clock className="w-4 h-4 text-warning flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs text-muted-foreground">Pending</div>
                                <div className="text-sm font-semibold text-warning">{pendingBids}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SECTION - Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0 w-full lg:w-auto">
                      {/* EXPAND ICON */}
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>

                      {/* VIEW BIDS BUTTON */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-accent/20 hover:border-accent hover:bg-accent/5 flex-1 lg:flex-initial"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/bid/batch/${batch.batch_id}`);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {t('sellerBidDashboard.viewBids')}
                        <ArrowUpRight className="w-3.5 h-3.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* EXPANDED SECTION */}
                {isExpanded && (
                  <div className="border-t border-border/50 bg-muted/20 p-4 sm:p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-semibold text-foreground">{t('sellerBidDashboard.productsCount', { count: productCount })}</h4>
                    </div>

                    {/* If no products */}
                    {productCount === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">{t('sellerBidDashboard.noProducts')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((prod: any, idx: number) => {
                          const images = safeArray<string>(prod.images);
                          const img = images[0] ?? PLACEHOLDER_IMG;
                          const imageCount = images.length;

                          return (
                            <Card
                              key={idx}
                              className="group border-border/50 hover:border-accent/50 transition-all duration-200 hover:shadow-md overflow-hidden bg-card"
                            >
                              {/* Image Section */}
                              <div className="relative aspect-square overflow-hidden bg-muted/30">
                                <img
                                  src={img}
                                  alt={prod.title || "Product"}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />

                                {/* Image Count Badge */}
                                {imageCount > 1 && (
                                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white rounded-full px-2 py-1 flex items-center gap-1.5 text-xs font-medium">
                                    <ImageIcon className="w-3 h-3" />
                                    <span>{imageCount}</span>
                                  </div>
                                )}

                                {/* Product Number Badge */}
                                <div className="absolute top-2 left-2 bg-accent text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg">
                                  #{idx + 1}
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors duration-200"></div>
                              </div>

                              {/* Content Section */}
                              <div className="p-4 space-y-3">
                                {/* Title */}
                                <div>
                                  <h5 className="font-semibold text-foreground text-base line-clamp-2 group-hover:text-accent transition-colors">
                                    {prod.title || t('sellerBidDashboard.untitledProduct')}
                                  </h5>
                                </div>

                                {/* Category and Details */}
                                <div className="space-y-2">
                                  {prod.category && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span className="line-clamp-1">{prod.category}</span>
                                    </div>
                                  )}

                                  {/* Additional Info Row */}
                                  <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                                    {imageCount > 0 && (
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        <span>{imageCount} {imageCount === 1 ? t('sellerBidDashboard.image') : t('sellerBidDashboard.images')}</span>
                                      </div>
                                    )}
                                    {prod.condition && (
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Package className="w-3.5 h-3.5" />
                                        <span>{prod.condition}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border-border/50"
          >
            {t('sellerBidDashboard.previous')}
          </Button>

          <span className="text-sm font-medium text-muted-foreground">
            {t('sellerBidDashboard.page')} <span className="font-semibold text-foreground">{page}</span> {t('sellerBidDashboard.of')} <span className="font-semibold text-foreground">{data.pagination.totalPages}</span>
          </span>

          <Button
            variant="outline"
            disabled={page >= (data.pagination.totalPages || 1)}
            onClick={() => setPage((p) => p + 1)}
            className="border-border/50"
          >
            {t('sellerBidDashboard.next')}
          </Button>
        </div>
      )}

    </DashboardLayout>
  );
};

export default SellerBidDashboard;
