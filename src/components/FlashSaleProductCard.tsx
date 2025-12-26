import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { QuickAddToCartDialog } from "./QuickAddToCartDialog";

interface FlashSaleProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    compare_at_price?: number | null;
    brand?: string | null;
    option1_name?: string | null;
    option2_name?: string | null;
    option3_name?: string | null;
    product_images?: Array<{ image_url: string; is_primary: boolean }>;
  };
  discountPercent?: number; // Flash sale discount percentage
  soldCount?: number; // Number of items sold
}

export const FlashSaleProductCard = ({ product, discountPercent = 30, soldCount = 0 }: FlashSaleProductCardProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
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
    } finally {
      setIsAddingToCart(false);
      setQuickAddOpen(false);
    }
  };

  const getPrimaryImage = (images: Array<{ image_url: string; is_primary: boolean }> | undefined) => {
    if (!images || images.length === 0) {
      return "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&h=500&fit=crop";
    }
    const primary = images.find(img => img.is_primary);
    return primary?.image_url || images[0]?.image_url;
  };

  // Use the flash sale discount, not the product's compare_at_price
  const hasDiscount = discountPercent > 0;
  const originalPrice = hasDiscount 
    ? Math.round(product.base_price / (1 - discountPercent / 100))
    : product.compare_at_price || product.base_price;

  const getSellingLabel = () => {
    if (soldCount >= 30) return "SẮP HẾT";
    if (soldCount >= 15) return "ĐANG BÁN CHẠY";
    return `ĐÃ BÁN ${soldCount}`;
  };

  // Calculate bar fill percentage based on sold count (assume max ~50 for visual)
  const barFillPercent = Math.min((soldCount / 50) * 100, 100);

  return (
    <Card
      className="group overflow-hidden transition-smooth shadow-card hover:shadow-hover rounded-xl border-0 cursor-pointer h-full flex flex-col bg-background"
      onClick={() => navigate(`/products/${product.slug}`)}
    >
      <CardContent className="p-0 flex flex-col flex-1">
        <div className="relative">
          <div className="relative aspect-square overflow-hidden bg-muted rounded-t-xl">
            <img
              src={getPrimaryImage(product.product_images)}
              alt={product.name}
              className="w-full h-full object-cover transition-smooth group-hover:scale-105"
            />
            
            {hasDiscount && (
              <Badge 
                className="absolute top-2 left-2 bg-secondary text-secondary-foreground hover:bg-secondary text-xs px-2 py-0.5"
              >
                Sale
              </Badge>
            )}

            {hasDiscount && (
              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded">
                -{discountPercent}%
              </div>
            )}
          </div>
        </div>

        <div className="p-3 space-y-2 flex flex-col flex-1">
          {product.brand && (
            <p className="text-xs text-muted-foreground font-medium truncate">{product.brand}</p>
          )}
          <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-smooth leading-tight">
            {product.name}
          </h3>

          <div className="flex items-center gap-2 mt-auto">
            <div className="flex flex-col flex-1">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(originalPrice)}₫
                </span>
              )}
              <span className="text-sm font-bold text-primary">
                {formatPrice(product.base_price)}₫
              </span>
            </div>
            <Button
              size="icon"
              className="rounded-full shadow-md h-8 w-8 shrink-0"
              onClick={handleQuickAddClick}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShoppingCart className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {/* Selling Pace Bar - Shopee style */}
          <div className="relative w-full h-5 bg-primary/20 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
              style={{ width: `${barFillPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white drop-shadow-sm">
                {getSellingLabel()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <QuickAddToCartDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        product={product}
        onAddToCart={handleAddToCart}
        isAddingToCart={isAddingToCart}
      />
    </Card>
  );
};
