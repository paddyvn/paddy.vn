import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, MoreVertical, Pencil, Trash2, Plus, Filter, RefreshCw, X, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useSyncProducts } from "@/hooks/useSyncProducts";

type Product = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  is_active: boolean;
  is_featured: boolean;
  shopify_product_id: string | null;
  category_id: string | null;
  vendor: string | null;
  product_type: string | null;
  product_images: Array<{ image_url: string; is_primary: boolean }>;
  product_variants: Array<{ stock_quantity: number }>;
  product_collections: Array<{
    categories: { name: string } | null;
  }>;
};

export default function ProductsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const syncProducts = useSyncProducts();

  const ITEMS_PER_PAGE = 50;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, vendorFilter, tagFilter]);

  // Fetch unique vendors
  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("vendor")
        .not("vendor", "is", null)
        .order("vendor");
      if (error) throw error;
      const uniqueVendors = [...new Set(data.map(p => p.vendor))].filter(Boolean);
      return uniqueVendors as string[];
    },
  });

  // Fetch unique tags
  const { data: tags } = useQuery({
    queryKey: ["product-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("tags")
        .not("tags", "is", null);
      if (error) throw error;
      const allTags = new Set<string>();
      data.forEach(p => {
        if (p.tags) {
          p.tags.split(",").forEach(tag => allTags.add(tag.trim()));
        }
      });
      return Array.from(allTags).sort();
    },
  });

  // Get total count
  const { data: totalCount } = useQuery({
    queryKey: ["admin-products-count", searchQuery, statusFilter, vendorFilter, tagFilter],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active");
      }

      if (vendorFilter !== "all") {
        query = query.eq("vendor", vendorFilter);
      }

      if (tagFilter !== "all") {
        query = query.ilike("tags", `%${tagFilter}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["admin-products", searchQuery, statusFilter, vendorFilter, tagFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("products")
        .select(`
          *,
          product_images(image_url, is_primary),
          product_variants(stock_quantity),
          product_collections(
            categories(name)
          )
        `)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active");
      }

      if (vendorFilter !== "all") {
        query = query.eq("vendor", vendorFilter);
      }

      if (tagFilter !== "all") {
        query = query.ilike("tags", `%${tagFilter}%`);
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

  const getTotalStock = (variants: Array<{ stock_quantity: number }>) => {
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

        <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={vendorOpen}
              className="w-[180px] justify-between"
            >
              {vendorFilter === "all" ? "All Vendors" : vendorFilter}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0 bg-popover" align="start">
            <Command>
              <CommandInput placeholder="Search vendors..." />
              <CommandList>
                <CommandEmpty>No vendor found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setVendorFilter("all");
                      setVendorOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        vendorFilter === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Vendors
                  </CommandItem>
                  {vendors?.map((vendor) => (
                    <CommandItem
                      key={vendor}
                      value={vendor}
                      onSelect={(value) => {
                        const selectedVendor = vendors.find(v => v.toLowerCase() === value.toLowerCase()) || value;
                        setVendorFilter(selectedVendor);
                        setVendorOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          vendorFilter === vendor ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {vendor}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
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
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                <CommandEmpty>No tag found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setTagFilter("all");
                      setTagOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        tagFilter === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Tags
                  </CommandItem>
                  {tags?.map((tag) => (
                    <CommandItem
                      key={tag}
                      value={tag}
                      onSelect={(value) => {
                        const selectedTag = tags.find(t => t.toLowerCase() === value.toLowerCase()) || value;
                        setTagFilter(selectedTag);
                        setTagOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          tagFilter === tag ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {tag}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {(statusFilter !== "all" || vendorFilter !== "all" || tagFilter !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setVendorFilter("all");
              setTagFilter("all");
            }}
            className="gap-2"
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
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
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No products found. Try adjusting your search or filters.
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <img
                      src={getPrimaryImage(product.product_images)}
                      alt={product.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {getTotalStock(product.product_variants)} in stock
                      {product.product_variants.length > 1 && (
                        <span className="text-muted-foreground ml-1">
                          ({product.product_variants.length} variants)
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {product.vendor || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {product.product_type || "—"}
                    </span>
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
              ))
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