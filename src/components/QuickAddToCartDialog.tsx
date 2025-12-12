import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Loader2, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ProductVariantSelector } from "@/components/ProductVariantSelector";

interface Variant {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

interface QuickAddToCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    base_price: number;
    compare_at_price?: number | null;
    product_images?: Array<{ image_url: string; is_primary: boolean }>;
    option1_name?: string | null;
    option2_name?: string | null;
    option3_name?: string | null;
  };
  onAddToCart: (variantId: string | null, quantity: number) => void;
  isAddingToCart: boolean;
}

export const QuickAddToCartDialog = ({
  open,
  onOpenChange,
  product,
  onAddToCart,
  isAddingToCart,
}: QuickAddToCartDialogProps) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchVariants();
      setQuantity(1);
    }
  }, [open, product.id]);

  const fetchVariants = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("product_variants")
      .select("id, name, price, compare_at_price, stock_quantity, option1, option2, option3")
      .eq("product_id", product.id)
      .order("price", { ascending: true });

    if (!error && data) {
      setVariants(data);
      if (data.length > 0) {
        setSelectedVariant(data[0]);
      }
    }
    setIsLoading(false);
  };

  const getPrimaryImage = () => {
    if (!product.product_images || product.product_images.length === 0) {
      return "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200&h=200&fit=crop";
    }
    const primary = product.product_images.find((img) => img.is_primary);
    return primary?.image_url || product.product_images[0]?.image_url;
  };

  const currentPrice = selectedVariant?.price ?? product.base_price;
  const comparePrice = selectedVariant?.compare_at_price ?? product.compare_at_price;
  const hasDiscount = comparePrice && comparePrice > currentPrice;

  const handleAddToCart = () => {
    onAddToCart(selectedVariant?.id ?? null, quantity);
  };

  const hasOptions = product.option1_name || product.option2_name || product.option3_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Thêm vào giỏ hàng</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4">
          <img
            src={getPrimaryImage()}
            alt={product.name}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground line-clamp-2 text-sm">
              {product.name}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {formatPrice(currentPrice)}₫
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(comparePrice!)}₫
                </span>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {hasOptions && variants.length > 1 && (
              <div className="space-y-3">
                <ProductVariantSelector
                  variants={variants}
                  selectedVariant={selectedVariant}
                  onVariantChange={(v) => {
                    const found = variants.find((vr) => vr.id === v.id);
                    setSelectedVariant(found ?? null);
                  }}
                  optionNames={{
                    option1: product.option1_name ?? null,
                    option2: product.option2_name ?? null,
                    option3: product.option3_name ?? null,
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Số lượng</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              Thêm vào giỏ hàng
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
