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
import { Search, Plus, Trash2, Loader2, ImageIcon, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ProductDiscountSetting {
  productId: string;
  variantId?: string;
  discountType: "percentage" | "fixed_amount" | "special_price";
  discountValue: number;
  isEnabled: boolean;
  stockLimit?: number;
  purchaseLimit?: number;
}

interface SimpleProductPickerProps {
  selectedProductIds: string[];
  onProductsChange: (productIds: string[]) => void;
  productSettings?: ProductDiscountSetting[];
  onProductSettingsChange?: (settings: ProductDiscountSetting[]) => void;
  discountType?: "percentage" | "fixed_amount" | "special_price";
  discountValue?: number;
  onDiscountTypeChange?: (type: "percentage" | "fixed_amount" | "special_price") => void;
  onDiscountValueChange?: (value: number) => void;
  title?: string;
  subtitle?: string;
  showDiscountSettings?: boolean;
}

interface ProductWithDetails {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  brand: string | null;
  product_type: string | null;
  image_url?: string;
  collectionIds: string[];
  totalStock: number;
  variants: {
    id: string;
    name: string;
    price: number;
    stock_quantity: number | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }[];
}

export function SimpleProductPicker({
  selectedProductIds,
  onProductsChange,
  productSettings = [],
  onProductSettingsChange,
  discountType = "percentage",
  discountValue = 0,
  onDiscountTypeChange,
  onDiscountValueChange,
  title = "Sản phẩm khuyến mãi",
  subtitle,
  showDiscountSettings = true,
}: SimpleProductPickerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [batchDiscountValue, setBatchDiscountValue] = useState<number>(0);
  const [batchStockLimit, setBatchStockLimit] = useState<string>("");
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);

  // Fetch products with images and variants
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["simple-product-picker-products-with-variants"],
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
          product_variants(id, name, price, stock_quantity, option1, option2, option3),
          product_collections(collection_id)
        `)
        .eq("is_active", true)
        .order("name")
        .limit(500);
      if (error) throw error;
      return data.map((p): ProductWithDetails => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        base_price: p.base_price,
        brand: p.brand,
        product_type: p.product_type,
        image_url:
          p.product_images?.find((img: { is_primary: boolean }) => img.is_primary)?.image_url ||
          p.product_images?.[0]?.image_url,
        collectionIds: p.product_collections?.map((pc: { collection_id: string }) => pc.collection_id) || [],
        totalStock: p.product_variants?.reduce((sum: number, v: { stock_quantity: number | null }) => sum + (v.stock_quantity || 0), 0) || 0,
        variants: p.product_variants || [],
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

  const calculateDiscountedPrice = (originalPrice: number, dType: string, dValue: number) => {
    if (dType === "percentage") {
      if (dValue === 0) return originalPrice;
      return originalPrice * (1 - dValue / 100);
    } else if (dType === "fixed_amount") {
      if (dValue === 0) return originalPrice;
      return Math.max(0, originalPrice - dValue);
    } else {
      // special_price - if value is 0 or not set, show original price
      return dValue > 0 ? dValue : originalPrice;
    }
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
    // Also remove settings for this product
    if (onProductSettingsChange) {
      onProductSettingsChange(productSettings.filter(s => s.productId !== productId));
    }
  };

  const toggleBatchSelection = (productId: string) => {
    setSelectedForBatch(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const applyBatchSettings = () => {
    if (!onProductSettingsChange || selectedForBatch.length === 0) return;

    const newSettings = [...productSettings];
    const stockLimitValue = batchStockLimit === "" ? undefined : parseInt(batchStockLimit) || 0;
    
    selectedForBatch.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      // Apply to all variants of the product
      product.variants.forEach(variant => {
        const existingIndex = newSettings.findIndex(s => s.productId === productId && s.variantId === variant.id);
        if (existingIndex >= 0) {
          newSettings[existingIndex] = {
            ...newSettings[existingIndex],
            discountType,
            discountValue: batchDiscountValue,
            ...(stockLimitValue !== undefined && { stockLimit: stockLimitValue }),
          };
        } else {
          newSettings.push({
            productId,
            variantId: variant.id,
            discountType,
            discountValue: batchDiscountValue,
            isEnabled: true,
            ...(stockLimitValue !== undefined && { stockLimit: stockLimitValue }),
          });
        }
      });
    });
    onProductSettingsChange(newSettings);
    setSelectedForBatch([]);
    setBatchDiscountValue(0);
    setBatchStockLimit("");
  };

  const removeSelectedProducts = () => {
    onProductsChange(selectedProductIds.filter(id => !selectedForBatch.includes(id)));
    if (onProductSettingsChange) {
      onProductSettingsChange(productSettings.filter(s => !selectedForBatch.includes(s.productId)));
    }
    setSelectedForBatch([]);
  };

  // Get selected product details
  const selectedProducts = products.filter((p) =>
    selectedProductIds.includes(p.id)
  );

  const getVariantDisplayName = (variant: ProductWithDetails["variants"][0]) => {
    return [variant.option1, variant.option2, variant.option3].filter(Boolean).join(" / ") || variant.name;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle || `Tổng cộng ${selectedProductIds.length} sản phẩm`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedForBatch(selectedForBatch.length === selectedProductIds.length ? [] : [...selectedProductIds])}
            size="sm"
            disabled={selectedProductIds.length === 0}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Thiết lập hàng loạt
          </Button>
          <Button
            variant="default"
            onClick={openDialog}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm sản phẩm
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Batch Settings Bar - Shopee style */}
        {showDiscountSettings && (
          <div className="border-y bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-fit">
                  Thiết lập hàng loạt
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedForBatch.length} sản phẩm đã chọn
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">Khuyến Mãi</span>
                <div className="flex items-center border rounded-md bg-background">
                  <Input
                    type="number"
                    value={batchDiscountValue || ""}
                    onChange={(e) => setBatchDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-20 border-0 text-center"
                    placeholder="0"
                  />
                  <span className="px-2 text-sm text-muted-foreground border-l">
                    {discountType === "percentage" ? "%GIẢM" : "₫"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">SL khuyến mãi</span>
                <div className="flex items-center border rounded-md bg-background">
                  <Input
                    type="number"
                    value={batchStockLimit}
                    onChange={(e) => setBatchStockLimit(e.target.value)}
                    className="w-20 border-0 text-center"
                    placeholder="--"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyBatchSettings}
                  disabled={selectedForBatch.length === 0}
                >
                  Cập nhật hàng loạt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeSelectedProducts}
                  disabled={selectedForBatch.length === 0}
                  className="text-destructive hover:text-destructive"
                >
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table - Shopee style */}
        {selectedProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedForBatch.length === selectedProductIds.length && selectedProductIds.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedForBatch(checked ? [...selectedProductIds] : []);
                      }}
                    />
                  </TableHead>
                  <TableHead className="min-w-[200px]">Tên sản phẩm</TableHead>
                  <TableHead className="text-right w-28">Giá gốc</TableHead>
                  {showDiscountSettings && (
                    <>
                      <TableHead className="text-center w-40">Giảm giá</TableHead>
                      <TableHead className="text-right w-28">Giá sau giảm</TableHead>
                    </>
                  )}
                  <TableHead className="text-center w-20">Kho hàng</TableHead>
                  {showDiscountSettings && (
                    <TableHead className="text-center w-28">SL khuyến mãi</TableHead>
                  )}
                  {showDiscountSettings && (
                    <TableHead className="text-center w-20">Bật/Tắt</TableHead>
                  )}
                  <TableHead className="w-16 text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedProducts.map((product) => (
                  <>
                    {/* Product row */}
                    <TableRow key={product.id} className="bg-muted/20">
                      <TableCell>
                        <Checkbox
                          checked={selectedForBatch.includes(product.id)}
                          onCheckedChange={() => toggleBatchSelection(product.id)}
                        />
                      </TableCell>
                      <TableCell colSpan={showDiscountSettings ? 4 : 2}>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium line-clamp-2">
                            {product.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell></TableCell>
                      {showDiscountSettings && <TableCell></TableCell>}
                      {showDiscountSettings && (
                        <TableCell className="text-center">
                          <Switch
                            checked={productSettings.find(s => s.productId === product.id)?.isEnabled ?? true}
                            onCheckedChange={(checked) => {
                              if (onProductSettingsChange) {
                                const newSettings = [...productSettings];
                                const idx = newSettings.findIndex(s => s.productId === product.id && !s.variantId);
                                if (idx >= 0) {
                                  newSettings[idx] = { ...newSettings[idx], isEnabled: checked };
                                } else {
                                  newSettings.push({
                                    productId: product.id,
                                    discountType,
                                    discountValue,
                                    isEnabled: checked,
                                  });
                                }
                                onProductSettingsChange(newSettings);
                              }
                            }}
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeProduct(product.id)}
                        >
                          Xóa
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Variant rows */}
                    {product.variants.map((variant) => {
                      const variantSetting = productSettings.find(
                        s => s.productId === product.id && s.variantId === variant.id
                      );
                      const effectiveDiscountValue = variantSetting?.discountValue ?? discountValue;
                      const effectiveDiscountType = variantSetting?.discountType ?? discountType;
                      const discountedPrice = calculateDiscountedPrice(variant.price, effectiveDiscountType, effectiveDiscountValue);
                      const isOutOfStock = (variant.stock_quantity || 0) === 0;

                      return (
                        <TableRow key={variant.id} className="hover:bg-muted/30">
                          <TableCell></TableCell>
                          <TableCell className="pl-16">
                            <div className="flex flex-col">
                              <span className="text-sm">{getVariantDisplayName(variant)}</span>
                              {isOutOfStock && (
                                <span className="text-xs text-destructive">Bán hết</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatPrice(variant.price)}₫
                          </TableCell>
                          {showDiscountSettings && (
                            <>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-xs text-muted-foreground">₫</span>
                                  <Input
                                    type="number"
                                    value={effectiveDiscountType === "special_price" ? effectiveDiscountValue : ""}
                                    onChange={(e) => {
                                      if (onProductSettingsChange) {
                                        const val = parseFloat(e.target.value) || 0;
                                        const newSettings = [...productSettings];
                                        const idx = newSettings.findIndex(
                                          s => s.productId === product.id && s.variantId === variant.id
                                        );
                                        if (idx >= 0) {
                                          newSettings[idx] = { ...newSettings[idx], discountValue: val, discountType: "special_price" };
                                        } else {
                                          newSettings.push({
                                            productId: product.id,
                                            variantId: variant.id,
                                            discountType: "special_price",
                                            discountValue: val,
                                            isEnabled: true,
                                          });
                                        }
                                        onProductSettingsChange(newSettings);
                                      }
                                    }}
                                    className="w-20 h-8 text-center text-sm"
                                    placeholder={formatPrice(variant.price)}
                                    disabled={isOutOfStock}
                                  />
                                  <span className="text-xs text-muted-foreground mx-1">HOẶC</span>
                                  <Input
                                    type="number"
                                    value={effectiveDiscountType === "percentage" ? effectiveDiscountValue : ""}
                                    onChange={(e) => {
                                      if (onProductSettingsChange) {
                                        const val = parseFloat(e.target.value) || 0;
                                        const newSettings = [...productSettings];
                                        const idx = newSettings.findIndex(
                                          s => s.productId === product.id && s.variantId === variant.id
                                        );
                                        if (idx >= 0) {
                                          newSettings[idx] = { ...newSettings[idx], discountValue: val, discountType: "percentage" };
                                        } else {
                                          newSettings.push({
                                            productId: product.id,
                                            variantId: variant.id,
                                            discountType: "percentage",
                                            discountValue: val,
                                            isEnabled: true,
                                          });
                                        }
                                        onProductSettingsChange(newSettings);
                                      }
                                    }}
                                    className="w-14 h-8 text-center text-sm"
                                    placeholder="0"
                                    disabled={isOutOfStock}
                                  />
                                  <span className="text-xs text-muted-foreground">%GIẢM</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium text-primary">
                                {formatPrice(discountedPrice)}₫
                              </TableCell>
                            </>
                          )}
                          <TableCell className="text-center text-sm">
                            {variant.stock_quantity || 0}
                          </TableCell>
                          {showDiscountSettings && (
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                value={variantSetting?.stockLimit ?? ""}
                                onChange={(e) => {
                                  if (onProductSettingsChange) {
                                    const val = e.target.value === "" ? undefined : parseInt(e.target.value) || 0;
                                    const newSettings = [...productSettings];
                                    const idx = newSettings.findIndex(
                                      s => s.productId === product.id && s.variantId === variant.id
                                    );
                                    if (idx >= 0) {
                                      newSettings[idx] = { ...newSettings[idx], stockLimit: val };
                                    } else {
                                      newSettings.push({
                                        productId: product.id,
                                        variantId: variant.id,
                                        discountType: effectiveDiscountType,
                                        discountValue: effectiveDiscountValue,
                                        isEnabled: true,
                                        stockLimit: val,
                                      });
                                    }
                                    onProductSettingsChange(newSettings);
                                  }
                                }}
                                className="w-20 h-8 text-center text-sm"
                                placeholder="--"
                                min={0}
                                max={variant.stock_quantity || 0}
                                disabled={isOutOfStock}
                              />
                            </TableCell>
                          )}
                          {showDiscountSettings && (
                            <TableCell className="text-center">
                              <Switch
                                checked={variantSetting?.isEnabled ?? true}
                                disabled={isOutOfStock}
                                onCheckedChange={(checked) => {
                                  if (onProductSettingsChange) {
                                    const newSettings = [...productSettings];
                                    const idx = newSettings.findIndex(
                                      s => s.productId === product.id && s.variantId === variant.id
                                    );
                                    if (idx >= 0) {
                                      newSettings[idx] = { ...newSettings[idx], isEnabled: checked };
                                    } else {
                                      newSettings.push({
                                        productId: product.id,
                                        variantId: variant.id,
                                        discountType,
                                        discountValue,
                                        isEnabled: checked,
                                      });
                                    }
                                    onProductSettingsChange(newSettings);
                                  }
                                }}
                              />
                            </TableCell>
                          )}
                          <TableCell></TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground px-6">
            <p>Chưa có sản phẩm nào trong chương trình</p>
            <p className="text-sm mt-1">
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
