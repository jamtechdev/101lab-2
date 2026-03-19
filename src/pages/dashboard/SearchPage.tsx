import React, { useState } from "react";
import { Search, Grid, List, Star, MapPin, Clock, ChevronUp, ChevronDown, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Filter } from "lucide-react";

const INITIAL_SHOW = 6;

const allCategories = [
  "Material Handling Equipment",
  "Construction & Earthmoving Equipment",
  "Agricultural Equipment",
  "Shop & Maintenance Tools",
  "Test & Measurement Equipment",
  "Industrial Equipment, Parts & Systems",
  "Metalworking Machines",
  "Woodworking Machines",
  "Plastics & Rubber Machinery",
  "Printing & Paper Machinery",
  "Textile Machinery",
  "Food & Beverage Equipment",
  "Packaging Machinery",
  "Electronics",
  "Office & IT Equipment",
  "Vehicles & Transport",
  "Energy & Power Generation",
  "Medical Equipment",
  "Chemical & Pharmaceutical Equipment",
  "Mining Equipment",
  "Marine Equipment",
  "Cleaning Equipment",
  "Safety Equipment",
  "Warehouse & Logistics",
  "Conveyor Systems",
  "Pumps & Compressors",
  "HVAC Equipment",
];

const bidStatuses = ["All Bids", "Active", "Won", "Outbid", "Ended"];

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBidStatus, setSelectedBidStatus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [bidStatusOpen, setBidStatusOpen] = useState(true);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleBidStatus = (status: string) => {
    setSelectedBidStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const visibleCategories = showAllCategories ? allCategories : allCategories.slice(0, INITIAL_SHOW);
  const hiddenCount = allCategories.length - INITIAL_SHOW;

  // Mock data
  const mockProducts = [
    { id: 1, name: "Industrial Plastic Waste", category: "Material Handling Equipment", price: 2500, location: "Mumbai, India", rating: 4.5, reviews: 23, image: "/placeholder.png", description: "High-quality industrial plastic waste suitable for recycling", seller: "EcoRecycle Ltd", timePosted: "2 hours ago" },
    { id: 2, name: "Electronic Components", category: "Electronics", price: 5000, location: "Delhi, India", rating: 4.8, reviews: 45, image: "/placeholder.png", description: "Mixed electronic components and circuit boards", seller: "TechWaste Solutions", timePosted: "5 hours ago" },
    { id: 3, name: "Metal Scrap Collection", category: "Metalworking Machines", price: 8000, location: "Bangalore, India", rating: 4.2, reviews: 12, image: "/placeholder.png", description: "Various metal scraps including aluminum and steel", seller: "MetalRecycle Pro", timePosted: "1 day ago" },
    { id: 4, name: "Paper Waste Bundle", category: "Packaging Machinery", price: 1200, location: "Chennai, India", rating: 4.6, reviews: 34, image: "/placeholder.png", description: "Clean office paper waste ready for recycling", seller: "PaperCycle Inc", timePosted: "3 hours ago" },
  ];

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    return matchesSearch && matchesCategory;
  });

  const ProductCard = ({ product }: { product: any }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      <div className="relative overflow-hidden rounded-t-lg">
        <img src={product.image} alt={product.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">{product.category}</Badge>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{product.name}</h3>
          <span className="text-xl font-bold text-primary">₹{product.price}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-sm text-muted-foreground">({product.reviews})</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{product.location}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{product.timePosted}</span>
          </div>
          <Button size="sm" variant="default">View Details</Button>
        </div>
      </CardContent>
    </Card>
  );

  const ProductListItem = ({ product }: { product: any }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-lg" />
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg hover:text-primary transition-colors">{product.name}</h3>
              <span className="text-xl font-bold text-primary">₹{product.price}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
            <div className="flex items-center gap-4 mb-2">
              <Badge variant="secondary">{product.category}</Badge>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{product.rating} ({product.reviews})</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{product.location}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{product.timePosted}</span>
              <Button size="sm" variant="default">View Details</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Search */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground mb-4">Search Products</h1>
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by equipment or batch ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar - Surplex style */}
          <div className="w-72 shrink-0">
            <Card className="sticky top-6">
              <CardContent className="p-0">
                {/* Filters Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <Filter className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Filters</span>
                </div>

                {/* Category Section */}
                <div className="border-b border-border">
                  <button
                    onClick={() => setCategoryOpen(!categoryOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-semibold text-sm text-foreground">Category</span>
                    {categoryOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {categoryOpen && (
                    <div className="px-4 pb-3 space-y-1">
                      {visibleCategories.map(cat => (
                        <label
                          key={cat}
                          className="flex items-center gap-3 py-1.5 cursor-pointer group"
                        >
                          <Checkbox
                            checked={selectedCategories.includes(cat)}
                            onCheckedChange={() => toggleCategory(cat)}
                            className="border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
                            {cat}
                          </span>
                        </label>
                      ))}
                      {hiddenCount > 0 && (
                        <button
                          onClick={() => setShowAllCategories(!showAllCategories)}
                          className="text-sm text-primary hover:text-primary/80 font-medium mt-2 transition-colors"
                        >
                          {showAllCategories ? "Show less" : `+ ${hiddenCount} more`}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Bid Status Section */}
                <div className="border-b border-border">
                  <button
                    onClick={() => setBidStatusOpen(!bidStatusOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-foreground" />
                      <span className="font-semibold text-sm text-foreground">Bid Status</span>
                    </div>
                    {bidStatusOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {bidStatusOpen && (
                    <div className="px-4 pb-3 space-y-1">
                      {bidStatuses.map(status => (
                        <label
                          key={status}
                          className="flex items-center gap-3 py-1.5 cursor-pointer group"
                        >
                          <Checkbox
                            checked={selectedBidStatus.includes(status)}
                            onCheckedChange={() => toggleBidStatus(status)}
                            className="border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                            {status}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort By */}
                <div className="px-4 py-3">
                  <label className="text-sm font-semibold text-foreground mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{filteredProducts.length} Results Found</h2>
                <p className="text-muted-foreground">Showing recyclable materials matching your search</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
                  <Grid className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map(product => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
