import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle2,
  ClipboardCheck,
  Package,
  Truck,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
  momo: "Ví MoMo",
  vnpay: "VNPay",
};

const BANK_ACCOUNT_NUMBER = "0441000726268";
const BANK_NAME = "Vietcombank";
const BANK_ACCOUNT_NAME = "CONG TY CO PHAN TM & DV PADDY";

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { toast } = useToast();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order-confirmation", orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_number", orderNumber!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderNumber,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `Đã sao chép ${label}` });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
          <div className="space-y-6">
            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </main>
        <Footer hideNewsletter />
      </div>
    );
  }

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
            <Link to="/">Về trang chủ</Link>
          </Button>
        </main>
        <Footer hideNewsletter />
      </div>
    );
  }

  const shippingAddress = order.shipping_address as Record<string, string> | null;
  const orderItems = (order.order_items || []) as Array<{
    id: string;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    price: number;
    subtotal: number;
  }>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        {/* 1. Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Đặt hàng thành công!</h1>
          <p className="text-muted-foreground mb-4">Cảm ơn bạn đã tin tưởng Paddy!</p>
          <div className="inline-block bg-muted/60 rounded-lg px-6 py-3">
            <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
            <p className="text-xl font-bold text-primary">{order.order_number}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {formatDate(order.created_at)}
          </p>
        </div>

        {/* 2. Bank transfer instructions */}
        {order.payment_gateway === "bank_transfer" && (
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardContent className="p-4 md:p-6">
              <h2 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Thông tin chuyển khoản
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-700">Ngân hàng:</span>
                  <span className="font-medium">{BANK_NAME}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-700">Số tài khoản:</span>
                  <span className="flex items-center gap-2 font-medium">
                    {BANK_ACCOUNT_NUMBER}
                    <button
                      onClick={() => copyToClipboard(BANK_ACCOUNT_NUMBER, "số tài khoản")}
                      className="text-amber-600 hover:text-amber-800"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Tên tài khoản:</span>
                  <span className="font-medium">{BANK_ACCOUNT_NAME}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-700">Nội dung CK:</span>
                  <span className="flex items-center gap-2 font-medium">
                    {order.order_number}
                    <button
                      onClick={() => copyToClipboard(order.order_number, "nội dung chuyển khoản")}
                      className="text-amber-600 hover:text-amber-800"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-3">
                Vui lòng chuyển khoản trong vòng 24 giờ để đơn hàng được xử lý.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 3. What happens next */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <h2 className="font-semibold mb-4">Điều gì xảy ra tiếp theo?</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">Xác nhận đơn hàng</p>
                <p className="text-xs text-muted-foreground mt-1">Chúng tôi đã nhận đơn hàng của bạn</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Chuẩn bị hàng</p>
                <p className="text-xs text-muted-foreground mt-1">Đơn hàng đang được đóng gói</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Giao hàng</p>
                <p className="text-xs text-muted-foreground mt-1">Đơn hàng sẽ được giao đến bạn</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Order summary card — two columns */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Shipping address */}
              <div>
                <h3 className="font-semibold mb-2">Địa chỉ giao hàng</h3>
                {shippingAddress ? (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">{shippingAddress.full_name}</p>
                    <p>{shippingAddress.phone}</p>
                    <p>
                      {[
                        shippingAddress.address_line1,
                        shippingAddress.ward,
                        shippingAddress.district,
                        shippingAddress.city,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Không có thông tin</p>
                )}
              </div>

              {/* Payment & delivery */}
              <div>
                <h3 className="font-semibold mb-2">Thanh toán & giao hàng</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="text-foreground">Thanh toán:</span>{" "}
                    {PAYMENT_LABELS[order.payment_gateway || ""] || order.payment_gateway || "—"}
                  </p>
                  {order.delivery_method && (
                    <p>
                      <span className="text-foreground">Vận chuyển:</span> {order.delivery_method}
                    </p>
                  )}
                  {order.notes && (
                    <p>
                      <span className="text-foreground">Ghi chú:</span> {order.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Order items */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <h3 className="font-semibold mb-4">Sản phẩm đã đặt</h3>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-muted-foreground text-xs">{item.variant_name}</p>
                    )}
                    <p className="text-muted-foreground">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>

            {/* 6. Order totals */}
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>
                  {order.shipping_fee ? formatCurrency(order.shipping_fee) : "Miễn phí"}
                </span>
              </div>
              {order.discount && order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. Action buttons */}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link to="/profile?tab=orders">Xem đơn hàng của tôi</Link>
          </Button>
          <Button asChild>
            <Link to="/">Tiếp tục mua sắm</Link>
          </Button>
        </div>
      </main>
      <Footer hideNewsletter />
    </div>
  );
}
