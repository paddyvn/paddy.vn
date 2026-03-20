import { useState, useEffect } from "react";
import { Heart, ShoppingBag, Check, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { QuickAddToCartDialog } from "./QuickAddToCartDialog";
import { ProductPromotion } from "@/hooks/useProductPromotions";
import { ProductVoucher } from "@/hooks/useProductVouchers";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    compare_at_price?: number | null;
    is_featured?: boolean;
    brand?: string | null;
    pet_type?: string | null;
    rating?: number | null;
    rating_count?: number | null;
    sold_count?: number | null;
    created_at?: string | null;
    option1_name?: string | null;
    option2_name?: string | null;
    option3_name?: string | null;
    product_images?: Array<{ image_url: string; is_primary: boolean }>;
    reviews?: Array<{ rating: number }>;
  };
  promotion?: ProductPromotion | null;
  vouchers?: ProductVoucher[];
}

// — Star rating SVG —
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-px">
    {[1, 2, 3, 4, 5].map((star) => {
      const fill = rating >= star ? 1 : rating >= star - 0.5 ? 0.5 : 0;
      return (
        <svg key={star} width="13" height="13" viewBox="0 0 16 16" fill="none">
          <defs>
            <linearGradient id={`star-${rating}-${star}`}>
              <stop offset={`${fill * 100}%`} stopColor="hsl(var(--secondary))" />
              <stop offset={`${fill * 100}%`} stopColor="#E0E0E0" />
            </linearGradient>
          </defs>
          <path
            d="M8 1.12l1.95 3.95 4.36.63-3.15 3.07.74 4.35L8 10.93l-3.9 2.19.74-4.35L1.69 5.7l4.36-.63L8 1.12z"
            fill={`url(#star-${rating}-${star})`}
          />
        </svg>
      );
    })}
  </div>
);

function formatSoldCount(count: number) {
  if (count >= 1000) return Math.floor(count / 1000) + "k+";
  if (count >= 100) return Math.floor(count / 100) * 100 + "+";
  return count + "+";
}

export const ProductCard = ({ product, promotion, vouchers = [] }: ProductCardProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [liked, setLiked] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { addToCart } = useCart(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickAddOpen(true);
  };

  const handleAddToCart = async (variantId: string | null, quantity: number) => {
    setIsAddingToCart(true);
    try {
      await addToCart({ productId: product.id, variantId: variantId ?? undefined, quantity });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 1200);
    } finally {
      setIsAddingToCart(false);
      setQuickAddOpen(false);
    }
  };

  // — Image —
  const getPrimaryImage = (images: Array<{ image_url: string; is_primary: boolean }> | undefined) => {
    if (!images || images.length === 0) {
      return "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&h=500&fit=crop";
    }
    const primary = images.find(img => img.is_primary);
    return primary?.image_url || images[0]?.image_url;
  };

  // — Rating —
  const avgRating = product.reviews && product.reviews.length > 0
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : (product.rating ?? 0);
  const reviewCount = product.reviews?.length ?? product.rating_count ?? 0;
  const hasReviews = reviewCount > 0 && avgRating > 0;

  // — Discount calculation (reuse existing logic) —
  const hasCompareAtDiscount = product.compare_at_price && product.compare_at_price > product.base_price;
  const hasPromotionDiscount = promotion?.discount_value && promotion.discount_value > 0;
  const showSale = hasPromotionDiscount || hasCompareAtDiscount;

  let displayPrice = product.base_price;
  let originalPrice = product.base_price;
  let discountPercentage = 0;

  if (hasPromotionDiscount && promotion) {
    originalPrice = product.base_price;
    if (promotion.discount_type === "percentage") {
      displayPrice = product.base_price * (1 - promotion.discount_value! / 100);
      discountPercentage = Math.round(promotion.discount_value!);
    } else if (promotion.discount_type === "fixed_amount") {
      displayPrice = Math.max(0, product.base_price - promotion.discount_value!);
      discountPercentage = Math.round((promotion.discount_value! / product.base_price) * 100);
    } else if (promotion.discount_type === "special_price") {
      displayPrice = promotion.discount_value!;
      discountPercentage = Math.round(((product.base_price - promotion.discount_value!) / product.base_price) * 100);
    }
  } else if (hasCompareAtDiscount) {
    originalPrice = product.compare_at_price!;
    displayPrice = product.base_price;
    discountPercentage = Math.round(((product.compare_at_price! - product.base_price) / product.compare_at_price!) * 100);
  }

  // — Badges —
  const isBestseller = product.is_featured;
  const soldCount = product.sold_count ?? 0;
  const isNew = product.created_at
    ? (Date.now() - new Date(product.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000
    : false;

  return (
    <>
      <div
        className="group relative flex flex-col bg-card rounded-2xl overflow-hidden cursor-pointer shadow-[0_1px_3px_rgba(8,73,255,0.06),0_4px_12px_rgba(8,73,255,0.04)] hover:shadow-[0_4px_16px_rgba(8,73,255,0.10),0_8px_28px_rgba(8,73,255,0.06)] hover:-translate-y-[3px] transition-all duration-300 ease-out"
        onClick={() => navigate(`/products/${product.slug}`)}
      >
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          <img
            src={getPrimaryImage(product.product_images)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-105"
          />

          {/* Badges top-left */}
          <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
            {isBestseller && (
              <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-orange-500 text-white">
                Bán chạy
              </span>
            )}
            {showSale && discountPercentage > 0 && (
              <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                -{discountPercentage}%
              </span>
            )}
            {isNew && (
              <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                Mới
              </span>
            )}
          </div>

          {/* Wishlist top-right */}
          <button
            className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:scale-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-95 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setLiked(!liked);
            }}
            aria-label="Yêu thích"
          >
            <Heart
              className={`h-[18px] w-[18px] ${liked ? "fill-rose-500 text-rose-500" : "fill-none text-muted-foreground"}`}
            />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-3.5 pb-4 gap-1">
          {/* Brand */}
          {product.brand && (
            <span className="text-[11.5px] font-semibold uppercase tracking-[0.04em] text-primary leading-none">
              {product.brand}
            </span>
          )}

          {/* Title */}
          <h3 className="text-sm font-semibold text-foreground leading-[1.35] line-clamp-2 m-0">
            {product.name}
          </h3>

          {/* Rating + sold count */}
          <div className="flex flex-col gap-0.5 mt-1">
            {hasReviews && (
              <div className="flex items-center gap-[5px]">
                <StarRating rating={avgRating} />
                <span className="text-[12.5px] font-bold text-foreground">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({reviewCount})</span>
              </div>
            )}
            {soldCount >= 10 && (
              <span className="text-[11.5px] text-muted-foreground font-medium">
                Đã bán {formatSoldCount(soldCount)}
              </span>
            )}
          </div>

          {/* Price + Cart button */}
          <div className="mt-auto pt-2 space-y-1">
            {showSale && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(originalPrice)}đ
              </span>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="text-[15px] font-bold text-primary tracking-tight whitespace-nowrap">
                  {formatPrice(displayPrice)}đ
                </span>
                {showSale && discountPercentage > 0 && (
                  <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                    -{discountPercentage}%
                  </span>
                )}
              </div>

              <button
                className={`w-[36px] h-[36px] rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-[1.06] active:scale-95 ${
                  addedToCart
                    ? "bg-green-500 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
                onClick={handleQuickAddClick}
                disabled={isAddingToCart}
                aria-label="Thêm vào giỏ"
              >
                {isAddingToCart ? (
                  <Loader2 className="h-[15px] w-[15px] animate-spin" />
                ) : addedToCart ? (
                  <Check className="h-[15px] w-[15px]" strokeWidth={3} />
                ) : (
                  <ShoppingBag className="h-[15px] w-[15px]" strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuickAddToCartDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        product={product}
        onAddToCart={handleAddToCart}
        isAddingToCart={isAddingToCart}
      />
    </>
  );
};
