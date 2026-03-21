import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";

interface RelatedProductsProps {
  currentProductId: string;
  collectionId?: string | null;
  productType: string | null;
  brand: string | null;
}

export function RelatedProducts({ currentProductId, collectionId, productType, brand }: RelatedProductsProps) {
  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", currentProductId, collectionId, productType, brand],
    queryFn: async () => {
      // Strategy 1: Same collection
      if (collectionId) {
        const { data, error } = await supabase
          .from("product_collections")
          .select(`
            products!inner (
              id, name, slug, base_price, compare_at_price, brand, pet_type,
              is_featured, is_active, sold_count, source_created_at,
              option1_name, option2_name, option3_name,
              product_images (image_url, is_primary),
              product_variants (stock_quantity)
            )
          `)
          .eq("collection_id", collectionId)
          .neq("product_id", currentProductId)
          .limit(8);

        if (!error && data) {
          const products = data
            .map((d: any) => d.products)
            .filter((p: any) => p && p.is_active);
          
          // Sort: in-stock first, then by sold_count
          products.sort((a: any, b: any) => {
            const aStock = (a.product_variants || []).reduce((s: number, v: any) => s + (v.stock_quantity || 0), 0);
            const bStock = (b.product_variants || []).reduce((s: number, v: any) => s + (v.stock_quantity || 0), 0);
            const aOOS = aStock <= 0;
            const bOOS = bStock <= 0;
            if (aOOS !== bOOS) return aOOS ? 1 : -1;
            return (b.sold_count || 0) - (a.sold_count || 0);
          });

          return products.slice(0, 8);
        }
      }

      // Fallback: same product_type or brand
      let query = supabase
        .from("products")
        .select(`
          id, name, slug, base_price, compare_at_price, brand, pet_type,
          is_featured, is_active, sold_count, source_created_at,
          option1_name, option2_name, option3_name,
          product_images (image_url, is_primary),
          product_variants (stock_quantity)
        `)
        .eq("is_active", true)
        .neq("id", currentProductId)
        .limit(8);

      if (productType) {
        query = query.eq("product_type", productType);
      } else if (brand) {
        query = query.eq("brand", brand);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  if (!relatedProducts || relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="mb-16">
      <h2 className="text-xl md:text-2xl font-bold text-primary mb-6">Sản phẩm liên quan</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {relatedProducts.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
