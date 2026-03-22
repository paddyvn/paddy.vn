import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateVoucher, calculateVoucherDiscount } from "@/lib/voucher-utils";
import { useComboDeals } from "@/hooks/useComboDeals";
import { useTieredDeals } from "@/hooks/useTieredDeals";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Trash2, Plus, Minus, ShoppingBag, Truck, Tag, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useProductsPromotions } from "@/hooks/useProductPromotions";
import { getEffectivePrice, getItemBasePrice } from "@/lib/promotion-price-utils";
import { useCartRecommendations } from "@/hooks/useCartRecommendations";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "@/components/ProductCard";

const FREE_SHIPPING_THRESHOLD = 500000;

export default function Cart() {
  const [userId, setUserId] = useState<string | undefined>();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    promotionId: string;
    discount_type: string;
    discount_value: number;
    max_discount: number | null;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const { cart, isLoading, removeFromCart, updateQuantity } = useCart(userId);
  const cartProductIds = (cart || [])
    .map((item) => item.product_id)
    .filter((id): id is string => !!id);
  const { data: promotionsMap } = useProductsPromotions(cartProductIds);
  const { data: recommendations = [] } = useCartRecommendations(cartProductIds);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  const getPrimaryImage = (images: Array<{ image_url: string; is_primary: boolean }> | undefined) => {
    if (!images || images.length === 0) {
      return "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=100&h=100&fit=crop";
    }
    const primary = images.find(img => img.is_primary);
    return primary?.image_url || images[0]?.image_url;
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const basePrice = getItemBasePrice(item);
      const promotion = promotionsMap?.[item.product_id];
      const { effectivePrice } = getEffectivePrice(basePrice, promotion);
      return total + effectivePrice * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  // Combo & Tiered deal hooks
  const dealCartItems = (cart || []).map((item) => {
    const basePrice = getItemBasePrice(item);
    const promotion = promotionsMap?.[item.product_id];
    const { effectivePrice } = getEffectivePrice(basePrice, promotion);
    return {
      product_id: item.product_id,
      quantity: item.quantity,
      unitPrice: effectivePrice,
    };
  });

  const { data: comboDiscounts = [] } = useComboDeals(dealCartItems);
  const { data: tieredDiscounts = [] } = useTieredDeals(dealCartItems);

  const totalDealDiscount = [
    ...comboDiscounts.map((d) => d.discountAmount),
    ...tieredDiscounts.map((d) => d.discountAmount),
  ].reduce((sum, d) => sum + d, 0);

  const discount = appliedCoupon?.discount || 0;
  const total = subtotal - discount - totalDealDiscount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    try {
      const result = await validateVoucher(couponCode, subtotal);

      if (!result.valid || !result.voucher) {
        toast({
          title: "Mã giảm giá không hợp lệ",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      const v = result.voucher;
      const discountAmount = calculateVoucherDiscount(
        v.discount_type,
        v.discount_value,
        v.max_discount,
        subtotal
      );

      setAppliedCoupon({
        code: v.voucher_code,
        discount: discountAmount,
        promotionId: v.id,
        discount_type: v.discount_type,
        discount_value: v.discount_value,
        max_discount: v.max_discount,
      });
      setCouponCode("");
      toast({
        title: "Áp dụng mã giảm giá thành công",
        description: `Giảm ${formatPrice(discountAmount)}₫`,
      });
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể áp dụng mã giảm giá",
        variant: "destructive",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Fix 4: Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Giỏ hàng</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Fix 3: Title with item count + continue shopping link */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            Giỏ hàng của bạn
            {cart.length > 0 && (
              <span className="text-muted-foreground font-normal ml-2">({cart.length})</span>
            )}
          </h1>
          {cart.length > 0 && (
            <Button
              variant="link"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Tiếp tục mua sắm
            </Button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-20 w-20 text-muted-foreground mb-6" />
            <h2 className="text-xl font-semibold mb-2">Giỏ hàng trống</h2>
            <p className="text-muted-foreground mb-6">
              Hãy thêm sản phẩm yêu thích vào giỏ hàng
            </p>
            <Button onClick={() => navigate("/")} size="lg">
              Tiếp tục mua sắm
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Sản phẩm ({cart.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => {
                    const basePrice = getItemBasePrice(item);
                    const promotion = promotionsMap?.[item.product_id];
                    const { effectivePrice, hasDiscount, originalPrice } = getEffectivePrice(basePrice, promotion);
                    const productImages = item.products?.product_images;
                    
                    return (
                      <div key={item.id}>
                        <div className="flex gap-4">
                          <img
                            src={getPrimaryImage(productImages)}
                            alt={item.products?.name || 'Product'}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                            onClick={() => navigate(`/products/${item.products?.slug}`)}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="font-medium line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                              onClick={() => navigate(`/products/${item.products?.slug}`)}
                            >
                              {item.products?.name}
                            </h3>
                            {item.product_variants?.name && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.product_variants.name}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-primary font-semibold">
                                {formatPrice(effectivePrice)}₫
                              </span>
                              {hasDiscount && (
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatPrice(originalPrice)}₫
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    if (item.quantity > 1) {
                                      updateQuantity({ cartItemId: item.id, quantity: item.quantity - 1 });
                                    }
                                  }}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-10 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity({ cartItemId: item.id, quantity: item.quantity + 1 })}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <span className="font-semibold">
                                    {formatPrice(effectivePrice * item.quantity)}₫
                                  </span>
                                  {hasDiscount && (
                                    <span className="text-xs text-muted-foreground line-through ml-1">
                                      {formatPrice(originalPrice * item.quantity)}₫
                                    </span>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Separator className="mt-4" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Column */}
            <div className="space-y-4">
              {/* Fix 2: Free Shipping Progress Bar */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-primary" />
                    {isFreeShipping ? (
                      <span className="text-sm font-medium text-green-600">
                        Bạn được miễn phí vận chuyển! 🎉
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Mua thêm <span className="font-semibold text-primary">{formatPrice(remaining)}₫</span> để được freeship
                      </span>
                    )}
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </CardContent>
              </Card>

              {/* Coupon Code */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Mã giảm giá
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {appliedCoupon.code}
                        </Badge>
                        <p className="text-sm text-green-700 mt-1">
                          Giảm {formatPrice(appliedCoupon.discount)}₫
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRemoveCoupon}
                        className="text-destructive hover:text-destructive"
                      >
                        Xóa
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập mã giảm giá"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleApplyCoupon} 
                        disabled={isApplyingCoupon || !couponCode.trim()}
                      >
                        {isApplyingCoupon ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Áp dụng"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Tổng đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{formatPrice(subtotal)}₫</span>
                  </div>
                  
                  {/* Fix 1: Simplified shipping line */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span>
                      {isFreeShipping ? (
                        <span className="text-green-600 font-medium">Miễn phí</span>
                      ) : (
                        "Tính khi thanh toán"
                      )}
                    </span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá voucher</span>
                      <span>-{formatPrice(discount)}₫</span>
                    </div>
                  )}
                  
                  {comboDiscounts.map((cd) => (
                    <div key={cd.promotionId} className="flex justify-between text-sm text-green-600">
                      <span>{cd.description}</span>
                      <span>-{formatPrice(cd.discountAmount)}₫</span>
                    </div>
                  ))}
                  {tieredDiscounts.map((td) => (
                    <div key={td.promotionId} className="flex justify-between text-sm text-green-600">
                      <span>{td.description}</span>
                      <span>-{formatPrice(td.discountAmount)}₫</span>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{formatPrice(total)}₫</span>
                  </div>
                  
                  {/* Fix 1: No disabled gate */}
                  <Button 
                    className="w-full mt-4" 
                    size="lg"
                    onClick={() => navigate("/thanh-toan", {
                      state: appliedCoupon ? { voucher: appliedCoupon } : undefined,
                    })}
                  >
                    Tiến hành thanh toán
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Fix 5: Product Recommendations */}
        {recommendations.length > 0 && cart.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">Có thể bạn cũng thích</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recommendations.slice(0, 10).map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.base_price}
                  image={product.product_images?.find(i => i.is_primary)?.image_url || product.product_images?.[0]?.image_url || ""}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
