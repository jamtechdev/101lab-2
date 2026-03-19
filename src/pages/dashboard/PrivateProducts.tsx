import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetProductsBySellerQuery } from "@/rtk/slices/productSlice";
import { Eye, Package, Calendar, Image as ImageIcon } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";

interface Product {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  batch_id: number | null;
  batch_number: number | null;
  slug?: string;
  meta: any;
  categories: any[];
  images: string[];
  videos: string[];
}

const PrivateProducts = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userId = localStorage.getItem("companySellerId") || localStorage.getItem("userId");

  const { data: sellerData, isLoading, error } = useGetProductsBySellerQuery({
    sellerId: userId || ""
  }, {
    skip: !userId,
  });

  const products = sellerData?.data || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">{t("products.privateProducts", "Private Products")}</h1>
            <Button onClick={() => navigate("/upload")}>
              <Package className="w-4 h-4 mr-2" />
              {t("products.addNew", "Add New Product")}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-muted rounded animate-pulse mb-1"></div>
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">
              {t("products.errorLoading", "Error Loading Products")}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t("products.tryAgain", "Please try again later")}
            </p>
            <Button onClick={() => navigate("/upload")}>
              {t("products.addFirst", "Add Your First Product")}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t("products.privateProducts", "Private Products")}</h1>
          {/* <Button onClick={() => navigate("/upload")}>
            <Package className="w-4 h-4 mr-2" />
            {t("products.addNew", "Add New Product")}
          </Button> */}
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">
              {t("products.noProducts", "No products found")}
            </h3>
            {/* <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t("products.startAdding", "You haven't added any products yet. Start by creating your first product listing.")}
            </p> */}
            {/* <Button onClick={() => navigate("/upload")} size="lg">
              <Package className="w-4 h-4 mr-2" />
              {t("products.addFirst", "Add Your First Product")}
            </Button> */}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: Product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer"
                onClick={() => {
                  // Use slug from product data or fallback to ID
                  const slug = product.slug || product.id;
                  window.open(`https://greenbidz.com/product/${slug}`, '_blank');
                }}
              >
                {/* Product Image */}
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={product.status === "publish" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {product.status === "publish" ? "Active" : product.status === "sold" ? "Sold" : "Draft"}
                    </Badge>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Use slug from product data or fallback to ID
                        const slug = product.slug || product.id;
                        window.open(`https://greenbidz.com/product/${slug}`, '_blank');
                      }}
                      className="bg-white/90 hover:bg-white text-black"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>

                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(product.created_at)}
                      </span>
                    </div>

                    {product.categories && product.categories.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {product.categories[0].term}
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <ImageIcon className="w-3 h-3" />
                        {product.images?.length || 0} images
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ID: {product.id}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PrivateProducts;
