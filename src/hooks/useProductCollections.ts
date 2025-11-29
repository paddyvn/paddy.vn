import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "./useCategories";

export interface ProductCollection {
  collection_id: string;
  position: number;
  categories: Category;
}

export const useProductCollections = (productId: string) => {
  return useQuery({
    queryKey: ["product-collections", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_collections")
        .select(`
          collection_id,
          position,
          categories (
            id,
            name,
            slug,
            description,
            image_url,
            parent_id,
            display_order,
            is_active
          )
        `)
        .eq("product_id", productId)
        .order("position", { ascending: true });

      if (error) throw error;
      return (data || []) as ProductCollection[];
    },
    enabled: !!productId,
  });
};
