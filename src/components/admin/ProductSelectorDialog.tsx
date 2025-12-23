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
import { Search, X, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  base_price: number;
  is_active: boolean;
  product_images: Array<{ image_url: string; is_primary: boolean }>;
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

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-for-selection", searchQuery, searchBy],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          base_price,
          is_active,
          product_images(image_url, is_primary)
        `)
        .eq("is_active", true)
        .order("name")
        .limit(50);

      if (searchQuery) {
        if (searchBy === "all" || searchBy === "title") {
          query = query.ilike("name", `%${searchQuery}%`);
        } else if (searchBy === "sku") {
          // Search in variants
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
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
    // Get all selected products
    const allSelectedProducts = products?.filter(p => selectedIds.has(p.id)) || [];
    onProductsSelect(allSelectedProducts);
    setSelectedIds(new Set());
    setSelectedProducts([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSelectedProducts([]);
    setSearchQuery("");
    onOpenChange(false);
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
          
          <Button variant="outline" size="sm" className="text-muted-foreground">
            <Plus className="h-4 w-4 mr-1" />
            Add filter
          </Button>
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
