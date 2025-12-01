import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProductImage {
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return (a.display_order || 0) - (b.display_order || 0);
  });

  if (sortedImages.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">No image available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="aspect-square rounded-lg overflow-hidden bg-muted cursor-zoom-in hover:opacity-95 transition-smooth"
        onClick={() => setIsZoomOpen(true)}
      >
        <img
          src={sortedImages[selectedImage].image_url}
          alt={sortedImages[selectedImage].alt_text || productName}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Thumbnail Row */}
      {sortedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-md overflow-hidden transition-smooth",
                selectedImage === index
                  ? "ring-2 ring-primary opacity-100"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={image.image_url}
                alt={image.alt_text || `${productName} ${index + 1}`}
                className="w-full h-full object-cover"
              />
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
