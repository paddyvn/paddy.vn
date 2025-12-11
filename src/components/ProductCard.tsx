import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    compare_at_price?: number | null;
    is_featured?: boolean;
    vendor?: string | null;
    product_images?: Array<{ image_url: string; is_primary: boolean }>;
    reviews?: Array<{ rating: number }>;
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();

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

  return (
    <Card
      className="group overflow-hidden transition-smooth shadow-card hover:shadow-hover rounded-sm border-0 cursor-pointer"
      onClick={() => navigate(`/products/${product.slug}`)}
    >
      <CardContent className="p-0">
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

        <div className="p-4 space-y-3">
          <div>
            {product.vendor && (
              <p className="text-xs text-muted-foreground mb-1 font-bold">{product.vendor}</p>
            )}
            <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-smooth">
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

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-primary">
              {formatPrice(product.base_price)}₫
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price!)}₫
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
