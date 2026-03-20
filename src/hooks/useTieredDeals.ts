import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TieredDiscount {
  promotionId: string;
  title: string;
  discountAmount: number;
  description: string;
  tierApplied: { quantity: number; discount: number };
}

interface CartItemForTier {
  product_id: string;
  quantity: number;
  unitPrice: number;
}

export function useTieredDeals(cartItems: CartItemForTier[]) {
  const productIds = cartItems.map((i) => i.product_id).filter(Boolean);

  return useQuery({
    queryKey: ["tiered-deals", productIds.sort().join(","), cartItems.map(i => `${i.product_id}:${i.quantity}`).join(",")],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const { data: promoProducts, error } = await supabase
        .from("promotion_products")
        .select(`
          product_id,
          promotion_id,
          promotions!inner (
            id, title, program_kind, is_active,
            start_date, end_date, rules
          )
        `)
        .in("product_id", productIds)
        .eq("promotions.program_kind", "buy_more_save_more")
        .eq("promotions.is_active", true);

      if (error || !promoProducts) return [];

      // Group by promotion
      const promoMap = new Map<string, { promo: any; productIds: Set<string> }>();

      for (const pp of promoProducts as any[]) {
        const promo = pp.promotions;
        if (promo.start_date && new Date(promo.start_date) > new Date()) continue;
        if (promo.end_date && new Date(promo.end_date) < new Date()) continue;

        if (!promoMap.has(promo.id)) {
          promoMap.set(promo.id, { promo, productIds: new Set() });
        }
        promoMap.get(promo.id)!.productIds.add(pp.product_id);
      }

      const discounts: TieredDiscount[] = [];

      for (const [, { promo, productIds: eligibleIds }] of promoMap) {
        const rules = promo.rules || {};
        const tiers = (rules.tiers || []) as { quantity: number; discount: number }[];
        if (tiers.length === 0) continue;

        // Sort tiers by quantity descending (apply highest qualifying tier)
        const sortedTiers = [...tiers].sort((a, b) => b.quantity - a.quantity);

        // Total quantity of eligible items in cart
        const totalEligibleQty = cartItems
          .filter((item) => eligibleIds.has(item.product_id))
          .reduce((sum, item) => sum + item.quantity, 0);

        // Find the highest tier that qualifies
        const qualifyingTier = sortedTiers.find((tier) => totalEligibleQty >= tier.quantity);
        if (!qualifyingTier) continue;

        // Apply the tier discount to all eligible items
        const eligibleTotal = cartItems
          .filter((item) => eligibleIds.has(item.product_id))
          .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

        const discountAmount = Math.round(eligibleTotal * (qualifyingTier.discount / 100));
        if (discountAmount > 0) {
          discounts.push({
            promotionId: promo.id,
            title: promo.title,
            discountAmount,
            description: `Mua ${qualifyingTier.quantity}+ giảm ${qualifyingTier.discount}%`,
            tierApplied: qualifyingTier,
          });
        }
      }

      return discounts;
    },
    enabled: productIds.length > 0,
    staleTime: 60000,
  });
}
