import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Package, Check, Trash2, GripVertical, Search, SlidersHorizontal } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);

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
    const assignedImage = productImages.find((img) => {
      const variantIds = img.variant_ids as string[] | null;
      return variantIds && variantIds.includes(variantId);
    });
    if (!assignedImage) {
      return productImages.find((img) => img.is_primary) || productImages[0] || null;
    }
    return assignedImage;
  };

  const isImageDirectlyAssigned = (variantId: string) => {
    if (!productImages) return false;
    return productImages.some((img) => {
      const variantIds = img.variant_ids as string[] | null;
      return variantIds && variantIds.includes(variantId);
    });
  };

  const assignImageMutation = useMutation({
    mutationFn: async ({ imageId, variantId }: { imageId: string; variantId: string }) => {
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
      toast({ title: "Image assigned", description: "The image has been assigned to the variant." });
    },
    onError: (error) => {
      toast({ title: "Error assigning image", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (variants) {
      const initial: Record<string, VariantEdit> = {};
      variants.forEach((v) => {
        initial[v.id] = { price: v.price, stock_quantity: v.stock_quantity || 0 };
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
      toast({ title: "Error updating variant", description: error.message, variant: "destructive" });
    },
  });

  const addVariantMutation = useMutation({
    mutationFn: async (variant: NewVariant) => {
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
      toast({ title: "Variant added", description: "The new variant has been created successfully." });
    },
    onError: (error) => {
      toast({ title: "Error adding variant", description: error.message, variant: "destructive" });
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
      toast({ title: "Variant deleted", description: "The variant has been removed." });
    },
    onError: (error) => {
      toast({ title: "Error deleting variant", description: error.message, variant: "destructive" });
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
    if (variant.price !== edited.price || (variant.stock_quantity || 0) !== edited.stock_quantity) {
      updateVariantMutation.mutate({ variantId, price: edited.price, stock_quantity: edited.stock_quantity });
    }
  };

  const handleAddVariant = () => {
    addVariantMutation.mutate(newVariant);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && variants) {
      setSelectedVariants(variants.map(v => v.id));
    } else {
      setSelectedVariants([]);
    }
  };

  const handleSelectVariant = (variantId: string, checked: boolean) => {
    if (checked) {
      setSelectedVariants(prev => [...prev, variantId]);
    } else {
      setSelectedVariants(prev => prev.filter(id => id !== variantId));
    }
  };

  const totalInventory = Object.values(editedVariants).reduce(
    (sum, v) => sum + (v.stock_quantity || 0),
    0
  );

  // Get unique option values for display
  const getUniqueOptionValues = (optionKey: 'option1' | 'option2' | 'option3') => {
    if (!variants) return [];
    return [...new Set(variants.map(v => v[optionKey]).filter(Boolean))] as string[];
  };

  const option1Values = getUniqueOptionValues('option1');
  const option2Values = getUniqueOptionValues('option2');
  const option3Values = getUniqueOptionValues('option3');

  const optionGroups = [
    { name: option1Name, values: option1Values, key: 'option1' as const },
    { name: option2Name, values: option2Values, key: 'option2' as const },
    { name: option3Name, values: option3Values, key: 'option3' as const },
  ].filter(g => g.name && g.values.length > 0);

  const hasOptions = option1Name || option2Name || option3Name;

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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add variant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Options Section - Shopify Style */}
        {optionGroups.length > 0 && (
          <div className="space-y-3">
            {optionGroups.map((group) => (
              <div key={group.key} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-muted-foreground cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-2">{group.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.values.map((value) => (
                        <Badge 
                          key={value} 
                          variant="secondary" 
                          className="font-normal px-3 py-1"
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Plus className="h-4 w-4 mr-1" />
              Add another option
            </Button>
          </div>
        )}

        {/* Variants Table - Shopify Style */}
        {variants && variants.length > 0 && (
          <>
            {/* Search/Filter Bar */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" className="h-8">
                <Search className="h-4 w-4 mr-1" />
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={selectedVariants.length === variants.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-medium">Variant</TableHead>
                    <TableHead className="font-medium">Price</TableHead>
                    <TableHead className="font-medium text-right">Available</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => {
                    const variantImage = getVariantImage(variant.id);
                    return (
                      <TableRow key={variant.id} className="group">
                        <TableCell>
                          <Checkbox 
                            checked={selectedVariants.includes(variant.id)}
                            onCheckedChange={(checked) => handleSelectVariant(variant.id, checked === true)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="h-12 w-12 rounded-md bg-muted flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden border"
                                >
                                  {variantImage ? (
                                    <img
                                      src={variantImage.image_url}
                                      alt={variantImage.alt_text || variant.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-2 bg-popover" align="start">
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
                                            assignImageMutation.mutate({ imageId: img.id, variantId: variant.id });
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
                                <p className="text-xs text-muted-foreground">{variant.sku}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative w-36">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₫</span>
                            <Input
                              type="text"
                              value={editedVariants[variant.id]?.price?.toLocaleString() ?? variant.price?.toLocaleString()}
                              onChange={(e) => {
                                const value = e.target.value.replace(/,/g, '');
                                handlePriceChange(variant.id, value);
                              }}
                              onBlur={() => handleBlur(variant.id)}
                              className="pl-7 h-9"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editedVariants[variant.id]?.stock_quantity ?? variant.stock_quantity ?? 0}
                            onChange={(e) => handleStockChange(variant.id, e.target.value)}
                            onBlur={() => handleBlur(variant.id)}
                            className="w-20 ml-auto text-right h-9 bg-muted/50"
                            disabled
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                            onClick={() => deleteVariantMutation.mutate(variant.id)}
                            disabled={deleteVariantMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Total Inventory Footer */}
            <div className="text-center py-3 text-sm text-muted-foreground border-t">
              Total inventory across all locations: <span className="font-medium text-foreground">{totalInventory} available</span>
            </div>
          </>
        )}

        {/* Empty State */}
        {(!variants || variants.length === 0) && (
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

      {/* Add Variant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add new variant</DialogTitle>
            <DialogDescription>
              Create a new product variant with its own price and inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Option fields */}
            {option1Name && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm">{option1Name}</Label>
                <div className="col-span-3">
                  <Select 
                    value={newVariant.option1} 
                    onValueChange={(val) => setNewVariant(prev => ({ ...prev, option1: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${option1Name}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {option1Values.map((val) => (
                        <SelectItem key={val} value={val}>{val}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="mt-2"
                    placeholder={`Or type new ${option1Name}`}
                    value={option1Values.includes(newVariant.option1) ? "" : newVariant.option1}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, option1: e.target.value }))}
                  />
                </div>
              </div>
            )}
            {option2Name && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm">{option2Name}</Label>
                <div className="col-span-3">
                  <Select 
                    value={newVariant.option2} 
                    onValueChange={(val) => setNewVariant(prev => ({ ...prev, option2: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${option2Name}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {option2Values.map((val) => (
                        <SelectItem key={val} value={val}>{val}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="mt-2"
                    placeholder={`Or type new ${option2Name}`}
                    value={option2Values.includes(newVariant.option2) ? "" : newVariant.option2}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, option2: e.target.value }))}
                  />
                </div>
              </div>
            )}
            {option3Name && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm">{option3Name}</Label>
                <div className="col-span-3">
                  <Select 
                    value={newVariant.option3} 
                    onValueChange={(val) => setNewVariant(prev => ({ ...prev, option3: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${option3Name}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {option3Values.map((val) => (
                        <SelectItem key={val} value={val}>{val}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="mt-2"
                    placeholder={`Or type new ${option3Name}`}
                    value={option3Values.includes(newVariant.option3) ? "" : newVariant.option3}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, option3: e.target.value }))}
                  />
                </div>
              </div>
            )}
            {!hasOptions && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="variantName" className="text-right text-sm">Name</Label>
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
              <Label className="text-right text-sm">Price</Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₫</span>
                <Input
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
              <Label className="text-right text-sm">SKU</Label>
              <Input
                value={newVariant.sku}
                onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value }))}
                className="col-span-3"
                placeholder="Stock keeping unit"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm">Quantity</Label>
              <Input
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
    </Card>
  );
}
