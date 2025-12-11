import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Brands = () => {
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('vendor')
        .not('vendor', 'is', null)
        .not('vendor', 'eq', '');
      
      // Get unique vendors and count
      const vendorCounts = data?.reduce((acc, item) => {
        if (item.vendor) {
          acc[item.vendor] = (acc[item.vendor] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Sort by product count and take top 16
      return Object.entries(vendorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 16)
        .map(([name]) => name);
    }
  });

  if (!brands || brands.length === 0) return null;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">
            1000+ Thương Hiệu Boss Thích
          </h2>
          <Link 
            to="/brands" 
            className="text-primary hover:underline text-sm font-medium"
          >
            Xem tất cả
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {brands.map((brand, index) => (
            <Link
              key={index}
              to={`/brand/${encodeURIComponent(brand)}`}
              className="group"
            >
              <div className="bg-muted/30 border rounded-lg p-4 h-24 flex items-center justify-center transition-all hover:shadow-md hover:border-primary/50">
                <span className="text-sm font-semibold text-center text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {brand}
                </span>
              </div>
              <p className="text-xs text-center mt-2 text-muted-foreground truncate">
                {brand}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
