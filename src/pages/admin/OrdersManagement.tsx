import { useState, useMemo } from "react";
import { useOrders, useOrderItems } from "@/hooks/useOrders";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Package },
  processing: { label: "Processing", variant: "default" as const, icon: Package },
  confirmed: { label: "Confirmed", variant: "default" as const, icon: CheckCircle },
  shipped: { label: "Shipped", variant: "default" as const, icon: Truck },
  delivered: { label: "Delivered", variant: "default" as const, icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle },
};

export default function OrdersManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const { data: orders, isLoading } = useOrders();
  const { data: orderItems } = useOrderItems(selectedOrder || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.shipping_address?.first_name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (order.shipping_address?.last_name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const updateOrderStatus = async (
    orderId: string,
    newStatus: "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled"
  ) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Invalidate queries to refresh the data
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

  const selectedOrderData = orders?.find((o) => o.id === selectedOrder);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
        <p className="text-muted-foreground">
          Manage and track all your orders from Shopify
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No orders found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {order.shipping_address?.first_name}{" "}
                      {order.shipping_address?.last_name}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${Number(order.total).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusConfig[order.status as keyof typeof statusConfig]
                            ?.variant || "secondary"
                        }
                        className="gap-1"
                      >
                        {StatusIcon && <StatusIcon className="h-3 w-3" />}
                        {statusConfig[order.status as keyof typeof statusConfig]
                          ?.label || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrderData?.order_number} •{" "}
              {selectedOrderData &&
                format(new Date(selectedOrderData.created_at), "MMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>

          {selectedOrderData && (
            <div className="space-y-6">
              {/* Order Status */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Order Status
                </label>
                <Select
                  value={selectedOrderData.status}
                  onValueChange={(value: "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled") =>
                    updateOrderStatus(selectedOrderData.id, value)
                  }
                >
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
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="border rounded-lg divide-y">
                  {orderItems?.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-sm text-muted-foreground">
                            {item.variant_name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          ${Number(item.price).toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        ${Number(item.subtotal).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${Number(selectedOrderData.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    ${Number(selectedOrderData.shipping_fee || 0).toFixed(2)}
                  </span>
                </div>
                {selectedOrderData.discount && selectedOrderData.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-destructive">
                      -${Number(selectedOrderData.discount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>${Number(selectedOrderData.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-3">Customer</h3>
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="font-medium">
                    {selectedOrderData.shipping_address?.first_name}{" "}
                    {selectedOrderData.shipping_address?.last_name}
                  </p>
                  {selectedOrderData.shipping_address?.phone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedOrderData.shipping_address.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold mb-3">Shipping Address</h3>
                <div className="border rounded-lg p-4">
                  <p className="text-sm">
                    {selectedOrderData.shipping_address?.address1}
                  </p>
                  {selectedOrderData.shipping_address?.address2 && (
                    <p className="text-sm">
                      {selectedOrderData.shipping_address.address2}
                    </p>
                  )}
                  <p className="text-sm">
                    {selectedOrderData.shipping_address?.city}
                    {selectedOrderData.shipping_address?.province &&
                      `, ${selectedOrderData.shipping_address.province}`}
                    {selectedOrderData.shipping_address?.zip &&
                      ` ${selectedOrderData.shipping_address.zip}`}
                  </p>
                  <p className="text-sm">
                    {selectedOrderData.shipping_address?.country}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedOrderData.notes && (
                <div>
                  <h3 className="font-semibold mb-3">Notes</h3>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm">{selectedOrderData.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
