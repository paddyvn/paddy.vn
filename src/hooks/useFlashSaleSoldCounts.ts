import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SoldCountsMap {
  [productId: string]: number;
}

export const useFlashSaleSoldCounts = (
  productIds: string[],
  startDate: string | null,
  endDate: string | null
) => {
  return useQuery({
    queryKey: ["flash-sale-sold-counts", productIds, startDate, endDate],
    enabled: productIds.length > 0 && !!startDate && !!endDate,
    queryFn: async () => {
      // Query order_items joined with orders to get sold counts
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          product_id,
          quantity,
          orders!inner(created_at, financial_status)
        `)
        .in("product_id", productIds)
        .gte("orders.created_at", startDate!)
        .lte("orders.created_at", endDate!)
        .in("orders.financial_status", ["paid", "partially_paid"]);

      if (error) throw error;

      // Aggregate sold counts by product_id
      const soldCounts: SoldCountsMap = {};
      productIds.forEach((id) => {
        soldCounts[id] = 0;
      });

      if (data) {
        data.forEach((item) => {
          if (item.product_id) {
            soldCounts[item.product_id] = (soldCounts[item.product_id] || 0) + item.quantity;
          }
        });
      }

      return soldCounts;
    },
  });
};
