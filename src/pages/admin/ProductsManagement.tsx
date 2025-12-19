import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, MoreVertical, Pencil, Trash2, Plus, Filter, RefreshCw, X, Check, ChevronsUpDown, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useSyncProducts } from "@/hooks/useSyncProducts";
import { InlineEditCell } from "@/components/admin/InlineEditCell";
import { Checkbox } from "@/components/ui/checkbox";

type ProductVariant = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  stock_quantity: number | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  is_active: boolean;
  is_featured: boolean;
  source_id: string | null;
  category_id: string | null;
  brand: string | null;
  product_type: string | null;
  product_images: Array<{ image_url: string; is_primary: boolean }>;
  product_variants: ProductVariant[];
  product_collections: Array<{
    categories: { name: string } | null;
  }>;
};

export default function ProductsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [brandOpen, setBrandOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [brandSearchText, setBrandSearchText] = useState("");
  const [tagSearchText, setTagSearchText] = useState("");
  const [categorySearchText, setCategorySearchText] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const syncProducts = useSyncProducts();

  const ITEMS_PER_PAGE = 50;

  const toggleRowExpanded = (productId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Reset to page 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, brandFilter, tagFilter, categoryFilter, sortKey, sortDirection]);

  // Fetch unique brands directly with proper query
  const { data: brands, isLoading: brandsLoading, error: brandsError } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      // Fetch ALL products without limit to get complete brand list
      let allProducts: Array<{ brand: string }> = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from("products")
          .select("brand")
          .not("brand", "is", null)
          .range(from, from + batchSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allProducts = allProducts.concat(data);
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      
      // Extract unique brands and sort
      const uniqueBrands = [...new Set(allProducts.map(p => p.brand))].filter(Boolean) as string[];
      uniqueBrands.sort();
      
      return uniqueBrands;
    },
  });

  // Manually filter brands based on search
  const filteredBrands = useMemo(() => {
    if (!brands) return [];
    if (!brandSearchText.trim()) return brands;
    
    const searchLower = brandSearchText.toLowerCase().trim();
    return brands.filter(brand =>
      brand.toLowerCase().startsWith(searchLower)
    );
  }, [brands, brandSearchText]);

  // Fetch unique tags
  const { data: tags } = useQuery({
    queryKey: ["product-tags"],
    queryFn: async () => {
      // Fetch ALL products to get complete tag list
      let allProducts: Array<{ tags: string | null }> = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from("products")
          .select("tags")
          .not("tags", "is", null)
          .range(from, from + batchSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allProducts = allProducts.concat(data);
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      
      const allTags = new Set<string>();
      allProducts.forEach(p => {
        if (p.tags) {
          p.tags.split(",").forEach(tag => allTags.add(tag.trim()));
        }
      });
      
      return Array.from(allTags).sort();
    },
  });

  // Manually filter tags based on search
  const filteredTags = useMemo(() => {
    if (!tags) return [];
    if (!tagSearchText.trim()) return tags;
    
    const searchLower = tagSearchText.toLowerCase().trim();
    return tags.filter(tag =>
      tag.toLowerCase().startsWith(searchLower)
    );
  }, [tags, tagSearchText]);

  // Fetch categories (collections)
  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Manually filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!categorySearchText.trim()) return categories;
    
    const searchLower = categorySearchText.toLowerCase().trim();
    return categories.filter(cat =>
      cat.name.toLowerCase().startsWith(searchLower)
    );
  }, [categories, categorySearchText]);

  // Get total count
  const { data: totalCount } = useQuery({
    queryKey: ["admin-products-count", searchQuery, statusFilter, brandFilter, tagFilter, categoryFilter],
    queryFn: async () => {
      // If category filter is applied, we need to get product IDs from product_collections first
      let productIdsInCategory: string[] | null = null;
      if (categoryFilter !== "all") {
        const { data: pcData } = await supabase
          .from("product_collections")
          .select("product_id")
          .eq("collection_id", categoryFilter);
        productIdsInCategory = pcData?.map(pc => pc.product_id) || [];
        if (productIdsInCategory.length === 0) return 0;
      }

      let query = supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active");
      }

      if (brandFilter !== "all") {
        query = query.eq("brand", brandFilter);
      }

      if (tagFilter !== "all") {
        query = query.ilike("tags", `%${tagFilter}%`);
      }

      if (productIdsInCategory) {
        query = query.in("id", productIdsInCategory);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["admin-products", searchQuery, statusFilter, brandFilter, tagFilter, categoryFilter, currentPage, sortKey, sortDirection],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // If category filter is applied, we need to get product IDs from product_collections first
      let productIdsInCategory: string[] | null = null;
      if (categoryFilter !== "all") {
        const { data: pcData } = await supabase
          .from("product_collections")
          .select("product_id")
          .eq("collection_id", categoryFilter);
        productIdsInCategory = pcData?.map(pc => pc.product_id) || [];
        if (productIdsInCategory.length === 0) return [];
      }

      let query = supabase
        .from("products")
        .select(`
          *,
          product_images(image_url, is_primary),
          product_variants(id, sku, name, price, stock_quantity),
          product_collections(
            categories(name)
          )
        `)
        .order(sortKey, { ascending: sortDirection === "asc" })
        .range(from, to);

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active");
      }

      if (brandFilter !== "all") {
        query = query.eq("brand", brandFilter);
      }

      if (tagFilter !== "all") {
        query = query.ilike("tags", `%${tagFilter}%`);
      }

      if (productIdsInCategory) {
        query = query.in("id", productIdsInCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });

  const totalPages = totalCount ? Math.ceil(totalCount / ITEMS_PER_PAGE) : 0;
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount || 0);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Product deleted",
        description: `${name} has been deleted successfully.`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `${name} is now ${!currentStatus ? "active" : "inactive"}.`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getTotalStock = (variants: ProductVariant[]) => {
    return variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
  };

  const getPrimaryImage = (images: Array<{ image_url: string; is_primary: boolean }>) => {
    const primary = images.find((img) => img.is_primary);
    return primary?.image_url || images[0]?.image_url || "/placeholder.svg";
  };

  const getCollectionNames = (product_collections: Array<{ categories: { name: string } | null }>) => {
    const names = product_collections
      .map(pc => pc.categories?.name)
      .filter(Boolean);
    if (names.length === 0) return "—";
    if (names.length === 1) return names[0];
    return `${names[0]} +${names.length - 1}`;
  };

  const updateVariant = async (
    variantId: string,
    field: "name" | "sku" | "price" | "stock_quantity",
    value: string | number
  ) => {
    const { error } = await supabase
      .from("product_variants")
      .update({ [field]: value })
      .eq("id", variantId);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to update variant: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Updated",
      description: "Variant updated successfully",
    });

    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  // Bulk selection helpers
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (!products) return;
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const isAllSelected = products && products.length > 0 && selectedProducts.size === products.length;
  const isSomeSelected = selectedProducts.size > 0 && selectedProducts.size < (products?.length || 0);

  // Bulk actions
  const bulkActivate = async () => {
    if (selectedProducts.size === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: true })
        .in("id", Array.from(selectedProducts));
      
      if (error) throw error;
      
      toast({
        title: "Products activated",
        description: `${selectedProducts.size} products have been activated.`,
      });
      setSelectedProducts(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const bulkDeactivate = async () => {
    if (selectedProducts.size === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false })
        .in("id", Array.from(selectedProducts));
      
      if (error) throw error;
      
      toast({
        title: "Products deactivated",
        description: `${selectedProducts.size} products have been deactivated.`,
      });
      setSelectedProducts(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} products? This action cannot be undone.`)) return;
    
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .in("id", Array.from(selectedProducts));
      
      if (error) throw error;
      
      toast({
        title: "Products deleted",
        description: `${selectedProducts.size} products have been deleted.`,
      });
      setSelectedProducts(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products-count"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button
          onClick={() => syncProducts.mutate()}
          disabled={syncProducts.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncProducts.isPending ? "animate-spin" : ""}`} />
          {syncProducts.isPending ? "Syncing..." : "Sync Products"}
        </Button>
      </div>

      <div className="flex gap-4 items-center bg-card p-4 rounded-lg border flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={brandOpen} onOpenChange={setBrandOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={brandOpen}
              className="w-[180px] justify-between"
            >
              {brandFilter === "all" ? "All Brands" : brandFilter}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0 bg-popover" align="start">
            <div className="flex flex-col">
              <div className="p-2 border-b">
                <Input
                  placeholder="Search brands..."
                  value={brandSearchText}
                  onChange={(e) => setBrandSearchText(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div
                  className="px-2 py-1.5 text-sm hover:bg-accent cursor-pointer flex items-center"
                  onClick={() => {
                    setBrandFilter("all");
                    setBrandOpen(false);
                    setBrandSearchText("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      brandFilter === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Brands
                </div>
                {filteredBrands.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No brand found.
                  </div>
                ) : (
                  filteredBrands.map((brand) => (
                    <div
                      key={brand}
                      className="px-2 py-1.5 text-sm hover:bg-accent cursor-pointer flex items-center"
                      onClick={() => {
                        setBrandFilter(brand);
                        setBrandOpen(false);
                        setBrandSearchText("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          brandFilter === brand ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {brand}
                    </div>
                  ))
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={tagOpen} onOpenChange={setTagOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={tagOpen}
              className="w-[180px] justify-between"
            >
              {tagFilter === "all" ? "All Tags" : tagFilter}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0 bg-popover" align="start">
            <div className="flex flex-col">
              <div className="p-2 border-b">
                <Input
                  placeholder="Search tags..."
                  value={tagSearchText}
                  onChange={(e) => setTagSearchText(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div
                  className="px-2 py-1.5 text-sm hover:bg-accent cursor-pointer flex items-center"
                  onClick={() => {
                    setTagFilter("all");
                    setTagOpen(false);
                    setTagSearchText("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      tagFilter === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Tags
                </div>
                {filteredTags.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No tag found.
                  </div>
                ) : (
                  filteredTags.map((tag) => (
                    <div
                      key={tag}
                      className="px-2 py-1.5 text-sm hover:bg-accent cursor-pointer flex items-center"
                      onClick={() => {
                        setTagFilter(tag);
                        setTagOpen(false);
                        setTagSearchText("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          tagFilter === tag ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {tag}
                    </div>
                  ))
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={categoryOpen}
              className="w-[180px] justify-between"
            >
              {categoryFilter === "all" 
                ? "All Categories" 
                : categories?.find(c => c.id === categoryFilter)?.name || "All Categories"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0 bg-popover" align="start">
            <div className="flex flex-col">
              <div className="p-2 border-b">
                <Input
                  placeholder="Search categories..."
                  value={categorySearchText}
                  onChange={(e) => setCategorySearchText(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div
                  className="px-2 py-1.5 text-sm hover:bg-accent cursor-pointer flex items-center"
                  onClick={() => {
                    setCategoryFilter("all");
                    setCategoryOpen(false);
                    setCategorySearchText("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      categoryFilter === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Categories
                </div>
                {filteredCategories.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No category found.
                  </div>
                ) : (
                  filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="px-2 py-1.5 text-sm hover:bg-accent cursor-pointer flex items-center"
                      onClick={() => {
                        setCategoryFilter(cat.id);
                        setCategoryOpen(false);
                        setCategorySearchText("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          categoryFilter === cat.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {cat.name}
                    </div>
                  ))
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort dropdown - Shopify style */}
        <Popover open={sortOpen} onOpenChange={setSortOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0 bg-popover" align="end">
            <div className="p-3">
              <p className="text-sm font-medium mb-3">Sort by</p>
              <RadioGroup value={sortKey} onValueChange={setSortKey} className="gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="name" id="sort-name" />
                  <Label htmlFor="sort-name" className="text-sm cursor-pointer">Product title</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="created_at" id="sort-created" />
                  <Label htmlFor="sort-created" className="text-sm cursor-pointer">Created</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="updated_at" id="sort-updated" />
                  <Label htmlFor="sort-updated" className="text-sm cursor-pointer">Updated</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="base_price" id="sort-price" />
                  <Label htmlFor="sort-price" className="text-sm cursor-pointer">Price</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="product_type" id="sort-type" />
                  <Label htmlFor="sort-type" className="text-sm cursor-pointer">Product type</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="brand" id="sort-vendor" />
                  <Label htmlFor="sort-vendor" className="text-sm cursor-pointer">Vendor</Label>
                </div>
              </RadioGroup>
            </div>
            <Separator />
            <div className="p-3">
              <RadioGroup value={sortDirection} onValueChange={(v) => setSortDirection(v as "asc" | "desc")} className="gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="asc" id="sort-asc" />
                  <Label htmlFor="sort-asc" className="text-sm cursor-pointer flex items-center gap-2">
                    <ArrowUp className="h-3 w-3" />
                    {sortKey === "name" || sortKey === "product_type" || sortKey === "brand" ? "A-Z" : "Oldest first"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="desc" id="sort-desc" />
                  <Label htmlFor="sort-desc" className="text-sm cursor-pointer flex items-center gap-2">
                    <ArrowDown className="h-3 w-3" />
                    {sortKey === "name" || sortKey === "product_type" || sortKey === "brand" ? "Z-A" : "Newest first"}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </PopoverContent>
        </Popover>

        {(statusFilter !== "all" || brandFilter !== "all" || tagFilter !== "all" || categoryFilter !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setCategoryFilter("all");
              setBrandFilter("all");
              setTagFilter("all");
            }}
            className="gap-2"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedProducts.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">
            {selectedProducts.size} product{selectedProducts.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={bulkActivate}
              disabled={bulkActionLoading}
            >
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={bulkDeactivate}
              disabled={bulkActionLoading}
            >
              Deactivate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={bulkDelete}
              disabled={bulkActionLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProducts(new Set())}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) {
                      (el as any).indeterminate = isSomeSelected;
                    }
                  }}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-12 w-12 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[250px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No products found. Try adjusting your search or filters.
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product) => {
                const isExpanded = expandedRows.has(product.id);
                const hasVariants = product.product_variants.length > 1;
                const isSelected = selectedProducts.has(product.id);
                
                return (
                  <React.Fragment key={product.id}>
                    <TableRow className={cn(isExpanded ? "border-b-0" : "", isSelected && "bg-primary/5")}>
                      <TableCell className="w-[40px]">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                      <TableCell className="w-[40px]">
                        {hasVariants && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleRowExpanded(product.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <img
                          src={getPrimaryImage(product.product_images)}
                          alt={product.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                          className="text-left hover:underline cursor-pointer"
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.slug}</div>
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getTotalStock(product.product_variants)} in stock
                          {hasVariants && (
                            <span className="text-muted-foreground ml-1">
                              ({product.product_variants.length} variants)
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {product.brand || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">—</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(product.base_price)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background">
                            <DropdownMenuItem onClick={() => navigate(`/admin/products/${product.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleStatus(product.id, product.is_active, product.name)}
                            >
                              {product.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(product.id, product.name)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded variant rows */}
                    {isExpanded && hasVariants && product.product_variants.map((variant) => (
                      <TableRow key={variant.id} className="bg-muted/30 hover:bg-muted/40">
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="py-2 pl-8">
                          <InlineEditCell
                            value={variant.name}
                            onSave={(val) => updateVariant(variant.id, "name", val)}
                            className="text-sm text-muted-foreground"
                          />
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="py-2">
                          <InlineEditCell
                            value={variant.stock_quantity ?? 0}
                            type="number"
                            onSave={(val) => updateVariant(variant.id, "stock_quantity", val)}
                            className="text-sm"
                            inputClassName="w-20"
                          />
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="py-2">
                          <InlineEditCell
                            value={variant.sku || ""}
                            onSave={(val) => updateVariant(variant.id, "sku", val)}
                            className="text-sm text-muted-foreground"
                            inputClassName="w-28"
                          />
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <InlineEditCell
                            value={variant.price}
                            type="number"
                            onSave={(val) => updateVariant(variant.id, "price", val)}
                            formatDisplay={(v) => formatCurrency(Number(v))}
                            className="text-sm"
                            inputClassName="w-24 text-right"
                          />
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalCount !== undefined && totalCount > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Showing {startItem} to {endItem} of {totalCount} product{totalCount !== 1 ? "s" : ""}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}