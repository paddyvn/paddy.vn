import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Order {
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

export interface OrderItem {
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

export const useOrders = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id)")
        .order("shopify_order_id", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return data.map((order) => {
        const orderItems = order.order_items as { id: string }[] | null;
        return {
          ...order,
          items_count: Array.isArray(orderItems) ? orderItems.length : 0,
          order_items: undefined,
        };
      }) as (Order & { items_count: number })[];
    },
  });
};

export const useOrderItems = (orderId: string) => {
  return useQuery({
    queryKey: ["order-items", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!orderId,
  });
};
