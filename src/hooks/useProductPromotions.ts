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
  // New discount fields
  discount_type: "percentage" | "fixed_amount" | "special_price" | null;
  discount_value: number | null;
  is_enabled: boolean;
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
          variant_id,
          discount_type,
          discount_value,
          is_enabled,
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

      // Filter for promotions that are currently active (within date range) and enabled
      const activePromos = data.filter((item: any) => {
        const promo = item.promotions;
        const startOk = !promo.start_date || new Date(promo.start_date) <= new Date();
        const endOk = !promo.end_date || new Date(promo.end_date) >= new Date();
        const isEnabled = item.is_enabled !== false;
        return startOk && endOk && isEnabled;
      });

      if (activePromos.length === 0) return null;

      // Prioritize flash_sale over other types
      const flashSale = activePromos.find((p: any) => p.promotions.promo_type === "flash_sale");
      const promo = flashSale || activePromos[0];

      // Get the highest discount value if there are multiple variants
      const maxDiscountItem = activePromos.reduce((max: any, current: any) => {
        if (!max) return current;
        if ((current.discount_value || 0) > (max.discount_value || 0)) {
          return current;
        }
        return max;
      }, null);

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
        discount_type: maxDiscountItem?.discount_type || null,
        discount_value: maxDiscountItem?.discount_value || null,
        is_enabled: maxDiscountItem?.is_enabled ?? true,
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
          variant_id,
          discount_type,
          discount_value,
          is_enabled,
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

      // Build a map of product_id -> promotion with discount info
      const promotionsMap: Record<string, ProductPromotion> = {};

      data.forEach((item: any) => {
        const promo = item.promotions;
        const startOk = !promo.start_date || new Date(promo.start_date) <= new Date();
        const endOk = !promo.end_date || new Date(promo.end_date) >= new Date();
        const isEnabled = item.is_enabled !== false;
        
        if (!startOk || !endOk || !isEnabled) return;

        const productId = item.product_id;
        
        // If already have a promotion, prioritize flash_sale or higher discount
        if (promotionsMap[productId]) {
          const existingDiscount = promotionsMap[productId].discount_value || 0;
          const newDiscount = item.discount_value || 0;
          
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
              discount_type: item.discount_type,
              discount_value: item.discount_value,
              is_enabled: item.is_enabled ?? true,
            };
          } else if (newDiscount > existingDiscount) {
            // Use higher discount value
            promotionsMap[productId].discount_type = item.discount_type;
            promotionsMap[productId].discount_value = item.discount_value;
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
            discount_type: item.discount_type,
            discount_value: item.discount_value,
            is_enabled: item.is_enabled ?? true,
          };
        }
      });

      return promotionsMap;
    },
    enabled: productIds.length > 0,
    staleTime: 60000, // Cache for 1 minute
  });
};
