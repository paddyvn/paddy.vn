import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Package,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Copy,
  ExternalLink,
  Search,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";

// ─── Status config (reused from CustomerOrderDetail) ───
type OrderStatus = "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700", icon: Package },
  confirmed: { label: "Đã xác nhận", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle2 },
  shipped: { label: "Đang giao", color: "bg-purple-100 text-purple-700", icon: Truck },
  delivered: { label: "Đã giao", color: "bg-green-100 text-green-700", icon: PackageCheck },
  cancelled: { label: "Đã huỷ", color: "bg-red-100 text-red-700", icon: XCircle },
};

const ORDER_STEPS: OrderStatus[] = ["pending", "processing", "confirmed", "shipped", "delivered"];

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
  momo: "Ví MoMo",
  vnpay: "VNPay",
};

function getStatusStep(status: string): number {
  const idx = ORDER_STEPS.indexOf(status as OrderStatus);
  return idx >= 0 ? idx : 0;
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone || "";
  return phone.slice(0, 4) + "***" + phone.slice(-3);
}

interface TrackOrderData {
  order: {
    order_number: string;
    status: string;
    subtotal: number;
    shipping_fee: number | null;
    discount: number | null;
    total: number;
    shipping_address: Record<string, string> | null;
    notes: string | null;
    created_at: string;
    payment_gateway: string | null;
    delivery_method: string | null;
    order_items: Array<{
      id: string;
      product_name: string;
      variant_name: string | null;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
  };
  fulfillments: Array<{
    tracking_number: string | null;
    tracking_url: string | null;
    tracking_company: string | null;
    status: string | null;
    created_at: string;
  }>;
}

export default function TrackOrder() {
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackOrderData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("track-order", {
        body: { orderNumber: orderNumber.trim(), phone: phone.trim() },
      });

      if (error) {
        toast({ title: "Đã xảy ra lỗi. Vui lòng thử lại.", variant: "destructive" });
        return;
      }

      if (data.error) {
        toast({ title: data.error, variant: "destructive" });
        return;
      }

      setResult(data);
    } catch {
      toast({ title: "Đã xảy ra lỗi. Vui lòng thử lại.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã sao chép" });
  };

  const resetForm = () => {
    setResult(null);
    setOrderNumber("");
    setPhone("");
  };

  // ─── Search form state ───
  if (!result) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 md:p-8">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-1">Tra cứu đơn hàng</h1>
                <p className="text-sm text-muted-foreground">
                  Nhập mã đơn hàng và số điện thoại để xem trạng thái đơn hàng.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="VD: PD1A2B3C"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    className="uppercase"
                    required
                  />
                </div>
                <div>
                  <Input
                    type="tel"
                    placeholder="Số điện thoại đặt hàng"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Tra cứu
                </Button>
              </form>

              {!isLoggedIn && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Chưa có tài khoản?{" "}
                  <Link to="/auth" className="text-primary hover:underline font-medium">
                    Đăng ký
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer hideNewsletter />
      </div>
    );
  }

  // ─── Results state ───
  const { order, fulfillments } = result;
  const status = (order.status as OrderStatus) || "pending";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const isCancelled = status === "cancelled";
  const currentStep = getStatusStep(status);
  const shippingAddress = order.shipping_address;
  const orderItems = order.order_items || [];
  const trackingFulfillments = fulfillments.filter((f) => f.tracking_number);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-2xl">
        {/* Back / reset link */}
        <button
          onClick={resetForm}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tra cứu đơn hàng khác
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-xl md:text-2xl font-bold">Đơn hàng #{order.order_number}</h1>
          <Badge className={`${statusConfig.color} border-0`}>
            <StatusIcon className="h-3.5 w-3.5 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
        </p>

        {/* Status stepper or cancelled alert */}
        {isCancelled ? (
          <Card className="mb-6 border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="font-medium text-destructive">Đơn hàng đã bị huỷ</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                {ORDER_STEPS.map((step, index) => {
                  const stepConfig = STATUS_CONFIG[step];
                  const StepIcon = stepConfig.icon;
                  const isCompleted = index <= currentStep;
                  const isActive = index === currentStep;
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-initial">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : isCompleted
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <StepIcon className="h-4 w-4" />
                        </div>
                        <span className={`text-[10px] mt-1.5 text-center hidden sm:block ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                          {stepConfig.label}
                        </span>
                      </div>
                      {index < ORDER_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${index < currentStep ? "bg-primary/40" : "bg-muted"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking card */}
        {trackingFulfillments.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4 md:p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Thông tin vận chuyển
              </h3>
              <div className="space-y-3">
                {trackingFulfillments.map((f, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {f.tracking_company && (
                      <span className="font-medium">{f.tracking_company}</span>
                    )}
                    <span className="flex items-center gap-1.5 font-mono text-muted-foreground">
                      {f.tracking_number}
                      <button onClick={() => copyToClipboard(f.tracking_number!)} className="hover:text-foreground">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </span>
                    {f.tracking_url && (
                      <a
                        href={f.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Theo dõi đơn hàng
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order items */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <h3 className="font-semibold mb-4">Sản phẩm ({orderItems.length})</h3>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Tổng đơn hàng</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>{order.shipping_fee ? formatCurrency(order.shipping_fee) : "Miễn phí"}</span>
              </div>
              {order.discount && order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Thanh toán</h3>
            <div className="text-sm space-y-1.5">
              <p>{PAYMENT_LABELS[order.payment_gateway || ""] || order.payment_gateway || "—"}</p>
              {order.delivery_method && (
                <p className="text-muted-foreground">Vận chuyển: {order.delivery_method}</p>
              )}
              {order.notes && (
                <p className="text-muted-foreground">Ghi chú: {order.notes}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping address (phone masked) */}
        {shippingAddress && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Địa chỉ giao hàng</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">{shippingAddress.full_name}</p>
                <p>{maskPhone(shippingAddress.phone)}</p>
                <p>
                  {[
                    shippingAddress.address_line1,
                    shippingAddress.ward,
                    shippingAddress.district,
                    shippingAddress.city,
                  ].filter(Boolean).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer hideNewsletter />
    </div>
  );
}
