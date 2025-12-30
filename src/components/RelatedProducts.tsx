import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";

interface RelatedProductsProps {
  currentProductId: string;
  productType: string | null;
  brand: string | null;
}

export function RelatedProducts({ currentProductId, productType, brand }: RelatedProductsProps) {
  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", currentProductId, productType, brand],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          base_price,
          compare_at_price,
          brand,
          pet_type,
          is_featured,
          option1_name,
          option2_name,
          option3_name,
          product_images (image_url, is_primary)
        `)
        .eq("is_active", true)
        .neq("id", currentProductId)
        .limit(4);

      // Prefer same product type, but fall back to same brand
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
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">You May Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {relatedProducts.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
