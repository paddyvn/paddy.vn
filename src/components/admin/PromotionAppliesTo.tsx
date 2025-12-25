import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Package, FolderOpen, Plus, ImageIcon, Loader2 } from "lucide-react";

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
  
  // Product picker dialog state
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [dialogSearch, setDialogSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [tempSelectedProducts, setTempSelectedProducts] = useState<string[]>([]);

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

  // Fetch products with images for the main list
  const { data: products = [] } = useQuery({
    queryKey: ["products-for-promotion-with-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, 
          name, 
          slug, 
          base_price,
          brand,
          product_type,
          product_images(image_url, is_primary),
          product_collections(collection_id)
        `)
        .eq("is_active", true)
        .order("name")
        .limit(500);
      if (error) throw error;
      return data.map((p) => ({
        ...p,
        image_url:
          p.product_images?.find((img: { is_primary: boolean }) => img.is_primary)?.image_url ||
          p.product_images?.[0]?.image_url,
        collectionIds: p.product_collections?.map((pc: { collection_id: string }) => pc.collection_id) || [],
      }));
    },
  });

  // Get unique product types
  const productTypes = Array.from(
    new Set(products.map((p) => p.product_type).filter(Boolean))
  ).sort() as string[];

  // Get products filtered by type for brand options
  const productsFilteredByType = typeFilter === "all" 
    ? products 
    : products.filter((p) => p.product_type === typeFilter);

  // Get available brands based on type filter
  const availableBrands = Array.from(
    new Set(productsFilteredByType.map((p) => p.brand).filter(Boolean))
  ).sort() as string[];

  // Filter products for dialog
  const filteredDialogProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(dialogSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(dialogSearch.toLowerCase());
    const matchesBrand = brandFilter === "all" || p.brand === brandFilter;
    const matchesType = typeFilter === "all" || p.product_type === typeFilter;
    const matchesCollection =
      collectionFilter === "all" || p.collectionIds?.includes(collectionFilter);
    return matchesSearch && matchesBrand && matchesType && matchesCollection;
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

  // Dialog handlers
  const openProductDialog = () => {
    setTempSelectedProducts([...selectedProducts]);
    setDialogSearch("");
    setTypeFilter("all");
    setBrandFilter("all");
    setCollectionFilter("all");
    setIsProductDialogOpen(true);
  };

  const toggleTempProduct = (productId: string) => {
    setTempSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const confirmProductSelection = () => {
    onProductsChange(tempSelectedProducts);
    setIsProductDialogOpen(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
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
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={openProductDialog}
              className="text-primary border-primary hover:bg-primary/5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </div>
          
          {/* Selected products with images */}
          {selectedProducts.length > 0 && (
            <div className="border rounded-md divide-y">
              {selectedProductItems.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3"
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
                    <p className="text-xs text-muted-foreground">{formatPrice(product.base_price)}₫</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeProduct(product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {selectedProducts.length === 0 && (
            <div className="border rounded-md p-8 text-center">
              <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No products selected</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Browse Products" to add products</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Product Picker Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Products</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {productTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {availableBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={collectionFilter} onValueChange={setCollectionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collections</SelectItem>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={dialogSearch}
                  onChange={(e) => setDialogSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Product list */}
            <ScrollArea className="h-[400px] border rounded-md">
              <div className="divide-y">
                {filteredDialogProducts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No products found
                  </div>
                ) : (
                  filteredDialogProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleTempProduct(product.id)}
                    >
                      <Checkbox
                        checked={tempSelectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleTempProduct(product.id)}
                      />
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(product.base_price)}₫
                          {product.brand && ` • ${product.brand}`}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {tempSelectedProducts.length} product(s) selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmProductSelection}>
                Confirm
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
