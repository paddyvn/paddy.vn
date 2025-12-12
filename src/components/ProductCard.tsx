import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, ShoppingCart, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QuickAddToCartDialog } from "./QuickAddToCartDialog";

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
    option1_name?: string | null;
    option2_name?: string | null;
    option3_name?: string | null;
    product_images?: Array<{ image_url: string; is_primary: boolean }>;
    reviews?: Array<{ rating: number }>;
  };
}

const PetBadge = ({ type }: { type: 'dog' | 'cat' }) => (
  <span 
    className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xl font-bold ${
      type === 'dog' 
        ? 'bg-amber-100 text-amber-700' 
        : 'bg-purple-100 text-purple-700'
    }`}
    title={type === 'dog' ? 'Cho chó' : 'Cho mèo'}
  >
    {type === 'dog' ? '🐕' : '🐱'}
  </span>
);

const getPetTypes = (petType: string | null | undefined): ('dog' | 'cat')[] => {
  if (!petType) return [];
  const lower = petType.toLowerCase();
  const types: ('dog' | 'cat')[] = [];
  if (lower.includes('dog') || lower.includes('chó')) types.push('dog');
  if (lower.includes('cat') || lower.includes('mèo')) types.push('cat');
  return types;
};

export const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    if (!userId) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setQuickAddOpen(true);
  };

  const handleAddToCart = (variantId: string | null, quantity: number) => {
    setIsAddingToCart(true);
    addToCart(
      { productId: product.id, variantId: variantId ?? undefined, quantity },
      {
        onSettled: () => {
          setIsAddingToCart(false);
          setQuickAddOpen(false);
        },
      }
    );
  };

  const calculateAverageRating = (reviews: Array<{ rating: number }> | undefined) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getPrimaryImage = (images: Array<{ image_url: string; is_primary: boolean }> | undefined) => {
    if (!images || images.length === 0) {
      return "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&h=500&fit=crop";
    }
    const primary = images.find(img => img.is_primary);
    return primary?.image_url || images[0]?.image_url;
  };

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.compare_at_price! - product.base_price) / product.compare_at_price!) * 100)
    : 0;
  const petTypes = getPetTypes(product.pet_type);

  return (
    <Card
      className="group overflow-hidden transition-smooth shadow-card hover:shadow-hover rounded-sm border-0 cursor-pointer"
      onClick={() => navigate(`/products/${product.slug}`)}
    >
      <CardContent className="p-0">
        <div className="relative">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={getPrimaryImage(product.product_images)}
              alt={product.name}
              className="w-full h-full object-cover transition-smooth group-hover:scale-110"
            />
            
            {product.is_featured && (
              <Badge 
                className="absolute top-3 left-3 bg-primary text-primary-foreground hover:bg-primary"
              >
                Featured
              </Badge>
            )}
            
            {hasDiscount && !product.is_featured && (
              <Badge 
                className="absolute top-3 left-3 bg-secondary text-secondary-foreground hover:bg-secondary"
              >
                Sale
              </Badge>
            )}
            
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-3 right-3 rounded-full opacity-0 group-hover:opacity-100 transition-smooth shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Add to wishlist
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
          
          {petTypes.length > 0 && (
            <div className="absolute -bottom-5 right-3 flex gap-1 z-20">
              {petTypes.map((type) => (
                <PetBadge key={type} type={type} />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            {product.brand && (
              <p className="text-xs text-muted-foreground mb-1 font-bold">{product.brand}</p>
            )}
            <h3 className="font-semibold text-foreground line-clamp-3 group-hover:text-primary transition-smooth">
              {product.name}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-secondary text-secondary" />
            <span className="text-sm font-medium">
              {calculateAverageRating(product.reviews)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({product.reviews?.length || 0})
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex flex-col items-start">
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price!)}₫
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary">
                  {formatPrice(product.base_price)}₫
                </span>
                {hasDiscount && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-medium text-xs">
                    -{discountPercentage}%
                  </Badge>
                )}
              </div>
            </div>
            <Button
              size="icon"
              className="rounded-full shadow-lg h-9 w-9"
              onClick={handleQuickAddClick}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </Button>
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
