import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Package, ChevronDown, ChevronRight, Plus, X } from "lucide-react";

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  sku: string | null;
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  product_type: string | null;
  brand_id: string | null;
  product_images: { image_url: string; is_primary: boolean }[];
  product_variants: ProductVariant[];
}

interface SelectedItem {
  productId: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  price: number;
  productImages: { image_url: string; is_primary: boolean }[];
}

interface Filter {
  type: "brand" | "collection" | "product_type";
  value: string;
  label: string;
}

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProducts: (items: SelectedItem[]) => void;
}

export function AddProductDialog({ open, onOpenChange, onAddProducts }: AddProductDialogProps) {
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedItems(new Map());
      setExpandedProducts(new Set());
      setFilters([]);
    }
  }, [open]);

  // Fetch brands for filter
  const { data: brands = [] } = useQuery({
    queryKey: ["brands-filter"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("id, name").order("name");
      return data || [];
    },
    enabled: open,
  });

  // Fetch collections for filter
  const { data: collections = [] } = useQuery({
    queryKey: ["collections-filter"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return data || [];
    },
    enabled: open,
  });

  // Fetch product types for filter
  const { data: productTypes = [] } = useQuery({
    queryKey: ["product-types-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("product_type")
        .not("product_type", "is", null)
        .order("product_type");
      const uniqueTypes = [...new Set(data?.map(p => p.product_type).filter(Boolean))];
      return uniqueTypes as string[];
    },
    enabled: open,
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["add-products-search", search, searchBy, filters],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          base_price,
          product_type,
          brand_id,
          product_images(image_url, is_primary),
          product_variants(id, name, price, sku)
        `)
        .order("name");

      if (search && search.length >= 2) {
        if (searchBy === "all") {
          query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
        } else if (searchBy === "name") {
          query = query.ilike("name", `%${search}%`);
        } else if (searchBy === "sku") {
          query = query.ilike("sku", `%${search}%`);
        }
      }

      // Apply filters
      const brandFilter = filters.find(f => f.type === "brand");
      if (brandFilter) {
        query = query.eq("brand_id", brandFilter.value);
      }

      const typeFilter = filters.find(f => f.type === "product_type");
      if (typeFilter) {
        query = query.eq("product_type", typeFilter.value);
      }

      query = query.limit(50);

      const { data, error } = await query;
      if (error) throw error;

      let filteredProducts = data as Product[];

      // Collection filter requires additional query
      const collectionFilter = filters.find(f => f.type === "collection");
      if (collectionFilter) {
        const { data: productIds } = await supabase
          .from("product_collections")
          .select("product_id")
          .eq("collection_id", collectionFilter.value);
        const ids = productIds?.map(p => p.product_id) || [];
        filteredProducts = filteredProducts.filter(p => ids.includes(p.id));
      }

      return filteredProducts;
    },
    enabled: open,
  });

  const getItemKey = (productId: string, variantId: string | null) => 
    variantId ? `${productId}-${variantId}` : productId;

  const toggleProductExpand = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const isVariantSelected = (productId: string, variantId: string) => {
    return selectedItems.has(getItemKey(productId, variantId));
  };

  const isProductSelected = (product: Product) => {
    if (product.product_variants.length === 0) {
      return selectedItems.has(getItemKey(product.id, null));
    }
    return product.product_variants.every(v => isVariantSelected(product.id, v.id));
  };

  const isProductPartiallySelected = (product: Product) => {
    if (product.product_variants.length === 0) return false;
    const selectedCount = product.product_variants.filter(v => 
      isVariantSelected(product.id, v.id)
    ).length;
    return selectedCount > 0 && selectedCount < product.product_variants.length;
  };

  const toggleVariant = (product: Product, variant: ProductVariant) => {
    const key = getItemKey(product.id, variant.id);
    setSelectedItems(prev => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, {
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          variantName: variant.name,
          price: variant.price,
          productImages: product.product_images,
        });
      }
      return next;
    });
  };

  const toggleProduct = (product: Product) => {
    if (product.product_variants.length === 0) {
      // Product without variants
      const key = getItemKey(product.id, null);
      setSelectedItems(prev => {
        const next = new Map(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.set(key, {
            productId: product.id,
            productName: product.name,
            variantId: null,
            variantName: null,
            price: product.base_price,
            productImages: product.product_images,
          });
        }
        return next;
      });
    } else {
      // Product with variants - toggle all
      const allSelected = isProductSelected(product);
      setSelectedItems(prev => {
        const next = new Map(prev);
        product.product_variants.forEach(variant => {
          const key = getItemKey(product.id, variant.id);
          if (allSelected) {
            next.delete(key);
          } else {
            next.set(key, {
              productId: product.id,
              productName: product.name,
              variantId: variant.id,
              variantName: variant.name,
              price: variant.price,
              productImages: product.product_images,
            });
          }
        });
        return next;
      });
      // Expand the product when selecting
      if (!allSelected && !expandedProducts.has(product.id)) {
        setExpandedProducts(prev => new Set(prev).add(product.id));
      }
    }
  };

  const handleAdd = () => {
    onAddProducts(Array.from(selectedItems.values()));
    onOpenChange(false);
  };

  const getPrimaryImage = (images: { image_url: string; is_primary: boolean }[]) => {
    const primary = images?.find(img => img.is_primary);
    return primary?.image_url || images?.[0]?.image_url;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add products</DialogTitle>
          <DialogDescription className="sr-only">
            Search and select products to add to the order
          </DialogDescription>
        </DialogHeader>

        {/* Search and filter row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="pl-10"
            />
          </div>
          <Select value={searchBy} onValueChange={setSearchBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Search by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Search by All</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="sku">SKU</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Plus className="h-3 w-3 mr-1" />
                Add filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-normal"
                  disabled={filters.some(f => f.type === "product_type")}
                  onClick={() => setFilterPopoverOpen(false)}
                >
                  <Select
                    onValueChange={(value) => {
                      setFilters(prev => [...prev.filter(f => f.type !== "product_type"), { type: "product_type", value, label: value }]);
                      setFilterPopoverOpen(false);
                    }}
                  >
                    <SelectTrigger className="border-0 shadow-none p-0 h-auto">
                      <span>Type</span>
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-normal"
                  disabled={filters.some(f => f.type === "brand")}
                  onClick={() => setFilterPopoverOpen(false)}
                >
                  <Select
                    onValueChange={(value) => {
                      const brand = brands.find(b => b.id === value);
                      if (brand) {
                        setFilters(prev => [...prev.filter(f => f.type !== "brand"), { type: "brand", value: brand.id, label: brand.name }]);
                      }
                      setFilterPopoverOpen(false);
                    }}
                  >
                    <SelectTrigger className="border-0 shadow-none p-0 h-auto">
                      <span>Brand</span>
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-normal"
                  disabled={filters.some(f => f.type === "collection")}
                  onClick={() => setFilterPopoverOpen(false)}
                >
                  <Select
                    onValueChange={(value) => {
                      const collection = collections.find(c => c.id === value);
                      if (collection) {
                        setFilters(prev => [...prev.filter(f => f.type !== "collection"), { type: "collection", value: collection.id, label: collection.name }]);
                      }
                      setFilterPopoverOpen(false);
                    }}
                  >
                    <SelectTrigger className="border-0 shadow-none p-0 h-auto">
                      <span>Collection</span>
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map(col => (
                        <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active filters */}
          {filters.map((filter) => (
            <Badge key={`${filter.type}-${filter.value}`} variant="secondary" className="h-7 gap-1">
              <span className="text-muted-foreground text-xs capitalize">{filter.type.replace("_", " ")}:</span>
              {filter.label}
              <button
                onClick={() => setFilters(prev => prev.filter(f => !(f.type === filter.type && f.value === filter.value)))}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_100px_120px] gap-2 px-2 py-2 text-sm font-medium text-muted-foreground border-b">
          <div className="w-5" />
          <div>Product</div>
          <div className="text-center">Available</div>
          <div className="text-right">Price</div>
        </div>

        {/* Products list */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-1">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {search.length < 2 ? "Type to search products" : "No products found"}
              </p>
            ) : (
              products.map((product) => {
                const hasVariants = product.product_variants.length > 0;
                const isExpanded = expandedProducts.has(product.id);
                const primaryImage = getPrimaryImage(product.product_images);

                return (
                  <div key={product.id}>
                    {/* Product row */}
                    <div 
                      className="grid grid-cols-[auto_1fr_100px_120px] gap-2 px-2 py-2 items-center hover:bg-muted/50 rounded-md cursor-pointer"
                      onClick={() => hasVariants ? toggleProductExpand(product.id) : toggleProduct(product)}
                    >
                      <div className="flex items-center gap-2">
                        {hasVariants && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleProductExpand(product.id); }}
                            className="p-0.5 hover:bg-muted rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        )}
                        <Checkbox
                          checked={isProductSelected(product)}
                          ref={(el) => {
                            if (el) {
                              (el as HTMLButtonElement).dataset.state = 
                                isProductPartiallySelected(product) ? "indeterminate" : 
                                isProductSelected(product) ? "checked" : "unchecked";
                            }
                          }}
                          onCheckedChange={() => toggleProduct(product)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                          {primaryImage ? (
                            <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium truncate">{product.name}</span>
                      </div>
                      <div className="text-center">
                        {!hasVariants && (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
                      <div className="text-right">
                        {!hasVariants && (
                          <span className="text-sm">{formatCurrency(product.base_price)}</span>
                        )}
                      </div>
                    </div>

                    {/* Variant rows */}
                    {hasVariants && isExpanded && (
                      <div className="ml-8 border-l border-muted pl-2">
                        {product.product_variants.map((variant) => {
                          return (
                            <div
                              key={variant.id}
                              className="grid grid-cols-[auto_1fr_100px_120px] gap-2 px-2 py-2 items-center hover:bg-muted/50 rounded-md cursor-pointer"
                              onClick={() => toggleVariant(product, variant)}
                            >
                              <Checkbox
                                checked={isVariantSelected(product.id, variant.id)}
                                onCheckedChange={() => toggleVariant(product, variant)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-sm">{variant.name}</span>
                              <div className="text-center text-sm text-muted-foreground">-</div>
                              <div className="text-right text-sm">
                                {formatCurrency(variant.price)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">
            {selectedItems.size} product{selectedItems.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={selectedItems.size === 0}>
              Add
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
