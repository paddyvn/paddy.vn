import { useParams, useNavigate, Link } from "react-router-dom";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Heart, CheckCircle, Leaf, Truck, Award, Ticket, Copy } from "lucide-react";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { ProductVariantSelector } from "@/components/ProductVariantSelector";
import { ProductReviews } from "@/components/ProductReviews";
import { RelatedProducts } from "@/components/RelatedProducts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductBreadcrumb } from "@/components/ProductBreadcrumb";
import { useToast } from "@/hooks/use-toast";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { useProductPromotion } from "@/hooks/useProductPromotions";
import { useProductVouchers } from "@/hooks/useProductVouchers";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: product, isLoading, error } = useProduct(slug || "");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [subscribeEnabled, setSubscribeEnabled] = useState(false);

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
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => navigate("/")}>Return to home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const basePrice = selectedVariant?.price || product.base_price;
  const comparePrice = selectedVariant?.compare_at_price || product.compare_at_price;
  const averageRating = product.reviews?.length > 0
    ? product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / product.reviews.length
    : 0;
  
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

  const primaryCategory = product.product_collections?.[0]?.categories;
  
  const isInStock = selectedVariant?.stock_quantity == null || selectedVariant?.stock_quantity > 0;

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      variantId: selectedVariant?.id,
      quantity,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <ProductBreadcrumb
        productName={product.name}
        categoryName={primaryCategory?.name}
        categorySlug={primaryCategory?.slug}
      />
      
      <div className="container mx-auto px-4 py-6">
        {/* Main Product Section */}
        <div className="grid lg:grid-cols-2 gap-10 mb-16">
          {/* Left Column - Images */}
          <ProductImageGallery 
            images={product.product_images || []} 
            productName={product.name}
            isFeatured={product.is_featured}
          />

          {/* Right Column - Product Info */}
          <div className="space-y-5">
            {/* Promotion Badge */}
            {promotion && (
              <Badge 
                className="text-white text-sm px-3 py-1"
                style={{
                  background: promotion.gradient_from && promotion.gradient_to
                    ? `linear-gradient(135deg, ${promotion.gradient_from}, ${promotion.gradient_to})`
                    : promotion.promo_type === 'flash_sale' 
                      ? 'linear-gradient(135deg, #ef4444, #f97316)'
                      : 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                }}
              >
                {promotion.title}
              </Badge>
            )}

            {/* Product Name */}
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Rating and Stock Row */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-lg ${i < Math.round(averageRating) ? "text-yellow-400" : "text-muted"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-primary hover:underline cursor-pointer">
                  {(product.reviews?.length || 0).toLocaleString()} reviews
                </span>
              </div>
              <span className="text-muted-foreground">|</span>
              {isInStock ? (
                <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  In Stock
                </span>
              ) : (
                <span className="text-sm text-red-600 font-medium">Out of Stock</span>
              )}
            </div>

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
              <p className="text-sm text-muted-foreground leading-relaxed">
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
            {product.product_variants && product.product_variants.length > 0 && (
              <ProductVariantSelector
                variants={product.product_variants}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
                optionNames={{
                  option1: product.option1_name,
                  option2: product.option2_name,
                  option3: product.option3_name,
                }}
              />
            )}

            {/* Subscribe & Save */}
            <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-muted/30">
              <Checkbox 
                id="subscribe" 
                checked={subscribeEnabled}
                onCheckedChange={(checked) => setSubscribeEnabled(!!checked)}
              />
              <label htmlFor="subscribe" className="cursor-pointer">
                <span className="font-semibold text-foreground">Subscribe & Save 10%</span>
                <p className="text-sm text-muted-foreground">
                  Never run out! Get tailored deliveries and save on every order.
                </p>
              </label>
            </div>

            {/* Quantity and Add to Cart Row */}
            <div className="flex items-center gap-3">
              {/* Quantity Selector */}
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-lg font-medium hover:bg-muted transition-colors"
                >
                  −
                </button>
                <span className="px-4 py-3 text-lg font-medium min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 text-lg font-medium hover:bg-muted transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <Button
                size="lg"
                className="flex-1 h-14 text-base bg-green-500 hover:bg-green-600 text-white"
                onClick={handleAddToCart}
                disabled={!isInStock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>

              {/* Wishlist Button */}
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-14 p-0"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Vet Approved</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Leaf className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium">100% Organic</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium">Free 2-Day Shipping</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Award className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="text-sm font-medium">Satisfaction Guarantee</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs and Nutrition Facts */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Tabs Section */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="description">
              <TabsList className="w-auto bg-transparent border-b border-border rounded-none p-0 h-auto">
                <TabsTrigger 
                  value="description" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3"
                >
                  Description
                </TabsTrigger>
                <TabsTrigger 
                  value="ingredients"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3"
                >
                  Ingredients
                </TabsTrigger>
                <TabsTrigger 
                  value="feeding"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3"
                >
                  Feeding Guidelines
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="pt-6">
                <div className="space-y-4">
                  <div 
                    className="prose prose-sm max-w-none text-foreground text-sm [&_p]:text-sm [&_li]:text-sm [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm [&_h4]:text-sm [&_strong]:text-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) || "No description available." }}
                  />
                  
                  <div>
                    <h3 className="text-base font-bold mb-3">Key Benefits:</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-foreground">•</span>
                        High-quality protein from real chicken
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-foreground">•</span>
                        Omega-3 and Omega-6 fatty acids for healthy skin and coat
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-foreground">•</span>
                        Natural fiber for healthy digestion
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-foreground">•</span>
                        Essential vitamins and minerals for overall wellness
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ingredients" className="pt-6">
                <div className="prose prose-sm max-w-none text-sm [&_p]:text-sm">
                  <p className="text-sm text-muted-foreground">
                    Deboned Chicken, Chicken Meal, Sweet Potatoes, Peas, Potatoes, Pea Protein, 
                    Chicken Fat (preserved with Mixed Tocopherols), Natural Flavor, Flaxseed, 
                    Ocean Fish Meal, Salt, Choline Chloride, Dried Chicory Root, Tomatoes, 
                    Blueberries, Raspberries, Yucca Schidigera Extract, Dried Enterococcus 
                    faecium Fermentation Product, Dried Lactobacillus acidophilus Fermentation 
                    Product, Dried Lactobacillus casei Fermentation Product.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="feeding" className="pt-6">
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    Feed according to your pet's weight and activity level. Always ensure fresh 
                    water is available. Consult your veterinarian for specific dietary needs.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full max-w-lg text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-semibold">Weight</th>
                          <th className="text-left py-2 font-semibold">Daily Amount</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border">
                          <td className="py-2">3-12 lbs</td>
                          <td className="py-2">1/3 - 1 cup</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">13-20 lbs</td>
                          <td className="py-2">1 - 1 1/3 cups</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">21-35 lbs</td>
                          <td className="py-2">1 1/3 - 2 cups</td>
                        </tr>
                        <tr>
                          <td className="py-2">36-50 lbs</td>
                          <td className="py-2">2 - 2 2/3 cups</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Nutrition Facts Card - Independent */}
          <div className="bg-muted/50 rounded-xl p-6 h-fit">
            <h3 className="text-xl font-bold mb-6">Nutrition Facts</h3>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Crude Protein (min)</span>
                <span className="font-semibold text-primary">24.0%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Crude Fat (min)</span>
                <span className="font-semibold text-primary">14.0%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Crude Fiber (max)</span>
                <span className="font-semibold text-primary">4.0%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Moisture (max)</span>
                <span className="font-semibold text-primary">10.0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-16">
          <ProductReviews
            productId={product.id}
            reviews={product.reviews || []}
            userId={session?.user?.id}
          />
        </div>

        {/* Related Products */}
        <RelatedProducts
          currentProductId={product.id}
          productType={product.product_type}
          brand={product.brand}
        />
      </div>

      <Footer />
    </div>
  );
}
