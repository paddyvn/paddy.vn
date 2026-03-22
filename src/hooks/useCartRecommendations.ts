import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  brand: string | null;
  product_images: { image_url: string; is_primary: boolean }[];
}

export function useCartRecommendations(cartProductIds: string[], limit = 10) {
  return useQuery({
    queryKey: ["cart-recommendations", cartProductIds],
    queryFn: async (): Promise<RecommendedProduct[]> => {
      if (cartProductIds.length === 0) return [];

      // Get brands of cart products
      const { data: cartProducts } = await supabase
        .from("products")
        .select("brand")
        .in("id", cartProductIds);

      const brands = [...new Set((cartProducts || []).map((p) => p.brand).filter(Boolean))] as string[];

      if (brands.length === 0) return [];

      const { data } = await supabase
        .from("products")
        .select("id, name, slug, base_price, brand, product_images(image_url, is_primary)")
        .in("brand", brands)
        .not("id", "in", `(${cartProductIds.join(",")})`)
        .eq("is_active", true)
        .limit(limit);

      return (data || []) as RecommendedProduct[];
    },
    enabled: cartProductIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
