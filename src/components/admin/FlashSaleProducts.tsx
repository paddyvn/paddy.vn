import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X, Package, Loader2, ImageIcon } from "lucide-react";

interface FlashSaleProductsProps {
  selectedProducts: string[];
  onProductsChange: (ids: string[]) => void;
}

export function FlashSaleProducts({
  selectedProducts,
  onProductsChange,
}: FlashSaleProductsProps) {
  const [search, setSearch] = useState("");

  // Fetch products with images
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["flash-sale-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, 
          name, 
          slug,
          base_price,
          compare_at_price,
          product_images!inner(image_url, is_primary)
        `)
        .eq("is_active", true)
        .order("name")
        .limit(500);
      if (error) throw error;
      return data.map((p) => ({
        ...p,
        image_url: p.product_images?.find((img: any) => img.is_primary)?.image_url 
          || p.product_images?.[0]?.image_url,
      }));
    },
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const toggleProduct = (id: string) => {
    if (selectedProducts.includes(id)) {
      onProductsChange(selectedProducts.filter((p) => p !== id));
    } else {
      onProductsChange([...selectedProducts, id]);
    }
  };

  const removeProduct = (id: string) => {
    onProductsChange(selectedProducts.filter((p) => p !== id));
  };

  // Get selected product details
  const selectedProductDetails = products.filter((p) =>
    selectedProducts.includes(p.id)
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="space-y-4">
      {/* Selected products display */}
      {selectedProducts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""} in flash sale
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onProductsChange([])}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          </div>
          <div className="grid gap-2">
            {selectedProductDetails.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(product.base_price)}
                    {product.compare_at_price && (
                      <span className="line-through ml-2">
                        {formatPrice(product.compare_at_price)}
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeProduct(product.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and add products */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Add products</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ScrollArea className="h-[280px] border rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No products found
                </p>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(product.base_price)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
