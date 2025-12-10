import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Package, Check, Trash2, GripVertical, Search, SlidersHorizontal, Pencil, X } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [isAddOptionDialogOpen, setIsAddOptionDialogOpen] = useState(false);
  const [newVariant, setNewVariant] = useState<NewVariant>(defaultNewVariant);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  
  // Option editing state
  const [editingOption, setEditingOption] = useState<'option1' | 'option2' | 'option3' | null>(null);
  const [editingOptionName, setEditingOptionName] = useState("");
  const [newOptionName, setNewOptionName] = useState("");
  const [deleteOptionKey, setDeleteOptionKey] = useState<'option1' | 'option2' | 'option3' | null>(null);

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
            await supabase.from("product_images").update({ variant_ids: newVariantIds }).eq("id", img.id);
          }
        }
      }
      const selectedImage = productImages?.find((img) => img.id === imageId);
      const currentVariantIds = (selectedImage?.variant_ids as string[] | null) || [];
      const newVariantIds = [...currentVariantIds, variantId];
      const { error } = await supabase.from("product_images").update({ variant_ids: newVariantIds }).eq("id", imageId);
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
      const { error } = await supabase.from("product_variants").update({ price, stock_quantity }).eq("id", variantId);
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
      const variantName = variant.name || [variant.option1, variant.option2, variant.option3].filter(Boolean).join(" / ") || "Default";
      const { error } = await supabase.from("product_variants").insert({
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
      const { error } = await supabase.from("product_variants").delete().eq("id", variantId);
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

  // Mutation to update product option names
  const updateOptionNameMutation = useMutation({
    mutationFn: async ({ optionKey, name }: { optionKey: 'option1' | 'option2' | 'option3'; name: string }) => {
      const fieldName = `${optionKey}_name` as 'option1_name' | 'option2_name' | 'option3_name';
      const { error } = await supabase
        .from("products")
        .update({ [fieldName]: name || null })
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-edit", productId] });
      setEditingOption(null);
      toast({ title: "Option updated", description: "The option name has been updated." });
    },
    onError: (error) => {
      toast({ title: "Error updating option", description: error.message, variant: "destructive" });
    },
  });

  // Mutation to delete an option (clears option values from variants too)
  const deleteOptionMutation = useMutation({
    mutationFn: async (optionKey: 'option1' | 'option2' | 'option3') => {
      // Clear option name from product
      const fieldName = `${optionKey}_name` as 'option1_name' | 'option2_name' | 'option3_name';
      const { error: productError } = await supabase
        .from("products")
        .update({ [fieldName]: null })
        .eq("id", productId);
      if (productError) throw productError;

      // Clear option values from all variants and update their names
      if (variants) {
        for (const variant of variants) {
          const newOptionValue = { [optionKey]: null };
          // Rebuild variant name from remaining options
          const remainingOptions = [
            optionKey !== 'option1' ? variant.option1 : null,
            optionKey !== 'option2' ? variant.option2 : null,
            optionKey !== 'option3' ? variant.option3 : null,
          ].filter(Boolean);
          const newName = remainingOptions.join(" / ") || "Default";
          
          const { error: variantError } = await supabase
            .from("product_variants")
            .update({ ...newOptionValue, name: newName })
            .eq("id", variant.id);
          if (variantError) throw variantError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-edit", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      setDeleteOptionKey(null);
      toast({ title: "Option deleted", description: "The option has been removed from the product." });
    },
    onError: (error) => {
      toast({ title: "Error deleting option", description: error.message, variant: "destructive" });
    },
  });

  // Add new option
  const addOptionMutation = useMutation({
    mutationFn: async (name: string) => {
      // Find the next available option slot
      let fieldName: 'option1_name' | 'option2_name' | 'option3_name' | null = null;
      if (!option1Name) fieldName = 'option1_name';
      else if (!option2Name) fieldName = 'option2_name';
      else if (!option3Name) fieldName = 'option3_name';
      
      if (!fieldName) throw new Error("Maximum of 3 options allowed");

      const { error } = await supabase
        .from("products")
        .update({ [fieldName]: name })
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-edit", productId] });
      setIsAddOptionDialogOpen(false);
      setNewOptionName("");
      toast({ title: "Option added", description: "The new option has been added to the product." });
    },
    onError: (error) => {
      toast({ title: "Error adding option", description: error.message, variant: "destructive" });
    },
  });

  const handlePriceChange = (variantId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedVariants((prev) => ({ ...prev, [variantId]: { ...prev[variantId], price: numValue } }));
  };

  const handleStockChange = (variantId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditedVariants((prev) => ({ ...prev, [variantId]: { ...prev[variantId], stock_quantity: numValue } }));
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

  const startEditingOption = (key: 'option1' | 'option2' | 'option3', currentName: string) => {
    setEditingOption(key);
    setEditingOptionName(currentName);
  };

  const saveOptionName = () => {
    if (editingOption) {
      updateOptionNameMutation.mutate({ optionKey: editingOption, name: editingOptionName });
    }
  };

  const totalInventory = Object.values(editedVariants).reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

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
  ].filter(g => g.name);

  const hasOptions = option1Name || option2Name || option3Name;
  const canAddMoreOptions = !option1Name || !option2Name || !option3Name;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Variants</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
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
          <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add variant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Options Section - Shopify Style with Edit/Delete */}
        {optionGroups.length > 0 && (
          <div className="space-y-3">
            {optionGroups.map((group) => (
              <div key={group.key} className="border rounded-lg p-4 group/option">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-muted-foreground cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    {editingOption === group.key ? (
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          value={editingOptionName}
                          onChange={(e) => setEditingOptionName(e.target.value)}
                          className="h-8 w-48"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveOptionName();
                            if (e.key === 'Escape') setEditingOption(null);
                          }}
                        />
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={saveOptionName}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingOption(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-sm">{group.name}</p>
                        <div className="opacity-0 group-hover/option:opacity-100 transition-opacity flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => startEditingOption(group.key, group.name || "")}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteOptionKey(group.key)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {group.values.length > 0 ? (
                        group.values.map((value) => (
                          <Badge key={value} variant="secondary" className="font-normal px-3 py-1">
                            {value}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No values yet - add variants to define values</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {canAddMoreOptions && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground"
                onClick={() => setIsAddOptionDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add another option
              </Button>
            )}
          </div>
        )}

        {/* No options yet - show add option button */}
        {!hasOptions && (
          <div className="border-2 border-dashed rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Add options like size, color, or flavor to create variants.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAddOptionDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add option
            </Button>
          </div>
        )}

        {/* Variants Table */}
        {variants && variants.length > 0 && (
          <>
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
                      <Checkbox checked={selectedVariants.length === variants.length} onCheckedChange={handleSelectAll} />
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
                          <Checkbox checked={selectedVariants.includes(variant.id)} onCheckedChange={(checked) => handleSelectVariant(variant.id, checked === true)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button type="button" className="h-12 w-12 rounded-md bg-muted flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden border">
                                  {variantImage ? (
                                    <img src={variantImage.image_url} alt={variantImage.alt_text || variant.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-2 bg-popover" align="start">
                                <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Select image for {variant.name}</p>
                                {productImages && productImages.length > 0 ? (
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {productImages.map((img) => {
                                      const currentAssigned = getVariantImage(variant.id);
                                      const isSelected = currentAssigned?.id === img.id && isImageDirectlyAssigned(variant.id);
                                      return (
                                        <button
                                          key={img.id}
                                          type="button"
                                          onClick={() => assignImageMutation.mutate({ imageId: img.id, variantId: variant.id })}
                                          className={cn("relative aspect-square rounded overflow-hidden border-2 transition-all hover:border-primary", isSelected ? "border-primary ring-1 ring-primary" : "border-transparent")}
                                        >
                                          <img src={img.image_url} alt={img.alt_text || "Product image"} className="h-full w-full object-cover" />
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
                                  <p className="text-xs text-muted-foreground text-center py-4">No images available</p>
                                )}
                              </PopoverContent>
                            </Popover>
                            <div>
                              <p className="font-medium text-sm">{variant.name}</p>
                              {variant.sku && <p className="text-xs text-muted-foreground">{variant.sku}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative w-36">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₫</span>
                            <Input
                              type="text"
                              value={editedVariants[variant.id]?.price?.toLocaleString() ?? variant.price?.toLocaleString()}
                              onChange={(e) => { const value = e.target.value.replace(/,/g, ''); handlePriceChange(variant.id, value); }}
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

            <div className="text-center py-3 text-sm text-muted-foreground border-t">
              Total inventory across all locations: <span className="font-medium text-foreground">{totalInventory} available</span>
            </div>
          </>
        )}

        {(!variants || variants.length === 0) && hasOptions && (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">No variants configured</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => setIsAddDialogOpen(true)}>
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
            <DialogDescription>Create a new product variant with its own price and inventory.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {option1Name && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm">{option1Name}</Label>
                <div className="col-span-3">
                  {option1Values.length > 0 && (
                    <Select value={newVariant.option1} onValueChange={(val) => setNewVariant(prev => ({ ...prev, option1: val }))}>
                      <SelectTrigger><SelectValue placeholder={`Select ${option1Name}`} /></SelectTrigger>
                      <SelectContent>
                        {option1Values.map((val) => (<SelectItem key={val} value={val}>{val}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input
                    className={option1Values.length > 0 ? "mt-2" : ""}
                    placeholder={option1Values.length > 0 ? `Or type new ${option1Name}` : `Enter ${option1Name}`}
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
                  {option2Values.length > 0 && (
                    <Select value={newVariant.option2} onValueChange={(val) => setNewVariant(prev => ({ ...prev, option2: val }))}>
                      <SelectTrigger><SelectValue placeholder={`Select ${option2Name}`} /></SelectTrigger>
                      <SelectContent>
                        {option2Values.map((val) => (<SelectItem key={val} value={val}>{val}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input
                    className={option2Values.length > 0 ? "mt-2" : ""}
                    placeholder={option2Values.length > 0 ? `Or type new ${option2Name}` : `Enter ${option2Name}`}
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
                  {option3Values.length > 0 && (
                    <Select value={newVariant.option3} onValueChange={(val) => setNewVariant(prev => ({ ...prev, option3: val }))}>
                      <SelectTrigger><SelectValue placeholder={`Select ${option3Name}`} /></SelectTrigger>
                      <SelectContent>
                        {option3Values.map((val) => (<SelectItem key={val} value={val}>{val}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input
                    className={option3Values.length > 0 ? "mt-2" : ""}
                    placeholder={option3Values.length > 0 ? `Or type new ${option3Name}` : `Enter ${option3Name}`}
                    value={option3Values.includes(newVariant.option3) ? "" : newVariant.option3}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, option3: e.target.value }))}
                  />
                </div>
              </div>
            )}
            {!hasOptions && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm">Name</Label>
                <Input value={newVariant.name} onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))} className="col-span-3" placeholder="e.g., Small, Medium, Large" />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm">Price</Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₫</span>
                <Input type="number" min="0" step="1000" value={newVariant.price} onChange={(e) => setNewVariant(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} className="pl-7" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm">SKU</Label>
              <Input value={newVariant.sku} onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value }))} className="col-span-3" placeholder="Stock keeping unit" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm">Quantity</Label>
              <Input type="number" min="0" value={newVariant.stock_quantity} onChange={(e) => setNewVariant(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVariant} disabled={addVariantMutation.isPending}>
              {addVariantMutation.isPending ? "Adding..." : "Add variant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Option Dialog */}
      <Dialog open={isAddOptionDialogOpen} onOpenChange={setIsAddOptionDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add option</DialogTitle>
            <DialogDescription>Add an option like size, color, or flavor to create product variants.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="optionName" className="text-sm">Option name</Label>
            <Input
              id="optionName"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              placeholder="e.g., Size, Color, Flavor"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newOptionName.trim()) {
                  addOptionMutation.mutate(newOptionName.trim());
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOptionDialogOpen(false); setNewOptionName(""); }}>Cancel</Button>
            <Button onClick={() => addOptionMutation.mutate(newOptionName.trim())} disabled={!newOptionName.trim() || addOptionMutation.isPending}>
              {addOptionMutation.isPending ? "Adding..." : "Add option"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Option Confirmation Dialog */}
      <AlertDialog open={!!deleteOptionKey} onOpenChange={(open) => !open && setDeleteOptionKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete option?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the option from the product and clear this option's values from all variants. The variants themselves will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteOptionKey && deleteOptionMutation.mutate(deleteOptionKey)}
            >
              Delete option
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
