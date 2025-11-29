import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

export const FeaturedProducts = () => {
  const { data: products, isLoading } = useProducts();
  const [userId, setUserId] = useState<string | undefined>();
  const { addToCart } = useCart(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  const calculateAverageRating = (reviews: Array<{ rating: number }>) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getPrimaryImage = (images: Array<{ image_url: string; is_primary: boolean }>) => {
    const primary = images?.find(img => img.is_primary);
    return primary?.image_url || images?.[0]?.image_url || "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&h=500&fit=crop";
  };

  if (isLoading) {
    return (
      <section className="py-16 md:py-24" style={{ backgroundColor: '#fefefe' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return (
      <section className="py-16 md:py-24" style={{ backgroundColor: '#fefefe' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Products</h2>
          <p className="text-lg text-muted-foreground">No featured products available yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: '#fefefe' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-muted-foreground">
              Hand-picked favorites loved by pets everywhere
            </p>
          </div>
          <Button variant="outline" className="hidden md:inline-flex rounded-full border-2 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-smooth">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {products.slice(0, 10).map((product, index) => (
            <Card
              key={product.id}
              className="group overflow-hidden transition-smooth shadow-card hover:shadow-hover animate-in fade-in zoom-in duration-500 rounded-md border-0"
              style={{ animationDelay: `${index * 100}ms` }}
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
                  
                  {product.compare_at_price && product.compare_at_price > product.base_price && (
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
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 space-y-3">
                  <div>
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
                    {product.compare_at_price && product.compare_at_price > product.base_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.compare_at_price)}₫
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Button variant="outline" className="rounded-full border-2 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-smooth">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
};
