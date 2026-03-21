import { useParams, useNavigate, Link } from "react-router-dom";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Heart, Ticket, Copy, CheckCircle } from "lucide-react";
import { ProductTrustBadges } from "@/components/ProductTrustBadges";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { ProductVariantSelector } from "@/components/ProductVariantSelector";
import { RelatedProducts } from "@/components/RelatedProducts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductBreadcrumb } from "@/components/ProductBreadcrumb";
import { useToast } from "@/hooks/use-toast";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { useProductPromotion } from "@/hooks/useProductPromotions";
import { useProductVouchers } from "@/hooks/useProductVouchers";

function sanitizeDescription(html: string): string {
  return html
    .replace(/\s*data-mce-[a-z]+="[^"]*"/g, '')
    .replace(/\s*style="[^"]*font-family[^"]*"/g, '')
    .replace(/\s*style="[^"]*font-size[^"]*"/g, '');
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: product, isLoading, error } = useProduct(slug || "");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>({
    description: false,
    ingredients: false,
    feeding: false,
  });

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { addToCart } = useCart(session?.user?.id);
  const { data: promotion } = useProductPromotion(product?.id);
  const { data: vouchers = [] } = useProductVouchers(product?.id);

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Đã sao chép!",
      description: `Mã ${code} đã được sao chép vào clipboard`,
    });
  };

  useEffect(() => {
    if (product?.product_variants?.[0]) {
      setSelectedVariant(product.product_variants[0]);
    }
  }, [product]);

  // Reset quantity when variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy sản phẩm</h1>
          <Button onClick={() => navigate("/")}>Về trang chủ</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const basePrice = selectedVariant?.price || product.base_price;
  const comparePrice = selectedVariant?.compare_at_price || product.compare_at_price;
  
  // Calculate pricing based on promotion or compare_at_price
  const hasPromotionDiscount = promotion?.discount_value && promotion.discount_value > 0;
  const hasCompareAtDiscount = comparePrice && comparePrice > basePrice;

  let currentPrice = basePrice;
  let originalPrice = basePrice;
  let discountPercentage = 0;

  if (hasPromotionDiscount && promotion) {
    originalPrice = basePrice;
    if (promotion.discount_type === "percentage") {
      currentPrice = basePrice * (1 - promotion.discount_value! / 100);
      discountPercentage = Math.round(promotion.discount_value!);
    } else if (promotion.discount_type === "fixed_amount") {
      currentPrice = Math.max(0, basePrice - promotion.discount_value!);
      discountPercentage = Math.round((promotion.discount_value! / basePrice) * 100);
    } else if (promotion.discount_type === "special_price") {
      currentPrice = promotion.discount_value!;
      discountPercentage = Math.round(((basePrice - promotion.discount_value!) / basePrice) * 100);
    }
  } else if (hasCompareAtDiscount) {
    originalPrice = comparePrice!;
    currentPrice = basePrice;
    discountPercentage = Math.round((1 - basePrice / comparePrice!) * 100);
  }

  const hasDiscount = discountPercentage > 0;

  // Breadcrumb: use category or first collection as fallback
  const primaryCategory = product.product_collections?.[0]?.categories;
  
  // Per-variant stock check
  const variantStock = selectedVariant?.stock_quantity;
  const isInStock = variantStock == null || variantStock > 0;
  
  // Check if ALL variants are out of stock
  const allVariantsOOS = product.product_variants?.length > 0 && 
    product.product_variants.every((v: any) => v.stock_quantity !== null && v.stock_quantity <= 0);

  // Collection ID for related products
  const collectionId = product.category_id || product.product_collections?.[0]?.collection_id;

  // Hide variant selector for single-variant "Title" products
  const shouldShowVariants = product.product_variants && product.product_variants.length > 0 && 
    !(product.product_variants.length === 1 && product.option1_name === "Title");

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      variantId: selectedVariant?.id,
      quantity,
    });
  };

  // Handle variant change with image switching
  const handleVariantChange = (variant: any) => {
    setSelectedVariant(variant);
  };

  // Find image index for selected variant
  const getVariantImageIndex = () => {
    if (!selectedVariant?.source_variant_id || !product.product_images) return undefined;
    const variantSourceId = Number(selectedVariant.source_variant_id);
    const sortedImages = [...(product.product_images || [])].sort((a: any, b: any) => {
      if (a.is_primary) return -1;
      if (b.is_primary) return 1;
      return (a.display_order || 0) - (b.display_order || 0);
    });
    const idx = sortedImages.findIndex((img: any) => 
      img.variant_ids && Array.isArray(img.variant_ids) && img.variant_ids.includes(variantSourceId)
    );
    return idx >= 0 ? idx : undefined;
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      
      <ProductBreadcrumb
        productName={product.name}
        categoryName={primaryCategory?.name}
        categorySlug={primaryCategory?.slug}
      />
      
      <div className="container mx-auto px-4 py-2 overflow-x-hidden">
        {/* Main Product Section */}
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-10 mb-0 max-w-full min-w-0">
          {/* Left Column - Images */}
          <div className="min-w-0">
            <ProductImageGallery 
              images={product.product_images || []} 
              productName={product.name}
              isFeatured={product.is_featured}
              isOnSale={hasDiscount}
              activeIndex={getVariantImageIndex()}
            />
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-3 min-w-0 max-w-full">
            {/* Product Name */}
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight max-w-full break-words">
              {product.name}
            </h1>

            {/* Stock Status Row (no fake reviews) */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Only show real reviews if they exist */}
              {product.rating && product.rating_count && product.rating_count > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i} 
                          className={`text-lg ${i < Math.round(product.rating!) ? "text-yellow-400" : "text-muted"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-primary">
                      ({product.rating_count} đánh giá)
                    </span>
                  </div>
                  <span className="text-muted-foreground">|</span>
                </>
              )}
              {isInStock ? (
                <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Còn hàng {variantStock != null && `(${variantStock})`}
                </span>
              ) : (
                <span className="text-sm text-destructive font-medium">Hết hàng</span>
              )}
            </div>

            {/* All variants OOS banner */}
            {allVariantsOOS && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive">Sản phẩm này đã hết hàng</p>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-bold text-foreground">
                {currentPrice.toLocaleString('vi-VN')} ₫
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {originalPrice.toLocaleString('vi-VN')} ₫
                  </span>
                  <span className="px-2 py-1 text-sm font-medium text-green-600 bg-green-100 rounded">
                    -{discountPercentage}%
                  </span>
                </>
              )}
            </div>

            {/* Applicable Vouchers */}
            {vouchers.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Ticket className="h-4 w-4 text-destructive" />
                  Mã giảm giá có thể áp dụng:
                </span>
                <div className="flex flex-wrap gap-2">
                  {vouchers.map((voucher) => (
                    <div
                      key={voucher.id}
                      className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg"
                    >
                      <span className="text-destructive font-semibold">
                        {voucher.discount_type === "percentage"
                          ? `-${voucher.discount_value}%`
                          : `-${(voucher.discount_value || 0).toLocaleString('vi-VN')}₫`}
                      </span>
                      {voucher.voucher_code && (
                        <>
                          <span className="text-xs text-muted-foreground">|</span>
                          <code className="text-sm font-mono bg-background px-2 py-0.5 rounded">
                            {voucher.voucher_code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyVoucherCode(voucher.voucher_code!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Short Description (from meta_description) */}
            {product.meta_description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {product.meta_description}
              </p>
            )}

            {/* Brand & Origin */}
            {(product.brand || product.product_origins) && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {product.brand && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Thương hiệu:</span>
                    <Link 
                      to={`/collections/${product.brand.toLowerCase().replace(/\s+/g, '-')}`}
                      className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                    >
                      {product.brand}
                    </Link>
                  </div>
                )}
                {product.product_origins && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Xuất xứ:</span>
                    <span className="font-medium text-foreground">{product.product_origins.name_vi}</span>
                  </div>
                )}
              </div>
            )}

            {/* Variants Selector */}
            {shouldShowVariants && (
              <ProductVariantSelector
                variants={product.product_variants}
                selectedVariant={selectedVariant}
                onVariantChange={handleVariantChange}
                optionNames={{
                  option1: product.option1_name,
                  option2: product.option2_name,
                  option3: product.option3_name,
                }}
              />
            )}

            {/* Stock Quantity Display */}
            {selectedVariant?.stock_quantity != null && (
              <p className="text-sm text-muted-foreground">
                Số lượng có sẵn: <span className={`font-medium ${isInStock ? 'text-foreground' : 'text-destructive'}`}>
                  {isInStock ? selectedVariant.stock_quantity : 'Hết hàng'}
                </span>
              </p>
            )}

            {/* Quantity and Add to Cart Row */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Quantity Selector */}
              <div className={`flex items-center border border-border rounded-lg ${!isInStock ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!isInStock || quantity <= 1}
                  className="px-2.5 py-2 md:px-4 md:py-3 text-base md:text-lg font-medium hover:bg-muted transition-colors"
                >
                  −
                </button>
                <span className="px-2 py-2 md:px-4 md:py-3 text-base md:text-lg font-medium min-w-[2rem] md:min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => {
                    const max = variantStock != null ? variantStock : Infinity;
                    setQuantity(Math.min(quantity + 1, max));
                  }}
                  disabled={!isInStock}
                  className="px-2.5 py-2 md:px-4 md:py-3 text-base md:text-lg font-medium hover:bg-muted transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <Button
                size="lg"
                className="flex-1 h-10 md:h-14 text-sm md:text-base bg-green-500 hover:bg-green-600 text-white disabled:bg-muted disabled:text-muted-foreground"
                onClick={handleAddToCart}
                disabled={!isInStock}
              >
                <ShoppingCart className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                {isInStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
              </Button>

              {/* Wishlist Button */}
              <Button
                size="lg"
                variant="outline"
                className="h-10 w-10 md:h-14 md:w-14 p-0"
              >
                <Heart className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            {/* Trust Badges */}
            <ProductTrustBadges productId={product.id} />
          </div>
        </div>

        {/* Product Details Tabs and Nutrition Facts */}
        {(() => {
          const hasIngredients = !!product.ingredients && product.ingredients.trim() !== '';
          const hasFeeding = !!product.feeding_guidelines && product.feeding_guidelines.trim() !== '';
          const hasNutrition = product.nutrition_facts
            && Array.isArray(product.nutrition_facts) && (product.nutrition_facts as any[]).length > 0;

          return (
            <div className={`grid ${hasNutrition ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8 mt-6 mb-16`}>
              <div className={hasNutrition ? 'lg:col-span-2' : ''}>
                <Tabs defaultValue="description">
                  <TabsList className="w-full bg-transparent border-b border-border rounded-none p-0 h-auto overflow-x-auto">
                    <div className="flex w-max min-w-full">
                      <TabsTrigger 
                        value="description" 
                        className="whitespace-nowrap rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-3 md:px-6 py-3"
                      >
                        Mô tả
                      </TabsTrigger>
                      {hasIngredients && (
                        <TabsTrigger 
                          value="ingredients"
                          className="whitespace-nowrap rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-3 md:px-6 py-3"
                        >
                          Thành phần
                        </TabsTrigger>
                      )}
                      {hasFeeding && (
                        <TabsTrigger 
                          value="feeding"
                          className="whitespace-nowrap rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-3 md:px-6 py-3"
                        >
                          Hướng dẫn cho ăn
                        </TabsTrigger>
                      )}
                    </div>
                  </TabsList>
                  
                  <TabsContent value="description" className="pt-6">
                    <div className="relative">
                      <div 
                        className={`space-y-4 overflow-hidden transition-all ${!expandedTabs.description ? 'max-h-[200px]' : ''}`}
                      >
                        <div 
                          className="prose prose-sm max-w-none text-foreground text-sm break-words overflow-x-hidden [&_p]:text-sm [&_li]:text-sm [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm [&_h4]:text-sm [&_strong]:text-sm [&_a]:break-all [&_code]:break-all [&_pre]:overflow-x-auto [&_table]:block [&_table]:overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(sanitizeDescription(product.description || '')) || "Chưa có mô tả." }}
                        />
                      </div>
                      {!expandedTabs.description && (
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedTabs(prev => ({ ...prev, description: !prev.description }))}
                      className="text-sm text-primary font-medium mt-3 hover:underline"
                    >
                      {expandedTabs.description ? 'Thu gọn' : 'Xem thêm'}
                    </button>
                  </TabsContent>
                  
                  {hasIngredients && (
                    <TabsContent value="ingredients" className="pt-6">
                      <div className="relative">
                        <div className={`overflow-hidden transition-all ${!expandedTabs.ingredients ? 'max-h-[200px]' : ''}`}>
                          <div 
                            className="prose prose-sm max-w-none text-sm [&_p]:text-sm"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(sanitizeDescription(product.ingredients || '')) }}
                          />
                        </div>
                        {!expandedTabs.ingredients && (
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                        )}
                      </div>
                      <button
                        onClick={() => setExpandedTabs(prev => ({ ...prev, ingredients: !prev.ingredients }))}
                        className="text-sm text-primary font-medium mt-3 hover:underline"
                      >
                        {expandedTabs.ingredients ? 'Thu gọn' : 'Xem thêm'}
                      </button>
                    </TabsContent>
                  )}
                  
                  {hasFeeding && (
                    <TabsContent value="feeding" className="pt-6">
                      <div className="relative">
                        <div className={`overflow-hidden transition-all ${!expandedTabs.feeding ? 'max-h-[200px]' : ''}`}>
                          <div 
                            className="prose prose-sm max-w-none text-sm [&_p]:text-sm [&_table]:block [&_table]:overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(sanitizeDescription(product.feeding_guidelines || '')) }}
                          />
                        </div>
                        {!expandedTabs.feeding && (
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                        )}
                      </div>
                      <button
                        onClick={() => setExpandedTabs(prev => ({ ...prev, feeding: !prev.feeding }))}
                        className="text-sm text-primary font-medium mt-3 hover:underline"
                      >
                        {expandedTabs.feeding ? 'Thu gọn' : 'Xem thêm'}
                      </button>
                    </TabsContent>
                  )}
                </Tabs>
              </div>

              {hasNutrition && (
                <div className="bg-muted/50 rounded-xl p-4 h-fit w-full lg:max-w-xs">
                  <h3 className="text-base font-bold mb-4">Thông tin dinh dưỡng</h3>
                  <div className="space-y-2 text-sm">
                    {(product.nutrition_facts as Array<{ label: string; value: string }>).map((fact, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 py-1.5 border-b border-border last:border-0">
                        <span className="text-muted-foreground min-w-0 flex-1 break-words">{fact.label}</span>
                        <span className="font-semibold text-primary whitespace-nowrap">{fact.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Related Products - using collection */}
        <RelatedProducts
          currentProductId={product.id}
          collectionId={collectionId}
          productType={product.product_type}
          brand={product.brand}
        />
      </div>

      <Footer />
    </div>
  );
}
