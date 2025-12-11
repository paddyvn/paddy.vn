import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface RelatedProductsProps {
  currentProductId: string;
  productType: string | null;
  brand: string | null;
}

export function RelatedProducts({ currentProductId, productType, brand }: RelatedProductsProps) {
  const navigate = useNavigate();

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
      <h2 className="text-3xl font-bold mb-6">You May Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {relatedProducts.map((product: any) => {
          const primaryImage = product.product_images?.find((img: any) => img.is_primary) 
            || product.product_images?.[0];

          return (
            <Card
              key={product.id}
              className="group cursor-pointer hover:shadow-hover transition-smooth"
              onClick={() => navigate(`/products/${product.slug}`)}
            >
              <CardContent className="p-0">
                <div className="aspect-square bg-muted overflow-hidden rounded-t-lg">
                  {primaryImage ? (
                    <img
                      src={primaryImage.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 space-y-2">
                  {product.brand && (
                    <p className="text-xs text-muted-foreground font-bold">{product.brand}</p>
                  )}
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-smooth">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-primary">
                      {product.base_price.toLocaleString('vi-VN')} ₫
                    </span>
                    {product.compare_at_price && product.compare_at_price > product.base_price && (
                      <span className="text-xs text-muted-foreground line-through">
                        {product.compare_at_price.toLocaleString('vi-VN')} ₫
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
