import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { Search, Eye, Package, Truck, CheckCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, X, CalendarIcon, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { OrderColumnsSelector, useOrderColumns } from "@/components/admin/OrderColumnsSelector";
import type { Order } from "@/hooks/useOrders";

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Package },
  processing: { label: "Processing", variant: "default" as const, icon: Package },
  confirmed: { label: "Confirmed", variant: "default" as const, icon: CheckCircle },
  shipped: { label: "Shipped", variant: "default" as const, icon: Truck },
  delivered: { label: "Delivered", variant: "default" as const, icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle },
};

const paymentStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "Paid", variant: "default" },
  pending: { label: "Payment pending", variant: "secondary" },
  partially_paid: { label: "Partially paid", variant: "secondary" },
  refunded: { label: "Refunded", variant: "outline" },
  partially_refunded: { label: "Partially refunded", variant: "outline" },
  voided: { label: "Voided", variant: "destructive" },
  authorized: { label: "Authorized", variant: "secondary" },
};

const ORDERS_PER_PAGE = 50;

type SortField = "order_number" | "created_at" | "customer_name" | "total" | "status";
type SortDirection = "asc" | "desc";

// Helper to build the common filter chain
function applyFilters(
  query: any,
  searchQuery: string,
  statusFilter: string,
  dateFrom: Date | null,
  dateTo: Date | null
) {
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  if (searchQuery) {
    query = query.or(
      `order_number.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%`
    );
  }
  if (dateFrom) {
    query = query.gte("created_at", dateFrom.toISOString());
  }
  if (dateTo) {
    const endOfDay = new Date(dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.lte("created_at", endOfDay.toISOString());
  }
  return query;
}

export default function OrdersManagement() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { columns, setColumns, isColumnVisible, visibleColumns } = useOrderColumns();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, dateFrom, dateTo]);

  // ── Count query (for pagination total) ──
  const { data: totalCount = 0 } = useQuery({
    queryKey: ["admin-orders-count", debouncedSearch, statusFilter, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      query = applyFilters(query, debouncedSearch, statusFilter, dateFrom, dateTo);

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  // ── Data query (paginated, sorted, filtered) ──
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders", debouncedSearch, statusFilter, sortField, sortDirection, currentPage, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      const from = (currentPage - 1) * ORDERS_PER_PAGE;
      const to = from + ORDERS_PER_PAGE - 1;

      let query = supabase
        .from("orders")
        .select("*");

      query = applyFilters(query, debouncedSearch, statusFilter, dateFrom, dateTo);

      // Apply sort
      query = query.order(sortField, { ascending: sortDirection === "asc" });

      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });

  // ── Items count for visible orders ──
  const paginatedOrderIds = useMemo(
    () => (orders || []).map((o) => o.id),
    [orders]
  );

  const { data: itemsCountByOrderId } = useQuery({
    queryKey: ["order-items-counts", paginatedOrderIds],
    enabled: paginatedOrderIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("order_id, quantity")
        .in("order_id", paginatedOrderIds);

      if (error) throw error;

      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        map[row.order_id] = (map[row.order_id] ?? 0) + (row.quantity ?? 0);
      }
      return map;
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </TableHead>
  );

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = Math.min(startIndex + ORDERS_PER_PAGE, totalCount);

  // Bulk selection handlers
  const isAllSelected = (orders?.length ?? 0) > 0 && (orders ?? []).every((o) => selectedOrders.has(o.id));
  const isSomeSelected = (orders ?? []).some((o) => selectedOrders.has(o.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set((orders ?? []).map((o) => o.id)));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const clearSelection = () => {
    setSelectedOrders(new Set());
  };

  // Fix 1: Single order status update with financial_status
  const updateOrderStatus = async (
    orderId: string,
    newStatus: "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled"
  ) => {
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
        .eq("id", orderId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders-count"] });

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

  // Fix 1: Bulk status update with financial_status
  const bulkUpdateStatus = async (
    newStatus: "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled"
  ) => {
    if (selectedOrders.size === 0) return;

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
        .in("id", Array.from(selectedOrders));

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders-count"] });
      clearSelection();

      toast({
        title: "Orders Updated",
        description: `${selectedOrders.size} orders updated to ${statusConfig[newStatus].label}.`,
      });
    } catch (error) {
      console.error("Error updating orders:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update orders.",
        variant: "destructive",
      });
    }
  };

  // Fix 6: CSV Export
  const exportOrdersCSV = async () => {
    try {
      let query = supabase
        .from("orders")
        .select(`
          order_number, created_at, status, financial_status,
          subtotal, shipping_fee, discount, total,
          customer_email, customer_phone, customer_name,
          payment_gateway, delivery_method, source_name,
          coupon_code, notes, shipping_address,
          order_items(product_name, variant_name, quantity, price, subtotal)
        `)
        .order("created_at", { ascending: false });

      query = applyFilters(query, debouncedSearch, statusFilter, dateFrom, dateTo);

      const { data, error } = await query.limit(10000);
      if (error) throw error;
      if (!data || data.length === 0) {
        toast({ title: "No orders to export", variant: "destructive" });
        return;
      }

      const headers = [
        "Order Number", "Date", "Status", "Payment Status",
        "Customer Name", "Email", "Phone",
        "Subtotal", "Shipping", "Discount", "Total",
        "Payment Method", "Delivery Method", "Source",
        "Voucher Code", "Items", "Shipping Address", "Notes"
      ];

      const rows = data.map((order: any) => {
        const address = order.shipping_address || {};
        const itemsSummary = (order.order_items || [])
          .map((item: any) => `${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""} x${item.quantity}`)
          .join("; ");
        const fullAddress = [address.address1 || address.address_line1, address.ward, address.district, address.city]
          .filter(Boolean).join(", ");

        return [
          order.order_number,
          format(new Date(order.created_at), "yyyy-MM-dd HH:mm"),
          order.status,
          order.financial_status || "pending",
          order.customer_name || `${address.first_name || ""} ${address.last_name || ""}`.trim() || "",
          order.customer_email || "",
          order.customer_phone || "",
          order.subtotal,
          order.shipping_fee || 0,
          order.discount || 0,
          order.total,
          order.payment_gateway || "",
          order.delivery_method || "",
          order.source_name || "",
          order.coupon_code || "",
          itemsSummary,
          fullAddress,
          order.notes || "",
        ];
      });

      const escapeCSV = (val: any) => {
        const str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csv = [
        headers.map(escapeCSV).join(","),
        ...rows.map((row: any[]) => row.map(escapeCSV).join(","))
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `paddy-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export complete", description: `${data.length} orders exported` });
    } catch (error) {
      toast({ title: "Export failed", description: String(error), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          {/* Fix 4: Subtitle */}
          <p className="text-muted-foreground">
            Manage and track all your orders
          </p>
        </div>
        <div className="flex gap-2">
          {/* Fix 6: Export button */}
          <Button variant="outline" onClick={exportOrdersCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
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

          {/* Fix 5: Date range filter */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Từ ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom || undefined}
                  onSelect={(date) => { setDateFrom(date || null); setCurrentPage(1); }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">–</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy") : "Đến ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo || undefined}
                  onSelect={(date) => { setDateTo(date || null); setCurrentPage(1); }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(null); setDateTo(null); setCurrentPage(1); }}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <OrderColumnsSelector columns={columns} onColumnsChange={setColumns} />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="bg-muted border rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{selectedOrders.size} selected</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Mark as
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => bulkUpdateStatus("pending")}>
                  <Package className="h-4 w-4 mr-2" />
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus("processing")}>
                  <Package className="h-4 w-4 mr-2" />
                  Processing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus("confirmed")}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus("shipped")}>
                  <Truck className="h-4 w-4 mr-2" />
                  Shipped
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus("delivered")}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Delivered
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => bulkUpdateStatus("cancelled")}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all orders"
                  className={isSomeSelected && !isAllSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
              </TableHead>
              {visibleColumns.map((col) => {
                if (col.id === "order_number") {
                  return <SortableHeader key={col.id} field="order_number">Order</SortableHeader>;
                }
                if (col.id === "created_at") {
                  return <SortableHeader key={col.id} field="created_at">Date</SortableHeader>;
                }
                if (col.id === "customer") {
                  return <SortableHeader key={col.id} field="customer_name">Customer</SortableHeader>;
                }
                if (col.id === "customer_email") {
                  return <TableHead key={col.id}>Email</TableHead>;
                }
                if (col.id === "customer_phone") {
                  return <TableHead key={col.id}>Phone</TableHead>;
                }
                if (col.id === "items") {
                  return <TableHead key={col.id}>Items</TableHead>;
                }
                if (col.id === "total") {
                  return <SortableHeader key={col.id} field="total">Total</SortableHeader>;
                }
                if (col.id === "payment") {
                  return <TableHead key={col.id}>Payment</TableHead>;
                }
                if (col.id === "status") {
                  return <SortableHeader key={col.id} field="status">Status</SortableHeader>;
                }
                if (col.id === "delivery_method") {
                  return <TableHead key={col.id}>Delivery method</TableHead>;
                }
                if (col.id === "source") {
                  return <TableHead key={col.id}>Source</TableHead>;
                }
                if (col.id === "tags") {
                  return <TableHead key={col.id}>Tags</TableHead>;
                }
                if (col.id === "notes") {
                  return <TableHead key={col.id}>Notes</TableHead>;
                }
                if (col.id === "currency") {
                  return <TableHead key={col.id}>Currency</TableHead>;
                }
                if (col.id === "actions") {
                  return <TableHead key={col.id} className="text-right">Actions</TableHead>;
                }
                return null;
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !orders?.length ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8">
                  <p className="text-muted-foreground">No orders found</p>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon;
                const isSelected = selectedOrders.has(order.id);
                return (
                  <TableRow 
                    key={order.id} 
                    className={isSelected ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectOrder(order.id)}
                        aria-label={`Select order ${order.order_number}`}
                      />
                    </TableCell>
                    {visibleColumns.map((col) => {
                      if (col.id === "order_number") {
                        return (
                          <TableCell key={col.id} className="font-medium">
                            <button
                              onClick={() => navigate(`/admin/orders/${order.id}`)}
                              className="text-primary hover:underline"
                            >
                              {order.order_number}
                            </button>
                          </TableCell>
                        );
                      }
                      if (col.id === "created_at") {
                        return (
                          <TableCell key={col.id}>
                            {format(new Date(order.created_at), "MMM d, yyyy HH:mm")}
                          </TableCell>
                        );
                      }
                      if (col.id === "customer") {
                        return (
                          <TableCell key={col.id}>
                            {order.shipping_address?.first_name}{" "}
                            {order.shipping_address?.last_name}
                          </TableCell>
                        );
                      }
                      if (col.id === "customer_email") {
                        return (
                          <TableCell key={col.id} className="text-muted-foreground">
                            {order.customer_email || "-"}
                          </TableCell>
                        );
                      }
                      if (col.id === "customer_phone") {
                        return (
                          <TableCell key={col.id} className="text-muted-foreground">
                            {order.customer_phone || "-"}
                          </TableCell>
                        );
                      }
                      if (col.id === "items") {
                        const count = itemsCountByOrderId?.[order.id] ?? 0;
                        return (
                          <TableCell key={col.id} className="text-muted-foreground">
                            {count} {count === 1 ? "item" : "items"}
                          </TableCell>
                        );
                      }
                      if (col.id === "total") {
                        return (
                          <TableCell key={col.id} className="font-medium">
                            {formatCurrency(order.total)}
                          </TableCell>
                        );
                      }
                      if (col.id === "payment") {
                        return (
                          <TableCell key={col.id}>
                            {order.financial_status && (
                              <Badge
                                variant={
                                  paymentStatusConfig[order.financial_status]?.variant || "secondary"
                                }
                              >
                                {paymentStatusConfig[order.financial_status]?.label || order.financial_status}
                              </Badge>
                            )}
                          </TableCell>
                        );
                      }
                      if (col.id === "status") {
                        return (
                          <TableCell key={col.id}>
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
                        );
                      }
                      if (col.id === "delivery_method") {
                        return (
                          <TableCell key={col.id} className="text-muted-foreground">
                            {order.delivery_method || "-"}
                          </TableCell>
                        );
                      }
                      if (col.id === "source") {
                        return (
                          <TableCell key={col.id} className="text-muted-foreground">
                            {order.source_name || "-"}
                          </TableCell>
                        );
                      }
                      if (col.id === "tags") {
                        return (
                          <TableCell key={col.id} className="text-muted-foreground max-w-[150px] truncate">
                            {order.tags || "-"}
                          </TableCell>
                        );
                      }
                      if (col.id === "notes") {
                        return (
                          <TableCell key={col.id} className="text-muted-foreground max-w-[150px] truncate">
                            {order.notes || "-"}
                          </TableCell>
                        );
                      }
                      if (col.id === "currency") {
                        return (
                          <TableCell key={col.id} className="text-muted-foreground">
                            {order.currency || "-"}
                          </TableCell>
                        );
                      }
                      if (col.id === "actions") {
                        return (
                          <TableCell key={col.id} className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/orders/${order.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        );
                      }
                      return null;
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && totalCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {endIndex} of{" "}
            {totalCount} orders
          </p>
          
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {currentPage > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}

                {/* Page numbers around current page */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return Math.abs(page - currentPage) <= 1;
                  })
                  .map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(totalPages)}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className={
                      currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
