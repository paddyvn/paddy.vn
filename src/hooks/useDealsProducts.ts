import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DealsFilterState {
  minDiscount: number;
  petType: string | null;
  brands: string[];
  priceRange: [number, number];
  categorySlug: string | null;
}

export const DEFAULT_DEALS_FILTERS: DealsFilterState = {
  minDiscount: 0,
  petType: null,
  brands: [],
  priceRange: [0, 10000000],
  categorySlug: null,
};

const PRODUCTS_PER_PAGE = 20;

export const useDealsProducts = (
  filters: DealsFilterState,
  sortBy: string,
  page: number
) => {
  return useQuery({
    queryKey: ["deals-products", filters, sortBy, page],
    queryFn: async () => {
      let query = supabase
        .from("products_on_sale")
        .select(
          `id, name, slug, base_price, compare_at_price, discount_percent,
           is_featured, brand, pet_type, rating, rating_count,
           option1_name, option2_name, option3_name`,
          { count: "exact" }
        );

      // Category/collection filter — must fetch matching product IDs first
      if (filters.categorySlug) {
        const { data: catRow } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", filters.categorySlug)
          .single();

        if (catRow) {
          const { data: pcRows } = await supabase
            .from("product_collections")
            .select("product_id")
            .eq("collection_id", catRow.id)
            .limit(500);

          const ids = (pcRows || []).map((r) => r.product_id);
          if (ids.length === 0) {
            return { products: [], total: 0 };
          }
          query = query.in("id", ids);
        }
      }

      // Discount filter
      if (filters.minDiscount > 0) {
        query = query.gte("discount_percent", filters.minDiscount);
      }

      // Pet type filter
      if (filters.petType) {
        query = query.or(
          `pet_type.eq.${filters.petType},pet_type.eq.both`
        );
      }

      // Brand filter
      if (filters.brands.length > 0) {
        query = query.in("brand", filters.brands);
      }

      // Price filter
      if (filters.priceRange[0] > 0) {
        query = query.gte("base_price", filters.priceRange[0]);
      }
      if (filters.priceRange[1] < 10000000) {
        query = query.lte("base_price", filters.priceRange[1]);
      }

      // Sort
      switch (sortBy) {
        case "discount_desc":
          query = query.order("discount_percent", { ascending: false });
          break;
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
          query = query.order("discount_percent", { ascending: false });
      }

      const from = (page - 1) * PRODUCTS_PER_PAGE;
      query = query.range(from, from + PRODUCTS_PER_PAGE - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      // Fetch images for these products
      const productIds = (data || []).map((p) => p.id).filter(Boolean) as string[];
      let imagesMap: Record<string, Array<{ image_url: string; is_primary: boolean }>> = {};

      if (productIds.length > 0) {
        const { data: images } = await supabase
          .from("product_images")
          .select("product_id, image_url, is_primary")
          .in("product_id", productIds);

        if (images) {
          images.forEach((img) => {
            if (!imagesMap[img.product_id]) imagesMap[img.product_id] = [];
            imagesMap[img.product_id].push(img);
          });
        }
      }

      const products = (data || []).map((p) => ({
        ...p,
        product_images: imagesMap[p.id!] || [],
      }));

      return { products, total: count || 0 };
    },
  });
};

// Fetch distinct brands from on-sale products
export const useDealsBrands = () => {
  return useQuery({
    queryKey: ["deals-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_on_sale")
        .select("brand");

      if (error) throw error;

      const brandCounts: Record<string, number> = {};
      (data || []).forEach((p) => {
        const brand = p.brand || "Khác";
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      });

      return Object.entries(brandCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 300000,
  });
};
