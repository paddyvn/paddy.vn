import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Star, Trash2, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductMediaGalleryProps {
  productId: string;
}

export function ProductMediaGallery({ productId }: ProductMediaGalleryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: images, isLoading } = useQuery({
    queryKey: ["product-images", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const primaryImage = images?.find((img) => img.is_primary) || images?.[0];
  const otherImages = images?.filter((img) => img.id !== primaryImage?.id) || [];
  
  // Grid: 6 columns, 2 rows when collapsed. Primary takes 2x2 = 4 cells. Remaining = 8 cells.
  // 1 cell for add button = 7 cells for other images max when collapsed
  const maxVisibleOthers = 6;
  const hasHiddenImages = otherImages.length > maxVisibleOthers;
  const visibleOtherImages = isExpanded ? otherImages : otherImages.slice(0, maxVisibleOthers);
  const hiddenCount = otherImages.length - maxVisibleOthers;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Media</CardTitle>
      </CardHeader>
      <CardContent>
        {images && images.length > 0 ? (
          <div className="grid grid-cols-6 gap-3">
            {/* Primary image - spans 2 columns and 2 rows */}
            {primaryImage && (
              <div className="col-span-2 row-span-2 relative group rounded-lg border bg-muted overflow-hidden">
                <div className="aspect-square">
                  <img
                    src={primaryImage.image_url}
                    alt={primaryImage.alt_text || "Product image"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Primary
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Other images - max 6 visible */}
            {visibleOtherImages.map((image) => (
              <div
                key={image.id}
                className="relative group aspect-square rounded-lg border bg-muted overflow-hidden"
              >
                <img
                  src={image.image_url}
                  alt={image.alt_text || "Product image"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Hidden count indicator / Collapse button */}
            {hasHiddenImages && !isExpanded && (
              <button 
                onClick={() => setIsExpanded(true)}
                className="aspect-square rounded-lg border bg-muted/80 backdrop-blur flex items-center justify-center text-foreground font-medium text-lg hover:bg-muted transition-colors"
              >
                +{hiddenCount}
              </button>
            )}
            
            {isExpanded && hasHiddenImages && (
              <button 
                onClick={() => setIsExpanded(false)}
                className="aspect-square rounded-lg border bg-muted/80 backdrop-blur flex flex-col items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <ChevronUp className="h-5 w-5" />
                <span className="text-xs">Collapse</span>
              </button>
            )}
            
            {/* Add button */}
            <button className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground">
              <Plus className="h-6 w-6" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-muted">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Add images to your product</p>
              <Button variant="secondary" size="sm" className="mt-2">
                Add media
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
