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
    brand?: string | null;
    pet_type?: string | null;
    product_images?: Array<{ image_url: string; is_primary: boolean }>;
    reviews?: Array<{ rating: number }>;
  };
}

const DogIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-7 h-7">
    <path 
      d="M16 48 C16 28, 16 20, 20 16 M20 16 C22 14, 26 12, 28 8 M20 16 C24 18, 32 20, 36 18 M36 18 C40 16, 44 10, 44 6 M36 18 C42 20, 48 24, 50 30 M50 30 C52 36, 50 40, 48 44 M48 44 C46 48, 42 50, 38 50" 
      stroke="currentColor" 
      strokeWidth="3.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="26" cy="26" r="3" fill="currentColor" />
    <ellipse cx="38" cy="28" rx="5" ry="4" fill="currentColor" />
    <path d="M30 36 C32 38, 34 38, 36 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CatIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-6 h-6">
    <path 
      d="M16 20 L20 8 L26 18 M38 18 L44 8 L48 20" 
      stroke="currentColor" 
      strokeWidth="3.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <ellipse cx="32" cy="36" rx="18" ry="16" stroke="currentColor" strokeWidth="3.5" fill="none" />
    <circle cx="24" cy="32" r="2" fill="currentColor" />
    <circle cx="40" cy="32" r="2" fill="currentColor" />
    <ellipse cx="32" cy="40" rx="3" ry="2" fill="currentColor" />
    <path d="M29 40 L22 42 M29 42 L22 44 M35 40 L42 42 M35 42 L42 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PetBadge = ({ type }: { type: 'dog' | 'cat' }) => (
  <span 
    className={`inline-flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
      type === 'dog' 
        ? 'bg-amber-50 text-amber-800' 
        : 'bg-purple-50 text-purple-800'
    }`}
    title={type === 'dog' ? 'Cho chó' : 'Cho mèo'}
  >
    {type === 'dog' ? <DogIcon /> : <CatIcon />}
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
        </div>
      </CardContent>
    </Card>
  );
};
