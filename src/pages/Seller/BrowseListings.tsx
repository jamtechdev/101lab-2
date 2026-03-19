import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, MapPin, Grid3X3, LayoutList, Search, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useBrowseListingsQuery, useGetNetworkBatchesQuery } from "@/rtk/slices/batchApiSlice";
import { useGetMySellerNetworksQuery } from "@/rtk/slices/sellerNetworkSlice";
import Pagination from "@/components/common/Pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SITE_TYPE } from "@/config/site";

type Listing = {
  product_id: number;
  title: string;
  slug: string;
  description: string;
  status: string;
  image1: string | null;
  categories: Array<{
    term: string | null;
    term_slug: string | null;
  }>;
  meta: Array<{
    meta_key: string;
    meta_value: string;
  }>;
};

const CATEGORIES = [
  "Furniture",
  "Business & Industrial",
  "CSI Master Format",
  "Home & Garden",
  "Hardware",
  "Office Supplies",
  "Electronics",
  "Miscellaneous",
  "Arts & Entertainment",
  "Manufacturing & Industrial",
  "Sporting Goods",
  "Apparel & Accessories",
];


const PlaceholderImg = () => (
  <div className="w-full aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
    <div className="w-20 h-20 rounded-lg bg-background/70 border border-border flex items-center justify-center text-muted-foreground">
      <Grid3X3 className="w-8 h-8" />
    </div>
  </div>
);

export default function BrowseListings() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<string>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    condition: "any",
    location: "",
    minPrice: "",
    maxPrice: "",
  });
  const navigate = useNavigate();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Get selected organization from URL params
  const selectedOrganization = searchParams.get('org') || 'all';

  // Get user's accepted network invitations (organizations they've joined)
  const { data: networkData } = useGetMySellerNetworksQuery({
    status: "active"
  });

  // Create organization options
  const organizationOptions = [
    { id: 'all', name: t('browseListings.allOrganizations'), sellerId: null },
    ...(networkData?.success ? networkData.data
      .filter((network: any) => network.status === 'active')
      .map((network: any) => ({
        id: network.main_seller_id.toString(),
        name: network.mainSeller?.display_name || network.mainSeller?.user_email || 'Unknown Organization',
        sellerId: network.main_seller_id
      })) : []
    )
  ];

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Use network query when organization is selected, otherwise use regular browse query
  const isNetworkQuery = selectedOrganization !== 'all';

  const browseQuery = useBrowseListingsQuery({
    type: SITE_TYPE,
    page: currentPage,
    limit: 12,
    category: selectedCategory || undefined,
    search: debouncedSearchTerm || undefined,
    condition: filters.condition === "any" ? undefined : filters.condition,
    location: filters.location || undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    sort: sort,
    main_seller_id: selectedOrganization === 'all' ? undefined : selectedOrganization,
    user_id: selectedOrganization === 'all' ? undefined : localStorage.getItem("userId"),
  }, { skip: isNetworkQuery });

  const networkQuery = useGetNetworkBatchesQuery({
    type: SITE_TYPE,
    page: currentPage,
    limit: 12,
    category: selectedCategory || undefined,
    search: debouncedSearchTerm || undefined,
    condition: filters.condition === "any" ? undefined : filters.condition,
    location: filters.location || undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    sort: sort,
    main_seller_id: selectedOrganization,
    user_id: localStorage.getItem("userId"), // Note: network query expects user_id
  }, { skip: !isNetworkQuery });

  const { data: browseData, isLoading, error } = isNetworkQuery ? networkQuery : browseQuery;

  // Helper function to get meta value
  const getMetaValue = (meta: any[], key: string) => {
    const metaItem = meta?.find(m => m.meta_key === key);
    return metaItem?.meta_value || "";
  };

  const listings = useMemo(() => {
    let products = browseData?.data?.products || [];

    // Client-side sorting (fallback if backend doesn't support all sort options)
    if (sort === "oldest") {
      products = [...products].sort((a, b) => a.product_id - b.product_id);
    } else if (sort === "price_low") {
      products = [...products].sort((a, b) => {
        const priceA = parseFloat(getMetaValue(a.meta, "_price")) || 0;
        const priceB = parseFloat(getMetaValue(b.meta, "_price")) || 0;
        return priceA - priceB;
      });
    } else if (sort === "price_high") {
      products = [...products].sort((a, b) => {
        const priceA = parseFloat(getMetaValue(a.meta, "_price")) || 0;
        const priceB = parseFloat(getMetaValue(b.meta, "_price")) || 0;
        return priceB - priceA;
      });
    }
    // "newest" is default - already sorted by backend

    return products;
  }, [browseData?.data?.products, sort]);

  const pagination = browseData?.data?.pagination;
  const totalListings = pagination?.totalItems || 0;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, debouncedSearchTerm, filters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleOrganizationChange = (orgId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (orgId === 'all') {
      newSearchParams.delete('org');
    } else {
      newSearchParams.set('org', orgId);
    }
    setSearchParams(newSearchParams);
    setCurrentPage(1); // Reset to first page when changing organization
  };

  const clearFilters = () => {
    setFilters({
      condition: "any",
      location: "",
      minPrice: "",
      maxPrice: "",
    });
    setSearchTerm("");
    setSelectedCategory(null);
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) =>
    value && (key !== 'condition' || value !== 'any')
  ).length + (selectedCategory ? 1 : 0) + (searchTerm ? 1 : 0);

   
  const handleViewMore=(item)=>{
    navigate(`/dashboard/browse/${item?.slug} `)
  }



  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('browseListings.title')}</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t('browseListings.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        {/* Organization Selector */}
        <div className="flex items-center gap-3">
          <Label htmlFor="organization-select" className="text-sm font-medium">
            {t('browseListings.organizationLabel')}
          </Label>
          <Select value={selectedOrganization} onValueChange={handleOrganizationChange}>
            <SelectTrigger id="organization-select" className="w-64">
              <SelectValue placeholder={t('browseListings.selectOrganization')} />
            </SelectTrigger>
            <SelectContent>
              {organizationOptions.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categories */}
        {/* <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(active ? null : cat)}
                  className={[
                    "h-10 rounded-md border text-xs font-medium px-3 transition-colors",
                    active
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border bg-background hover:bg-muted/40 text-foreground",
                  ].join(" ")}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          <button type="button" className="text-sm underline text-muted-foreground hover:text-foreground">
            Show more
          </button>
        </div> */}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  {t('browseListings.filters')}
                  {activeFiltersCount > 0 && (
                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t('browseListings.filters')}</SheetTitle>
                  <SheetDescription>
                    {t('browseListings.filtersDescription')}
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="condition">{t('browseListings.condition')}</Label>
                    <Select value={filters.condition} onValueChange={(value) => handleFilterChange("condition", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('browseListings.anyCondition')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t('browseListings.anyCondition')}</SelectItem>
                        <SelectItem value="new">{t('browseListings.conditionNew')}</SelectItem>
                        <SelectItem value="used">{t('browseListings.conditionUsed')}</SelectItem>
                        <SelectItem value="refurbished">{t('browseListings.conditionRefurbished')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
{/* 
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Enter location"
                      value={filters.location}
                      onChange={(e) => handleFilterChange("location", e.target.value)}
                    />
                  </div> */}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minPrice">{t('browseListings.minPrice')}</Label>
                      <Input
                        id="minPrice"
                        type="number"
                        placeholder="0"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPrice">{t('browseListings.maxPrice')}</Label>
                      <Input
                        id="maxPrice"
                        type="number"
                        placeholder={t('common.noLimit') || "No limit"}
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={clearFilters} variant="outline" className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    {t('browseListings.clearAllFilters')}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
{/* 
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleFilterChange("location", "Vancouver")}
            >
              <MapPin className="w-4 h-4" />
              Vancouver
            </Button> */}
          </div>

          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('browseListings.sort')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('browseListings.newest')}</SelectItem>
                <SelectItem value="oldest">{t('browseListings.oldest')}</SelectItem>
                <SelectItem value="price_low">{t('browseListings.priceLowToHigh')}</SelectItem>
                <SelectItem value="price_high">{t('browseListings.priceHighToLow')}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={[
                  "px-3 py-2 text-sm",
                  view === "grid" ? "bg-muted" : "bg-background hover:bg-muted/40",
                ].join(" ")}
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={[
                  "px-3 py-2 text-sm border-l",
                  view === "list" ? "bg-muted" : "bg-background hover:bg-muted/40",
                ].join(" ")}
                aria-label="List view"
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            t('browseListings.loadingListings')
          ) : (
            selectedCategory
              ? t('browseListings.listingsCountWithCategory', {
                  count: totalListings,
                  current: pagination?.currentPage || 1,
                  total: pagination?.totalPages || 1,
                  category: selectedCategory
                })
              : t('browseListings.listingsCount', {
                  count: totalListings,
                  current: pagination?.currentPage || 1,
                  total: pagination?.totalPages || 1
                })
          )}
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">{t('browseListings.loadingListings')}</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-destructive">{t('browseListings.errorLoading')}</div>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">{t('browseListings.noListingsFound')}</div>
          </div>
        ) : (
          <>
            <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" : "space-y-3"}>
              {listings.map((item,index) => (
                <Card key={index+1} className="overflow-hidden cursor-pointer" onClick={()=>handleViewMore(item)}>
                  <CardContent className="p-4 space-y-3">
                    {item.image1 ? (
                      <img
                        src={item.image1}
                        alt={item.title}
                        className="w-full aspect-[4/3] object-cover rounded-lg"
                      />
                    ) : (
                      <PlaceholderImg />
                    )}

                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-foreground line-clamp-2">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {getMetaValue(item.meta, "_price") || t('browseListings.priceNotSet')}
                        </span>
                        {" • "}
                        <span>{getMetaValue(item.meta, "_condition") || t('browseListings.conditionNotSpecified')}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getMetaValue(item.meta, "_quantity") || t('browseListings.quantityNotSpecified')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getMetaValue(item.meta, "_location") || t('browseListings.locationNotSpecified')}
                      </div>
                      {item.categories && item.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.categories.slice(0, 2).map((cat, idx) => (
                            <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                              {cat.term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button variant="outline" size="sm" className="w-fit">
                      {t('browseListings.viewDetails')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}