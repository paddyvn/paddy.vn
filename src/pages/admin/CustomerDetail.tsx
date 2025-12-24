import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ChevronDownIcon,
  MapPin,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  DollarSign,
  Users,
  Edit,
  Smile,
  AtSign,
  Hash,
  Paperclip,
  ExternalLink,
  CreditCard,
  GitMerge,
  FileText,
  Eraser,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, format } from "date-fns";
import {
  EditCustomerDialog,
  EditMarketingDialog,
  EditTagsDialog,
  EditNotesDialog,
  ManageAddressesDialog,
  EditTaxDetailsDialog,
} from "@/components/admin/CustomerEditDialogs";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  // Dialog states
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [editMarketingOpen, setEditMarketingOpen] = useState(false);
  const [editTagsOpen, setEditTagsOpen] = useState(false);
  const [editNotesOpen, setEditNotesOpen] = useState(false);
  const [manageAddressesOpen, setManageAddressesOpen] = useState(false);
  const [editTaxOpen, setEditTaxOpen] = useState(false);

  // Fetch customer data
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch all customers for navigation
  const { data: allCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id")
        .order("shopify_created_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch orders for this customer
  const { data: orders } = useQuery({
    queryKey: ["customer-orders", customer?.email, customer?.phone],
    queryFn: async () => {
      if (!customer?.email && !customer?.phone) return [];

      let query = supabase
        .from("orders")
        .select(`
          *,
          order_items(
            id,
            product_name,
            variant_name,
            price,
            quantity,
            subtotal,
            product:products(
              product_images(image_url, is_primary)
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      // Search by email or phone
      if (customer.email) {
        query = query.eq("customer_email", customer.email);
      } else if (customer.phone) {
        query = query.eq("customer_phone", customer.phone);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!customer && !!(customer.email || customer.phone),
  });

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "₫0";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    return phone.replace(/^\+84/, "0");
  };

  // Navigation between customers
  const currentIndex = allCustomers?.findIndex((c) => c.id === id) ?? -1;
  const prevCustomerId = currentIndex > 0 ? allCustomers?.[currentIndex - 1]?.id : null;
  const nextCustomerId = currentIndex < (allCustomers?.length ?? 0) - 1 ? allCustomers?.[currentIndex + 1]?.id : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "refunded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getFulfillmentColor = (status: string) => {
    switch (status) {
      case "fulfilled":
        return "bg-green-100 text-green-800";
      case "unfulfilled":
        return "bg-yellow-100 text-yellow-800";
      case "partial":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRfmGroup = () => {
    if (!customer) return "Unknown";
    if ((customer.orders_count || 0) >= 5 && (customer.total_spent || 0) >= 5000000) return "VIP";
    if ((customer.orders_count || 0) >= 3) return "Active";
    if ((customer.orders_count || 0) >= 1) return "New";
    return "Prospect";
  };

  if (customerLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="link" onClick={() => navigate("/admin/customers")}>
          Back to Customers
        </Button>
      </div>
    );
  }

  const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Unknown Customer";
  const customerSince = customer.shopify_created_at || customer.created_at;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/customers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">›</span>
            <h1 className="text-xl font-semibold">{customerName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                More actions
                <ChevronDownIcon className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Mail className="h-4 w-4 mr-2" />
                Send account invite
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="h-4 w-4 mr-2" />
                Issue store credit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <GitMerge className="h-4 w-4 mr-2" />
                Merge customer
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Request customer data
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eraser className="h-4 w-4 mr-2" />
                Erase personal data
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={() => prevCustomerId && navigate(`/admin/customers/${prevCustomerId}`)}
            disabled={!prevCustomerId}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => nextCustomerId && navigate(`/admin/customers/${nextCustomerId}`)}
            disabled={!nextCustomerId}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground underline decoration-dotted">Amount spent</p>
            <p className="text-lg font-semibold">{formatCurrency(customer.total_spent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground underline decoration-dotted">Orders</p>
            <p className="text-lg font-semibold">{customer.orders_count || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground underline decoration-dotted">Customer since</p>
            <p className="text-lg font-semibold">
              {customerSince ? formatDistanceToNow(new Date(customerSince), { addSuffix: false }) : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground underline decoration-dotted">RFM group</p>
            <p className="text-lg font-semibold">{getRfmGroup()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Last Order Placed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Last order placed</CardTitle>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {/* Order Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary font-medium"
                          onClick={() => navigate(`/admin/orders/${orders[0].id}`)}
                        >
                          {orders[0].order_number}
                        </Button>
                        <Badge className={getStatusColor(orders[0].financial_status || "pending")}>
                          {orders[0].financial_status === "paid" ? "Paid" : "Pending"}
                        </Badge>
                        <Badge className={getFulfillmentColor(orders[0].fulfillment_status || "unfulfilled")}>
                          {orders[0].fulfillment_status === "fulfilled" ? "Fulfilled" : "Unfulfilled"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(orders[0].created_at), "MMMM d, yyyy 'at' h:mm a")} from{" "}
                        <span className="inline-flex items-center gap-1">
                          🏬 {orders[0].source_name || "Online Store"}
                        </span>
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(orders[0].total)}</p>
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <div className="space-y-3">
                    {orders[0].order_items?.slice(0, 3).map((item: any) => {
                      const primaryImage = item.product?.product_images?.find((img: any) => img.is_primary);
                      const imageUrl = primaryImage?.image_url || item.product?.product_images?.[0]?.image_url;

                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded border overflow-hidden bg-muted flex-shrink-0">
                            {imageUrl ? (
                              <img src={imageUrl} alt={item.product_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                <ShoppingBag className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.product_name}</p>
                            {item.variant_name && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {item.variant_name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">x {item.quantity}</p>
                          <p className="text-sm font-medium">{formatCurrency(item.subtotal)}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => navigate("/admin/orders")}>
                      View all orders
                    </Button>
                    <Button>Create order</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No orders from this customer yet</p>
                  <Button className="mt-4">Create order</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blocks Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-lg">📦</span> Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-dashed">
                + Block
              </Button>
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
                    <Input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Leave a comment..."
                      className="bg-transparent border-none shadow-none text-sm focus-visible:ring-0"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 pb-3">
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <AtSign className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Hash className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button size="sm" disabled={!commentText.trim()} className="text-xs">
                    Post
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-3">
                Only you and other staff can see comments
              </p>

              {/* Timeline Events */}
              <div className="mt-6 space-y-4">
                <p className="text-xs text-muted-foreground font-medium">Today</p>
                {orders && orders.length > 0 && (
                  <div className="relative pl-6 space-y-4">
                    {orders.slice(0, 2).map((order: any) => (
                      <div key={order.id} className="relative">
                        <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-muted-foreground/30" />
                        <div className="space-y-1">
                          <p className="text-sm">
                            This customer placed order{" "}
                            <Button
                              variant="link"
                              className="p-0 h-auto text-primary"
                              onClick={() => navigate(`/admin/orders/${order.id}`)}
                            >
                              {order.order_number}
                            </Button>{" "}
                            on {order.source_name || "Online Store"}.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Customer Info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Customer</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditCustomerOpen(true)}>
                    Edit contact information
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setManageAddressesOpen(true)}>
                    Manage addresses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditMarketingOpen(true)}>
                    Edit marketing settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditTaxOpen(true)}>
                    Edit tax details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-medium mb-2">Contact information</h4>
                <div className="space-y-1 text-sm">
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="text-primary hover:underline flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {customer.email}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">No email address provided</p>
                  )}
                  {customer.phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {formatPhone(customer.phone)}
                    </p>
                  )}
                  <p className="text-muted-foreground">Will receive notifications in Vietnamese</p>
                </div>
              </div>

              <Separator />

              {/* Default Address */}
              <div>
                <h4 className="text-sm font-medium mb-2">Default address</h4>
                {orders && orders.length > 0 && orders[0].shipping_address ? (
                  <div className="text-sm space-y-1">
                    <p>{(orders[0].shipping_address as any).name || customerName}</p>
                    <p>{(orders[0].shipping_address as any).address1}</p>
                    {(orders[0].shipping_address as any).address2 && <p>{(orders[0].shipping_address as any).address2}</p>}
                    <p>{(orders[0].shipping_address as any).city}</p>
                    <p>{(orders[0].shipping_address as any).country || "Vietnam"}</p>
                    <p>{formatPhone((orders[0].shipping_address as any).phone)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No address on file</p>
                )}
              </div>

              <Separator />

              {/* Marketing */}
              <div>
                <h4 className="text-sm font-medium mb-2">Marketing</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full border-2 ${customer.accepts_marketing ? "bg-primary border-primary" : "border-muted-foreground"}`} />
                    <span>{customer.accepts_marketing ? "Email subscribed" : "Email not subscribed"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border-2 border-muted-foreground" />
                    <span>SMS not subscribed</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tax Details */}
              <div>
                <h4 className="text-sm font-medium mb-2">Tax details</h4>
                <p className="text-sm text-muted-foreground">Collect tax</p>
              </div>
            </CardContent>
          </Card>

          {/* Store Credit */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Store credit</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No store credit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Tags</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditTagsOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {customer.tags ? (
                <div className="flex flex-wrap gap-1">
                  {customer.tags.split(",").map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Input placeholder="Add tags..." className="text-sm" />
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Notes</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditNotesOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{customer.note || "No notes"}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialogs */}
      <EditCustomerDialog
        open={editCustomerOpen}
        onOpenChange={setEditCustomerOpen}
        customer={customer}
      />
      <ManageAddressesDialog
        open={manageAddressesOpen}
        onOpenChange={setManageAddressesOpen}
        customer={customer}
      />
      <EditMarketingDialog
        open={editMarketingOpen}
        onOpenChange={setEditMarketingOpen}
        customer={customer}
      />
      <EditTaxDetailsDialog
        open={editTaxOpen}
        onOpenChange={setEditTaxOpen}
        customer={customer}
      />
      <EditTagsDialog
        open={editTagsOpen}
        onOpenChange={setEditTagsOpen}
        customer={customer}
      />
      <EditNotesDialog
        open={editNotesOpen}
        onOpenChange={setEditNotesOpen}
        customer={customer}
      />
    </div>
  );
};

export default CustomerDetail;
