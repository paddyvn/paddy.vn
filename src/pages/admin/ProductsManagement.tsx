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
import { Search, MoreVertical, Pencil, Trash2, Plus, Filter, RefreshCw, X, Check, ChevronsUpDown, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";
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
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [brandOpen, setBrandOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [brandSearchText, setBrandSearchText] = useState("");
  const [collectionSearchText, setCollectionSearchText] = useState("");
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
  }, [searchQuery, statusFilter, brandFilter, collectionFilter, categoryFilter, sortKey, sortDirection]);

  // Fetch unique brands from the brands table directly
  const { data: brands, isLoading: brandsLoading, error: brandsError } = useQuery({
    queryKey: ["admin-brand-names"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data.map((b) => b.name);
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

  // Fetch all collections for the collection filter
  const { data: collections } = useQuery({
    queryKey: ["all-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, collection_type")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Manually filter collections based on search
  const filteredCollections = useMemo(() => {
    if (!collections) return [];
    if (!collectionSearchText.trim()) return collections;
    
    const searchLower = collectionSearchText.toLowerCase().trim();
    return collections.filter(col =>
      col.name.toLowerCase().startsWith(searchLower)
    );
  }, [collections, collectionSearchText]);

  // Fetch product types from products table
  const { data: productTypes } = useQuery({
    queryKey: ["product-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("product_type")
        .not("product_type", "is", null)
        .neq("product_type", "");
      
      if (error) throw error;
      
      // Get unique product types
      const uniqueTypes = [...new Set(data?.map(p => p.product_type).filter(Boolean))] as string[];
      return uniqueTypes.sort();
    },
  });

  // Manually filter product types based on search
  const filteredProductTypes = useMemo(() => {
    if (!productTypes) return [];
    if (!categorySearchText.trim()) return productTypes;
    
    const searchLower = categorySearchText.toLowerCase().trim();
    return productTypes.filter(type =>
      type.toLowerCase().startsWith(searchLower)
    );
  }, [productTypes, categorySearchText]);

  // Shared search helper for both count and data queries
  const applyProductSearch = async (query: any, search: string) => {
    if (!search) return query;
    const term = search.trim();
    const looksLikeSKU = !term.includes(" ") && term.length <= 30;

    if (looksLikeSKU) {
      const { data: skuMatches } = await supabase
        .from("product_variants")
        .select("product_id")
        .ilike("sku", `%${term}%`)
        .limit(100);

      const skuProductIds = skuMatches?.map((v) => v.product_id) || [];

      if (skuProductIds.length > 0) {
        return query.or(
          `name.ilike.%${term}%,slug.ilike.%${term}%,id.in.(${skuProductIds.join(",")})`
        );
      }
    }

    return query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  };

  // Get total count
  const { data: totalCount } = useQuery({
    queryKey: ["admin-products-count", searchQuery, statusFilter, brandFilter, collectionFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      query = await applyProductSearch(query, searchQuery);

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active");
      }

      if (brandFilter !== "all") {
        query = query.eq("brand", brandFilter);
      }

      if (collectionFilter !== "all") {
        const { data: collectionProducts } = await supabase
          .from("product_collections")
          .select("product_id")
          .eq("collection_id", collectionFilter);
        const collectionProductIds = collectionProducts?.map(cp => cp.product_id) || [];
        if (collectionProductIds.length === 0) return 0;
        query = query.in("id", collectionProductIds);
      }

      if (categoryFilter !== "all") {
        query = query.eq("product_type", categoryFilter);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["admin-products", searchQuery, statusFilter, brandFilter, collectionFilter, categoryFilter, currentPage, sortKey, sortDirection],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

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

      query = await applyProductSearch(query, searchQuery);

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active");
      }

      if (brandFilter !== "all") {
        query = query.eq("brand", brandFilter);
      }

      if (collectionFilter !== "all") {
        const { data: collectionProducts } = await supabase
          .from("product_collections")
          .select("product_id")
          .eq("collection_id", collectionFilter);
        const collectionProductIds = collectionProducts?.map(cp => cp.product_id) || [];
        if (collectionProductIds.length === 0) return [];
        query = query.in("id", collectionProductIds);
      }

      if (categoryFilter !== "all") {
        query = query.eq("product_type", categoryFilter);
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

  const exportProductsCSV = async () => {
    try {
      let query = supabase
        .from("products")
        .select(`
          id, name, slug, base_price, compare_at_price, brand, product_type,
          pet_type, tags, is_active, is_featured, created_at,
          product_variants(sku, name, price, stock_quantity)
        `)
        .order("name");

      query = await applyProductSearch(query, searchQuery);

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active");
      }
      if (brandFilter !== "all") {
        query = query.eq("brand", brandFilter);
      }
      if (categoryFilter !== "all") {
        query = query.eq("product_type", categoryFilter);
      }

      const { data, error } = await query.limit(5000);
      if (error) throw error;
      if (!data || data.length === 0) {
        toast({ title: "No products to export", variant: "destructive" });
        return;
      }

      const headers = [
        "Product Name", "Slug", "Brand", "Type", "Pet Type", "Tags",
        "Status", "Featured", "Base Price", "Compare At Price",
        "Variant Name", "SKU", "Variant Price", "Stock", "Created At"
      ];

      const rows = data.flatMap((product: any) => {
        const variants = product.product_variants || [];
        if (variants.length === 0) {
          return [[
            product.name, product.slug, product.brand || "", product.product_type || "",
            product.pet_type || "", product.tags || "",
            product.is_active ? "Active" : "Inactive", product.is_featured ? "Yes" : "No",
            product.base_price, product.compare_at_price || "",
            "", "", "", "", product.created_at,
          ]];
        }
        return variants.map((v: any, i: number) => [
          i === 0 ? product.name : "", i === 0 ? product.slug : "",
          i === 0 ? (product.brand || "") : "", i === 0 ? (product.product_type || "") : "",
          i === 0 ? (product.pet_type || "") : "", i === 0 ? (product.tags || "") : "",
          i === 0 ? (product.is_active ? "Active" : "Inactive") : "",
          i === 0 ? (product.is_featured ? "Yes" : "No") : "",
          i === 0 ? product.base_price : "", i === 0 ? (product.compare_at_price || "") : "",
          v.name || "", v.sku || "", v.price, v.stock_quantity ?? "",
          i === 0 ? product.created_at : "",
        ]);
      });

      const escapeCSV = (val: any) => {
        const str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csv = [
        headers.map(escapeCSV).join(","),
        ...rows.map((row: any[]) => row.map(escapeCSV).join(","))
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `paddy-products-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export complete", description: `${data.length} products exported` });
    } catch (error) {
      toast({ title: "Export failed", description: String(error), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportProductsCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <SyncOptionNamesButton />
          <Button
            onClick={() => syncProducts.mutate()}
            disabled={syncProducts.isPending}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncProducts.isPending ? "animate-spin" : ""}`} />
            {syncProducts.isPending ? "Syncing..." : "Sync Products"}
          </Button>
          <Button
            onClick={() => navigate("/admin/products/new")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-card p-4 rounded-lg border flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, slug, or SKU..."
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

        <Popover open={collectionOpen} onOpenChange={setCollectionOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={collectionOpen}
              className="w-[180px] justify-between"
            >
              {collectionFilter === "all" 
                ? "All Collections" 
                : collections?.find(c => c.id === collectionFilter)?.name || "All Collections"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0 bg-popover" align="start">
            <div className="flex flex-col">
              <div className="p-2 border-b">
                <Input
                  placeholder="Search collections..."
                  value={collectionSearchText}
                  onChange={(e) => setCollectionSearchText(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div
                  className="px-2 py-1.5 text-sm hover:bg-accent cursor-pointer flex items-center"
                  onClick={() => {
                    setCollectionFilter("all");
                    setCollectionOpen(false);
                    setCollectionSearchText("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      collectionFilter === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Collections
                </div>
                {filteredCollections.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No collection found.
                  </div>
                ) : (
                  filteredCollections.map((col) => (
                    <div
                      key={col.id}
                      className="px-2 py-1.5 text-sm hover:bg-accent cursor-pointer flex items-center"
                      onClick={() => {
                        setCollectionFilter(col.id);
                        setCollectionOpen(false);
                        setCollectionSearchText("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          collectionFilter === col.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{col.name}</span>
                      {col.collection_type === "brand" && (
                        <span className="ml-1 text-xs text-muted-foreground">(Brand)</span>
                      )}
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
              <span className="truncate">
                {categoryFilter === "all" 
                  ? "All Product Types" 
                  : categoryFilter}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0 bg-popover" align="start">
            <div className="flex flex-col">
              <div className="p-2 border-b">
                <Input
                  placeholder="Search product types..."
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
                      "mr-2 h-4 w-4 shrink-0",
                      categoryFilter === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Product Types
                </div>
                {filteredProductTypes.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No product type found.
                  </div>
                ) : (
                  filteredProductTypes.map((type) => (
                    <div
                      key={type}
                      className="px-2 py-1.5 text-sm hover:bg-accent cursor-pointer flex items-center whitespace-nowrap overflow-hidden"
                      onClick={() => {
                        setCategoryFilter(type);
                        setCategoryOpen(false);
                        setCategorySearchText("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          categoryFilter === type ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{type}</span>
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

        {(statusFilter !== "all" || brandFilter !== "all" || collectionFilter !== "all" || categoryFilter !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setCategoryFilter("all");
              setBrandFilter("all");
              setCollectionFilter("all");
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