import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Plus, Trash2, Loader2, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SimpleProductPickerProps {
  selectedProductIds: string[];
  onProductsChange: (productIds: string[]) => void;
  title?: string;
  subtitle?: string;
}

export function SimpleProductPicker({
  selectedProductIds,
  onProductsChange,
  title = "Sản phẩm tham gia chương trình",
  subtitle,
}: SimpleProductPickerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  // Fetch products with images
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["simple-product-picker-products"],
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
          product_variants(id, stock_quantity),
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
        totalStock: p.product_variants?.reduce((sum: number, v: { stock_quantity: number | null }) => sum + (v.stock_quantity || 0), 0) || 0,
      }));
    },
  });

  // Fetch categories for collection filter
  const { data: categories = [] } = useQuery({
    queryKey: ["simple-product-picker-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Get unique product types
  const productTypes = Array.from(
    new Set(products.map((p) => p.product_type).filter(Boolean))
  ).sort();

  // Get products filtered by type (for brand filter options)
  const productsFilteredByType =
    typeFilter === "all"
      ? products
      : products.filter((p) => p.product_type === typeFilter);

  // Get available brands based on type filter
  const availableBrands = Array.from(
    new Set(productsFilteredByType.map((p) => p.brand).filter(Boolean))
  ).sort() as string[];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = brandFilter === "all" || p.brand === brandFilter;
    const matchesType = typeFilter === "all" || p.product_type === typeFilter;
    const matchesCollection =
      collectionFilter === "all" || p.collectionIds?.includes(collectionFilter);
    return matchesSearch && matchesBrand && matchesType && matchesCollection;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const openDialog = () => {
    setTempSelected([...selectedProductIds]);
    setSearch("");
    setTypeFilter("all");
    setBrandFilter("all");
    setCollectionFilter("all");
    setIsDialogOpen(true);
  };

  const toggleProductSelection = (productId: string) => {
    setTempSelected((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const confirmSelection = () => {
    onProductsChange(tempSelected);
    setIsDialogOpen(false);
  };

  const removeProduct = (productId: string) => {
    onProductsChange(selectedProductIds.filter((id) => id !== productId));
  };

  // Get selected product details
  const selectedProducts = products.filter((p) =>
    selectedProductIds.includes(p.id)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle || `Đã chọn ${selectedProductIds.length} sản phẩm`}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={openDialog}
          className="text-primary border-primary hover:bg-primary/5"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </CardHeader>
      <CardContent>
        {selectedProducts.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[250px]">Sản phẩm</TableHead>
                  <TableHead className="text-right">Giá</TableHead>
                  <TableHead className="text-center">Kho</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium line-clamp-2">
                          {product.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(product.base_price)}₫
                    </TableCell>
                    <TableCell className="text-center">
                      {product.totalStock}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Chưa có sản phẩm nào trong chương trình</p>
            <p className="text-sm">
              Vui lòng thêm sản phẩm vào chương trình khuyến mãi của bạn
            </p>
          </div>
        )}
      </CardContent>

      {/* Product Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chọn sản phẩm</DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 py-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Loại sản phẩm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {productTypes.map((type) => (
                  <SelectItem key={type} value={type as string}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Thương hiệu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                {availableBrands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={collectionFilter} onValueChange={setCollectionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Bộ sưu tập" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả bộ sưu tập</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Products Table */}
          <ScrollArea className="flex-1 border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không tìm thấy sản phẩm nào
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          tempSelected.length > 0 &&
                          filteredProducts.every((p) =>
                            tempSelected.includes(p.id)
                          )
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const allIds = filteredProducts.map((p) => p.id);
                            setTempSelected((prev) => [
                              ...new Set([...prev, ...allIds]),
                            ]);
                          } else {
                            const filterIds = new Set(
                              filteredProducts.map((p) => p.id)
                            );
                            setTempSelected((prev) =>
                              prev.filter((id) => !filterIds.has(id))
                            );
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="min-w-[250px]">Sản phẩm</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead className="text-center">Kho</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={tempSelected.includes(product.id)}
                          onCheckedChange={() =>
                            toggleProductSelection(product.id)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium line-clamp-2">
                            {product.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(product.base_price)}₫
                      </TableCell>
                      <TableCell className="text-center">
                        {product.totalStock}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          <DialogFooter className="pt-4">
            <p className="text-sm text-muted-foreground mr-auto">
              Đã chọn {tempSelected.length} sản phẩm
            </p>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={confirmSelection}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
