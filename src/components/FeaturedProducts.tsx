import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { useProductsPromotions } from "@/hooks/useProductPromotions";

export const FeaturedProducts = () => {
  // 1. Fetch config
  const { data: config } = useQuery({
    queryKey: ["homepage-featured-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_featured_config")
        .select(`
          collection_id, section_title, product_count, is_active
        `)
        .limit(1)
        .single();
      if (error) throw error;

      let collectionSlug: string | null = null;
      if (data?.collection_id) {
        const { data: cat } = await supabase
          .from("categories")
          .select("slug")
          .eq("id", data.collection_id)
          .single();
        collectionSlug = cat?.slug ?? null;
      }

      return { ...data, collectionSlug };
    },
  });

  const maxProducts = config?.product_count || 10;

  // 2. Fetch products from selected collection
  const { data: collectionProducts, isLoading: collectionLoading } = useQuery({
    queryKey: ["homepage-featured-products", config?.collection_id, maxProducts],
    queryFn: async () => {
      if (!config?.collection_id) return null;

      const { data: productIds } = await supabase
        .from("product_collections")
        .select("product_id")
        .eq("collection_id", config.collection_id)
        .order("position")
        .limit(maxProducts);

      if (!productIds || productIds.length === 0) return null;

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images (image_url, alt_text, is_primary),
          product_collections (
            collection_id, position,
            categories (id, name, slug)
          ),
          reviews (rating)
        `)
        .in("id", productIds.map(p => p.product_id))
        .eq("is_active", true);

      if (error) throw error;

      const posMap = new Map(productIds.map((p, i) => [p.product_id, i]));
      return data?.sort((a, b) => (posMap.get(a.id) ?? 99) - (posMap.get(b.id) ?? 99));
    },
    enabled: !!config?.collection_id,
  });

  // 3. Fallback: newest products
  const { data: newestProducts, isLoading: newestLoading } = useProducts();

  const hasCollection = collectionProducts && collectionProducts.length > 0;
  const products = hasCollection ? collectionProducts : newestProducts;
  const isLoading = !config || (config.collection_id ? collectionLoading : newestLoading);
  const sectionTitle = config?.section_title || "Sản phẩm nổi bật";
  const displayProducts = products?.slice(0, maxProducts) || [];

  // Get product IDs for promotion lookup (must be before any returns)
  const productIds = useMemo(() => displayProducts.map(p => p.id), [displayProducts]);
  const { data: promotionsMap } = useProductsPromotions(productIds);

  const viewAllLink = (config?.collection as any)?.slug
    ? `/collections/${(config?.collection as any).slug}`
    : "/collections/featured";

  // If section is disabled, don't render
  if (config && !config.is_active) return null;

  if (isLoading) {
    return (
      <section className="py-6" style={{ backgroundColor: '#fefefe' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: maxProducts }).map((_, i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!displayProducts.length) {
    return (
      <section className="py-6" style={{ backgroundColor: '#fefefe' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-primary mb-4">{sectionTitle}</h2>
          <p className="text-lg text-muted-foreground">No featured products available yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6" style={{ backgroundColor: '#fefefe' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 animate-in fade-in slide-in-from-bottom duration-700">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-1">
              {sectionTitle}
            </h2>
          </div>
          <Link 
            to={viewAllLink}
            className="flex items-center gap-1 text-primary font-medium hover:opacity-80 transition-opacity"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {displayProducts.map((product, index) => (
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
            to={viewAllLink}
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
