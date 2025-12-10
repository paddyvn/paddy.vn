import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface ProductVariantsTableProps {
  productId: string;
  option1Name?: string | null;
  option2Name?: string | null;
  option3Name?: string | null;
}

interface VariantEdit {
  price: number;
  stock_quantity: number;
}

export function ProductVariantsTable({
  productId,
  option1Name,
  option2Name,
  option3Name,
}: ProductVariantsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedVariants, setEditedVariants] = useState<Record<string, VariantEdit>>({});

  const { data: variants, isLoading } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const { data: productImages } = useQuery({
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

  // Get the image assigned to a variant
  const getVariantImage = (variantId: string) => {
    if (!productImages) return null;
    
    // Find image that has this variant in its variant_ids array
    const assignedImage = productImages.find((img) => {
      const variantIds = img.variant_ids as string[] | null;
      return variantIds && variantIds.includes(variantId);
    });
    
    // If no specific image assigned, return the primary image
    if (!assignedImage) {
      return productImages.find((img) => img.is_primary) || productImages[0] || null;
    }
    
    return assignedImage;
  };

  // Check if a specific image is directly assigned to a variant (not fallback)
  const isImageDirectlyAssigned = (variantId: string) => {
    if (!productImages) return false;
    return productImages.some((img) => {
      const variantIds = img.variant_ids as string[] | null;
      return variantIds && variantIds.includes(variantId);
    });
  };

  const assignImageMutation = useMutation({
    mutationFn: async ({ imageId, variantId }: { imageId: string; variantId: string }) => {
      // First, remove this variant from all other images
      if (productImages) {
        for (const img of productImages) {
          const variantIds = (img.variant_ids as string[] | null) || [];
          if (variantIds.includes(variantId)) {
            const newVariantIds = variantIds.filter((id) => id !== variantId);
            await supabase
              .from("product_images")
              .update({ variant_ids: newVariantIds })
              .eq("id", img.id);
          }
        }
      }

      // Then add this variant to the selected image
      const selectedImage = productImages?.find((img) => img.id === imageId);
      const currentVariantIds = (selectedImage?.variant_ids as string[] | null) || [];
      const newVariantIds = [...currentVariantIds, variantId];
      
      const { error } = await supabase
        .from("product_images")
        .update({ variant_ids: newVariantIds })
        .eq("id", imageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      toast({
        title: "Image assigned",
        description: "The image has been assigned to the variant.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error assigning image",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize editedVariants when variants load
  useEffect(() => {
    if (variants) {
      const initial: Record<string, VariantEdit> = {};
      variants.forEach((v) => {
        initial[v.id] = {
          price: v.price,
          stock_quantity: v.stock_quantity || 0,
        };
      });
      setEditedVariants(initial);
    }
  }, [variants]);

  const updateVariantMutation = useMutation({
    mutationFn: async ({ variantId, price, stock_quantity }: { variantId: string; price: number; stock_quantity: number }) => {
      const { error } = await supabase
        .from("product_variants")
        .update({ price, stock_quantity })
        .eq("id", variantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
    },
    onError: (error) => {
      toast({
        title: "Error updating variant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePriceChange = (variantId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedVariants((prev) => ({
      ...prev,
      [variantId]: { ...prev[variantId], price: numValue },
    }));
  };

  const handleStockChange = (variantId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditedVariants((prev) => ({
      ...prev,
      [variantId]: { ...prev[variantId], stock_quantity: numValue },
    }));
  };

  const handleBlur = (variantId: string) => {
    const variant = variants?.find((v) => v.id === variantId);
    const edited = editedVariants[variantId];
    
    if (!variant || !edited) return;
    
    // Only update if values changed
    if (variant.price !== edited.price || (variant.stock_quantity || 0) !== edited.stock_quantity) {
      updateVariantMutation.mutate({
        variantId,
        price: edited.price,
        stock_quantity: edited.stock_quantity,
      });
    }
  };

  const totalInventory = Object.values(editedVariants).reduce(
    (sum, v) => sum + (v.stock_quantity || 0),
    0
  );

  // Get unique option values for display
  const getOptionValues = () => {
    const options: { name: string; values: string[] }[] = [];
    
    if (option1Name && variants) {
      const values = [...new Set(variants.map(v => v.option1).filter(Boolean))] as string[];
      if (values.length > 0) options.push({ name: option1Name, values });
    }
    if (option2Name && variants) {
      const values = [...new Set(variants.map(v => v.option2).filter(Boolean))] as string[];
      if (values.length > 0) options.push({ name: option2Name, values });
    }
    if (option3Name && variants) {
      const values = [...new Set(variants.map(v => v.option3).filter(Boolean))] as string[];
      if (values.length > 0) options.push({ name: option3Name, values });
    }

    return options;
  };

  const optionGroups = getOptionValues();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Variants</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">
            <Plus className="h-4 w-4 mr-1" />
            Add variant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Option Groups */}
        {optionGroups.length > 0 && (
          <div className="space-y-3">
            {optionGroups.map((group) => (
              <div key={group.name} className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
                  {group.name}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.values.map((value) => (
                    <Badge key={value} variant="secondary" className="font-normal">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Variants Table */}
        {variants && variants.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40%]">Variant</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => {
                  const variantImage = getVariantImage(variant.id);
                  return (
                  <TableRow key={variant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="h-10 w-10 rounded bg-muted flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden"
                            >
                              {variantImage ? (
                                <img
                                  src={variantImage.image_url}
                                  alt={variantImage.alt_text || variant.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2" align="start">
                            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                              Select image for {variant.name}
                            </p>
                            {productImages && productImages.length > 0 ? (
                              <div className="grid grid-cols-4 gap-1.5">
                                {productImages.map((img) => {
                                  const currentAssigned = getVariantImage(variant.id);
                                  const isSelected = currentAssigned?.id === img.id && isImageDirectlyAssigned(variant.id);
                                  return (
                                    <button
                                      key={img.id}
                                      type="button"
                                      onClick={() => {
                                        assignImageMutation.mutate({
                                          imageId: img.id,
                                          variantId: variant.id,
                                        });
                                      }}
                                      className={cn(
                                        "relative aspect-square rounded overflow-hidden border-2 transition-all hover:border-primary",
                                        isSelected ? "border-primary ring-1 ring-primary" : "border-transparent"
                                      )}
                                    >
                                      <img
                                        src={img.image_url}
                                        alt={img.alt_text || "Product image"}
                                        className="h-full w-full object-cover"
                                      />
                                      {isSelected && (
                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                          <Check className="h-4 w-4 text-primary" />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-4">
                                No images available
                              </p>
                            )}
                          </PopoverContent>
                        </Popover>
                        <div>
                          <p className="font-medium text-sm">{variant.name}</p>
                          {variant.sku && (
                            <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={editedVariants[variant.id]?.price ?? variant.price}
                        onChange={(e) => handlePriceChange(variant.id, e.target.value)}
                        onBlur={() => handleBlur(variant.id)}
                        className="w-32 ml-auto text-right h-8"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={editedVariants[variant.id]?.stock_quantity ?? variant.stock_quantity ?? 0}
                        onChange={(e) => handleStockChange(variant.id, e.target.value)}
                        onBlur={() => handleBlur(variant.id)}
                        className="w-20 ml-auto text-right h-8"
                      />
                    </TableCell>
                  </TableRow>
                  );
                })}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={2} className="font-medium text-sm">
                    Total inventory
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {totalInventory}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">No variants configured</p>
            <Button variant="secondary" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-1" />
              Add variant
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
