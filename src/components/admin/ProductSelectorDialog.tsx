import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X, Plus, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  base_price: number;
  is_active: boolean;
  product_images: Array<{ image_url: string; is_primary: boolean }>;
}

interface ActiveFilter {
  type: "category" | "collection" | "type" | "tag" | "vendor";
  value: string;
  label: string;
}

interface ProductSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductIds: string[];
  onProductsSelect: (products: Product[]) => void;
}

export function ProductSelectorDialog({
  open,
  onOpenChange,
  selectedProductIds,
  onProductsSelect,
}: ProductSelectorDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<string | null>(null);

  // Fetch filter options
  const { data: categories } = useQuery({
    queryKey: ["categories-for-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    enabled: open,
  });

  const { data: productTypes } = useQuery({
    queryKey: ["product-types-for-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("product_type")
        .not("product_type", "is", null)
        .eq("is_active", true);
      const types = [...new Set(data?.map(p => p.product_type).filter(Boolean))];
      return types.sort();
    },
    enabled: open,
  });

  const { data: tags } = useQuery({
    queryKey: ["tags-for-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("tags")
        .not("tags", "is", null)
        .eq("is_active", true);
      const allTags = data?.flatMap(p => p.tags?.split(",").map((t: string) => t.trim()) || []) || [];
      return [...new Set(allTags)].filter(Boolean).sort();
    },
    enabled: open,
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendors-for-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("brand")
        .not("brand", "is", null)
        .eq("is_active", true);
      const brands = [...new Set(data?.map(p => p.brand).filter(Boolean))];
      return brands.sort();
    },
    enabled: open,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-for-selection", searchQuery, searchBy, activeFilters],
    queryFn: async () => {
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
          category_id,
          product_images(image_url, is_primary),
          product_collections(collection_id)
        `)
        .eq("is_active", true)
        .order("name")
        .limit(50);

      if (searchQuery) {
        if (searchBy === "all" || searchBy === "title") {
          query = query.ilike("name", `%${searchQuery}%`);
        }
      }

      // Apply filters
      for (const filter of activeFilters) {
        if (filter.type === "category") {
          query = query.eq("category_id", filter.value);
        } else if (filter.type === "type") {
          query = query.eq("product_type", filter.value);
        } else if (filter.type === "vendor") {
          query = query.eq("brand", filter.value);
        } else if (filter.type === "tag") {
          query = query.ilike("tags", `%${filter.value}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by collection if needed
      let filteredData = data || [];
      const collectionFilter = activeFilters.find(f => f.type === "collection");
      if (collectionFilter) {
        filteredData = filteredData.filter(p => 
          p.product_collections?.some((pc: any) => pc.collection_id === collectionFilter.value)
        );
      }

      return filteredData as Product[];
    },
    enabled: open,
  });

  const getPrimaryImage = (images: Array<{ image_url: string; is_primary: boolean }>) => {
    const primary = images?.find(img => img.is_primary);
    return primary?.image_url || images?.[0]?.image_url;
  };

  const toggleProduct = (product: Product) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(product.id)) {
      newSelectedIds.delete(product.id);
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      newSelectedIds.add(product.id);
      setSelectedProducts(prev => [...prev, product]);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleConfirm = () => {
    const allSelectedProducts = products?.filter(p => selectedIds.has(p.id)) || [];
    onProductsSelect(allSelectedProducts);
    setSelectedIds(new Set());
    setSelectedProducts([]);
    setActiveFilters([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSelectedProducts([]);
    setSearchQuery("");
    setActiveFilters([]);
    setActiveFilterType(null);
    onOpenChange(false);
  };

  const addFilter = (type: ActiveFilter["type"], value: string, label: string) => {
    // Remove existing filter of same type
    setActiveFilters(prev => [
      ...prev.filter(f => f.type !== type),
      { type, value, label }
    ]);
    setActiveFilterType(null);
  };

  const removeFilter = (type: string) => {
    setActiveFilters(prev => prev.filter(f => f.type !== type));
  };

  const getFilterOptions = () => {
    switch (activeFilterType) {
      case "category":
        return categories?.map(c => ({ value: c.id, label: c.name })) || [];
      case "collection":
        return categories?.map(c => ({ value: c.id, label: c.name })) || [];
      case "type":
        return productTypes?.map(t => ({ value: t, label: t })) || [];
      case "tag":
        return tags?.map(t => ({ value: t, label: t })) || [];
      case "vendor":
        return vendors?.map(v => ({ value: v, label: v })) || [];
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Add products</DialogTitle>
          </div>
        </DialogHeader>

        {/* Search row */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <Select value={searchBy} onValueChange={setSearchBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Search by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Search by All</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="sku">SKU</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-muted-foreground">
                  <Plus className="h-4 w-4 mr-1" />
                  Add filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => { setActiveFilterType("category"); setFilterMenuOpen(false); }}>
                  Categories
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setActiveFilterType("collection"); setFilterMenuOpen(false); }}>
                  Collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setActiveFilterType("type"); setFilterMenuOpen(false); }}>
                  Types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setActiveFilterType("tag"); setFilterMenuOpen(false); }}>
                  Tags
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setActiveFilterType("vendor"); setFilterMenuOpen(false); }}>
                  Vendors
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Active filters */}
            {activeFilters.map(filter => (
              <Badge key={filter.type} variant="secondary" className="gap-1">
                {filter.type}: {filter.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeFilter(filter.type)} 
                />
              </Badge>
            ))}
          </div>

          {/* Filter value selector */}
          {activeFilterType && (
            <div className="flex items-center gap-2">
              <Select onValueChange={(value) => {
                const options = getFilterOptions();
                const option = options.find(o => o.value === value);
                if (option) {
                  addFilter(activeFilterType as ActiveFilter["type"], option.value, option.label);
                }
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Select ${activeFilterType}`} />
                </SelectTrigger>
                <SelectContent>
                  {getFilterOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => setActiveFilterType(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Products list */}
        <ScrollArea className="h-[400px] border-t">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading products...
            </div>
          ) : products?.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No products found
            </div>
          ) : (
            <div className="divide-y">
              {products?.map((product) => {
                const isSelected = selectedIds.has(product.id);
                const isAlreadyAdded = selectedProductIds.includes(product.id);
                
                return (
                  <div
                    key={product.id}
                    className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      isAlreadyAdded ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => !isAlreadyAdded && toggleProduct(product)}
                  >
                    <Checkbox
                      checked={isSelected || isAlreadyAdded}
                      disabled={isAlreadyAdded}
                      onCheckedChange={() => !isAlreadyAdded && toggleProduct(product)}
                    />
                    {getPrimaryImage(product.product_images) ? (
                      <img
                        src={getPrimaryImage(product.product_images)}
                        alt={product.name}
                        className="w-10 h-10 rounded border object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded border bg-muted" />
                    )}
                    <span className="flex-1 text-sm font-medium truncate">
                      {product.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedIds.size === 0}
          >
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
