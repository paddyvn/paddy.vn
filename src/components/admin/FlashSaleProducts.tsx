import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import {
  Search,
  Plus,
  Trash2,
  Loader2,
  ImageIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface FlashSaleVariant {
  variantId: string;
  variantName: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  promoQuantity: number;
  stockQuantity: number;
  orderLimit: number;
  isEnabled: boolean;
}

export interface FlashSaleProduct {
  productId: string;
  productName: string;
  imageUrl: string | null;
  variants: FlashSaleVariant[];
}

interface FlashSaleProductsProps {
  selectedProducts: FlashSaleProduct[];
  onProductsChange: (products: FlashSaleProduct[]) => void;
}

export function FlashSaleProducts({
  selectedProducts,
  onProductsChange,
}: FlashSaleProductsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Bulk edit state
  const [bulkDiscount, setBulkDiscount] = useState("");
  const [bulkPromoQty, setBulkPromoQty] = useState("");
  const [bulkOrderLimit, setBulkOrderLimit] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  // Fetch products with images and variants
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["flash-sale-products-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, 
          name, 
          slug,
          base_price,
          category_id,
          brand_id,
          product_type,
          product_images(image_url, is_primary),
          product_variants(id, name, price, compare_at_price, stock_quantity),
          product_collections(collection_id)
        `)
        .eq("is_active", true)
        .order("name")
        .limit(500);
      if (error) throw error;
      return data.map((p) => ({
        ...p,
        image_url:
          p.product_images?.find((img: any) => img.is_primary)?.image_url ||
          p.product_images?.[0]?.image_url,
        collectionIds: p.product_collections?.map((pc: any) => pc.collection_id) || [],
      }));
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["flash-sale-categories"],
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

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ["flash-sale-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Get unique product types from products
  const productTypes = Array.from(
    new Set(products.map((p) => p.product_type).filter(Boolean))
  ).sort();

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesBrand =
      brandFilter === "all" || p.brand_id === brandFilter;
    const matchesType =
      typeFilter === "all" || p.product_type === typeFilter;
    const matchesCollection =
      collectionFilter === "all" || p.collectionIds?.includes(collectionFilter);
    return matchesSearch && matchesBrand && matchesType && matchesCollection;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const openDialog = () => {
    setTempSelected(selectedProducts.map((p) => p.productId));
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
    const existingMap = new Map(
      selectedProducts.map((p) => [p.productId, p])
    );

    const newProducts: FlashSaleProduct[] = tempSelected.map((productId) => {
      if (existingMap.has(productId)) {
        return existingMap.get(productId)!;
      }

      const product = products.find((p) => p.id === productId);
      if (!product) return null;

      const variants: FlashSaleVariant[] =
        product.product_variants?.map((v: any) => ({
          variantId: v.id,
          variantName: v.name,
          originalPrice: v.price,
          salePrice: v.price,
          discountPercent: 0,
          promoQuantity: 0,
          stockQuantity: v.stock_quantity || 0,
          orderLimit: 0,
          isEnabled: false,
        })) || [];

      // If no variants, create a default one from base product
      if (variants.length === 0) {
        variants.push({
          variantId: productId,
          variantName: "Default",
          originalPrice: product.base_price,
          salePrice: product.base_price,
          discountPercent: 0,
          promoQuantity: 0,
          stockQuantity: 0,
          orderLimit: 0,
          isEnabled: false,
        });
      }

      return {
        productId,
        productName: product.name,
        imageUrl: product.image_url,
        variants,
      };
    }).filter(Boolean) as FlashSaleProduct[];

    onProductsChange(newProducts);
    setIsDialogOpen(false);
  };

  const removeProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((p) => p.productId !== productId));
  };

  const toggleExpanded = (productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const updateVariant = (
    productId: string,
    variantId: string,
    updates: Partial<FlashSaleVariant>
  ) => {
    onProductsChange(
      selectedProducts.map((product) => {
        if (product.productId !== productId) return product;
        return {
          ...product,
          variants: product.variants.map((variant) => {
            if (variant.variantId !== variantId) return variant;
            const updated = { ...variant, ...updates };
            // Recalculate based on what was changed
            if ("salePrice" in updates && updates.salePrice !== undefined) {
              updated.discountPercent =
                updated.originalPrice > 0
                  ? Math.round(
                      ((updated.originalPrice - updated.salePrice) /
                        updated.originalPrice) *
                        100
                    )
                  : 0;
            } else if ("discountPercent" in updates && updates.discountPercent !== undefined) {
              updated.salePrice = Math.round(
                updated.originalPrice * (1 - updated.discountPercent / 100)
              );
            }
            return updated;
          }),
        };
      })
    );
  };

  const toggleVariantSelection = (variantId: string) => {
    setSelectedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) {
        next.delete(variantId);
      } else {
        next.add(variantId);
      }
      return next;
    });
  };

  const applyBulkUpdate = () => {
    if (selectedVariants.size === 0) return;

    onProductsChange(
      selectedProducts.map((product) => ({
        ...product,
        variants: product.variants.map((variant) => {
          if (!selectedVariants.has(variant.variantId)) return variant;
          const updated = { ...variant };
          if (bulkDiscount) {
            updated.discountPercent = parseInt(bulkDiscount) || 0;
            updated.salePrice = Math.round(
              updated.originalPrice * (1 - updated.discountPercent / 100)
            );
          }
          if (bulkPromoQty) {
            updated.promoQuantity = parseInt(bulkPromoQty) || 0;
          }
          if (bulkOrderLimit) {
            updated.orderLimit = parseInt(bulkOrderLimit) || 0;
          }
          return updated;
        }),
      }))
    );
    setSelectedVariants(new Set());
    setBulkDiscount("");
    setBulkPromoQty("");
    setBulkOrderLimit("");
  };

  const enableAllSelected = (enable: boolean) => {
    if (selectedVariants.size === 0) return;
    onProductsChange(
      selectedProducts.map((product) => ({
        ...product,
        variants: product.variants.map((variant) => {
          if (!selectedVariants.has(variant.variantId)) return variant;
          return { ...variant, isEnabled: enable };
        }),
      }))
    );
  };

  const deleteSelected = () => {
    if (selectedVariants.size === 0) return;
    onProductsChange(
      selectedProducts
        .map((product) => ({
          ...product,
          variants: product.variants.filter(
            (v) => !selectedVariants.has(v.variantId)
          ),
        }))
        .filter((p) => p.variants.length > 0)
    );
    setSelectedVariants(new Set());
  };

  const totalVariants = selectedProducts.reduce(
    (acc, p) => acc + p.variants.length,
    0
  );
  const enabledVariants = selectedProducts.reduce(
    (acc, p) => acc + p.variants.filter((v) => v.isEnabled).length,
    0
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-medium">
            Sản phẩm tham gia Flash Sale
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Đã chọn {enabledVariants}/{totalVariants} phân loại hàng
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
      <CardContent className="space-y-4">
        {selectedProducts.length > 0 && (
          <>
            {/* Bulk edit section */}
            <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Chỉnh sửa hàng loạt</p>
                <p className="text-sm font-medium">
                  Đã chọn {selectedVariants.size} phân loại
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Khuyến mãi</label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={bulkDiscount}
                    onChange={(e) => setBulkDiscount(e.target.value)}
                    className="w-20 h-8"
                    placeholder="0"
                  />
                  <span className="text-sm">%GIẢM</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">SL khuyến mãi</label>
                <Input
                  type="number"
                  value={bulkPromoQty}
                  onChange={(e) => setBulkPromoQty(e.target.value)}
                  className="w-24 h-8"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Giới hạn đặt</label>
                <Input
                  type="number"
                  value={bulkOrderLimit}
                  onChange={(e) => setBulkOrderLimit(e.target.value)}
                  className="w-24 h-8"
                  placeholder="0"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={applyBulkUpdate}
                disabled={selectedVariants.size === 0}
              >
                Cập nhật
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => enableAllSelected(true)}
                disabled={selectedVariants.size === 0}
              >
                Bật
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => enableAllSelected(false)}
                disabled={selectedVariants.size === 0}
              >
                Tắt
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={deleteSelected}
                disabled={selectedVariants.size === 0}
                className="text-destructive hover:text-destructive"
              >
                Xóa
              </Button>
            </div>

            {/* Products table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          selectedVariants.size > 0 &&
                          selectedVariants.size === totalVariants
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const allIds = selectedProducts.flatMap((p) =>
                              p.variants.map((v) => v.variantId)
                            );
                            setSelectedVariants(new Set(allIds));
                          } else {
                            setSelectedVariants(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="min-w-[180px]">Phân loại hàng</TableHead>
                    <TableHead className="text-right">Giá gốc</TableHead>
                    <TableHead className="text-center">Giá đã giảm</TableHead>
                    <TableHead className="text-center">Khuyến mãi</TableHead>
                    <TableHead className="text-center">SL KM</TableHead>
                    <TableHead className="text-center">Kho hàng</TableHead>
                    <TableHead className="text-center">Giới hạn</TableHead>
                    <TableHead className="text-center">Bật/Tắt</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProducts.map((product) => (
                    <>
                      {/* Product header row */}
                      <TableRow
                        key={product.productId}
                        className="bg-muted/30 hover:bg-muted/40"
                      >
                        <TableCell colSpan={8}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleExpanded(product.productId)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              {expandedProducts.has(product.productId) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.productName}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium truncate max-w-[300px]">
                              {product.productName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeProduct(product.productId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {/* Variant rows */}
                      {expandedProducts.has(product.productId) &&
                        product.variants.map((variant) => (
                          <TableRow key={variant.variantId}>
                            <TableCell>
                              <Checkbox
                                checked={selectedVariants.has(variant.variantId)}
                                onCheckedChange={() =>
                                  toggleVariantSelection(variant.variantId)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <span className="text-sm truncate max-w-[150px] block">
                                {variant.variantName}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm">
                                ₫{formatPrice(variant.originalPrice)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 justify-center">
                                <span className="text-xs text-muted-foreground">₫</span>
                                <Input
                                  type="number"
                                  value={variant.salePrice}
                                  onChange={(e) =>
                                    updateVariant(
                                      product.productId,
                                      variant.variantId,
                                      { salePrice: parseInt(e.target.value) || 0 }
                                    )
                                  }
                                  className="w-24 h-8 text-center"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 justify-center">
                                <Input
                                  type="number"
                                  value={variant.discountPercent}
                                  onChange={(e) =>
                                    updateVariant(
                                      product.productId,
                                      variant.variantId,
                                      {
                                        discountPercent:
                                          parseInt(e.target.value) || 0,
                                      }
                                    )
                                  }
                                  className="w-16 h-8 text-center"
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={variant.promoQuantity}
                                onChange={(e) =>
                                  updateVariant(
                                    product.productId,
                                    variant.variantId,
                                    { promoQuantity: parseInt(e.target.value) || 0 }
                                  )
                                }
                                className="w-16 h-8 text-center mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm text-muted-foreground">
                                {variant.stockQuantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={variant.orderLimit}
                                onChange={(e) =>
                                  updateVariant(
                                    product.productId,
                                    variant.variantId,
                                    { orderLimit: parseInt(e.target.value) || 0 }
                                  )
                                }
                                className="w-16 h-8 text-center mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={variant.isEnabled}
                                onCheckedChange={(checked) =>
                                  updateVariant(
                                    product.productId,
                                    variant.variantId,
                                    { isEnabled: checked }
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {selectedProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-2">Chưa có sản phẩm nào trong Flash Sale</p>
            <p className="text-sm">
              Vui lòng thêm sản phẩm vào chương trình khuyến mãi của bạn
            </p>
          </div>
        )}
      </CardContent>

      {/* Product Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chọn Sản Phẩm</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mb-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Loại</span>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Tất cả" />
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
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Thương hiệu</span>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Collection</span>
                <Select value={collectionFilter} onValueChange={setCollectionFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả collection</SelectItem>
                    {categories.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tìm</span>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tên sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <ScrollArea className="h-[400px] border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Sản Phẩm</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead className="text-center">Kho hàng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                      >
                        Không tìm thấy sản phẩm
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const isSelected = tempSelected.includes(product.id);
                      const totalStock =
                        product.product_variants?.reduce(
                          (acc: number, v: any) => acc + (v.stock_quantity || 0),
                          0
                        ) || 0;
                      const priceRange =
                        product.product_variants && product.product_variants.length > 0
                          ? {
                              min: Math.min(
                                ...product.product_variants.map((v: any) => v.price)
                              ),
                              max: Math.max(
                                ...product.product_variants.map((v: any) => v.price)
                              ),
                            }
                          : { min: product.base_price, max: product.base_price };

                      return (
                        <TableRow
                          key={product.id}
                          className={`cursor-pointer ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
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
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium truncate max-w-[250px]">
                                  {product.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Mã: {product.slug}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {priceRange.min === priceRange.max ? (
                              <span>₫{formatPrice(priceRange.min)}</span>
                            ) : (
                              <span>
                                ₫{formatPrice(priceRange.min)} - ₫
                                {formatPrice(priceRange.max)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{totalStock}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={confirmSelection}>
              Xác nhận ({tempSelected.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
