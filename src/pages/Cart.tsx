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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Minus, ShoppingBag, Truck, Tag, ArrowRight, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useProductsPromotions } from "@/hooks/useProductPromotions";
import { getEffectivePrice, getItemBasePrice } from "@/lib/promotion-price-utils";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const SHIPPING_RATES = [
  { id: "standard", name: "Giao hàng tiêu chuẩn", price: 30000, days: "3-5 ngày" },
  { id: "express", name: "Giao hàng nhanh", price: 50000, days: "1-2 ngày" },
  { id: "free", name: "Miễn phí giao hàng", price: 0, days: "5-7 ngày", minOrder: 500000 },
];

const PROVINCES = [
  "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
  "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
];

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
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const { cart, isLoading, removeFromCart, updateQuantity } = useCart(userId);
  const cartProductIds = (cart || [])
    .map((item) => item.product_id)
    .filter((id): id is string => !!id);
  const { data: promotionsMap } = useProductsPromotions(cartProductIds);
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

  const shippingRate = SHIPPING_RATES.find(r => r.id === selectedShipping);
  const shippingCost = shippingRate?.minOrder && subtotal >= shippingRate.minOrder 
    ? 0 
    : (shippingRate?.price || 0);
  const discount = appliedCoupon?.discount || 0;
  const total = subtotal + shippingCost - discount - totalDealDiscount;

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
        <h1 className="text-2xl font-bold mb-6">Giỏ hàng của bạn</h1>

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

            {/* Order Summary */}
            <div className="space-y-4">
              {/* Shipping Calculator */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Tính phí vận chuyển
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tỉnh/Thành phố</label>
                    <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tỉnh/thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProvince && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium mb-2 block">Phương thức giao hàng</label>
                      {SHIPPING_RATES.map((rate) => {
                        const isFreeEligible = rate.minOrder && subtotal >= rate.minOrder;
                        const isDisabled = rate.minOrder && subtotal < rate.minOrder;
                        
                        return (
                          <div
                            key={rate.id}
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedShipping === rate.id 
                                ? "border-primary bg-primary/5" 
                                : isDisabled 
                                  ? "opacity-50 cursor-not-allowed" 
                                  : "hover:border-primary/50"
                            }`}
                            onClick={() => !isDisabled && setSelectedShipping(rate.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                selectedShipping === rate.id 
                                  ? "border-primary bg-primary" 
                                  : "border-muted-foreground"
                              }`}>
                                {selectedShipping === rate.id && (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{rate.name}</p>
                                <p className="text-xs text-muted-foreground">{rate.days}</p>
                                {rate.minOrder && (
                                  <p className="text-xs text-muted-foreground">
                                    Đơn tối thiểu {formatPrice(rate.minOrder)}₫
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="font-semibold text-sm">
                              {isFreeEligible || rate.price === 0 ? "Miễn phí" : `${formatPrice(rate.price)}₫`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span>
                      {selectedProvince 
                        ? shippingCost === 0 
                          ? "Miễn phí" 
                          : `${formatPrice(shippingCost)}₫`
                        : "Chưa tính"
                      }
                    </span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá</span>
                      <span>-{formatPrice(discount)}₫</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{formatPrice(total)}₫</span>
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    size="lg"
                    onClick={() => navigate("/checkout", {
                      state: appliedCoupon ? { voucher: appliedCoupon } : undefined,
                    })}
                    disabled={!selectedProvince}
                  >
                    Tiến hành thanh toán
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  {!selectedProvince && (
                    <p className="text-xs text-center text-muted-foreground">
                      Vui lòng chọn địa chỉ giao hàng
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
