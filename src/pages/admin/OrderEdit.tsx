import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Package,
  CheckSquare,
  Search,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  discount?: number;
  discountType?: "amount" | "percentage";
  discountReason?: string;
  product?: {
    product_images: {
      image_url: string;
      is_primary: boolean;
    }[];
  } | null;
  isNew?: boolean;
  isRemoved?: boolean;
  originalQuantity?: number;
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  product_images: { image_url: string; is_primary: boolean }[];
  product_variants: { id: string; name: string; price: number; sku: string | null }[];
}

export default function OrderEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [shippingFee, setShippingFee] = useState(0);
  const [editReason, setEditReason] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [discountItemId, setDiscountItemId] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<"amount" | "percentage">("amount");
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  // Fetch order
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch order items with product images
  const { data: orderItems } = useQuery({
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

  // Search products for adding
  const { data: searchResults } = useQuery({
    queryKey: ["products-search", productSearch],
    queryFn: async () => {
      if (!productSearch || productSearch.length < 2) return [];
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          base_price,
          product_images(image_url, is_primary),
          product_variants(id, name, price, sku)
        `)
        .ilike("name", `%${productSearch}%`)
        .eq("is_active", true)
        .limit(10);
      if (error) throw error;
      return data as Product[];
    },
    enabled: productSearch.length >= 2,
  });

  // Initialize edited items
  useEffect(() => {
    if (orderItems && editedItems.length === 0) {
      setEditedItems(orderItems.map(item => ({
        ...item,
        originalQuantity: item.quantity,
      })));
    }
    if (order) {
      setShippingFee(order.shipping_fee || 0);
    }
  }, [orderItems, order]);

  // Check for changes
  useEffect(() => {
    if (!orderItems) return;
    
    const hasItemChanges = editedItems.some(item => 
      item.isNew || 
      item.isRemoved || 
      item.quantity !== item.originalQuantity ||
      item.discount
    );
    const hasShippingChange = order && shippingFee !== (order.shipping_fee || 0);
    
    setHasChanges(hasItemChanges || !!hasShippingChange);
  }, [editedItems, shippingFee, orderItems, order]);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setEditedItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
          : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setEditedItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, isRemoved: true }
          : item
      )
    );
  };

  const restoreItem = (itemId: string) => {
    setEditedItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, isRemoved: false }
          : item
      )
    );
  };

  const addProduct = (product: Product, variant?: { id: string; name: string; price: number }) => {
    const newItem: OrderItem = {
      id: `new-${Date.now()}`,
      order_id: id!,
      product_id: product.id,
      product_name: product.name,
      variant_id: variant?.id || null,
      variant_name: variant?.name || null,
      price: variant?.price || product.base_price,
      quantity: 1,
      subtotal: variant?.price || product.base_price,
      product: {
        product_images: product.product_images,
      },
      isNew: true,
    };
    setEditedItems([...editedItems, newItem]);
    setAddProductOpen(false);
    setProductSearch("");
  };

  const applyDiscount = () => {
    if (!discountItemId || !discountValue) return;
    
    const value = parseFloat(discountValue);
    if (isNaN(value) || value < 0) return;

    setEditedItems(items =>
      items.map(item =>
        item.id === discountItemId
          ? {
              ...item,
              discount: value,
              discountType,
              discountReason,
            }
          : item
      )
    );
    setDiscountItemId(null);
    setDiscountValue("");
    setDiscountReason("");
  };

  const calculateItemTotal = (item: OrderItem) => {
    let total = item.price * item.quantity;
    if (item.discount) {
      if (item.discountType === "percentage") {
        total -= total * (item.discount / 100);
      } else {
        total -= item.discount * item.quantity;
      }
    }
    return Math.max(0, total);
  };

  const activeItems = editedItems.filter(item => !item.isRemoved);
  const subtotal = activeItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const total = subtotal + shippingFee;

  const handleSave = async () => {
    if (!editReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please enter a reason for editing the order.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete removed items
      const removedItems = editedItems.filter(item => item.isRemoved && !item.isNew);
      for (const item of removedItems) {
        await supabase.from("order_items").delete().eq("id", item.id);
      }

      // Update existing items
      const updatedItems = editedItems.filter(
        item => !item.isNew && !item.isRemoved && 
        (item.quantity !== item.originalQuantity || item.discount)
      );
      for (const item of updatedItems) {
        await supabase
          .from("order_items")
          .update({
            quantity: item.quantity,
            subtotal: calculateItemTotal(item),
          })
          .eq("id", item.id);
      }

      // Insert new items
      const newItems = editedItems.filter(item => item.isNew && !item.isRemoved);
      for (const item of newItems) {
        await supabase.from("order_items").insert({
          order_id: id,
          product_id: item.product_id,
          product_name: item.product_name,
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          price: item.price,
          quantity: item.quantity,
          subtotal: calculateItemTotal(item),
        });
      }

      // Update order totals
      await supabase
        .from("orders")
        .update({
          subtotal,
          shipping_fee: shippingFee,
          total,
          notes: order?.notes 
            ? `${order.notes}\n\n[Edit ${format(new Date(), "MMM d, yyyy")}] ${editReason}`
            : `[Edit ${format(new Date(), "MMM d, yyyy")}] ${editReason}`,
        })
        .eq("id", id);

      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["order-items", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      toast({
        title: "Order Updated",
        description: "Order has been updated successfully.",
      });

      navigate(`/admin/orders/${id}`);
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update order.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
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

  const fulfillmentStatus = order.fulfillment_status || "unfulfilled";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => navigate("/admin/orders")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Link to="/admin/orders" className="hover:text-foreground">Orders</Link>
        <span>›</span>
        <Link to={`/admin/orders/${id}`} className="hover:text-foreground">{order.order_number}</Link>
        <span>›</span>
        <span className="text-foreground font-medium">Edit order</span>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")} from {order.source_name || "Online Store"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={fulfillmentStatus === "unfulfilled" 
                ? "bg-amber-50 text-amber-700 border-amber-200" 
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }
            >
              <CheckSquare className="h-3 w-3 mr-1" />
              {fulfillmentStatus === "unfulfilled" ? "Unfulfilled" : "Fulfilled"}
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddProductOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add product
              </Button>
            </div>
          </div>

          {/* Items Table */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Fulfilled
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Product</th>
                      <th className="text-right p-3 text-sm font-medium w-24">Price</th>
                      <th className="text-center p-3 text-sm font-medium w-24">Quantity</th>
                      <th className="text-right p-3 text-sm font-medium w-24">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {editedItems.map((item) => {
                      if (item.isRemoved) return null;
                      
                      const primaryImage = item.product?.product_images?.find(img => img.is_primary)?.image_url 
                        || item.product?.product_images?.[0]?.image_url;
                      
                      return (
                        <tr key={item.id} className={item.isNew ? "bg-green-50/50" : ""}>
                          <td className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                                {primaryImage ? (
                                  <img src={primaryImage} alt={item.product_name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{item.product_name}</p>
                                {item.variant_name && (
                                  <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                                )}
                                {item.discount && (
                                  <p className="text-xs text-emerald-600">
                                    -{item.discountType === "percentage" ? `${item.discount}%` : formatCurrency(item.discount)} discount
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="text-sm hover:underline">
                                  {formatCurrency(item.price)}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64">
                                <div className="space-y-3">
                                  <div className="space-y-2">
                                    <Label>Discount type</Label>
                                    <Select 
                                      value={discountItemId === item.id ? discountType : (item.discountType || "amount")}
                                      onValueChange={(v) => {
                                        setDiscountItemId(item.id);
                                        setDiscountType(v as "amount" | "percentage");
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="amount">Amount</SelectItem>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Value (per unit)</Label>
                                    <Input
                                      type="number"
                                      value={discountItemId === item.id ? discountValue : (item.discount?.toString() || "")}
                                      onChange={(e) => {
                                        setDiscountItemId(item.id);
                                        setDiscountValue(e.target.value);
                                      }}
                                      placeholder="0"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Reason for discount</Label>
                                    <Input
                                      value={discountItemId === item.id ? discountReason : (item.discountReason || "")}
                                      onChange={(e) => {
                                        setDiscountItemId(item.id);
                                        setDiscountReason(e.target.value);
                                      }}
                                      placeholder="Visible to customer"
                                    />
                                  </div>
                                  <Button className="w-full" onClick={applyDiscount}>
                                    Done
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center mx-auto"
                            />
                          </td>
                          <td className="p-3 text-right text-sm">
                            {formatCurrency(calculateItemTotal(item))}
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {fulfillmentStatus === "fulfilled" && (
                <p className="text-sm text-muted-foreground mt-3">
                  Fulfilled item quantities can't be changed
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal</span>
                <span className="text-sm">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button 
                    className="text-sm text-primary hover:underline"
                    onClick={() => {
                      const newFee = prompt("Enter shipping fee:", shippingFee.toString());
                      if (newFee !== null) {
                        setShippingFee(parseFloat(newFee) || 0);
                      }
                    }}
                  >
                    Edit shipping fees
                  </button>
                </div>
                <span className="text-sm">{formatCurrency(shippingFee)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-3">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Paid</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Reason for Edit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reason for edit</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Enter reason for editing this order..."
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-2">Only visible to staff</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasChanges ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {editedItems.filter(i => i.isNew && !i.isRemoved).length > 0 && (
                      <span className="block">+ {editedItems.filter(i => i.isNew && !i.isRemoved).length} item(s) added</span>
                    )}
                    {editedItems.filter(i => i.isRemoved && !i.isNew).length > 0 && (
                      <span className="block">- {editedItems.filter(i => i.isRemoved && !i.isNew).length} item(s) removed</span>
                    )}
                    {editedItems.filter(i => !i.isNew && !i.isRemoved && i.quantity !== i.originalQuantity).length > 0 && (
                      <span className="block">~ {editedItems.filter(i => !i.isNew && !i.isRemoved && i.quantity !== i.originalQuantity).length} item(s) modified</span>
                    )}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span>New total</span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                  {total !== order.total && (
                    <div className="flex justify-between text-sm">
                      <span>Difference</span>
                      <span className={total > order.total ? "text-destructive" : "text-emerald-600"}>
                        {total > order.total ? "+" : ""}{formatCurrency(total - order.total)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No changes have been made</p>
              )}
              <Button 
                className="w-full" 
                disabled={!hasChanges}
                onClick={handleSave}
              >
                Update order
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/admin/orders/${id}`)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {searchResults?.map((product) => (
                  <div key={product.id} className="border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                        {product.product_images?.[0]?.image_url ? (
                          <img 
                            src={product.product_images[0].image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.name}</p>
                        {product.product_variants?.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {product.product_variants.map((variant) => (
                              <button
                                key={variant.id}
                                className="w-full text-left text-xs p-2 rounded bg-muted/50 hover:bg-muted flex justify-between"
                                onClick={() => addProduct(product, variant)}
                              >
                                <span>{variant.name}</span>
                                <span>{formatCurrency(variant.price)}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => addProduct(product)}
                          >
                            Add • {formatCurrency(product.base_price)}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {productSearch.length >= 2 && searchResults?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No products found
                  </p>
                )}
                {productSearch.length < 2 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Type at least 2 characters to search
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProductOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}