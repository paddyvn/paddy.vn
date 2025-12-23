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
import { Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(selectedProductIds));
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-for-selection", searchQuery],
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
        .order("name")
        .limit(50);

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
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
    // Get all selected products (from previously selected + newly selected)
    const allSelectedProducts = products?.filter(p => selectedIds.has(p.id)) || [];
    onProductsSelect(allSelectedProducts);
    onOpenChange(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add products</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Selected:</span>
            <Badge variant="secondary">{selectedIds.size} products</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedIds(new Set());
                setSelectedProducts([]);
              }}
            >
              Clear all
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] border rounded-md">
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
                    className={`flex items-center gap-4 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      isSelected ? "bg-primary/5" : ""
                    } ${isAlreadyAdded ? "opacity-50" : ""}`}
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
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(product.base_price)}
                      </p>
                    </div>
                    {isAlreadyAdded && (
                      <Badge variant="outline">Already added</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            Add {selectedIds.size > 0 ? `${selectedIds.size} products` : "products"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
