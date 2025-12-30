import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImage {
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  isFeatured?: boolean;
  isOnSale?: boolean;
}

export function ProductImageGallery({ images, productName, isFeatured, isOnSale }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return (a.display_order || 0) - (b.display_order || 0);
  });

  const maxVisibleThumbnails = 4;
  const hiddenCount = sortedImages.length - maxVisibleThumbnails;
  const visibleThumbnails = sortedImages.slice(0, maxVisibleThumbnails);

  if (sortedImages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
          <span className="text-muted-foreground">No image available</span>
        </div>
      </div>
    );
  }

  const scrollPrev = () => {
    setSelectedImage((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const scrollNext = () => {
    setSelectedImage((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-2 w-full max-w-full overflow-hidden">
      {/* Main Image */}
      <div
        className="relative aspect-square w-full max-w-full rounded-xl overflow-hidden bg-muted/50 cursor-zoom-in"
        onClick={() => setIsZoomOpen(true)}
      >
        {isOnSale && (
          <Badge className="absolute top-4 left-4 z-10 bg-secondary text-secondary-foreground hover:bg-secondary font-semibold px-3 py-1">
            Sale
          </Badge>
        )}
        {isFeatured && !isOnSale && (
          <Badge className="absolute top-4 left-4 z-10 bg-green-500 hover:bg-green-500 text-white font-semibold px-3 py-1">
            BEST SELLER
          </Badge>
        )}
        <img
          src={sortedImages[selectedImage].image_url}
          alt={sortedImages[selectedImage].alt_text || productName}
          className="block w-full h-full max-w-full max-h-full object-contain transition-transform duration-300 md:hover:scale-105"
        />
        
        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-md transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); scrollNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-md transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Row */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-0 scrollbar-hide">
          {visibleThumbnails.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 transition-all",
                selectedImage === index
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <img
                src={image.image_url}
                alt={image.alt_text || `${productName} ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Show +X overlay on last visible thumbnail if there are more images */}
              {index === maxVisibleThumbnails - 1 && hiddenCount > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">+{hiddenCount}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Zoom Dialog */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <img
              src={sortedImages[selectedImage].image_url}
              alt={sortedImages[selectedImage].alt_text || productName}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            
            {/* Navigation in zoom view */}
            {sortedImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-background/80 p-2 rounded-lg">
                {sortedImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-smooth",
                      selectedImage === index ? "bg-primary" : "bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
