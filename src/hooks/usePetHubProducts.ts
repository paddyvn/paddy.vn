import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PRODUCTS_PER_PAGE = 20;
const DEFAULT_MAX_PRICE = 10000000;

export interface PetHubFilterState {
  brands: string[];
  priceRange: [number, number];
  categoryId: string | null;
}

export const usePetHubProducts = (
  petType: "dog" | "cat",
  filters: PetHubFilterState,
  sortBy: string,
  page: number
) => {
  return useQuery({
    queryKey: ["pet-hub-products", petType, filters, sortBy, page],
    queryFn: async () => {
      // If a category is selected, get product IDs from product_collections
      let categoryProductIds: string[] | null = null;
      if (filters.categoryId) {
        const { data: pcData } = await supabase
          .from("product_collections")
          .select("product_id")
          .eq("collection_id", filters.categoryId);
        categoryProductIds = (pcData || []).map((p) => p.product_id);
        if (categoryProductIds.length === 0) {
          return { products: [], total: 0 };
        }
      }

      let query = supabase
        .from("products")
        .select(
          `id, name, slug, base_price, compare_at_price, is_featured, brand, pet_type,
           rating, rating_count, sold_count, created_at, source_created_at,
           option1_name, option2_name, option3_name, total_stock,
           product_images(image_url, is_primary)`,
          { count: "exact" }
        )
        .eq("is_active", true)
        .or(`pet_type.eq.${petType},pet_type.eq.both`);

      if (categoryProductIds) {
        query = query.in("id", categoryProductIds);
      }

      if (filters.brands.length > 0) {
        query = query.in("brand", filters.brands);
      }

      if (filters.priceRange[0] > 0) {
        query = query.gte("base_price", filters.priceRange[0]);
      }
      if (filters.priceRange[1] < DEFAULT_MAX_PRICE) {
        query = query.lte("base_price", filters.priceRange[1]);
      }

      switch (sortBy) {
        case "price_asc":
          query = query.order("base_price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("base_price", { ascending: false });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        default:
          query = query
            .order("is_featured", { ascending: false })
            .order("sold_count", { ascending: false, nullsFirst: false });
          break;
      }

      const from = (page - 1) * PRODUCTS_PER_PAGE;
      query = query.range(from, from + PRODUCTS_PER_PAGE - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      return { products: data || [], total: count || 0 };
    },
  });
};

export const usePetHubBrands = (petType: "dog" | "cat") => {
  return useQuery({
    queryKey: ["pet-hub-brands", petType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("brand")
        .eq("is_active", true)
        .or(`pet_type.eq.${petType},pet_type.eq.both`)
        .not("brand", "is", null);

      if (error) throw error;

      const brandCounts: Record<string, number> = {};
      (data || []).forEach((p) => {
        if (p.brand) {
          brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
        }
      });

      return Object.entries(brandCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 5 * 60 * 1000,
  });
};
