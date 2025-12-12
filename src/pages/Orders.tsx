import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Package, 
  Loader2, 
  ShoppingBag,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type OrderStatus = "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled";

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  notes: string | null;
  shipping_address: {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    district?: string;
    ward?: string;
  };
  created_at: string;
  order_items: Array<{
    id: string;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700", icon: Package },
  confirmed: { label: "Đã xác nhận", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle2 },
  shipped: { label: "Đang giao hàng", color: "bg-purple-100 text-purple-700", icon: Truck },
  delivered: { label: "Đã giao hàng", color: "bg-green-100 text-green-700", icon: PackageCheck },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: XCircle },
};

const ORDER_STEPS: OrderStatus[] = ["pending", "processing", "confirmed", "shipped", "delivered"];

export default function Orders() {
  const [userId, setUserId] = useState<string | undefined>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      fetchOrders(session.user.id);
    });
  }, [navigate]);

  const fetchOrders = async (uid: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as unknown as Order[]) || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStep = (status: OrderStatus) => {
    if (status === "cancelled") return -1;
    return ORDER_STEPS.indexOf(status);
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
        <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-20 w-20 text-muted-foreground mb-6" />
            <h2 className="text-xl font-semibold mb-2">Chưa có đơn hàng nào</h2>
            <p className="text-muted-foreground mb-6">
              Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!
            </p>
            <Button onClick={() => navigate("/")} size="lg">
              Mua sắm ngay
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status];
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card 
                  key={order.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">#{order.order_number}</span>
                          <Badge className={`${statusConfig.color} hover:${statusConfig.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.order_items.length} sản phẩm
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Tổng tiền</p>
                          <p className="text-lg font-bold text-primary">
                            {formatPrice(order.total)}₫
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Đơn hàng #{selectedOrder.order_number}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Order Status */}
                <div>
                  <h3 className="font-medium mb-4">Trạng thái đơn hàng</h3>
                  {selectedOrder.status === "cancelled" ? (
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Đơn hàng đã bị hủy</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      {ORDER_STEPS.map((step, index) => {
                        const stepConfig = STATUS_CONFIG[step];
                        const StepIcon = stepConfig.icon;
                        const currentStep = getStatusStep(selectedOrder.status);
                        const isCompleted = index <= currentStep;
                        const isCurrent = index === currentStep;
                        
                        return (
                          <div key={step} className="flex flex-col items-center flex-1">
                            <div className="flex items-center w-full">
                              {index > 0 && (
                                <div 
                                  className={`flex-1 h-0.5 ${
                                    index <= currentStep ? "bg-primary" : "bg-muted"
                                  }`}
                                />
                              )}
                              <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isCompleted 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted text-muted-foreground"
                                } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
                              >
                                <StepIcon className="h-4 w-4" />
                              </div>
                              {index < ORDER_STEPS.length - 1 && (
                                <div 
                                  className={`flex-1 h-0.5 ${
                                    index < currentStep ? "bg-primary" : "bg-muted"
                                  }`}
                                />
                              )}
                            </div>
                            <span className={`text-xs mt-2 text-center ${
                              isCompleted ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              {stepConfig.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Shipping Address */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ giao hàng
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{selectedOrder.shipping_address.full_name}</p>
                    <p>{selectedOrder.shipping_address.phone}</p>
                    <p>
                      {selectedOrder.shipping_address.address_line1}
                      {selectedOrder.shipping_address.address_line2 && `, ${selectedOrder.shipping_address.address_line2}`}
                    </p>
                    <p>
                      {[
                        selectedOrder.shipping_address.ward,
                        selectedOrder.shipping_address.district,
                        selectedOrder.shipping_address.city
                      ].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h3 className="font-medium mb-3">Sản phẩm</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          {item.variant_name && (
                            <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.price)}₫ x {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">{formatPrice(item.subtotal)}₫</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{formatPrice(selectedOrder.subtotal)}₫</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span>{formatPrice(selectedOrder.shipping_fee || 0)}₫</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá</span>
                      <span>-{formatPrice(selectedOrder.discount)}₫</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{formatPrice(selectedOrder.total)}₫</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-2">Ghi chú</h3>
                      <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                    </div>
                  </>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>Ngày đặt: {format(new Date(selectedOrder.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
