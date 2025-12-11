import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
}

export function ProductImageGallery({ images, productName, isFeatured }: ProductImageGalleryProps) {
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

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative aspect-square rounded-xl overflow-hidden bg-muted/50 cursor-zoom-in"
        onClick={() => setIsZoomOpen(true)}
      >
        {isFeatured && (
          <Badge className="absolute top-4 left-4 z-10 bg-green-500 hover:bg-green-500 text-white font-semibold px-3 py-1">
            BEST SELLER
          </Badge>
        )}
        <img
          src={sortedImages[selectedImage].image_url}
          alt={sortedImages[selectedImage].alt_text || productName}
          className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Thumbnail Row */}
      {sortedImages.length > 1 && (
        <div className="flex gap-3">
          {visibleThumbnails.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all",
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
