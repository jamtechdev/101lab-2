import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductThumbnailProps {
  src?: string | null;
  alt?: string;
  /** Tailwind classes for the wrapper (controls size, rounded, border, etc.) */
  className?: string;
  /** Tailwind classes for the fallback icon */
  iconClassName?: string;
}

/**
 * Renders a product image with a Package-icon placeholder when:
 *   1. src is missing / empty, OR
 *   2. src exists but fails to load (404, broken URL, blocked, etc.)
 */
export default function ProductThumbnail({
  src,
  alt = "",
  className,
  iconClassName,
}: ProductThumbnailProps) {
  const [errored, setErrored] = useState(false);

  // Reset error state if the src changes (e.g. a different row reuses this component)
  useEffect(() => {
    setErrored(false);
  }, [src]);

  const showFallback = !src || errored;

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden bg-muted",
        className
      )}
    >
      {showFallback ? (
        <Package
          className={cn("w-5 h-5 text-muted-foreground/60", iconClassName)}
        />
      ) : (
        <img
          src={src as string}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}
