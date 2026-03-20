import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ComboDiscount {
  promotionId: string;
  title: string;
  comboType: string;
  discountAmount: number;
  description: string;
}

interface CartItemForCombo {
  product_id: string;
  quantity: number;
  unitPrice: number;
}

export function useComboDeals(cartItems: CartItemForCombo[]) {
  const productIds = cartItems.map((i) => i.product_id).filter(Boolean);

  return useQuery({
    queryKey: ["combo-deals", productIds.sort().join(",")],
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
        .eq("promotions.program_kind", "combo_buy")
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

      const discounts: ComboDiscount[] = [];

      for (const [, { promo, productIds: eligibleIds }] of promoMap) {
        const rules = promo.rules || {};
        const comboType = rules.combo_type || "buy_x_discount_y";

        // Expand cart items to individual units, sorted cheapest first
        const eligibleUnits = cartItems
          .filter((item) => eligibleIds.has(item.product_id))
          .flatMap((item) =>
            Array.from({ length: item.quantity }, () => ({
              product_id: item.product_id,
              unitPrice: item.unitPrice,
            }))
          )
          .sort((a, b) => a.unitPrice - b.unitPrice);

        if (comboType === "buy_x_free_y") {
          const buyQty = rules.buy_quantity || 2;
          const freeQty = rules.get_quantity || 1;
          const comboSize = buyQty + freeQty;

          const completeCombos = Math.floor(eligibleUnits.length / comboSize);
          if (completeCombos === 0) continue;

          const freeItemCount = freeQty * completeCombos;
          let totalDiscount = 0;
          for (let i = 0; i < freeItemCount && i < eligibleUnits.length; i++) {
            totalDiscount += eligibleUnits[i].unitPrice;
          }

          if (totalDiscount > 0) {
            discounts.push({
              promotionId: promo.id,
              title: promo.title,
              comboType,
              discountAmount: Math.round(totalDiscount),
              description: `Mua ${buyQty} tặng ${freeQty}`,
            });
          }
        } else if (comboType === "buy_x_discount_y") {
          const buyQty = rules.buy_quantity || 2;
          const discountPct = rules.discount_percentage || 50;

          if (eligibleUnits.length < buyQty) continue;

          const completeCombos = Math.floor(eligibleUnits.length / buyQty);
          let totalDiscount = 0;
          for (let i = 0; i < completeCombos && i < eligibleUnits.length; i++) {
            totalDiscount += eligibleUnits[i].unitPrice * (discountPct / 100);
          }

          totalDiscount = Math.round(totalDiscount);
          if (totalDiscount > 0) {
            discounts.push({
              promotionId: promo.id,
              title: promo.title,
              comboType,
              discountAmount: totalDiscount,
              description: `Mua ${buyQty}, giảm ${discountPct}% SP rẻ nhất`,
            });
          }
        } else if (comboType === "bundles") {
          const bundlePrice = rules.bundle_price || 0;
          if (bundlePrice <= 0) continue;

          const allPresent = [...eligibleIds].every((pid) =>
            cartItems.some((item) => item.product_id === pid && item.quantity > 0)
          );
          if (!allPresent) continue;

          const individualTotal = cartItems
            .filter((item) => eligibleIds.has(item.product_id))
            .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

          const totalDiscount = Math.max(0, individualTotal - bundlePrice);
          if (totalDiscount > 0) {
            discounts.push({
              promotionId: promo.id,
              title: promo.title,
              comboType,
              discountAmount: Math.round(totalDiscount),
              description: `Combo giá ${bundlePrice.toLocaleString("vi-VN")}₫`,
            });
          }
        }
      }

      return discounts;
    },
    enabled: productIds.length > 0,
    staleTime: 60000,
  });
}
