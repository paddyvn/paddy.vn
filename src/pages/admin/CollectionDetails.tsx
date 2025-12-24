import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Upload, X, Save, Eye, Plus, Trash2, Copy, MoreHorizontal, Pencil, ChevronDown, Search, GripVertical } from "lucide-react";
import { ProductSelectorDialog } from "@/components/admin/ProductSelectorDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImagePickerDialog } from "@/components/admin/ImagePickerDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ConditionFieldSelector,
  ConditionOperatorSelector,
  ConditionValueSelector,
  getFieldType,
} from "@/components/admin/ConditionFieldSelector";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CollectionTypeSelector } from "@/components/admin/CollectionTypeSelector";

const collectionSchema = z.object({
  name: z.string().trim().min(1, "Title is required").max(100),
  slug: z.string().trim().min(1, "Slug is required").max(100),
  description: z.string().max(50000).optional(),
  image_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(160).optional(),
});

type CollectionRule = {
  field: string;
  operator: string;
  value: string;
};

// Sortable Product Row Component
interface SortableProductRowProps {
  product: any;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
  isManualCollection: boolean;
  getPrimaryImage: (images: Array<{ image_url: string; is_primary: boolean }>) => string | undefined;
}

function SortableProductRow({
  product,
  index,
  isSelected,
  onToggleSelect,
  onEdit,
  onRemove,
  isManualCollection,
  getPrimaryImage,
}: SortableProductRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group ${
        isDragging ? 'bg-muted shadow-lg z-50' : ''
      }`}
    >
      {isManualCollection && (
        <>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
          />
        </>
      )}
      <span className="text-sm text-muted-foreground w-6">
        {index + 1}.
      </span>
      {getPrimaryImage(product.product_images) ? (
        <img
          src={getPrimaryImage(product.product_images)}
          alt={product.name}
          className="w-12 h-12 rounded object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-muted" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{product.name}</p>
      </div>
      <Badge variant={product.is_active ? "default" : "secondary"}>
        {product.is_active ? "Active" : "Inactive"}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      {isManualCollection && (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default function CollectionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNewCollection = id === "new";
  const [isSaving, setIsSaving] = useState(false);
  const [isSeoEditing, setIsSeoEditing] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isPreviewingConditions, setIsPreviewingConditions] = useState(false);
  const [previewedProducts, setPreviewedProducts] = useState<any[] | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    is_active: true,
    meta_title: "",
    meta_description: "",
    collection_type: "manual",
    rules_match_type: "all",
  });
  const [rules, setRules] = useState<CollectionRule[]>([]);
  const [productsPage, setProductsPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20;
  const [seoFormData, setSeoFormData] = useState({
    meta_title: "",
    meta_description: "",
    slug: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [manuallySelectedProducts, setManuallySelectedProducts] = useState<any[]>([]);
  const [removedProductIds, setRemovedProductIds] = useState<Set<string>>(new Set());
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [reorderedProducts, setReorderedProducts] = useState<any[] | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: collection, isLoading } = useQuery({
    queryKey: ["collection", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select(`
          *,
          product_collections(
            id,
            position,
            product_id,
            products(
              id,
              name,
              base_price,
              is_active,
              product_images(image_url, is_primary)
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as any;
    },
    enabled: !!id && !isNewCollection,
  });

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        slug: collection.slug,
        description: collection.description || "",
        image_url: collection.image_url || "",
        is_active: collection.is_active,
        meta_title: collection.meta_title || "",
        meta_description: collection.meta_description || "",
        collection_type: collection.collection_type || "custom",
        rules_match_type: collection.rules_match_type || "all",
      });
      setSeoFormData({
        meta_title: collection.meta_title || "",
        meta_description: collection.meta_description || "",
        slug: collection.slug,
      });
      setRules(collection.rules || []);
    }
  }, [collection]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  const validateForm = () => {
    try {
      collectionSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const collectionData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
        is_active: formData.is_active,
        meta_title: formData.meta_title.trim() || null,
        meta_description: formData.meta_description.trim() || null,
        collection_type: formData.collection_type,
        rules: rules.length > 0 ? rules : null,
        rules_match_type: formData.rules_match_type,
      };

      if (isNewCollection) {
        const { data, error } = await supabase
          .from("categories")
          .insert(collectionData)
          .select()
          .single();

        if (error) throw error;

        // If manual collection with products, save product_collections
        if (formData.collection_type !== "smart" && manuallySelectedProducts.length > 0) {
          const productCollections = manuallySelectedProducts.map((product, index) => ({
            collection_id: data.id,
            product_id: product.id,
            position: index,
          }));
          
          const { error: pcError } = await supabase
            .from("product_collections")
            .insert(productCollections);
          
          if (pcError) console.error("Error saving product collections:", pcError);
        }

        toast({
          title: "Collection created",
          description: "Your collection has been created successfully.",
        });

        // Navigate to the new collection's edit page
        navigate(`/admin/collections/${data.id}`, { replace: true });
      } else {
        const { error } = await supabase
          .from("categories")
          .update(collectionData)
          .eq("id", id);

        if (error) throw error;

        // If manual collection, handle product additions and removals
        if (formData.collection_type !== "smart") {
          // Remove products marked for removal
          if (removedProductIds.size > 0) {
            const { error: deleteError } = await supabase
              .from("product_collections")
              .delete()
              .eq("collection_id", id)
              .in("product_id", Array.from(removedProductIds));
            
            if (deleteError) console.error("Error removing products:", deleteError);
          }

          // Add new products
          if (manuallySelectedProducts.length > 0) {
            const existingIds = new Set(linkedProducts.map((p: any) => p.id));
            const newProducts = manuallySelectedProducts.filter(p => !existingIds.has(p.id));
            
            if (newProducts.length > 0) {
              const remainingCount = linkedProducts.filter((p: any) => !removedProductIds.has(p.id)).length;
              const productCollections = newProducts.map((product, index) => ({
                collection_id: id,
                product_id: product.id,
                position: remainingCount + index,
              }));
              
              const { error: pcError } = await supabase
                .from("product_collections")
                .insert(productCollections);
              
              if (pcError) console.error("Error saving product collections:", pcError);
            }
          }
        }

        toast({
          title: "Collection updated",
          description: "Your changes have been saved successfully.",
        });
        
        // Clear state after save
        setManuallySelectedProducts([]);
        setRemovedProductIds(new Set());
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addRule = () => {
    setRules([...rules, { field: "brand", operator: "equals", value: "" }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof CollectionRule, value: string) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
    // Clear preview when rules change
    setPreviewedProducts(null);
  };

  const previewMatchingProducts = async () => {
    if (rules.length === 0) {
      toast({
        title: "No conditions",
        description: "Please add at least one condition to preview matching products.",
        variant: "destructive",
      });
      return;
    }

    setIsPreviewingConditions(true);
    try {
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          base_price,
          is_active,
          brand,
          product_type,
          tags,
          product_images(image_url, is_primary)
        `)
        .eq("is_active", true);

      // Apply each rule as a filter
      for (const rule of rules) {
        if (!rule.value.trim()) continue;

        const value = rule.value.trim();
        
        switch (rule.field) {
          case "brand":
            if (rule.operator === "equals") {
              query = query.ilike("brand", value);
            } else if (rule.operator === "not_equals") {
              query = query.not("brand", "ilike", value);
            } else if (rule.operator === "contains") {
              query = query.ilike("brand", `%${value}%`);
            } else if (rule.operator === "starts_with") {
              query = query.ilike("brand", `${value}%`);
            } else if (rule.operator === "ends_with") {
              query = query.ilike("brand", `%${value}`);
            }
            break;
          case "product_type":
            if (rule.operator === "equals") {
              query = query.ilike("product_type", value);
            } else if (rule.operator === "not_equals") {
              query = query.not("product_type", "ilike", value);
            } else if (rule.operator === "contains") {
              query = query.ilike("product_type", `%${value}%`);
            }
            break;
          case "tags":
            if (rule.operator === "equals" || rule.operator === "contains") {
              query = query.ilike("tags", `%${value}%`);
            } else if (rule.operator === "not_equals" || rule.operator === "not_contains") {
              query = query.not("tags", "ilike", `%${value}%`);
            }
            break;
          case "title":
            if (rule.operator === "equals") {
              query = query.ilike("name", value);
            } else if (rule.operator === "not_equals") {
              query = query.not("name", "ilike", value);
            } else if (rule.operator === "contains") {
              query = query.ilike("name", `%${value}%`);
            } else if (rule.operator === "starts_with") {
              query = query.ilike("name", `${value}%`);
            } else if (rule.operator === "ends_with") {
              query = query.ilike("name", `%${value}`);
            }
            break;
          case "price":
            const priceValue = parseFloat(value);
            if (!isNaN(priceValue)) {
              if (rule.operator === "equals") {
                query = query.eq("base_price", priceValue);
              } else if (rule.operator === "not_equals") {
                query = query.neq("base_price", priceValue);
              } else if (rule.operator === "greater_than") {
                query = query.gt("base_price", priceValue);
              } else if (rule.operator === "less_than") {
                query = query.lt("base_price", priceValue);
              }
            }
            break;
        }
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      setPreviewedProducts(data || []);
      setProductsPage(1);
      
      toast({
        title: "Preview loaded",
        description: `Found ${data?.length || 0} matching products.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to preview products",
        variant: "destructive",
      });
    } finally {
      setIsPreviewingConditions(false);
    }
  };

  const handleSeoSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          meta_title: seoFormData.meta_title.trim() || null,
          meta_description: seoFormData.meta_description.trim() || null,
          slug: seoFormData.slug.trim(),
        })
        .eq("id", id);

      if (error) throw error;

      setFormData({
        ...formData,
        meta_title: seoFormData.meta_title,
        meta_description: seoFormData.meta_description,
        slug: seoFormData.slug,
      });

      toast({
        title: "SEO settings updated",
        description: "Your search engine listing has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save SEO settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPrimaryImage = (images: Array<{ image_url: string; is_primary: boolean }>) => {
    const primary = images?.find(img => img.is_primary);
    return primary?.image_url || images?.[0]?.image_url;
  };

  if (isLoading && !isNewCollection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-[300px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[300px]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!collection && !isNewCollection) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Collection not found</p>
        <Button onClick={() => navigate("/admin/collections")} className="mt-4">
          Back to Collections
        </Button>
      </div>
    );
  }

  // Helper to check if collection is manual type (includes legacy "custom" value)
  const isManualCollection = formData.collection_type !== "smart";

  // Use previewed products for smart collections if available, otherwise use linked products
  const linkedProducts = collection?.product_collections
    ?.map((pc: any) => pc.products)
    .filter(Boolean) || [];
  
  // For manual collections, combine linked products with manually selected ones
  const getProducts = () => {
    // If user has reordered, use that order
    if (reorderedProducts !== null) {
      return reorderedProducts;
    }

    if (formData.collection_type === "smart" && previewedProducts !== null) {
      return previewedProducts;
    }
    
    // Filter out removed products from linked products
    const filteredLinkedProducts = linkedProducts.filter((p: any) => !removedProductIds.has(p.id));
    
    if (isManualCollection) {
      // Combine existing linked products with newly selected ones
      const existingIds = new Set(filteredLinkedProducts.map((p: any) => p.id));
      const newProducts = manuallySelectedProducts.filter(p => !existingIds.has(p.id));
      return [...filteredLinkedProducts, ...newProducts];
    }
    return filteredLinkedProducts;
  };
  
  const products = getProducts();
  
  const handleProductsSelect = (selectedProducts: any[]) => {
    setManuallySelectedProducts(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const newProducts = selectedProducts.filter(p => !existingIds.has(p.id));
      return [...prev, ...newProducts];
    });
    // Clear reordered state when adding new products
    setReorderedProducts(null);
  };
  
  const removeManualProduct = (productId: string) => {
    setManuallySelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const removeProductFromCollection = (productId: string) => {
    // Check if it's a manually added product (not saved yet)
    const isManuallyAdded = manuallySelectedProducts.some(p => p.id === productId);
    if (isManuallyAdded) {
      setManuallySelectedProducts(prev => prev.filter(p => p.id !== productId));
    } else {
      // It's an existing linked product - mark for removal
      setRemovedProductIds(prev => new Set([...prev, productId]));
    }
    // Also remove from selection
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
    // Update reordered list if exists
    if (reorderedProducts) {
      setReorderedProducts(prev => prev?.filter(p => p.id !== productId) || null);
    }
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedProductIds.size === products.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(products.map((p: any) => p.id)));
    }
  };

  const toggleSelectProduct = (productId: string) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleBulkRemove = () => {
    selectedProductIds.forEach(productId => {
      removeProductFromCollection(productId);
    });
    setSelectedProductIds(new Set());
  };

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p: any) => p.id === active.id);
      const newIndex = products.findIndex((p: any) => p.id === over.id);
      
      const newProducts = arrayMove(products, oldIndex, newIndex);
      setReorderedProducts(newProducts);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/collections")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isNewCollection ? "Create collection" : collection?.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNewCollection && (
            <>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`/collection/${formData.slug}`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    More actions
                    <MoreHorizontal className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-destructive">
                    Delete collection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? (isNewCollection ? "Creating..." : "Saving...") : (isNewCollection ? "Create" : "Save")}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description */}
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Summer Collection"
                maxLength={100}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                minHeight="400px"
              />
              {formErrors.description && (
                <p className="text-sm text-destructive">{formErrors.description}</p>
              )}
            </div>
          </Card>

          {/* Conditions - Only show for Smart collections */}
          {formData.collection_type === "smart" && (
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Conditions</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm">Products must match:</span>
                  <RadioGroup
                    value={formData.rules_match_type}
                    onValueChange={(value) => setFormData({ ...formData, rules_match_type: value })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="font-normal cursor-pointer">all conditions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="any" id="any" />
                      <Label htmlFor="any" className="font-normal cursor-pointer">any condition</Label>
                    </div>
                  </RadioGroup>
                </div>

                {rules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ConditionFieldSelector
                      value={rule.field}
                      onValueChange={(value) => updateRule(index, "field", value)}
                    />

                    <ConditionOperatorSelector
                      value={rule.operator}
                      onValueChange={(value) => updateRule(index, "operator", value)}
                      fieldType={getFieldType(rule.field)}
                    />

                    <ConditionValueSelector
                      value={rule.value}
                      onValueChange={(value) => updateRule(index, "value", value)}
                      field={rule.field}
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRule(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addRule}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add another condition
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={previewMatchingProducts}
                    disabled={isPreviewingConditions || rules.length === 0}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isPreviewingConditions ? "Loading..." : "Preview matching products"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Products */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Products</h3>
            
            {/* Shopify-style search bar */}
            {isManualCollection && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products"
                    className="pl-10 cursor-pointer"
                    onClick={() => setIsProductSelectorOpen(true)}
                    readOnly
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsProductSelectorOpen(true)}
                >
                  Browse
                </Button>
                <Select defaultValue="best-selling">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort: Best selling" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best-selling">Sort: Best selling</SelectItem>
                    <SelectItem value="alphabetical">Sort: Alphabetical</SelectItem>
                    <SelectItem value="price-low">Sort: Price low to high</SelectItem>
                    <SelectItem value="price-high">Sort: Price high to low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {products.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <svg 
                  className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" 
                  />
                </svg>
                <p className="font-medium text-foreground">There are no products in this collection.</p>
                <p className="text-sm mt-1">Search or browse to add products.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bulk actions bar */}
                {isManualCollection && selectedProductIds.size > 0 && (
                  <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">
                      {selectedProductIds.size} product{selectedProductIds.size > 1 ? 's' : ''} selected
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkRemove}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove selected
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProductIds(new Set())}
                    >
                      Clear selection
                    </Button>
                  </div>
                )}

                {/* Select all header */}
                {isManualCollection && products.length > 0 && (
                  <div className="flex items-center gap-4 px-3 py-2 border-b">
                    <Checkbox
                      checked={selectedProductIds.size === products.length && products.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedProductIds.size === products.length ? 'Deselect all' : 'Select all'}
                    </span>
                  </div>
                )}

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={isManualCollection ? [restrictToVerticalAxis] : []}
                >
                  <SortableContext
                    items={products.slice((productsPage - 1) * PRODUCTS_PER_PAGE, productsPage * PRODUCTS_PER_PAGE).map((p: any) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {products
                        .slice((productsPage - 1) * PRODUCTS_PER_PAGE, productsPage * PRODUCTS_PER_PAGE)
                        .map((product: any, index: number) => (
                          <SortableProductRow
                            key={product.id}
                            product={product}
                            index={(productsPage - 1) * PRODUCTS_PER_PAGE + index}
                            isSelected={selectedProductIds.has(product.id)}
                            onToggleSelect={() => toggleSelectProduct(product.id)}
                            onEdit={() => navigate(`/admin/products/${product.id}`)}
                            onRemove={() => removeProductFromCollection(product.id)}
                            isManualCollection={isManualCollection}
                            getPrimaryImage={getPrimaryImage}
                          />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
                
                {/* Pagination */}
                {products.length > PRODUCTS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {(productsPage - 1) * PRODUCTS_PER_PAGE + 1} to{" "}
                      {Math.min(productsPage * PRODUCTS_PER_PAGE, products.length)} of{" "}
                      {products.length} products
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProductsPage(p => Math.max(1, p - 1))}
                        disabled={productsPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm px-2">
                        Page {productsPage} of {Math.ceil(products.length / PRODUCTS_PER_PAGE)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProductsPage(p => Math.min(Math.ceil(products.length / PRODUCTS_PER_PAGE), p + 1))}
                        disabled={productsPage >= Math.ceil(products.length / PRODUCTS_PER_PAGE)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Search Engine Listing */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Search engine listing</h3>
              {!isSeoEditing && (
                <Button 
                  variant="link" 
                  size="sm"
                  className="text-primary p-0 h-auto"
                  onClick={() => {
                    setSeoFormData({
                      meta_title: formData.meta_title || formData.name,
                      meta_description: formData.meta_description || formData.description?.replace(/<[^>]*>/g, '') || "",
                      slug: formData.slug,
                    });
                    setIsSeoEditing(true);
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
            
            {isSeoEditing ? (
              <div className="space-y-4">
                {/* Live Preview */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                  <h4 className="text-primary text-lg font-medium">
                    {seoFormData.meta_title || formData.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    https://paddy.vn › collections › {seoFormData.slug}
                  </p>
                  {seoFormData.meta_description && (
                    <p className="text-sm">
                      {seoFormData.meta_description}
                    </p>
                  )}
                </div>

                {/* Page Title */}
                <div className="space-y-2">
                  <Label htmlFor="seo-title">Page title</Label>
                  <Input
                    id="seo-title"
                    value={seoFormData.meta_title}
                    onChange={(e) => setSeoFormData({ ...seoFormData, meta_title: e.target.value })}
                    placeholder={formData.name}
                    maxLength={70}
                  />
                  <p className="text-xs text-muted-foreground">
                    {seoFormData.meta_title.length} of 70 characters used
                  </p>
                </div>

                {/* Meta Description */}
                <div className="space-y-2">
                  <Label htmlFor="seo-description">Meta description</Label>
                  <Textarea
                    id="seo-description"
                    value={seoFormData.meta_description}
                    onChange={(e) => setSeoFormData({ ...seoFormData, meta_description: e.target.value })}
                    placeholder="Enter a description..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {seoFormData.meta_description.length} of 160 characters used
                  </p>
                </div>

                {/* URL Handle */}
                <div className="space-y-2">
                  <Label htmlFor="seo-slug">URL handle</Label>
                  <Input
                    id="seo-slug"
                    value={seoFormData.slug}
                    onChange={(e) => setSeoFormData({ ...seoFormData, slug: e.target.value })}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    https://paddy.vn/collections/{seoFormData.slug}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsSeoEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={async () => {
                      await handleSeoSave();
                      setIsSeoEditing(false);
                    }} 
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <h4 className="text-primary text-lg">
                  {formData.meta_title || formData.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  https://paddy.vn › collections › {formData.slug}
                </p>
                {(formData.meta_description || formData.description) && (
                  <p className="text-sm line-clamp-2">
                    {formData.meta_description || formData.description?.replace(/<[^>]*>/g, '')}
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Image */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Image</h3>
              {formData.image_url && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                      Edit
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background">
                    <DropdownMenuItem onClick={() => setIsImagePickerOpen(true)}>
                      Change image
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setFormData({ ...formData, image_url: "" })}>
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {formData.image_url ? (
              <img
                src={formData.image_url}
                alt={formData.name}
                className="w-full aspect-square object-contain rounded-lg bg-muted/30"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsImagePickerOpen(true)}
                className="w-full border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to add an image
                </p>
              </button>
            )}
          </Card>

          <ImagePickerDialog
            open={isImagePickerOpen}
            onOpenChange={setIsImagePickerOpen}
            onSelect={(url) => setFormData({ ...formData, image_url: url })}
            currentImage={formData.image_url}
          />

          {/* Collection Type */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Collection type</h3>
            <CollectionTypeSelector
              value={formData.collection_type}
              onValueChange={(value) => {
                setFormData({ ...formData, collection_type: value });
                // Clear rules when switching to manual
                if (value === "manual") {
                  setRules([]);
                }
              }}
            />
          </Card>
        </div>
      </div>

      {/* Product Selector Dialog for Manual Collections */}
      <ProductSelectorDialog
        open={isProductSelectorOpen}
        onOpenChange={setIsProductSelectorOpen}
        selectedProductIds={products.map((p: any) => p.id)}
        onProductsSelect={handleProductsSelect}
      />
    </div>
  );
}
