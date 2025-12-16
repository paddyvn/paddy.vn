import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X, Package, FolderOpen } from "lucide-react";

interface SelectedItem {
  id: string;
  name: string;
  type: "collection" | "product";
}

interface PromotionAppliesToProps {
  selectedCollections: string[];
  selectedProducts: string[];
  onCollectionsChange: (ids: string[]) => void;
  onProductsChange: (ids: string[]) => void;
}

export function PromotionAppliesTo({
  selectedCollections,
  selectedProducts,
  onCollectionsChange,
  onProductsChange,
}: PromotionAppliesToProps) {
  const [collectionSearch, setCollectionSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Fetch collections
  const { data: collections = [] } = useQuery({
    queryKey: ["collections-for-promotion"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ["products-for-promotion"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name")
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const filteredCollections = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(collectionSearch.toLowerCase()) ||
      c.slug.toLowerCase().includes(collectionSearch.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase())
  );

  const toggleCollection = (id: string) => {
    if (selectedCollections.includes(id)) {
      onCollectionsChange(selectedCollections.filter((c) => c !== id));
    } else {
      onCollectionsChange([...selectedCollections, id]);
    }
  };

  const toggleProduct = (id: string) => {
    if (selectedProducts.includes(id)) {
      onProductsChange(selectedProducts.filter((p) => p !== id));
    } else {
      onProductsChange([...selectedProducts, id]);
    }
  };

  const removeCollection = (id: string) => {
    onCollectionsChange(selectedCollections.filter((c) => c !== id));
  };

  const removeProduct = (id: string) => {
    onProductsChange(selectedProducts.filter((p) => p !== id));
  };

  // Get selected items for display
  const selectedCollectionItems = collections.filter((c) =>
    selectedCollections.includes(c.id)
  );
  const selectedProductItems = products.filter((p) =>
    selectedProducts.includes(p.id)
  );

  const totalSelected = selectedCollections.length + selectedProducts.length;

  return (
    <div className="space-y-4">
      {/* Selected items display */}
      {totalSelected > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {totalSelected} item{totalSelected > 1 ? "s" : ""} selected
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedCollectionItems.map((c) => (
              <Badge key={c.id} variant="secondary" className="gap-1">
                <FolderOpen className="h-3 w-3" />
                {c.name}
                <button
                  onClick={() => removeCollection(c.id)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedProductItems.map((p) => (
              <Badge key={p.id} variant="outline" className="gap-1">
                <Package className="h-3 w-3" />
                {p.name}
                <button
                  onClick={() => removeProduct(p.id)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="collections" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="collections" className="flex-1">
            <FolderOpen className="h-4 w-4 mr-2" />
            Collections
            {selectedCollections.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {selectedCollections.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="products" className="flex-1">
            <Package className="h-4 w-4 mr-2" />
            Products
            {selectedProducts.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {selectedProducts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={collectionSearch}
              onChange={(e) => setCollectionSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[240px] border rounded-md">
            <div className="p-2 space-y-1">
              {filteredCollections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No collections found
                </p>
              ) : (
                filteredCollections.map((collection) => (
                  <div
                    key={collection.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => toggleCollection(collection.id)}
                  >
                    <Checkbox
                      checked={selectedCollections.includes(collection.id)}
                      onCheckedChange={() => toggleCollection(collection.id)}
                    />
                    <span className="text-sm">{collection.name}</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="products" className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[240px] border rounded-md">
            <div className="p-2 space-y-1">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No products found
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => toggleProduct(product.id)}
                  >
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                    <span className="text-sm">{product.name}</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
