import { ProductPromotion } from "@/hooks/useProductPromotions";

/**
 * Calculate the effective price for a cart item considering active promotions.
 * Uses the same discount formulas as ProductCard and ProductDetail.
 */
export function getEffectivePrice(
  basePrice: number,
  promotion: ProductPromotion | null | undefined
): {
  effectivePrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  discountPercentage: number;
} {
  if (!promotion || !promotion.discount_value || promotion.discount_value <= 0) {
    return {
      effectivePrice: basePrice,
      originalPrice: basePrice,
      hasDiscount: false,
      discountPercentage: 0,
    };
  }

  let effectivePrice = basePrice;
  let discountPercentage = 0;

  if (promotion.discount_type === "percentage") {
    effectivePrice = basePrice * (1 - promotion.discount_value / 100);
    discountPercentage = Math.round(promotion.discount_value);
  } else if (promotion.discount_type === "fixed_amount") {
    effectivePrice = Math.max(0, basePrice - promotion.discount_value);
    discountPercentage = basePrice > 0 ? Math.round((promotion.discount_value / basePrice) * 100) : 0;
  } else if (promotion.discount_type === "special_price") {
    effectivePrice = promotion.discount_value;
    discountPercentage = basePrice > 0 ? Math.round(((basePrice - promotion.discount_value) / basePrice) * 100) : 0;
  }

  return {
    effectivePrice: Math.round(effectivePrice), // VND has no decimals
    originalPrice: basePrice,
    hasDiscount: discountPercentage > 0,
    discountPercentage,
  };
}

/**
 * Get the base price for a cart item (variant price or product base_price)
 */
export function getItemBasePrice(item: {
  product_variants?: { price: number } | null;
  products?: { base_price: number } | null;
}): number {
  return item.product_variants?.price || item.products?.base_price || 0;
}
