import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductVoucher {
  id: string;
  voucher_code: string | null;
  discount_type: string | null;
  discount_value: number | null;
  title: string;
}

export const useProductVouchers = (productId: string | undefined) => {
  return useQuery({
    queryKey: ["product-vouchers", productId],
    queryFn: async () => {
      if (!productId) return [];

      const now = new Date().toISOString();

      // Get shop-wide vouchers
      const { data: shopWideVouchers, error: shopError } = await supabase
        .from("promotions")
        .select("id, voucher_code, discount_type, discount_value, title")
        .eq("program_kind", "voucher")
        .eq("is_active", true)
        .eq("voucher_type", "shop_wide")
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order("display_order", { ascending: true })
        .limit(3);

      if (shopError) throw shopError;

      // Get product-specific vouchers
      const { data: productVouchers, error: productError } = await supabase
        .from("promotion_products")
        .select(`
          promotion_id,
          promotions!inner (
            id,
            voucher_code,
            discount_type,
            discount_value,
            title,
            program_kind,
            is_active,
            start_date,
            end_date
          )
        `)
        .eq("product_id", productId)
        .eq("is_enabled", true);

      if (productError) throw productError;

      // Filter product vouchers that are active and within date range
      const activeProductVouchers = (productVouchers || [])
        .filter((pv) => {
          const promo = pv.promotions as unknown as {
            program_kind: string;
            is_active: boolean;
            start_date: string | null;
            end_date: string | null;
          };
          if (promo.program_kind !== "voucher" || !promo.is_active) return false;
          if (promo.start_date && new Date(promo.start_date) > new Date(now)) return false;
          if (promo.end_date && new Date(promo.end_date) < new Date(now)) return false;
          return true;
        })
        .map((pv) => {
          const promo = pv.promotions as unknown as ProductVoucher;
          return {
            id: promo.id,
            voucher_code: promo.voucher_code,
            discount_type: promo.discount_type,
            discount_value: promo.discount_value,
            title: promo.title,
          };
        });

      // Combine and deduplicate
      const allVouchers = [...(shopWideVouchers || []), ...activeProductVouchers];
      const uniqueVouchers = allVouchers.filter(
        (voucher, index, self) => index === self.findIndex((v) => v.id === voucher.id)
      );

      return uniqueVouchers.slice(0, 3) as ProductVoucher[];
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// Batch fetch vouchers for multiple products at once
export const useAllProductVouchers = () => {
  return useQuery({
    queryKey: ["all-product-vouchers"],
    queryFn: async () => {
      const now = new Date().toISOString();

      // Get shop-wide vouchers (these apply to all products)
      const { data: shopWideVouchers, error: shopError } = await supabase
        .from("promotions")
        .select("id, voucher_code, discount_type, discount_value, title")
        .eq("program_kind", "voucher")
        .eq("is_active", true)
        .eq("voucher_type", "shop_wide")
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order("display_order", { ascending: true })
        .limit(3);

      if (shopError) throw shopError;

      // Get all product-specific voucher mappings
      const { data: productVoucherMappings, error: productError } = await supabase
        .from("promotion_products")
        .select(`
          product_id,
          promotion_id,
          promotions!inner (
            id,
            voucher_code,
            discount_type,
            discount_value,
            title,
            program_kind,
            is_active,
            voucher_type,
            start_date,
            end_date
          )
        `)
        .eq("is_enabled", true);

      if (productError) throw productError;

      // Build a map of product_id -> specific vouchers
      const productVouchersMap: Record<string, ProductVoucher[]> = {};
      
      (productVoucherMappings || []).forEach((pvm) => {
        const promo = pvm.promotions as unknown as {
          id: string;
          voucher_code: string | null;
          discount_type: string | null;
          discount_value: number | null;
          title: string;
          program_kind: string;
          is_active: boolean;
          voucher_type: string;
          start_date: string | null;
          end_date: string | null;
        };

        // Only include active vouchers within date range
        if (promo.program_kind !== "voucher" || !promo.is_active) return;
        if (promo.start_date && new Date(promo.start_date) > new Date(now)) return;
        if (promo.end_date && new Date(promo.end_date) < new Date(now)) return;

        if (!productVouchersMap[pvm.product_id]) {
          productVouchersMap[pvm.product_id] = [];
        }

        // Avoid duplicates
        if (!productVouchersMap[pvm.product_id].some(v => v.id === promo.id)) {
          productVouchersMap[pvm.product_id].push({
            id: promo.id,
            voucher_code: promo.voucher_code,
            discount_type: promo.discount_type,
            discount_value: promo.discount_value,
            title: promo.title,
          });
        }
      });

      return {
        shopWideVouchers: (shopWideVouchers || []) as ProductVoucher[],
        productVouchersMap,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
