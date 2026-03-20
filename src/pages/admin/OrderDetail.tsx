import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CreditCard,
  BookOpen,
  Smile,
  AtSign,
  Hash,
  Paperclip,
  Copy,
  XCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  financial_status: string | null;
  fulfillment_status: string | null;
  payment_gateway: string | null;
  currency: string | null;
  tags: string | null;
  source_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  cancelled_at: string | null;
  closed_at: string | null;
  delivery_method: string | null;
  coupon_code: string | null;
  promotion_id: string | null;
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
  product?: {
    product_images: {
      image_url: string;
      is_primary: boolean;
    }[];
  } | null;
}

interface OrderEvent {
  id: string;
  order_id: string;
  shopify_event_id: string | null;
  event_type: string;
  message: string;
  author: string | null;
  created_at: string;
}

interface OrderFulfillment {
  id: string;
  order_id: string;
  shopify_fulfillment_id: string | null;
  status: string;
  tracking_number: string | null;
  tracking_url: string | null;
  tracking_company: string | null;
  location_name: string | null;
  shipment_status: string | null;
  created_at: string;
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

  // Edit dialog states
  const [editNotesOpen, setEditNotesOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [editTagsOpen, setEditTagsOpen] = useState(false);
  const [editDeliveryOpen, setEditDeliveryOpen] = useState(false);

  // Fix 2A: Add tracking dialog state
  const [addTrackingOpen, setAddTrackingOpen] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    tracking_number: "",
    tracking_company: "",
    tracking_url: "",
  });

  // Fix 2B: Refund dialog state
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  // Form states
  const [editNotes, setEditNotes] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editDeliveryMethod, setEditDeliveryMethod] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [updateCustomerProfile, setUpdateCustomerProfile] = useState(false);
  const [editAddress, setEditAddress] = useState({
    first_name: "",
    last_name: "",
    address1: "",
    address2: "",
    city: "",
    province: "",
    zip: "",
    country: "",
    phone: "",
  });

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
        .select(`
          *,
          product:products(
            product_images(image_url, is_primary)
          )
        `)
        .eq("order_id", id);
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!id,
  });

  const { data: orderEvents } = useQuery({
    queryKey: ["order-events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_events")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderEvent[];
    },
    enabled: !!id,
  });

  const { data: orderFulfillments } = useQuery({
    queryKey: ["order-fulfillments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_fulfillments")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderFulfillment[];
    },
    enabled: !!id,
  });

  // Fetch delivery methods
  const { data: deliveryMethods = [] } = useQuery({
    queryKey: ["delivery-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_methods")
        .select("id, name, price")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
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

  // Fetch customer's previous addresses from other orders
  const customerPhone = order?.customer_phone || order?.shipping_address?.phone;
  const customerEmail = order?.customer_email;
  
  const { data: customerAddresses } = useQuery({
    queryKey: ["customer-addresses", customerPhone, customerEmail],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("shipping_address, order_number, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (customerPhone) {
        query = query.or(`customer_phone.eq.${customerPhone},shipping_address->phone.eq.${customerPhone}`);
      } else if (customerEmail) {
        query = query.eq("customer_email", customerEmail);
      } else {
        return [];
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Deduplicate addresses based on address1 + city
      const seen = new Set<string>();
      const uniqueAddresses: Array<{ address: any; order_number: string }> = [];
      
      for (const order of data || []) {
        const addr = order.shipping_address as Record<string, any> | null;
        if (!addr || typeof addr !== 'object') continue;
        const key = `${addr.address1 || ''}-${addr.city || ''}`.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueAddresses.push({ address: addr, order_number: order.order_number });
        }
      }
      
      return uniqueAddresses;
    },
    enabled: !!order && (!!customerPhone || !!customerEmail),
  });

  const currentOrderIndex = allOrders?.findIndex((o) => o.id === id) ?? -1;
  const prevOrderId = currentOrderIndex > 0 ? allOrders?.[currentOrderIndex - 1]?.id : null;
  const nextOrderId = currentOrderIndex < (allOrders?.length ?? 0) - 1 ? allOrders?.[currentOrderIndex + 1]?.id : null;

  // Fix 1: Update status with financial_status
  const updateOrderStatus = async (newStatus: string) => {
    try {
      const updates: Record<string, any> = { status: newStatus };

      if (newStatus === "confirmed" || newStatus === "shipped" || newStatus === "delivered") {
        updates.financial_status = "paid";
      } else if (newStatus === "cancelled") {
        updates.financial_status = "voided";
        updates.cancelled_at = new Date().toISOString();
      } else if (newStatus === "pending") {
        updates.financial_status = "pending";
      }

      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });

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

  const updateOrderField = async (updates: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      toast({
        title: "Order Updated",
        description: "Order has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update order.",
        variant: "destructive",
      });
    }
  };

  // Fix 2A: Add tracking handler
  const handleAddTracking = async () => {
    if (!trackingForm.tracking_number.trim()) {
      toast({ title: "Vui lòng nhập mã vận đơn", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("order_fulfillments").insert({
        order_id: id,
        status: "fulfilled",
        tracking_number: trackingForm.tracking_number.trim(),
        tracking_company: trackingForm.tracking_company.trim() || null,
        tracking_url: trackingForm.tracking_url.trim() || null,
      });

      if (error) throw error;

      await supabase.from("orders").update({ fulfillment_status: "fulfilled" }).eq("id", id);

      queryClient.invalidateQueries({ queryKey: ["order-fulfillments", id] });
      queryClient.invalidateQueries({ queryKey: ["order", id] });

      setAddTrackingOpen(false);
      setTrackingForm({ tracking_number: "", tracking_company: "", tracking_url: "" });
      toast({ title: "Tracking added", description: `Tracking number: ${trackingForm.tracking_number}` });
    } catch (error) {
      toast({ title: "Failed to add tracking", variant: "destructive" });
    }
  };

  // Fix 2B: Refund handler
  const handleRefund = async () => {
    if (!order) return;
    try {
      await supabase.from("orders").update({
        financial_status: "refunded",
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      }).eq("id", id);

      await supabase.from("order_events").insert({
        order_id: id,
        event_type: "refund",
        message: `Order refunded. Amount: ${formatCurrency(order.total)}`,
      });

      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["order-events", id] });
      setRefundDialogOpen(false);
      toast({ title: "Order refunded", description: `${order.order_number} has been marked as refunded.` });
    } catch (error) {
      toast({ title: "Refund failed", variant: "destructive" });
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !id) return;
    
    setIsPostingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("order_events")
        .insert({
          order_id: id,
          event_type: "comment",
          message: commentText.trim(),
          author: user?.email || "Staff",
        });

      if (error) throw error;

      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["order-events", id] });

      toast({
        title: "Comment Added",
        description: "Your comment has been posted.",
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post comment.",
        variant: "destructive",
      });
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleSaveNotes = async () => {
    await updateOrderField({ notes: editNotes });
    setEditNotesOpen(false);
  };

  const handleSaveContact = async () => {
    await updateOrderField({ 
      customer_email: editEmail, 
      customer_phone: editPhone 
    });

    if (updateCustomerProfile) {
      try {
        const originalPhone = order?.customer_phone || order?.shipping_address?.phone;
        const originalEmail = order?.customer_email;
        
        let customerId: string | null = null;
        
        if (originalPhone) {
          const { data: customerByPhone } = await supabase
            .from("customers")
            .select("id")
            .eq("phone", originalPhone)
            .maybeSingle();
          if (customerByPhone) customerId = customerByPhone.id;
        }
        
        if (!customerId && originalEmail) {
          const { data: customerByEmail } = await supabase
            .from("customers")
            .select("id")
            .eq("email", originalEmail)
            .maybeSingle();
          if (customerByEmail) customerId = customerByEmail.id;
        }

        if (customerId) {
          const updates: Record<string, string | null> = {};
          if (editEmail) updates.email = editEmail;
          if (editPhone) updates.phone = editPhone;
          
          const { error: customerError } = await supabase
            .from("customers")
            .update(updates)
            .eq("id", customerId);

          if (customerError) {
            toast({
              title: "Customer Update Failed",
              description: "Order updated, but failed to update customer profile.",
              variant: "destructive",
            });
          } else {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast({
              title: "Customer Updated",
              description: "Customer profile has also been updated.",
            });
          }
        }
      } catch (error) {
        console.error("Error finding/updating customer:", error);
      }
    }

    setEditContactOpen(false);
    setUpdateCustomerProfile(false);
  };

  const handleSaveAddress = async () => {
    const currentAddress = order?.shipping_address || {};
    await updateOrderField({ 
      shipping_address: { ...currentAddress, ...editAddress } 
    });
    setEditAddressOpen(false);
  };

  const handleSaveTags = async () => {
    await updateOrderField({ tags: editTags });
    setEditTagsOpen(false);
  };

  const handleSaveDeliveryMethod = async () => {
    const selectedMethod = deliveryMethods.find(m => m.name === editDeliveryMethod);
    await updateOrderField({ 
      delivery_method: editDeliveryMethod,
      shipping_fee: selectedMethod?.price ?? order?.shipping_fee
    });
    setEditDeliveryOpen(false);
  };

  const openNotesDialog = () => {
    setEditNotes(order?.notes || "");
    setEditNotesOpen(true);
  };

  const openContactDialog = () => {
    setEditEmail(order?.customer_email || "");
    setEditPhone(order?.customer_phone || order?.shipping_address?.phone || "");
    setEditContactOpen(true);
  };

  const openAddressDialog = () => {
    const addr = order?.shipping_address || {};
    setEditAddress({
      first_name: addr.first_name || "",
      last_name: addr.last_name || "",
      address1: addr.address1 || "",
      address2: addr.address2 || "",
      city: addr.city || "",
      province: addr.province || "",
      zip: addr.zip || "",
      country: addr.country || "",
      phone: addr.phone || "",
    });
    setEditAddressOpen(true);
  };

  const openTagsDialog = () => {
    setEditTags(order?.tags || "");
    setEditTagsOpen(true);
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

  const financialStatus = order.financial_status || statusInfo.paymentLabel || "pending";
  const fulfillmentStatus = order.fulfillment_status || statusInfo.fulfillmentLabel || "unfulfilled";
  
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  const getFinancialBadgeClass = (status: string) => {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'refunded' || status === 'voided') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const getFulfillmentBadgeClass = (status: string) => {
    if (status === 'fulfilled') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'partial') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const groupEventsByDate = (events: OrderEvent[]) => {
    const groups: Record<string, OrderEvent[]> = {};
    events.forEach(event => {
      const date = format(new Date(event.created_at), 'MMM d, yyyy');
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
    });
    return groups;
  };

  const eventsByDate = orderEvents ? groupEventsByDate(orderEvents) : {};

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
            <Badge variant="outline" className={getFinancialBadgeClass(financialStatus)}>
              {formatStatus(financialStatus)}
            </Badge>
            <Badge variant="outline" className={getFulfillmentBadgeClass(fulfillmentStatus)}>
              {formatStatus(fulfillmentStatus)}
            </Badge>
            {order.closed_at && (
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                Archived
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Fix 2B: Refund button */}
          <Button variant="outline" size="sm" onClick={() => setRefundDialogOpen(true)}>Refund</Button>
          {/* Fix 2C: Return placeholder */}
          <Button variant="outline" size="sm" onClick={() => toast({ title: "Chức năng đang phát triển", description: "Quản lý đổi trả sẽ sớm ra mắt." })}>Return</Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/orders/${id}/edit`)}>Edit</Button>
          {/* Fix 2D: More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/admin/orders/${id}/edit`)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/admin/orders/${id}`);
                toast({ title: "Link copied" });
              }}>
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.from("orders").update({
                    status: "cancelled",
                    financial_status: "voided",
                    cancelled_at: new Date().toISOString(),
                  }).eq("id", id);
                  queryClient.invalidateQueries({ queryKey: ["order", id] });
                  queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
                  toast({ title: "Order cancelled" });
                }}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")} from {order.source_name || "Online Store"}
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
                  orderItems?.map((item) => {
                    const primaryImage = item.product?.product_images?.find(img => img.is_primary)?.image_url 
                      || item.product?.product_images?.[0]?.image_url;
                    
                    return (
                      <div key={item.id} className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                          {primaryImage ? (
                            <img 
                              src={primaryImage} 
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
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
                    );
                  })
                )}
              </div>

              {/* Tracking Info */}
              {orderFulfillments && orderFulfillments.length > 0 ? (
                <div className="pt-4 space-y-2">
                  {orderFulfillments.map((fulfillment) => (
                    <div key={fulfillment.id} className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{fulfillment.tracking_company || "Carrier"}</span>
                      {fulfillment.tracking_number && (
                        fulfillment.tracking_url ? (
                          <a 
                            href={fulfillment.tracking_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {fulfillment.tracking_number}
                          </a>
                        ) : (
                          <span>{fulfillment.tracking_number}</span>
                        )
                      )}
                      <Badge variant="outline" className="text-xs">
                        {fulfillment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-4">
                  {/* Fix 2A: Wire up Add tracking button */}
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setAddTrackingOpen(true)}>
                    <Truck className="h-4 w-4" />
                    Add tracking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`gap-1 ${getFinancialBadgeClass(financialStatus)}`}>
                  <CreditCard className="h-3 w-3" />
                  {formatStatus(financialStatus)}
                </Badge>
                {order.payment_gateway && (
                  <span className="text-xs text-muted-foreground">via {order.payment_gateway}</span>
                )}
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
                  <div className="flex gap-8 items-center">
                    <button 
                      onClick={() => {
                        setEditDeliveryMethod(order.delivery_method || "");
                        setEditDeliveryOpen(true);
                      }}
                      className="text-muted-foreground text-xs max-w-[200px] truncate hover:text-primary hover:underline"
                    >
                      {order.delivery_method || "Standard shipping"}
                    </button>
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
                {/* Fix 3: Voucher display */}
                {order.coupon_code && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Voucher</span>
                    <Badge variant="outline" className="text-xs font-mono">{order.coupon_code}</Badge>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">{formatStatus(financialStatus)}</span>
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
              <div className="border rounded-lg bg-muted/30">
                <div className="flex items-start gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    P
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handlePostComment();
                        }
                      }}
                      placeholder="Leave a comment..."
                      className="w-full bg-transparent border-none outline-none text-sm"
                      disabled={isPostingComment}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 pb-3">
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Add emoji">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Mention staff">
                      <AtSign className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Reference page">
                      <Hash className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Attach file">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    onClick={handlePostComment}
                    disabled={isPostingComment || !commentText.trim()}
                    className="text-xs"
                  >
                    {isPostingComment ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Only you and other staff can see comments
              </p>

              <div className="mt-6 space-y-6">
                {Object.keys(eventsByDate).length > 0 ? (
                  Object.entries(eventsByDate).map(([date, events]) => (
                    <div key={date} className="space-y-3">
                      <div className="text-xs text-muted-foreground font-medium">{date}</div>
                      {events.map((event) => (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5" />
                          <div className="flex-1">
                            <p className="text-sm">{event.message}</p>
                            {event.author && (
                              <p className="text-xs text-muted-foreground">by {event.author}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(event.created_at), "h:mm a")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground font-medium">
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                    </div>
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
                )}
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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openNotesDialog}>
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
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={openContactDialog}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-2 space-y-1">
                  {(order.customer_email || shippingAddress.email) && (
                    <Link to={`mailto:${order.customer_email || shippingAddress.email}`} className="text-sm text-primary hover:underline block">
                      {order.customer_email || shippingAddress.email}
                    </Link>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {order.customer_phone || shippingAddress.phone || "No phone number"}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Shipping address</h4>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={openAddressDialog}>
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
                {shippingAddress.latitude && shippingAddress.longitude && (
                  <a 
                    href={`https://www.google.com/maps?q=${shippingAddress.latitude},${shippingAddress.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-2 block"
                  >
                    View map
                  </a>
                )}
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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openTagsDialog}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-2 min-h-[40px]">
                {order.tags ? (
                  <div className="flex flex-wrap gap-1">
                    {order.tags.split(",").map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tags</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Notes Dialog */}
      <Dialog open={editNotesOpen} onOpenChange={setEditNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add notes about this order..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNotesOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNotes}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="customer@example.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone number</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+84..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateCustomerProfile"
                checked={updateCustomerProfile}
                onCheckedChange={(checked) => setUpdateCustomerProfile(checked === true)}
              />
              <label
                htmlFor="updateCustomerProfile"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Update customer profile
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContactOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveContact}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={editAddressOpen} onOpenChange={setEditAddressOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Shipping Address</DialogTitle>
              {customerAddresses && customerAddresses.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Address Book
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0">
                    <div className="p-2 border-b">
                      <p className="text-sm font-medium">Select from previous addresses</p>
                    </div>
                    <ScrollArea className="max-h-64">
                      <div className="p-2 space-y-1">
                        {customerAddresses.map((item, index) => (
                          <button
                            key={index}
                            className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors"
                            onClick={() => {
                              const addr = item.address;
                              setEditAddress({
                                first_name: addr.first_name || "",
                                last_name: addr.last_name || "",
                                address1: addr.address1 || "",
                                address2: addr.address2 || "",
                                city: addr.city || "",
                                province: addr.province || "",
                                zip: addr.zip || "",
                                country: addr.country || "Vietnam",
                                phone: addr.phone || "",
                              });
                            }}
                          >
                            <p className="font-medium text-sm">
                              {item.address.first_name} {item.address.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.address.address1}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.address.city}{item.address.country ? `, ${item.address.country}` : ""}
                            </p>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={editAddress.first_name}
                  onChange={(e) => setEditAddress({ ...editAddress, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={editAddress.last_name}
                  onChange={(e) => setEditAddress({ ...editAddress, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address Line 1</Label>
              <Input
                value={editAddress.address1}
                onChange={(e) => setEditAddress({ ...editAddress, address1: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input
                value={editAddress.address2}
                onChange={(e) => setEditAddress({ ...editAddress, address2: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={editAddress.city}
                  onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Province/State</Label>
                <Input
                  value={editAddress.province}
                  onChange={(e) => setEditAddress({ ...editAddress, province: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={editAddress.zip}
                  onChange={(e) => setEditAddress({ ...editAddress, zip: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={editAddress.country}
                  onChange={(e) => setEditAddress({ ...editAddress, country: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editAddress.phone}
                onChange={(e) => setEditAddress({ ...editAddress, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAddressOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tags Dialog */}
      <Dialog open={editTagsOpen} onOpenChange={setEditTagsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="vip, wholesale, priority"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTagsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTags}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Delivery Method Dialog */}
      <Dialog open={editDeliveryOpen} onOpenChange={setEditDeliveryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Delivery Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <Select value={editDeliveryMethod} onValueChange={setEditDeliveryMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryMethods.map((method) => (
                    <SelectItem key={method.id} value={method.name}>
                      {method.name} - {formatCurrency(method.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDeliveryOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDeliveryMethod}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fix 2A: Add Tracking Dialog */}
      <Dialog open={addTrackingOpen} onOpenChange={setAddTrackingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm mã vận đơn</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Đơn vị vận chuyển</Label>
              <Select
                value={trackingForm.tracking_company}
                onValueChange={(value) => setTrackingForm({ ...trackingForm, tracking_company: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đơn vị vận chuyển" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GHN">Giao Hàng Nhanh (GHN)</SelectItem>
                  <SelectItem value="GHTK">Giao Hàng Tiết Kiệm (GHTK)</SelectItem>
                  <SelectItem value="Viettel Post">Viettel Post</SelectItem>
                  <SelectItem value="J&T Express">J&T Express</SelectItem>
                  <SelectItem value="Ninja Van">Ninja Van</SelectItem>
                  <SelectItem value="Best Express">Best Express</SelectItem>
                  <SelectItem value="Other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mã vận đơn *</Label>
              <Input
                value={trackingForm.tracking_number}
                onChange={(e) => setTrackingForm({ ...trackingForm, tracking_number: e.target.value })}
                placeholder="VD: GHN123456789"
              />
            </div>
            <div className="space-y-2">
              <Label>URL theo dõi</Label>
              <Input
                value={trackingForm.tracking_url}
                onChange={(e) => setTrackingForm({ ...trackingForm, tracking_url: e.target.value })}
                placeholder="https://tracking.ghn.vn/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTrackingOpen(false)}>Hủy</Button>
            <Button onClick={handleAddTracking}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fix 2B: Refund Confirmation Dialog */}
      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hoàn tiền</AlertDialogTitle>
            <AlertDialogDescription>
              Đánh dấu đơn hàng {order.order_number} là đã hoàn tiền ({formatCurrency(order.total)}).
              Hành động này sẽ hủy đơn hàng. Vui lòng đảm bảo đã xử lý hoàn tiền qua phương thức thanh toán trước khi xác nhận.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xác nhận hoàn tiền
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
