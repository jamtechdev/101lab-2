import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";

interface CategoryBarProps {
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
}

const CategoryBar = ({ selectedCategory, onCategoryChange }: CategoryBarProps) => {
  const { data: categoriesData } = useLanguageAwareCategories();
  const categories: { slug: string; name: string }[] = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData as any)?.data ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="border-b border-border bg-white sticky top-[57px] z-40">
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
          {/* All auctions - bordered active style */}
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

          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => onCategoryChange(selectedCategory === cat.slug ? "" : cat.slug)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 flex-shrink-0 border-b-2 ${
                selectedCategory === cat.slug
                  ? "border-foreground text-foreground"
                  : "border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/20"
              }`}
            >
              {cat.name}
            </button>
          ))}
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
    </div>
  );
};

export default CategoryBar;
