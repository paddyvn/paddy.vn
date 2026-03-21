import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";

interface BrandCollection {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

export const Brands = () => {
  const { data: brands } = useQuery({
    queryKey: ['brand-collections'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, image_url')
        .eq('collection_type', 'brand')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(12);
      
      return data as BrandCollection[] || [];
    }
  });

  if (!brands || brands.length === 0) return null;

  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-primary">
            1000+ Thương Hiệu Boss Thích
          </h2>
          <Link 
            to="/brands-thuong-hieu-thu-cung" 
            className="flex items-center gap-1 text-primary font-medium hover:opacity-80 transition-opacity"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {brands.map((brand, index) => (
            <Link
              key={brand.id}
              to={`/collections/${brand.slug}`}
              className={`group ${index >= 6 ? 'hidden sm:block' : ''}`}
            >
              <div className="bg-muted/30 rounded-lg p-4 h-24 flex items-center justify-center transition-all hover:shadow-md overflow-hidden">
                {brand.image_url ? (
                  <img 
                    src={brand.image_url} 
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-sm font-semibold text-center text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {brand.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-center mt-2 text-muted-foreground truncate">
                {brand.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
