import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Package, Check, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface NewVariant {
  name: string;
  option1: string;
  option2: string;
  option3: string;
  price: number;
  compare_at_price: number | null;
  sku: string;
  barcode: string;
  stock_quantity: number;
}

const defaultNewVariant: NewVariant = {
  name: "",
  option1: "",
  option2: "",
  option3: "",
  price: 0,
  compare_at_price: null,
  sku: "",
  barcode: "",
  stock_quantity: 0,
};

export function ProductVariantsTable({
  productId,
  option1Name,
  option2Name,
  option3Name,
}: ProductVariantsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedVariants, setEditedVariants] = useState<Record<string, VariantEdit>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newVariant, setNewVariant] = useState<NewVariant>(defaultNewVariant);

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

  const addVariantMutation = useMutation({
    mutationFn: async (variant: NewVariant) => {
      // Generate variant name from options if not provided
      const variantName = variant.name || [variant.option1, variant.option2, variant.option3]
        .filter(Boolean)
        .join(" / ") || "Default";

      const { error } = await supabase
        .from("product_variants")
        .insert({
          product_id: productId,
          name: variantName,
          option1: variant.option1 || null,
          option2: variant.option2 || null,
          option3: variant.option3 || null,
          price: variant.price,
          compare_at_price: variant.compare_at_price || null,
          sku: variant.sku || null,
          barcode: variant.barcode || null,
          stock_quantity: variant.stock_quantity,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-variants-count", productId] });
      setIsAddDialogOpen(false);
      setNewVariant(defaultNewVariant);
      toast({
        title: "Variant added",
        description: "The new variant has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding variant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", variantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-variants-count", productId] });
      toast({
        title: "Variant deleted",
        description: "The variant has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting variant",
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

  const handleAddVariant = () => {
    addVariantMutation.mutate(newVariant);
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-primary">
                <Plus className="h-4 w-4 mr-1" />
                Add variant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add new variant</DialogTitle>
                <DialogDescription>
                  Create a new product variant with its own price and inventory.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {option1Name && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="option1" className="text-right">
                      {option1Name}
                    </Label>
                    <Input
                      id="option1"
                      value={newVariant.option1}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, option1: e.target.value }))}
                      className="col-span-3"
                      placeholder={`Enter ${option1Name}`}
                    />
                  </div>
                )}
                {option2Name && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="option2" className="text-right">
                      {option2Name}
                    </Label>
                    <Input
                      id="option2"
                      value={newVariant.option2}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, option2: e.target.value }))}
                      className="col-span-3"
                      placeholder={`Enter ${option2Name}`}
                    />
                  </div>
                )}
                {option3Name && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="option3" className="text-right">
                      {option3Name}
                    </Label>
                    <Input
                      id="option3"
                      value={newVariant.option3}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, option3: e.target.value }))}
                      className="col-span-3"
                      placeholder={`Enter ${option3Name}`}
                    />
                  </div>
                )}
                {!option1Name && !option2Name && !option3Name && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="variantName" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="variantName"
                      value={newVariant.name}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., Small, Medium, Large"
                    />
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price
                  </Label>
                  <div className="col-span-3 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₫</span>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="1000"
                      value={newVariant.price}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="compare_at_price" className="text-right">
                    Compare at
                  </Label>
                  <div className="col-span-3 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₫</span>
                    <Input
                      id="compare_at_price"
                      type="number"
                      min="0"
                      step="1000"
                      value={newVariant.compare_at_price || ""}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, compare_at_price: e.target.value ? parseFloat(e.target.value) : null }))}
                      className="pl-7"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sku" className="text-right">
                    SKU
                  </Label>
                  <Input
                    id="sku"
                    value={newVariant.sku}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value }))}
                    className="col-span-3"
                    placeholder="Stock keeping unit"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="barcode" className="text-right">
                    Barcode
                  </Label>
                  <Input
                    id="barcode"
                    value={newVariant.barcode}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, barcode: e.target.value }))}
                    className="col-span-3"
                    placeholder="ISBN, UPC, GTIN, etc."
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">
                    Quantity
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={newVariant.stock_quantity}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddVariant}
                  disabled={addVariantMutation.isPending}
                >
                  {addVariantMutation.isPending ? "Adding..." : "Add variant"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  <TableHead className="w-[35%]">Variant</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
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
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteVariantMutation.mutate(variant.id)}
                        disabled={deleteVariantMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">No variants configured</p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-2"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add variant
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
