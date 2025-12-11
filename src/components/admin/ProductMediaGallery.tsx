import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Star, Trash2, ChevronUp, GripVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ImagePickerDialog } from "@/components/admin/ImagePickerDialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface ProductMediaGalleryProps {
  productId: string;
}

interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean | null;
  display_order: number | null;
}

interface SortableImageProps {
  image: ProductImage;
  isPrimary?: boolean;
}

function SortableImage({ image, isPrimary }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group rounded-lg border bg-muted overflow-hidden",
        isPrimary ? "col-span-2 row-span-2" : "aspect-square",
        isDragging && "opacity-50 z-50"
      )}
    >
      {isPrimary ? (
        <div className="aspect-square">
          <img
            src={image.image_url}
            alt={image.alt_text || "Product image"}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <img
          src={image.image_url}
          alt={image.alt_text || "Product image"}
          className="w-full h-full object-cover"
        />
      )}
      
      {isPrimary && (
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs flex items-center gap-1">
          <Star className="h-3 w-3" />
          Primary
        </div>
      )}
      
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 rounded bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {/* Delete overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
        <Button size="icon" variant="secondary" className="h-8 w-8 pointer-events-auto">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ProductMediaGallery({ productId }: ProductMediaGalleryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const { data: images, isLoading } = useQuery({
    queryKey: ["product-images", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!productId,
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !images) return;
    
    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newOrder = arrayMove(images, oldIndex, newIndex);
    
    // Optimistic update
    queryClient.setQueryData(["product-images", productId], newOrder);
    
    // Update database
    try {
      const updates = newOrder.map((img, index) => ({
        id: img.id,
        display_order: index,
        product_id: productId,
        image_url: img.image_url,
      }));
      
      for (const update of updates) {
        const { error } = await supabase
          .from("product_images")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
        
        if (error) throw error;
      }
      
      toast({
        title: "Images reordered",
        description: "The image order has been updated.",
      });
    } catch (error) {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      toast({
        title: "Error",
        description: "Failed to reorder images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddImage = async (imageUrl: string) => {
    try {
      const newDisplayOrder = (images?.length || 0);
      const { error } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          image_url: imageUrl,
          display_order: newDisplayOrder,
          is_primary: newDisplayOrder === 0,
        });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      toast({
        title: "Image added",
        description: "The image has been added to the product.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add image. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const allImages = images || [];
  const primaryImage = allImages[0];
  const otherImages = allImages.slice(1);
  
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
        {allImages.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={allImages.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-6 gap-3">
                {/* Primary image - spans 2 columns and 2 rows */}
                {primaryImage && (
                  <SortableImage image={primaryImage} isPrimary />
                )}
                
                {/* Other images - max 6 visible when collapsed */}
                {visibleOtherImages.map((image) => (
                  <SortableImage key={image.id} image={image} />
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
                <button 
                  onClick={() => setIsImagePickerOpen(true)}
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-muted">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Add images to your product</p>
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => setIsImagePickerOpen(true)}>
                Add media
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      <ImagePickerDialog
        open={isImagePickerOpen}
        onOpenChange={setIsImagePickerOpen}
        onSelect={handleAddImage}
      />
    </Card>
  );
}
