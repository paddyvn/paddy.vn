import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  base_price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  is_active: boolean;
  category_id: string | null;
  product_images: Array<{
    image_url: string;
    alt_text: string | null;
    is_primary: boolean;
  }>;
  reviews: Array<{
    rating: number;
  }>;
}

export const useProducts = (featured?: boolean) => {
  return useQuery({
    queryKey: ["products", featured],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          product_images (image_url, alt_text, is_primary),
          reviews (rating)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (featured) {
        query = query.eq("is_featured", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Product[];
    },
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images (image_url, alt_text, is_primary, display_order),
          product_variants (*),
          reviews (
            *,
            profiles (full_name, avatar_url)
          )
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
  });
};