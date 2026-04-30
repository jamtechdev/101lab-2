// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Star, Clock, BadgeCheck, X, Send, Loader2, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/common/Header";
import { useGetPublicWantedRequestsQuery, useSubmitProductRequestMutation } from "@/rtk/slices/adminApiSlice";
import { useGetUserProfileQuery } from "@/rtk/slices/apiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import { formatDistanceToNow } from "date-fns";
import Footer from "@/components/common/Footer";

// ── Contact / Post-a-Wanted modal ────────────────────────────────────────────
function RequestModal({
  open,
  onClose,
  prefillCategory = "",
  prefillMessage = "",
  mode = "post",
}: {
  open: boolean;
  onClose: () => void;
  prefillCategory?: string;
  prefillMessage?: string;
  mode?: "post" | "contact";
}) {
  const { t } = useTranslation();
  const userId = localStorage.getItem("userId");
  const { data: profileData } = useGetUserProfileQuery(userId!, { skip: !userId });
  const [submitRequest, { isLoading }] = useSubmitProductRequestMutation();
  const [submitted, setSubmitted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: prefillCategory,
    message: prefillMessage,
  });

  useEffect(() => {
    if (!profileData?.data) return;
    const u = profileData.data;
    const fullName =
      u.personalInfo?.firstName && u.personalInfo?.lastName
        ? `${u.personalInfo.firstName} ${u.personalInfo.lastName}`.trim()
        : u.displayName || "";
    setForm((prev) => ({
      ...prev,
      name: fullName || prev.name,
      email: u.email || prev.email,
      phone: u.personalInfo?.phone || prev.phone,
    }));
  }, [profileData]);

  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setForm((prev) => ({ ...prev, category: prefillCategory, message: prefillMessage }));
    }
  }, [open, prefillCategory, prefillMessage]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toastError(t("wanted.postModal.nameEmailRequired"));
      return;
    }
    try {
      await submitRequest({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        category: form.category || undefined,
        message: form.message || undefined,
        user_id: userId || null,
      }).unwrap();
      setSubmitted(true);
      toastSuccess(t("wanted.postModal.successToast"));
    } catch (err: any) {
      toastError(err?.data?.message || t("wanted.postModal.nameEmailRequired"));
    }
  };

  if (!open) return null;

  const title = mode === "contact" ? t("wanted.postModal.contactTitle") : t("wanted.postModal.title");

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-border max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {submitted ? (
            <div className="text-center py-10 space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {t("wanted.postModal.submitted")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {t("wanted.postModal.submittedMsg")}
              </p>
              <Button variant="outline" size="sm" onClick={onClose}>{t("wanted.postModal.close")}</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground">
                  {mode === "contact" ? t("wanted.postModal.canSupply") : t("wanted.postModal.whatLooking")}
                  <span className="text-muted-foreground font-normal ml-1">{t("wanted.postModal.optional")}</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder={t("wanted.postModal.messagePlaceholder")}
                  rows={4}
                  className="text-sm resize-none w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground">
                  {t("wanted.postModal.category")}
                  <span className="text-muted-foreground font-normal ml-1">{t("wanted.postModal.optional")}</span>
                </label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  placeholder={t("wanted.postModal.categoryPlaceholder")}
                  className="h-9 text-sm"
                />
              </div>

              <div className="border-t border-border" />
              <p className="text-xs font-semibold text-foreground">{t("wanted.postModal.contactDetails")}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-muted-foreground">
                    {t("wanted.postModal.name")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder={t("wanted.postModal.namePlaceholder")}
                    className="h-9 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-muted-foreground">
                    {t("wanted.postModal.email")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="h-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted-foreground">
                  {t("wanted.postModal.phone")}
                  <span className="ml-1 font-normal text-muted-foreground">{t("wanted.postModal.optional")}</span>
                </label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder={t("wanted.postModal.phonePlaceholder")}
                  className="h-9 text-sm"
                />
              </div>

              {!!userId && (
                <div className="flex items-center gap-1.5 text-[11px] text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {t("wanted.postModal.autofilled")}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                {isLoading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("wanted.postModal.submitting")}</>
                  : <><Send className="w-4 h-4 mr-2" />{t("wanted.postModal.submit")}</>
                }
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, onContact }: { item: any; onClose: () => void; onContact: () => void }) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const timeAgo = item?.createdAt
    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
    : "";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 border-0">
            {item.category}
          </Badge>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground leading-snug">{item.title}</h2>
            <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
              <Clock className="w-3 h-3" />{timeAgo}
            </span>
          </div>

          {item.description && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.description}</p>
          )}

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {item.posted_by === "admin" ? (
                <><BadgeCheck className="w-4 h-4 text-primary" /><span className="text-primary font-medium">{t("wanted.postedBy101Lab")}</span></>
              ) : item.is_verified ? (
                <><BadgeCheck className="w-4 h-4 text-green-600" /><span className="text-green-700 font-medium">{t("wanted.buyerVerified")}</span></>
              ) : null}
            </div>
            <Button onClick={onContact} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm px-5 h-9">
              {t("wanted.contact")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function WantedCardSkeleton() {
  return (
    <div className="border border-border rounded-xl p-5 space-y-3 animate-pulse bg-card">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-muted rounded-full" />
        <div className="h-4 w-16 bg-muted rounded" />
      </div>
      <div className="h-5 w-3/4 bg-muted rounded" />
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-5/6 bg-muted rounded" />
      </div>
      <div className="border-t border-border pt-3 flex items-center justify-between">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-8 w-20 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WantedPage() {
  const { t, i18n } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput === debouncedSearch) return;
      setDebouncedSearch(searchInput);
      const p = new URLSearchParams(searchParams);
      if (searchInput) p.set("search", searchInput); else p.delete("search");
      p.delete("page");
      setSearchParams(p);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    const p = new URLSearchParams(searchParams);
    if (cat !== "all") p.set("category", cat); else p.delete("category");
    p.delete("page");
    setSearchParams(p);
  };

  const handlePageChange = useCallback((page: number) => {
    const p = new URLSearchParams(searchParams);
    if (page === 1) p.delete("page"); else p.set("page", String(page));
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchParams, setSearchParams]);

  const { data, isLoading } = useGetPublicWantedRequestsQuery({
    search: debouncedSearch || undefined,
    category: activeCategory !== "all" ? activeCategory : undefined,
    page: currentPage,
    limit: 12,
  });

  // Pick translated field based on current language, fall back to EN
  const pickLang = (item: any, field: string) => {
    const lang = i18n.language;
    if (lang === "zh" || lang === "zh-TW") return item[`${field}_zh`] || item[field];
    if (lang === "ja") return item[`${field}_ja`] || item[field];
    if (lang === "th") return item[`${field}_th`] || item[field];
    return item[field];
  };

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const [allCategories, setAllCategories] = useState<string[]>([]);
  const { data: allData } = useGetPublicWantedRequestsQuery({ limit: 100 });
  useEffect(() => {
    if (!allData?.data) return;
    const cats = [...new Set(allData.data.map((r) => pickLang(r, "category")).filter(Boolean))];
    setAllCategories(cats);
  }, [allData, i18n.language]);

  const [postOpen, setPostOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [contactItem, setContactItem] = useState<any>(null);

  const handleContact = (item: any) => {
    setDetailItem(null);
    setContactItem(item);
  };

  const generatePageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-b from-[#e8f5e9] to-background pt-12 pb-10 px-4">
        <div className="container mx-auto max-w-3xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-widest">
            <Star className="w-3.5 h-3.5 fill-primary" />
            {t("wanted.badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            {t("wanted.heading")}
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            {t("wanted.subheading")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("wanted.searchPlaceholder")}
                className="pl-10 h-11 bg-white shadow-sm border-border"
              />
            </div>
            <Button
              onClick={() => setPostOpen(true)}
              className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 flex-shrink-0"
            >
              {t("wanted.postButton")} →
            </Button>
          </div>

          {allCategories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => handleCategoryClick("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  activeCategory === "all"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {t("wanted.all")}
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-foreground border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Listings */}
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex items-center gap-2 mb-6">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <h2 className="text-xl font-bold text-foreground">{t("wanted.openRequests")}</h2>
          {!isLoading && (
            <span className="text-sm text-muted-foreground ml-1">
              {total} {t("wanted.listingsFound")}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <WantedCardSkeleton key={i} />)}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <p className="text-muted-foreground">{t("wanted.noRequests")}</p>
            <Button variant="outline" onClick={() => setPostOpen(true)}>
              {t("wanted.beFirst")}
            </Button>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => {
                const timeAgo = item.createdAt
                  ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                  : "";
                return (
                  <div
                    key={item.id}
                    className="border border-border rounded-xl p-5 bg-card hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3"
                    onClick={() => setDetailItem({
                      ...item,
                      category: pickLang(item, "category") || "General",
                      title: pickLang(item, "search_query") || (item.message ? item.message.substring(0, 80) : "Equipment Wanted"),
                      description: pickLang(item, "message") || "",
                    })}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[11px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border-0">
                        {pickLang(item, "category") || "General"}
                      </Badge>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />{timeAgo}
                      </span>
                    </div>

                    <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                      {pickLang(item, "search_query") || (item.message ? item.message.substring(0, 80) : "Equipment Wanted")}
                    </h3>

                    {(pickLang(item, "message") || item.message) && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{pickLang(item, "message")}</p>
                    )}

                    <div className="mt-auto border-t border-border pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {item.posted_by === "admin" ? (
                          <><BadgeCheck className="w-3.5 h-3.5 text-primary" /><span className="text-primary font-medium">{t("wanted.postedBy101Lab")}</span></>
                        ) : item.is_verified ? (
                          <><BadgeCheck className="w-3.5 h-3.5 text-green-600" /><span className="text-green-700">{t("wanted.buyerVerified")}</span></>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-4 text-xs border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleContact({
                          ...item,
                          category: pickLang(item, "category") || "General",
                          title: pickLang(item, "search_query") || "",
                        }); }}
                      >
                        {t("wanted.contact")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between py-8 mt-4">
                <div className="text-sm text-muted-foreground">
                  {t("wanted.page")} {currentPage} {t("wanted.of")} {totalPages} ({total} {t("wanted.requests")})
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)} className="h-9 w-9 p-0">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {generatePageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span key={i} className="px-3 py-2 text-muted-foreground">...</span>
                    ) : (
                      <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm" onClick={() => handlePageChange(p as number)} className="h-9 min-w-9">
                        {p}
                      </Button>
                    )
                  )}
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)} className="h-9 w-9 p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <RequestModal open={postOpen} onClose={() => setPostOpen(false)} mode="post" />

      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onContact={() => handleContact(detailItem)}
        />
      )}

      {contactItem && (
        <RequestModal
          open={!!contactItem}
          onClose={() => setContactItem(null)}
          prefillCategory={contactItem.category}
          prefillMessage={`I can supply: ${contactItem.title}`}
          mode="contact"
        />
      )}

      <Footer />
    </div>
  );
}
