import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Package,
  MapPin,
  CheckSquare,
  Truck,
  User,
  Mail,
  Phone,
  FileText,
  Clock,
  CreditCard,
} from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  subtotal: number;
  shipping_fee: number | null;
  discount: number | null;
  total: number;
  shipping_address: any;
  notes: string | null;
  shopify_order_id: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  variant_id: string | null;
  variant_name: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; paymentLabel?: string; fulfillmentLabel?: string }> = {
  pending: { label: "Pending", variant: "secondary", paymentLabel: "Pending", fulfillmentLabel: "Unfulfilled" },
  processing: { label: "Processing", variant: "default", paymentLabel: "Pending", fulfillmentLabel: "Unfulfilled" },
  confirmed: { label: "Confirmed", variant: "default", paymentLabel: "Paid", fulfillmentLabel: "Unfulfilled" },
  shipped: { label: "Shipped", variant: "default", paymentLabel: "Paid", fulfillmentLabel: "Fulfilled" },
  delivered: { label: "Delivered", variant: "default", paymentLabel: "Paid", fulfillmentLabel: "Fulfilled" },
  cancelled: { label: "Cancelled", variant: "destructive", paymentLabel: "Refunded", fulfillmentLabel: "Cancelled" },
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Order;
    },
    enabled: !!id,
  });

  const { data: orderItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["order-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!id,
  });

  const { data: allOrders } = useQuery({
    queryKey: ["orders-navigation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id")
        .order("shopify_order_id", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const currentOrderIndex = allOrders?.findIndex((o) => o.id === id) ?? -1;
  const prevOrderId = currentOrderIndex > 0 ? allOrders?.[currentOrderIndex - 1]?.id : null;
  const nextOrderId = currentOrderIndex < (allOrders?.length ?? 0) - 1 ? allOrders?.[currentOrderIndex + 1]?.id : null;

  const updateOrderStatus = async (newStatus: "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  };

  if (orderLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Button variant="link" onClick={() => navigate("/admin/orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[order.status] || statusConfig.pending;
  const shippingAddress = order.shipping_address || {};
  const totalItems = orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/orders")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{order.order_number}</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {statusInfo.paymentLabel || "Paid"}
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {statusInfo.fulfillmentLabel || "Fulfilled"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Refund</Button>
          <Button variant="outline" size="sm">Return</Button>
          <Button variant="outline" size="sm">Edit</Button>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <div className="flex border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              disabled={!prevOrderId}
              onClick={() => prevOrderId && navigate(`/admin/orders/${prevOrderId}`)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none border-l"
              disabled={!nextOrderId}
              onClick={() => nextOrderId && navigate(`/admin/orders/${nextOrderId}`)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Date */}
      <p className="text-sm text-muted-foreground -mt-4 ml-14">
        {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")} from Online Store
      </p>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fulfillment Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                    <CheckSquare className="h-3 w-3" />
                    Fulfilled ({totalItems})
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{shippingAddress.city || "Location"}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-3">
                <CheckSquare className="h-4 w-4" />
                <span>{format(new Date(order.updated_at), "MMMM d, yyyy")}</span>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                {itemsLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  orderItems?.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                        )}
                      </div>
                      <div className="text-sm text-right">
                        <span>{formatCurrency(item.price)}</span>
                        <span className="mx-2">×</span>
                        <span className="inline-flex items-center justify-center w-6 h-6 border rounded text-xs">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="text-sm font-medium w-24 text-right">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4">
                <Button variant="outline" size="sm" className="gap-2">
                  <Truck className="h-4 w-4" />
                  Add tracking
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-muted gap-1">
                  <CreditCard className="h-3 w-3" />
                  {statusInfo.paymentLabel || "Paid"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <div className="flex gap-8">
                    <span>{totalItems} items</span>
                    <span className="w-24 text-right">{formatCurrency(order.subtotal)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <div className="flex gap-8">
                    <span className="text-muted-foreground text-xs max-w-[200px] truncate">
                      Standard shipping
                    </span>
                    <span className="w-24 text-right">{formatCurrency(order.shipping_fee || 0)}</span>
                  </div>
                </div>
                {order.discount && order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <div className="flex gap-8">
                      <span></span>
                      <span className="w-24 text-right text-destructive">-{formatCurrency(order.discount)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">{statusInfo.paymentLabel || "Paid"}</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  P
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Leave a comment..."
                    className="w-full bg-transparent border-none outline-none text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Only you and other staff can see comments
              </p>

              <div className="mt-6 space-y-4">
                <div className="text-xs text-muted-foreground font-medium">Today</div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm">Order was created.</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Notes</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {order.notes || "No notes from customer"}
              </p>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Customer</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Link to="#" className="text-sm text-primary hover:underline">
                  {shippingAddress.first_name} {shippingAddress.last_name}
                </Link>
                <p className="text-sm text-muted-foreground">1 order</p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Contact information</h4>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-2 space-y-1">
                  {shippingAddress.email && (
                    <Link to={`mailto:${shippingAddress.email}`} className="text-sm text-primary hover:underline block">
                      {shippingAddress.email}
                    </Link>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {shippingAddress.phone || "No phone number"}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Shipping address</h4>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-2 text-sm space-y-0.5">
                  <p>{shippingAddress.first_name} {shippingAddress.last_name}</p>
                  <p>{shippingAddress.address1}</p>
                  {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                  <p>
                    {[shippingAddress.city, shippingAddress.province, shippingAddress.zip]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>{shippingAddress.country}</p>
                  {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                </div>
                <Link to="#" className="text-sm text-primary hover:underline mt-2 block">
                  View map
                </Link>
              </div>

              <div>
                <h4 className="text-sm font-medium">Billing address</h4>
                <p className="text-sm text-muted-foreground mt-1">Same as shipping address</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={order.status} onValueChange={updateOrderStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Tags</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-2 min-h-[40px]">
                <p className="text-sm text-muted-foreground">No tags</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
