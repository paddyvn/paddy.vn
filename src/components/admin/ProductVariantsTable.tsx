import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Package, Check, Trash2, GripVertical, Search, SlidersHorizontal, Database, X, ChevronDown, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, useMemo } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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

interface OptionTemplate {
  id: string;
  name: string;
  values: string[];
}

interface OptionCardProps {
  optionKey: 'option1' | 'option2' | 'option3';
  optionName: string;
  values: string[];
  suggestedValues: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateName: (name: string) => void;
  onUpdateValue: (oldValue: string, newValue: string) => void;
  onDeleteValue: (value: string) => void;
  onAddValue: (value: string) => void;
  onDelete: () => void;
  isUpdating: boolean;
}

function OptionCard({
  optionKey,
  optionName,
  values,
  suggestedValues,
  isExpanded,
  onToggleExpand,
  onUpdateName,
  onUpdateValue,
  onDeleteValue,
  onAddValue,
  onDelete,
  isUpdating,
}: OptionCardProps) {
  const [editingName, setEditingName] = useState(optionName);
  const [newValue, setNewValue] = useState("");
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [showValueSuggestions, setShowValueSuggestions] = useState(false);

  // Filter suggested values that are not already in use
  const availableSuggestions = suggestedValues.filter(sv => !values.includes(sv));

  useEffect(() => {
    setEditingName(optionName);
  }, [optionName]);

  useEffect(() => {
    const initial: Record<string, string> = {};
    values.forEach((v) => {
      initial[v] = v;
    });
    setEditingValues(initial);
  }, [values]);

  const handleAddValue = () => {
    if (newValue.trim() && !values.includes(newValue.trim())) {
      onAddValue(newValue.trim());
      setNewValue("");
    }
  };

  const handleValueBlur = (originalValue: string) => {
    const newVal = editingValues[originalValue];
    if (newVal && newVal !== originalValue && !values.includes(newVal)) {
      onUpdateValue(originalValue, newVal);
    }
  };

  if (!isExpanded) {
    // Collapsed state - show option name with values as badges
    return (
      <div 
        className="border rounded-lg p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm mb-2">{optionName}</p>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => (
                <Badge key={value} variant="secondary" className="font-normal px-3 py-1">
                  {value}
                </Badge>
              ))}
              {values.length === 0 && (
                <span className="text-sm text-muted-foreground italic">No values</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Expanded state - full editing interface
  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Option Name */}
      <div className="flex items-start gap-3">
        <div className="mt-2.5 text-muted-foreground cursor-grab">
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-muted-foreground">Option name</Label>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => {
                if (editingName.trim() && editingName !== optionName) {
                  onUpdateName(editingName.trim());
                }
              }}
              className="w-full"
            />
          </div>

          {/* Option Values */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Option values</Label>
            <div className="space-y-2">
              {values.map((value) => (
                <div key={value} className="flex items-center gap-2">
                  <div className="text-muted-foreground cursor-grab">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <Input
                    value={editingValues[value] ?? value}
                    onChange={(e) => setEditingValues((prev) => ({ ...prev, [value]: e.target.value }))}
                    onBlur={() => handleValueBlur(value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteValue(value)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {/* Add new value input with suggestions */}
              <div className="flex items-center gap-2 relative">
                <div className="w-4" /> {/* Spacer for alignment */}
                <Popover open={showValueSuggestions && availableSuggestions.length > 0} onOpenChange={setShowValueSuggestions}>
                  <PopoverTrigger asChild>
                    <Input
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onFocus={() => setShowValueSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddValue();
                          setShowValueSuggestions(false);
                        }
                        if (e.key === "Escape") {
                          setShowValueSuggestions(false);
                        }
                      }}
                      placeholder="Add another value"
                      className="flex-1"
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Command>
                      <CommandList>
                        <CommandGroup heading="Suggested values">
                          {availableSuggestions
                            .filter(s => s.toLowerCase().includes(newValue.toLowerCase()))
                            .slice(0, 8)
                            .map((suggestion) => (
                              <CommandItem
                                key={suggestion}
                                onSelect={() => {
                                  onAddValue(suggestion);
                                  setNewValue("");
                                  setShowValueSuggestions(false);
                                }}
                              >
                                {suggestion}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="w-9" /> {/* Spacer for alignment */}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              Delete
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onToggleExpand}
              disabled={isUpdating}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newVariant, setNewVariant] = useState<NewVariant>(defaultNewVariant);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  
  // Option management state
  const [expandedOption, setExpandedOption] = useState<'option1' | 'option2' | 'option3' | null>(null);
  const [showAddOptionMenu, setShowAddOptionMenu] = useState(false);
  const [addOptionSearch, setAddOptionSearch] = useState("");
  const [deleteOptionKey, setDeleteOptionKey] = useState<'option1' | 'option2' | 'option3' | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

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

  // Fetch option templates from database
  const { data: optionTemplates } = useQuery({
    queryKey: ["option-templates"],
    queryFn: async () => {
      const { data: templates, error: templatesError } = await supabase
        .from("product_option_templates")
        .select("id, name, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (templatesError) throw templatesError;

      const { data: values, error: valuesError } = await supabase
        .from("product_option_template_values")
        .select("template_id, value, display_order")
        .order("display_order", { ascending: true });
      if (valuesError) throw valuesError;

      // Group values by template
      const result: OptionTemplate[] = templates.map(t => ({
        id: t.id,
        name: t.name,
        values: values.filter(v => v.template_id === t.id).map(v => v.value)
      }));
      return result;
    },
  });

  // Also fetch all unique option names used across all products for auto-suggestions
  const { data: existingOptionNames } = useQuery({
    queryKey: ["existing-option-names"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("option1_name, option2_name, option3_name");
      if (error) throw error;
      const names = new Set<string>();
      data.forEach(p => {
        if (p.option1_name) names.add(p.option1_name);
        if (p.option2_name) names.add(p.option2_name);
        if (p.option3_name) names.add(p.option3_name);
      });
      return Array.from(names);
    },
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
      toast({ title: "Option updated", description: "The option name has been updated." });
    },
    onError: (error) => {
      toast({ title: "Error updating option", description: error.message, variant: "destructive" });
    },
  });

  // Mutation to update option value across variants
  const updateOptionValueMutation = useMutation({
    mutationFn: async ({ 
      optionKey, 
      oldValue, 
      newValue 
    }: { 
      optionKey: 'option1' | 'option2' | 'option3'; 
      oldValue: string; 
      newValue: string;
    }) => {
      if (!variants) return;
      
      const variantsToUpdate = variants.filter(v => v[optionKey] === oldValue);
      for (const variant of variantsToUpdate) {
        const newName = [
          optionKey === 'option1' ? newValue : variant.option1,
          optionKey === 'option2' ? newValue : variant.option2,
          optionKey === 'option3' ? newValue : variant.option3,
        ].filter(Boolean).join(" / ") || "Default";
        
        const { error } = await supabase
          .from("product_variants")
          .update({ [optionKey]: newValue, name: newName })
          .eq("id", variant.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      toast({ title: "Value updated", description: "The option value has been updated." });
    },
    onError: (error) => {
      toast({ title: "Error updating value", description: error.message, variant: "destructive" });
    },
  });

  // Mutation to delete option value (deletes variants with that value)
  const deleteOptionValueMutation = useMutation({
    mutationFn: async ({ 
      optionKey, 
      value 
    }: { 
      optionKey: 'option1' | 'option2' | 'option3'; 
      value: string;
    }) => {
      if (!variants) return;
      
      const variantsToDelete = variants.filter(v => v[optionKey] === value);
      for (const variant of variantsToDelete) {
        const { error } = await supabase
          .from("product_variants")
          .delete()
          .eq("id", variant.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-variants-count", productId] });
      toast({ title: "Value deleted", description: "Variants with this value have been removed." });
    },
    onError: (error) => {
      toast({ title: "Error deleting value", description: error.message, variant: "destructive" });
    },
  });

  // Mutation to add a new option value (creates new variants with auto-combinations)
  const addOptionValueMutation = useMutation({
    mutationFn: async ({ 
      optionKey, 
      value 
    }: { 
      optionKey: 'option1' | 'option2' | 'option3'; 
      value: string;
    }) => {
      // Get existing option values
      const opt1Vals = option1Name && variants ? [...new Set(variants.map(v => v.option1).filter(Boolean))] as string[] : [];
      const opt2Vals = option2Name && variants ? [...new Set(variants.map(v => v.option2).filter(Boolean))] as string[] : [];
      const opt3Vals = option3Name && variants ? [...new Set(variants.map(v => v.option3).filter(Boolean))] as string[] : [];
      
      const variantsToCreate: { name: string; option1: string | null; option2: string | null; option3: string | null }[] = [];
      
      if (optionKey === 'option1') {
        // Adding a new main variant value - create combinations with all option2 and option3 values
        if (opt2Vals.length > 0 && opt3Vals.length > 0) {
          for (const o2 of opt2Vals) {
            for (const o3 of opt3Vals) {
              variantsToCreate.push({ name: `${value} / ${o2} / ${o3}`, option1: value, option2: o2, option3: o3 });
            }
          }
        } else if (opt2Vals.length > 0) {
          for (const o2 of opt2Vals) {
            variantsToCreate.push({ name: `${value} / ${o2}`, option1: value, option2: o2, option3: null });
          }
        } else {
          variantsToCreate.push({ name: value, option1: value, option2: null, option3: null });
        }
      } else if (optionKey === 'option2') {
        // Adding a sub-variant value - create combinations with all option1 values
        if (opt1Vals.length > 0 && opt3Vals.length > 0) {
          for (const o1 of opt1Vals) {
            for (const o3 of opt3Vals) {
              variantsToCreate.push({ name: `${o1} / ${value} / ${o3}`, option1: o1, option2: value, option3: o3 });
            }
          }
        } else if (opt1Vals.length > 0) {
          for (const o1 of opt1Vals) {
            variantsToCreate.push({ name: `${o1} / ${value}`, option1: o1, option2: value, option3: null });
          }
        } else {
          variantsToCreate.push({ name: value, option1: null, option2: value, option3: null });
        }
      } else if (optionKey === 'option3') {
        // Adding a third-level value - create combinations with all option1 and option2 values
        if (opt1Vals.length > 0 && opt2Vals.length > 0) {
          for (const o1 of opt1Vals) {
            for (const o2 of opt2Vals) {
              variantsToCreate.push({ name: `${o1} / ${o2} / ${value}`, option1: o1, option2: o2, option3: value });
            }
          }
        } else if (opt1Vals.length > 0) {
          for (const o1 of opt1Vals) {
            variantsToCreate.push({ name: `${o1} / ${value}`, option1: o1, option2: null, option3: value });
          }
        } else {
          variantsToCreate.push({ name: value, option1: null, option2: null, option3: value });
        }
      }
      
      // Insert all new variants
      for (const variant of variantsToCreate) {
        const { error } = await supabase.from("product_variants").insert({
          product_id: productId,
          name: variant.name,
          option1: variant.option1,
          option2: variant.option2,
          option3: variant.option3,
          price: 0,
          stock_quantity: 0,
        });
        if (error) throw error;
      }
      
      return variantsToCreate.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-variants-count", productId] });
      toast({ title: "Value added", description: `Created ${count} new variant${count > 1 ? 's' : ''}.` });
    },
    onError: (error) => {
      toast({ title: "Error adding value", description: error.message, variant: "destructive" });
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
      setExpandedOption(null);
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
      setShowAddOptionMenu(false);
      setAddOptionSearch("");
      toast({ title: "Option added", description: "The new option has been added to the product." });
    },
    onError: (error) => {
      toast({ title: "Error adding option", description: error.message, variant: "destructive" });
    },
  });

  // Generate all combinations from option values
  const generateCombinationsMutation = useMutation({
    mutationFn: async (defaultPrice: number) => {
      // Get all option values
      const opt1Vals = option1Name ? getUniqueOptionValues('option1') : [];
      const opt2Vals = option2Name ? getUniqueOptionValues('option2') : [];
      const opt3Vals = option3Name ? getUniqueOptionValues('option3') : [];

      // Generate all combinations
      const combinations: { option1: string | null; option2: string | null; option3: string | null }[] = [];
      
      if (opt1Vals.length > 0 && opt2Vals.length > 0 && opt3Vals.length > 0) {
        // 3 options
        for (const o1 of opt1Vals) {
          for (const o2 of opt2Vals) {
            for (const o3 of opt3Vals) {
              combinations.push({ option1: o1, option2: o2, option3: o3 });
            }
          }
        }
      } else if (opt1Vals.length > 0 && opt2Vals.length > 0) {
        // 2 options
        for (const o1 of opt1Vals) {
          for (const o2 of opt2Vals) {
            combinations.push({ option1: o1, option2: o2, option3: null });
          }
        }
      } else if (opt1Vals.length > 0) {
        // 1 option
        for (const o1 of opt1Vals) {
          combinations.push({ option1: o1, option2: null, option3: null });
        }
      }

      if (combinations.length === 0) {
        throw new Error("No option values defined to generate combinations");
      }

      // Check which combinations already exist
      const existingCombos = new Set(
        variants?.map(v => `${v.option1 || ''}|${v.option2 || ''}|${v.option3 || ''}`) || []
      );

      // Insert only new combinations
      let insertedCount = 0;
      for (const combo of combinations) {
        const comboKey = `${combo.option1 || ''}|${combo.option2 || ''}|${combo.option3 || ''}`;
        if (!existingCombos.has(comboKey)) {
          const variantName = [combo.option1, combo.option2, combo.option3].filter(Boolean).join(" / ");
          const { error } = await supabase.from("product_variants").insert({
            product_id: productId,
            name: variantName,
            option1: combo.option1,
            option2: combo.option2,
            option3: combo.option3,
            price: defaultPrice,
            stock_quantity: 0,
          });
          if (error) throw error;
          insertedCount++;
        }
      }

      return { total: combinations.length, inserted: insertedCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-variants-count", productId] });
      toast({ 
        title: "Combinations generated", 
        description: `Created ${result.inserted} new variants (${result.total - result.inserted} already existed).` 
      });
    },
    onError: (error) => {
      toast({ title: "Error generating combinations", description: error.message, variant: "destructive" });
    },
  });

  // Calculate expected combinations count
  const getExpectedCombinationsCount = () => {
    const opt1Count = option1Name ? getUniqueOptionValues('option1').length : 0;
    const opt2Count = option2Name ? getUniqueOptionValues('option2').length : 0;
    const opt3Count = option3Name ? getUniqueOptionValues('option3').length : 0;
    
    if (opt1Count > 0 && opt2Count > 0 && opt3Count > 0) return opt1Count * opt2Count * opt3Count;
    if (opt1Count > 0 && opt2Count > 0) return opt1Count * opt2Count;
    if (opt1Count > 0) return opt1Count;
    return 0;
  };

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

  // Combine database templates + existing option names from products
  const allOptionSuggestions = useMemo(() => {
    const templateNames = optionTemplates?.map(t => t.name) || [];
    const existingNames = existingOptionNames || [];
    const combined = [...new Set([...templateNames, ...existingNames])];
    return combined;
  }, [optionTemplates, existingOptionNames]);

  // Filter options based on search
  const filteredRecommendedOptions = useMemo(() => {
    const currentOptions = [option1Name, option2Name, option3Name].filter(Boolean).map(n => n?.toLowerCase());
    return allOptionSuggestions.filter(
      opt => 
        !currentOptions.includes(opt.toLowerCase()) &&
        opt.toLowerCase().includes(addOptionSearch.toLowerCase())
    );
  }, [addOptionSearch, option1Name, option2Name, option3Name, allOptionSuggestions]);

  const showCreateCustomOption = addOptionSearch.trim() && 
    !allOptionSuggestions.some(opt => opt.toLowerCase() === addOptionSearch.toLowerCase()) &&
    ![option1Name, option2Name, option3Name].some(n => n?.toLowerCase() === addOptionSearch.toLowerCase());

  // Get suggested values for a given option name from templates or existing products
  const getSuggestedValuesForOption = (optName: string) => {
    const template = optionTemplates?.find(t => t.name.toLowerCase() === optName.toLowerCase());
    return template?.values || [];
  };

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
        {/* Options Section - Shopify Style */}
        {optionGroups.length > 0 && (
          <div className="space-y-3">
            {optionGroups.map((group) => (
              <OptionCard
                key={group.key}
                optionKey={group.key}
                optionName={group.name || ""}
                values={group.values}
                suggestedValues={getSuggestedValuesForOption(group.name || "")}
                isExpanded={expandedOption === group.key}
                onToggleExpand={() => setExpandedOption(expandedOption === group.key ? null : group.key)}
                onUpdateName={(name) => updateOptionNameMutation.mutate({ optionKey: group.key, name })}
                onUpdateValue={(oldValue, newValue) => updateOptionValueMutation.mutate({ optionKey: group.key, oldValue, newValue })}
                onDeleteValue={(value) => deleteOptionValueMutation.mutate({ optionKey: group.key, value })}
                onAddValue={(value) => addOptionValueMutation.mutate({ optionKey: group.key, value })}
                onDelete={() => setDeleteOptionKey(group.key)}
                isUpdating={updateOptionNameMutation.isPending || updateOptionValueMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Add another option - Shopify style dropdown (only show when there ARE existing options) */}
        {hasOptions && canAddMoreOptions && (
          <Popover open={showAddOptionMenu} onOpenChange={setShowAddOptionMenu}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add another option
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search" 
                  value={addOptionSearch}
                  onValueChange={setAddOptionSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {!showCreateCustomOption && "No options found."}
                  </CommandEmpty>
                  {filteredRecommendedOptions.length > 0 && (
                    <CommandGroup heading="Recommended">
                      {filteredRecommendedOptions.map((opt) => (
                        <CommandItem
                          key={opt}
                          onSelect={() => {
                            addOptionMutation.mutate(opt);
                          }}
                        >
                          {opt}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {showCreateCustomOption && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            addOptionMutation.mutate(addOptionSearch.trim());
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create custom option
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}


        {/* No options yet - show add option prompt (only show when NO options exist) */}
        {!hasOptions && (
          <div className="border-2 border-dashed rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Add options like size, color, or flavor to create variants.
            </p>
            <Popover open={showAddOptionMenu} onOpenChange={setShowAddOptionMenu}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add option
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search" 
                    value={addOptionSearch}
                    onValueChange={setAddOptionSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {!showCreateCustomOption && "No options found."}
                    </CommandEmpty>
                    {filteredRecommendedOptions.length > 0 && (
                      <CommandGroup heading="Recommended">
                        {filteredRecommendedOptions.map((opt) => (
                          <CommandItem
                            key={opt}
                            onSelect={() => {
                              addOptionMutation.mutate(opt);
                            }}
                          >
                            {opt}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {showCreateCustomOption && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              addOptionMutation.mutate(addOptionSearch.trim());
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create custom option
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Variants Table - Grouped View */}
        {variants && variants.length > 0 && (
          <>
            {/* Group by selector and controls */}
            {option1Name && option2Name && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Group by</span>
                  <Badge variant="secondary">{option1Name}</Badge>
                </div>
                <div className="flex items-center gap-2">
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
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[40px]">
                      <Checkbox checked={selectedVariants.length === variants.length} onCheckedChange={handleSelectAll} />
                    </TableHead>
                    <TableHead className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>Variant</span>
                        {option1Name && option2Name && (
                          <button 
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setCollapsedGroups(new Set())}
                          >
                            · Expand all
                          </button>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="font-medium">Price</TableHead>
                    <TableHead className="font-medium text-right">Available</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {option1Name && option2Name ? (
                    // Grouped display
                    <>
                      {option1Values.map((groupValue) => {
                        const groupVariants = variants.filter(v => v.option1 === groupValue);
                        const isCollapsed = collapsedGroups.has(groupValue);
                        const groupImage = groupVariants.length > 0 ? getVariantImage(groupVariants[0].id) : null;
                        
                        return (
                          <React.Fragment key={groupValue}>
                            {/* Group Header Row */}
                            <TableRow className="bg-muted/20 hover:bg-muted/30">
                              <TableCell>
                                <Checkbox 
                                  checked={groupVariants.every(v => selectedVariants.includes(v.id))}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedVariants(prev => [...new Set([...prev, ...groupVariants.map(v => v.id)])]);
                                    } else {
                                      setSelectedVariants(prev => prev.filter(id => !groupVariants.some(v => v.id === id)));
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    className="h-10 w-10 rounded-md bg-muted flex items-center justify-center border overflow-hidden"
                                    onClick={() => {
                                      setCollapsedGroups(prev => {
                                        const next = new Set(prev);
                                        if (next.has(groupValue)) {
                                          next.delete(groupValue);
                                        } else {
                                          next.add(groupValue);
                                        }
                                        return next;
                                      });
                                    }}
                                  >
                                    {groupImage ? (
                                      <img src={groupImage.image_url} alt={groupValue} className="h-full w-full object-cover" />
                                    ) : (
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      className="flex items-center gap-1 hover:text-primary"
                                      onClick={() => {
                                        setCollapsedGroups(prev => {
                                          const next = new Set(prev);
                                          if (next.has(groupValue)) {
                                            next.delete(groupValue);
                                          } else {
                                            next.add(groupValue);
                                          }
                                          return next;
                                        });
                                      }}
                                    >
                                      {isCollapsed ? (
                                        <ChevronRight className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                      <span className="font-medium">{groupValue}</span>
                                    </button>
                                    <span className="text-xs text-muted-foreground">
                                      {groupVariants.length} variant{groupVariants.length > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">—</span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-sm text-muted-foreground">
                                  {groupVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)}
                                </span>
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                            
                            {/* Sub-variants */}
                            {!isCollapsed && groupVariants.map((variant) => {
                              const variantImage = getVariantImage(variant.id);
                              const displayName = variant.option2 || variant.name;
                              return (
                                <TableRow key={variant.id} className="group">
                                  <TableCell className="pl-8">
                                    <Checkbox 
                                      checked={selectedVariants.includes(variant.id)} 
                                      onCheckedChange={(checked) => handleSelectVariant(variant.id, checked === true)} 
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3 pl-6">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button type="button" className="h-10 w-10 rounded-md bg-muted flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden border">
                                            {variantImage ? (
                                              <img src={variantImage.image_url} alt={variantImage.alt_text || variant.name} className="h-full w-full object-cover" />
                                            ) : (
                                              <Package className="h-4 w-4 text-muted-foreground" />
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
                                        <p className="font-medium text-sm">{displayName}</p>
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
                          </React.Fragment>
                        );
                      })}
                    </>
                  ) : (
                    // Flat display (single option or no grouping)
                    variants.map((variant) => {
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
                    })
                  )}
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
