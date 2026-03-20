import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Clock,
  Package,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  ShoppingCart,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

// ─── Status config ───
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function getPrimaryImage(images: Array<{ image_url: string; is_primary: boolean; display_order?: number | null }> | null | undefined): string | null {
  if (!images || images.length === 0) return null;
  const primary = images.find((i) => i.is_primary);
  return primary?.image_url || images[0]?.image_url || null;
}

export default function CustomerOrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reordering, setReordering] = useState(false);

  // Primary query: order + items with product images/slug
  const { data: order, isLoading } = useQuery({
    queryKey: ["customer-order", orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products:product_id (slug, product_images (image_url, is_primary, display_order))
          )
        `)
        .eq("order_number", orderNumber!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderNumber,
  });

  // Secondary: fulfillments
  const { data: fulfillments } = useQuery({
    queryKey: ["customer-order-fulfillments", order?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_fulfillments")
        .select("*")
        .eq("order_id", order!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!order?.id,
  });

  // Secondary: events
  const { data: events } = useQuery({
    queryKey: ["customer-order-events", order?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_events")
        .select("*")
        .eq("order_id", order!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!order?.id,
  });

  // Auth for reorder
  const [userId, setUserId] = useState<string | undefined>();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);
  const { addToCart } = useCart(userId);

  const handleReorder = async () => {
    if (!order?.order_items) return;
    setReordering(true);
    let skipped = 0;
    try {
      for (const item of order.order_items as any[]) {
        if (!item.product_id) {
          skipped++;
          continue;
        }
        await addToCart({ productId: item.product_id, variantId: item.variant_id ?? undefined, quantity: item.quantity });
      }
      if (skipped > 0) {
        toast({ title: `${skipped} sản phẩm không còn tồn tại và đã bị bỏ qua`, variant: "destructive" });
      }
      navigate("/cart");
    } catch {
      toast({ title: "Có lỗi khi thêm vào giỏ hàng", variant: "destructive" });
    } finally {
      setReordering(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã sao chép" });
  };

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="h-5 w-48 mb-6" />
          <Skeleton className="h-8 w-72 mb-2" />
          <Skeleton className="h-4 w-40 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer hideNewsletter />
      </div>
    );
  }

  // ─── Not found ───
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Không tìm thấy đơn hàng</h1>
          <p className="text-muted-foreground mb-6">
            Đơn hàng "{orderNumber}" không tồn tại hoặc bạn không có quyền xem.
          </p>
          <Button asChild>
            <Link to="/profile?tab=orders">Đơn hàng của tôi</Link>
          </Button>
        </main>
        <Footer hideNewsletter />
      </div>
    );
  }

  const status = (order.status as OrderStatus) || "pending";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const isCancelled = status === "cancelled";
  const currentStep = getStatusStep(status);
  const shippingAddress = order.shipping_address as Record<string, string> | null;
  const orderItems = (order.order_items || []) as any[];
  const trackingFulfillments = (fulfillments || []).filter((f: any) => f.tracking_number);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-5xl">

        {/* 1. Back link + header */}
        <Link
          to="/profile?tab=orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Đơn hàng của tôi
        </Link>

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

        {/* 2. Status stepper or cancelled alert */}
        {isCancelled ? (
          <Card className="mb-6 border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="font-medium text-destructive">Đơn hàng đã bị huỷ</p>
                {order.cancelled_at && (
                  <p className="text-xs text-muted-foreground">
                    Ngày huỷ: {format(new Date(order.cancelled_at), "dd/MM/yyyy HH:mm")}
                  </p>
                )}
              </div>
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

        {/* 3. Tracking card */}
        {trackingFulfillments.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4 md:p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Thông tin vận chuyển
              </h3>
              <div className="space-y-3">
                {trackingFulfillments.map((f: any) => (
                  <div key={f.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {f.tracking_company && (
                      <span className="font-medium">{f.tracking_company}</span>
                    )}
                    <span className="flex items-center gap-1.5 font-mono text-muted-foreground">
                      {f.tracking_number}
                      <button onClick={() => copyToClipboard(f.tracking_number)} className="hover:text-foreground">
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

        {/* 4. Two-column layout */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Left: order items */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-4">Sản phẩm ({orderItems.length})</h3>
                <div className="space-y-4">
                  {orderItems.map((item: any) => {
                    const productImages = item.products?.product_images;
                    const imgUrl = getPrimaryImage(productImages);
                    const slug = item.products?.slug;
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {slug ? (
                            <Link to={`/products/${slug}`} className="text-sm font-medium hover:text-primary line-clamp-1">
                              {item.product_name}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                          )}
                          {item.variant_name && (
                            <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium shrink-0">{formatCurrency(item.subtotal)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Reorder button */}
                <Separator className="my-4" />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleReorder}
                  disabled={reordering}
                >
                  {reordering ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  Mua lại đơn hàng này
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: summary sidebar */}
          <div className="space-y-4">
            {/* Order summary */}
            <Card>
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
            <Card>
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

            {/* Shipping address */}
            {shippingAddress && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Địa chỉ giao hàng</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">{shippingAddress.full_name}</p>
                    <p>{shippingAddress.phone}</p>
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
          </div>
        </div>

        {/* 5. Order timeline (collapsible) */}
        {events && events.length > 0 && (
          <Collapsible>
            <Card>
              <CardContent className="p-4 md:p-6">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <h3 className="font-semibold">Lịch sử đơn hàng</h3>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="space-y-3 border-l-2 border-muted pl-4">
                    {events.map((event: any) => (
                      <div key={event.id} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary/60 border-2 border-background" />
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), "dd/MM HH:mm")}
                        </p>
                        <p className="text-sm">{stripHtml(event.message)}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>
        )}
      </main>
      <Footer hideNewsletter />
    </div>
  );
}
