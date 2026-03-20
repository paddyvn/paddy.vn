import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Check, 
  MapPin, 
  CreditCard, 
  Package, 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  Truck,
  Building2,
  Wallet,
  CheckCircle2,
  Tag,
  X,
  RefreshCw
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useProductsPromotions } from "@/hooks/useProductPromotions";
import { getEffectivePrice, getItemBasePrice } from "@/lib/promotion-price-utils";
import { useDeliveryMethods } from "@/hooks/useDeliveryMethods";
import { useCreateSubscription, type SubscriptionFrequency } from "@/hooks/useSubscriptions";
import { useComboDeals } from "@/hooks/useComboDeals";
import { useTieredDeals } from "@/hooks/useTieredDeals";
import { useSubscriptionDeal } from "@/hooks/useSubscriptionDeal";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { validateVoucher, calculateVoucherDiscount as calcVoucherDiscount } from "@/lib/voucher-utils";

const PROVINCES = [
  "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
  "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
];

const PAYMENT_METHODS = [
  { 
    id: "cod", 
    name: "Thanh toán khi nhận hàng (COD)", 
    description: "Thanh toán bằng tiền mặt khi nhận hàng",
    icon: Truck 
  },
  { 
    id: "bank_transfer", 
    name: "Chuyển khoản ngân hàng", 
    description: "Chuyển khoản trước khi giao hàng",
    icon: Building2 
  },
  { 
    id: "momo", 
    name: "Ví MoMo", 
    description: "Thanh toán qua ví điện tử MoMo",
    icon: Wallet 
  },
  { 
    id: "vnpay", 
    name: "VNPay", 
    description: "Thanh toán qua cổng VNPay",
    icon: CreditCard 
  },
];

interface AddressForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  ward: string;
}

export default function Checkout() {
  const [userId, setUserId] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Address form
  const [addressForm, setAddressForm] = useState<AddressForm>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    district: "",
    ward: "",
  });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(true);
  
  // Delivery & Payment
  const [selectedDelivery, setSelectedDelivery] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [orderNotes, setOrderNotes] = useState("");
  
  // Voucher/Coupon
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount_type: string;
    discount_value: number;
    max_discount: number | null;
    promotionId: string;
  } | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  
  // Subscribe & Save
  const [enableSubscription, setEnableSubscription] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState<SubscriptionFrequency>("monthly");
  
  
  const { cart, isLoading: cartLoading } = useCart(userId);
  const cartProductIds = (cart || [])
    .map((item) => item.product_id)
    .filter((id): id is string => !!id);
  const { data: promotionsMap } = useProductsPromotions(cartProductIds);
  const { data: deliveryMethods = [], isLoading: deliveryMethodsLoading } = useDeliveryMethods(true);
  const { data: subscriptionDeal } = useSubscriptionDeal();
  const createSubscription = useCreateSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Accept voucher from Cart navigation state
  const incomingVoucher = (location.state as any)?.voucher;
  useEffect(() => {
    if (incomingVoucher) {
      setAppliedVoucher({
        code: incomingVoucher.code,
        discount_type: incomingVoucher.discount_type,
        discount_value: incomingVoucher.discount_value,
        max_discount: incomingVoucher.max_discount,
        promotionId: incomingVoucher.promotionId,
      });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      setUserEmail(session.user.email || null);
      
      // Fetch user profile for pre-filling
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", session.user.id)
        .single();
      
      if (profile) {
        setAddressForm(prev => ({
          ...prev,
          fullName: profile.full_name || "",
          phone: profile.phone || "",
        }));
      }
      
      // Fetch saved addresses
      const { data: addresses } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", session.user.id)
        .order("is_default", { ascending: false });
      
      if (addresses && addresses.length > 0) {
        setSavedAddresses(addresses);
        const defaultAddress = addresses.find(a => a.is_default) || addresses[0];
        setSelectedAddressId(defaultAddress.id);
        setUseNewAddress(false);
      }
    });
  }, [navigate]);

  // Set default delivery method when loaded
  useEffect(() => {
    if (deliveryMethods.length > 0 && !selectedDelivery) {
      setSelectedDelivery(deliveryMethods[0].id);
    }
  }, [deliveryMethods, selectedDelivery]);

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
  const deliveryMethod = deliveryMethods.find(m => m.id === selectedDelivery);
  const shippingCost = deliveryMethod?.price || 0;

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
  
  // Calculate discount (voucher + subscription)
  const subscriptionDiscountPct = subscriptionDeal?.discountPercentage || 0;

  const calculateVoucherDiscount = () => {
    if (!appliedVoucher) return 0;
    let voucherDiscount = 0;
    if (appliedVoucher.discount_type === "percentage") {
      voucherDiscount = (subtotal * appliedVoucher.discount_value) / 100;
      if (appliedVoucher.max_discount && voucherDiscount > appliedVoucher.max_discount) {
        voucherDiscount = appliedVoucher.max_discount;
      }
    } else {
      voucherDiscount = appliedVoucher.discount_value;
    }
    return Math.min(voucherDiscount, subtotal);
  };
  
  const voucherDiscount = calculateVoucherDiscount();
  const subscriptionDiscount = enableSubscription ? Math.round(subtotal * subscriptionDiscountPct / 100) : 0;
  const discount = voucherDiscount + subscriptionDiscount;
  const total = subtotal + shippingCost - discount - totalDealDiscount;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    
    setIsApplyingVoucher(true);
    try {
      const result = await validateVoucher(voucherCode, subtotal);

      if (!result.valid || !result.voucher) {
        toast({
          title: "Mã không hợp lệ",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      const v = result.voucher;
      setAppliedVoucher({
        code: v.voucher_code,
        discount_type: v.discount_type,
        discount_value: v.discount_value,
        max_discount: v.max_discount,
        promotionId: v.id,
      });
      setVoucherCode("");
      toast({
        title: "Áp dụng thành công",
        description: `Mã ${v.voucher_code} đã được áp dụng`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể kiểm tra mã giảm giá",
        variant: "destructive",
      });
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
  };

  const getSelectedAddress = () => {
    if (useNewAddress) {
      return addressForm;
    }
    return savedAddresses.find(a => a.id === selectedAddressId);
  };

  const validateAddress = () => {
    const address = getSelectedAddress();
    if (!address) return false;
    
    if (useNewAddress) {
      return (
        addressForm.fullName.trim() !== "" &&
        addressForm.phone.trim() !== "" &&
        addressForm.addressLine1.trim() !== "" &&
        addressForm.city.trim() !== ""
      );
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateAddress()) {
      toast({
        title: "Vui lòng điền đầy đủ thông tin",
        description: "Họ tên, số điện thoại, địa chỉ và thành phố là bắt buộc",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PD${timestamp}${random}`;
  };

  const handlePlaceOrder = async () => {
    if (!userId) return;
    
    setIsSubmitting(true);
    try {
      const address = getSelectedAddress();
      const newOrderNumber = generateOrderNumber();
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          order_number: newOrderNumber,
          subtotal: subtotal,
          shipping_fee: shippingCost,
          discount: discount,
          total: total,
          status: "pending",
          financial_status: selectedPayment === "cod" ? "pending" : "pending",
          notes: orderNotes || null,
          delivery_method: deliveryMethod?.name || null,
          payment_gateway: selectedPayment,
          source_name: "web",
          customer_email: userEmail || null,
          customer_phone: useNewAddress ? addressForm.phone : (address?.phone || null),
          coupon_code: appliedVoucher?.code || null,
          promotion_id: appliedVoucher?.promotionId || null,
          shipping_address: useNewAddress 
            ? {
                full_name: addressForm.fullName,
                phone: addressForm.phone,
                address_line1: addressForm.addressLine1,
                address_line2: addressForm.addressLine2,
                city: addressForm.city,
                district: addressForm.district,
                ward: addressForm.ward,
              }
            : {
                full_name: address.full_name,
                phone: address.phone,
                address_line1: address.address_line1,
                address_line2: address.address_line2,
                city: address.city,
                district: address.district,
                ward: address.ward,
              },
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with promotion-adjusted prices
      const orderItems = cart.map(item => {
        const basePrice = getItemBasePrice(item);
        const promotion = promotionsMap?.[item.product_id];
        const { effectivePrice } = getEffectivePrice(basePrice, promotion);
        return {
          order_id: order.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.products?.name || "Unknown Product",
          variant_name: item.product_variants?.name || null,
          quantity: item.quantity,
          price: effectivePrice,
          subtotal: effectivePrice * item.quantity,
        };
      });

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Increment voucher usage
      if (appliedVoucher?.promotionId) {
        await supabase.rpc("increment_voucher_usage", {
          p_promotion_id: appliedVoucher.promotionId,
        });
      }

      // Clear cart
      const cartItemIds = cart.map(item => item.id);
      await supabase
        .from("cart_items")
        .delete()
        .in("id", cartItemIds);

      // Save new address if requested
      if (useNewAddress && addressForm.fullName) {
        await supabase.from("addresses").insert({
          user_id: userId,
          full_name: addressForm.fullName,
          phone: addressForm.phone,
          address_line1: addressForm.addressLine1,
          address_line2: addressForm.addressLine2,
          city: addressForm.city,
          district: addressForm.district,
          ward: addressForm.ward,
          is_default: savedAddresses.length === 0,
        });
      }

      // Create subscription if enabled
      if (enableSubscription) {
        const shippingAddr = useNewAddress 
          ? {
              full_name: addressForm.fullName,
              phone: addressForm.phone,
              address_line1: addressForm.addressLine1,
              address_line2: addressForm.addressLine2,
              city: addressForm.city,
              district: addressForm.district,
              ward: addressForm.ward,
            }
          : {
              full_name: address.full_name,
              phone: address.phone,
              address_line1: address.address_line1,
              address_line2: address.address_line2,
              city: address.city,
              district: address.district,
              ward: address.ward,
            };

        await createSubscription.mutateAsync({
          user_id: userId,
          frequency: subscriptionFrequency,
          discount_percent: subscriptionDiscountPct,
          shipping_address: shippingAddr,
          delivery_method: deliveryMethod?.name,
          items: cart.map(item => {
            const basePrice = getItemBasePrice(item);
            const promotion = promotionsMap?.[item.product_id];
            const { effectivePrice } = getEffectivePrice(basePrice, promotion);
            return {
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity,
              price: effectivePrice,
            };
          }),
        });
      }

      navigate(`/order-confirmation/${newOrderNumber}`);
      
    } catch (error: any) {
      console.error("Order error:", error);
      toast({
        title: "Lỗi đặt hàng",
        description: error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Địa chỉ", icon: MapPin },
    { number: 2, title: "Thanh toán", icon: CreditCard },
    { number: 3, title: "Xác nhận", icon: Package },
  ];

  if (cartLoading || deliveryMethodsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer hideNewsletter />
      </div>
    );
  }

  if (cart.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      currentStep >= step.number 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-sm mt-2 ${
                    currentStep >= step.number ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`flex-1 h-0.5 mx-4 transition-colors ${
                      currentStep > step.number ? "bg-primary" : "bg-muted"
                    }`}
                    style={{ width: "80px" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Địa chỉ giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {savedAddresses.length > 0 && (
                    <div className="space-y-3">
                      <Label>Địa chỉ đã lưu</Label>
                      <RadioGroup 
                        value={useNewAddress ? "new" : selectedAddressId || ""} 
                        onValueChange={(value) => {
                          if (value === "new") {
                            setUseNewAddress(true);
                          } else {
                            setUseNewAddress(false);
                            setSelectedAddressId(value);
                          }
                        }}
                      >
                        {savedAddresses.map((address) => (
                          <div 
                            key={address.id}
                            className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                              !useNewAddress && selectedAddressId === address.id 
                                ? "border-primary bg-primary/5" 
                                : "hover:border-primary/50"
                            }`}
                            onClick={() => {
                              setUseNewAddress(false);
                              setSelectedAddressId(address.id);
                            }}
                          >
                            <RadioGroupItem value={address.id} id={address.id} />
                            <div className="flex-1">
                              <p className="font-medium">{address.full_name}</p>
                              <p className="text-sm text-muted-foreground">{address.phone}</p>
                              <p className="text-sm text-muted-foreground">
                                {address.address_line1}
                                {address.address_line2 && `, ${address.address_line2}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {[address.ward, address.district, address.city].filter(Boolean).join(", ")}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div 
                          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            useNewAddress ? "border-primary bg-primary/5" : "hover:border-primary/50"
                          }`}
                          onClick={() => setUseNewAddress(true)}
                        >
                          <RadioGroupItem value="new" id="new-address" />
                          <span className="font-medium">Thêm địa chỉ mới</span>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {(useNewAddress || savedAddresses.length === 0) && (
                    <div className="space-y-4">
                      {savedAddresses.length > 0 && <Separator />}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Họ và tên *</Label>
                          <Input
                            id="fullName"
                            value={addressForm.fullName}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder="Nguyễn Văn A"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Số điện thoại *</Label>
                          <Input
                            id="phone"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="0912 345 678"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="addressLine1">Địa chỉ *</Label>
                        <Input
                          id="addressLine1"
                          value={addressForm.addressLine1}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                          placeholder="Số nhà, tên đường"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="addressLine2">Địa chỉ 2 (tùy chọn)</Label>
                        <Input
                          id="addressLine2"
                          value={addressForm.addressLine2}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                          placeholder="Tòa nhà, tầng, căn hộ..."
                        />
                      </div>
                      
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Tỉnh/Thành phố *</Label>
                          <Select 
                            value={addressForm.city} 
                            onValueChange={(value) => setAddressForm(prev => ({ ...prev, city: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn tỉnh/thành" />
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
                        <div className="space-y-2">
                          <Label htmlFor="district">Quận/Huyện</Label>
                          <Input
                            id="district"
                            value={addressForm.district}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, district: e.target.value }))}
                            placeholder="Quận/Huyện"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ward">Phường/Xã</Label>
                          <Input
                            id="ward"
                            value={addressForm.ward}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, ward: e.target.value }))}
                            placeholder="Phường/Xã"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipping Method */}
                  <Separator />
                  <div className="space-y-3">
                    <Label>Phương thức giao hàng</Label>
                    <RadioGroup value={selectedDelivery} onValueChange={setSelectedDelivery}>
                      {deliveryMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedDelivery === method.id 
                              ? "border-primary bg-primary/5" 
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedDelivery(method.id)}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <div>
                              <p className="font-medium">{method.name}</p>
                              <p className="text-sm text-muted-foreground">{method.description}</p>
                            </div>
                          </div>
                          <span className="font-semibold">{formatPrice(method.price)}₫</span>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Phương thức thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                    {PAYMENT_METHODS.map((method) => (
                      <div
                        key={method.id}
                        className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPayment === method.id 
                            ? "border-primary bg-primary/5" 
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedPayment(method.id)}
                      >
                        <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <method.icon className="h-5 w-5 text-primary" />
                            <p className="font-medium">{method.name}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="notes">Ghi chú đơn hàng (tùy chọn)</Label>
                    <Textarea
                      id="notes"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Địa chỉ giao hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const address = getSelectedAddress();
                      return (
                        <div>
                          <p className="font-medium">{useNewAddress ? addressForm.fullName : address?.full_name}</p>
                          <p className="text-muted-foreground">{useNewAddress ? addressForm.phone : address?.phone}</p>
                          <p className="text-muted-foreground">
                            {useNewAddress ? addressForm.addressLine1 : address?.address_line1}
                            {(useNewAddress ? addressForm.addressLine2 : address?.address_line2) && 
                              `, ${useNewAddress ? addressForm.addressLine2 : address?.address_line2}`}
                          </p>
                          <p className="text-muted-foreground">
                            {[
                              useNewAddress ? addressForm.ward : address?.ward,
                              useNewAddress ? addressForm.district : address?.district,
                              useNewAddress ? addressForm.city : address?.city
                            ].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const method = PAYMENT_METHODS.find(m => m.id === selectedPayment);
                        if (!method) return null;
                        return (
                          <>
                            <method.icon className="h-5 w-5 text-primary" />
                            <span className="font-medium">{method.name}</span>
                          </>
                        );
                      })()}
                    </div>
                    {orderNotes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Ghi chú: {orderNotes}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Sản phẩm ({cart.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cart.map((item) => {
                      const basePrice = getItemBasePrice(item);
                      const promotion = promotionsMap?.[item.product_id];
                      const { effectivePrice, hasDiscount, originalPrice } = getEffectivePrice(basePrice, promotion);
                      return (
                        <div key={item.id} className="flex gap-3">
                          <img
                            src={getPrimaryImage(item.products?.product_images)}
                            alt={item.products?.name || ''}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium line-clamp-1">{item.products?.name}</p>
                            {item.product_variants?.name && (
                              <p className="text-sm text-muted-foreground">{item.product_variants.name}</p>
                            )}
                            <div className="text-sm">
                              <span>{formatPrice(effectivePrice)}₫ x {item.quantity}</span>
                              {hasDiscount && (
                                <span className="text-xs text-muted-foreground line-through ml-2">
                                  {formatPrice(originalPrice)}₫
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatPrice(effectivePrice * item.quantity)}₫</p>
                            {hasDiscount && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatPrice(originalPrice * item.quantity)}₫
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
              ) : (
                <Button variant="outline" onClick={() => navigate("/cart")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Giỏ hàng
                </Button>
              )}
              
              {currentStep < 3 ? (
                <Button onClick={handleNextStep}>
                  Tiếp tục
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handlePlaceOrder} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Đặt hàng
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Tổng đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {cart.map((item) => {
                    const basePrice = getItemBasePrice(item);
                    const promotion = promotionsMap?.[item.product_id];
                    const { effectivePrice, hasDiscount, originalPrice } = getEffectivePrice(basePrice, promotion);
                    return (
                      <div key={item.id} className="flex gap-2">
                        <img
                          src={getPrimaryImage(item.products?.product_images)}
                          alt=""
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.products?.name}</p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatPrice(effectivePrice * item.quantity)}₫</p>
                          {hasDiscount && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(originalPrice * item.quantity)}₫
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Voucher Input */}
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    Mã giảm giá / Gift Card
                  </Label>
                  {appliedVoucher ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          {appliedVoucher.code}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={handleRemoveVoucher}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập mã giảm giá"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyVoucher()}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleApplyVoucher}
                        disabled={isApplyingVoucher || !voucherCode.trim()}
                      >
                        {isApplyingVoucher ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Áp dụng"
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Subscribe & Save - Hidden for now, will be enabled later
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-primary" />
                      <Label htmlFor="subscription" className="text-sm font-medium cursor-pointer">
                        Subscribe & Save {SUBSCRIPTION_DISCOUNT}%
                      </Label>
                    </div>
                    <Switch
                      id="subscription"
                      checked={enableSubscription}
                      onCheckedChange={setEnableSubscription}
                    />
                  </div>
                  
                  {enableSubscription && (
                    <div className="space-y-2 pl-6">
                      <Label className="text-xs text-muted-foreground">Tần suất giao hàng</Label>
                      <Select
                        value={subscriptionFrequency}
                        onValueChange={(value) => setSubscriptionFrequency(value as SubscriptionFrequency)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Hàng tuần</SelectItem>
                          <SelectItem value="bi-weekly">2 tuần/lần</SelectItem>
                          <SelectItem value="monthly">Hàng tháng</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Tự động đặt hàng lại theo lịch, tiết kiệm {SUBSCRIPTION_DISCOUNT}%
                      </p>
                    </div>
                  )}
                </div>
                */}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{formatPrice(subtotal)}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span>{formatPrice(shippingCost)}₫</span>
                  </div>
                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá voucher</span>
                      <span>-{formatPrice(voucherDiscount)}₫</span>
                    </div>
                  )}
                  {subscriptionDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Subscribe & Save ({SUBSCRIPTION_DISCOUNT}%)</span>
                      <span>-{formatPrice(subscriptionDiscount)}₫</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{formatPrice(total)}₫</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer hideNewsletter />
    </div>
  );
}
