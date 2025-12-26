import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductPromotion {
  promotion_id: string;
  product_id: string;
  title: string;
  subtitle: string | null;
  promo_type: string | null;
  gradient_from: string | null;
  gradient_to: string | null;
  start_date: string | null;
  end_date: string | null;
}

// Fetch active promotions for a single product
export const useProductPromotion = (productId: string | undefined) => {
  return useQuery({
    queryKey: ["product-promotion", productId],
    queryFn: async () => {
      if (!productId) return null;

      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("promotion_products")
        .select(`
          promotion_id,
          product_id,
          promotions!inner (
            id,
            title,
            subtitle,
            promo_type,
            gradient_from,
            gradient_to,
            start_date,
            end_date,
            is_active
          )
        `)
        .eq("product_id", productId)
        .eq("promotions.is_active", true);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Filter for promotions that are currently active (within date range)
      const activePromos = data.filter((item: any) => {
        const promo = item.promotions;
        const startOk = !promo.start_date || new Date(promo.start_date) <= new Date();
        const endOk = !promo.end_date || new Date(promo.end_date) >= new Date();
        return startOk && endOk;
      });

      if (activePromos.length === 0) return null;

      // Prioritize flash_sale over other types
      const flashSale = activePromos.find((p: any) => p.promotions.promo_type === "flash_sale");
      const promo = flashSale || activePromos[0];

      return {
        promotion_id: promo.promotion_id,
        product_id: promo.product_id,
        title: promo.promotions.title,
        subtitle: promo.promotions.subtitle,
        promo_type: promo.promotions.promo_type,
        gradient_from: promo.promotions.gradient_from,
        gradient_to: promo.promotions.gradient_to,
        start_date: promo.promotions.start_date,
        end_date: promo.promotions.end_date,
      } as ProductPromotion;
    },
    enabled: !!productId,
  });
};

// Fetch active promotions for multiple products (batch query for product lists)
export const useProductsPromotions = (productIds: string[]) => {
  return useQuery({
    queryKey: ["products-promotions", productIds.sort().join(",")],
    queryFn: async () => {
      if (productIds.length === 0) return {};

      const { data, error } = await supabase
        .from("promotion_products")
        .select(`
          promotion_id,
          product_id,
          promotions!inner (
            id,
            title,
            subtitle,
            promo_type,
            gradient_from,
            gradient_to,
            start_date,
            end_date,
            is_active
          )
        `)
        .in("product_id", productIds)
        .eq("promotions.is_active", true);

      if (error) throw error;
      if (!data) return {};

      // Build a map of product_id -> promotion
      const promotionsMap: Record<string, ProductPromotion> = {};

      data.forEach((item: any) => {
        const promo = item.promotions;
        const startOk = !promo.start_date || new Date(promo.start_date) <= new Date();
        const endOk = !promo.end_date || new Date(promo.end_date) >= new Date();
        
        if (!startOk || !endOk) return;

        const productId = item.product_id;
        
        // If already have a promotion, prioritize flash_sale
        if (promotionsMap[productId]) {
          if (promo.promo_type === "flash_sale" && promotionsMap[productId].promo_type !== "flash_sale") {
            promotionsMap[productId] = {
              promotion_id: item.promotion_id,
              product_id: item.product_id,
              title: promo.title,
              subtitle: promo.subtitle,
              promo_type: promo.promo_type,
              gradient_from: promo.gradient_from,
              gradient_to: promo.gradient_to,
              start_date: promo.start_date,
              end_date: promo.end_date,
            };
          }
        } else {
          promotionsMap[productId] = {
            promotion_id: item.promotion_id,
            product_id: item.product_id,
            title: promo.title,
            subtitle: promo.subtitle,
            promo_type: promo.promo_type,
            gradient_from: promo.gradient_from,
            gradient_to: promo.gradient_to,
            start_date: promo.start_date,
            end_date: promo.end_date,
          };
        }
      });

      return promotionsMap;
    },
    enabled: productIds.length > 0,
    staleTime: 60000, // Cache for 1 minute
  });
};
