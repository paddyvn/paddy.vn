import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { useProductsPromotions } from "@/hooks/useProductPromotions";

export const FeaturedProducts = () => {
  const { data: products, isLoading } = useProducts();
  
  // Get product IDs for promotion lookup
  const productIds = useMemo(() => 
    products?.slice(0, 10).map(p => p.id) || [], 
    [products]
  );
  const { data: promotionsMap } = useProductsPromotions(productIds);

  if (isLoading) {
    return (
      <section className="py-16 md:py-24" style={{ backgroundColor: '#fefefe' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
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
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">Featured Products</h2>
          <p className="text-lg text-muted-foreground">No featured products available yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: '#fefefe' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-muted-foreground">
              Hand-picked favorites loved by pets everywhere
            </p>
          </div>
          <Link 
            to="/collections/featured" 
            className="flex items-center gap-1 text-primary font-medium hover:opacity-80 transition-opacity"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {products.slice(0, 10).map((product, index) => (
            <div 
              key={product.id}
              className="animate-in fade-in zoom-in duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard 
                product={product} 
                promotion={promotionsMap?.[product.id]}
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link 
            to="/collections/featured" 
            className="inline-flex items-center gap-1 text-primary font-medium hover:opacity-80 transition-opacity"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
