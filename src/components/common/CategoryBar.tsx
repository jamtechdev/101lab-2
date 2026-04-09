import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { useLanguageAwareCategories, LabCategory } from "@/hooks/useLanguageAwareCategories";

interface CategoryBarProps {
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
}

const CategoryBar = ({ selectedCategory, onCategoryChange }: CategoryBarProps) => {
  const { data: categoriesData } = useLanguageAwareCategories();
  const categories: LabCategory[] = Array.isArray(categoriesData) ? categoriesData : [];

  const scrollRef = useRef<HTMLDivElement>(null);
  const subScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Which parent is currently "expanded" to show its subcategories
  const activeParent = categories.find(
    (c) => c.slug === selectedCategory || c.subcategories?.some((s) => s.slug === selectedCategory)
  ) ?? null;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  const handleParentClick = (cat: LabCategory) => {
    if (selectedCategory === cat.slug) {
      // Clicking active parent deselects
      onCategoryChange("");
    } else {
      onCategoryChange(cat.slug);
    }
  };

  return (
    <div className="border-b border-border bg-white sticky top-[57px] z-40">
      {/* ── Parent category row ── */}
      <div className="container mx-auto px-4 relative">
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-white via-white/90 to-transparent"
          >
            <ChevronLeft className="h-4 w-4 text-foreground/60" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex items-center gap-0 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* All auctions */}
          <button
            onClick={() => onCategoryChange("")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 flex-shrink-0 border-b-2 ${
              !selectedCategory
                ? "border-foreground text-foreground"
                : "border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/20"
            }`}
          >
            All auctions
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />

          {/* Parent categories */}
          {categories.map((cat) => {
            const isActive =
              selectedCategory === cat.slug ||
              cat.subcategories?.some((s) => s.slug === selectedCategory);
            return (
              <button
                key={cat.slug}
                onClick={() => handleParentClick(cat)}
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 flex-shrink-0 border-b-2 ${
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {cat.name}
                {cat.subcategories?.length > 0 && (
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${isActive ? "rotate-90" : ""}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-white via-white/90 to-transparent"
          >
            <ChevronRight className="h-4 w-4 text-foreground/60" />
          </button>
        )}
      </div>

      {/* ── Subcategory row — shown when a parent with subcategories is active ── */}
      {activeParent && activeParent.subcategories?.length > 0 && (
        <div className="border-t border-border/50 bg-muted/30">
          <div className="container mx-auto px-4 relative">
            <div
              ref={subScrollRef}
              className="flex items-center gap-0 overflow-x-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {/* Show all parent link */}
              <button
                onClick={() => onCategoryChange(activeParent.slug)}
                className={`px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors duration-150 flex-shrink-0 border-b-2 uppercase tracking-wide ${
                  selectedCategory === activeParent.slug
                    ? "border-primary text-primary"
                    : "border-transparent text-primary/70 hover:text-primary hover:border-primary/40"
                }`}
              >
                Show all
              </button>

              <div className="w-px h-4 bg-border mx-1 flex-shrink-0" />

              {activeParent.subcategories.map((sub) => (
                <button
                  key={sub.slug}
                  onClick={() => onCategoryChange(sub.slug)}
                  className={`px-3 py-2 text-xs whitespace-nowrap transition-colors duration-150 flex-shrink-0 border-b-2 ${
                    selectedCategory === sub.slug
                      ? "border-foreground text-foreground font-medium"
                      : "border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/20"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryBar;
