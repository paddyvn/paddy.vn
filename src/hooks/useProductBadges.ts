import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductBadge {
  id: string;
  name: string;
  name_vi: string | null;
  icon: string;
  icon_color: string;
  bg_color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all active badges
export function useProductBadges() {
  return useQuery({
    queryKey: ["product-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_badges")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data as ProductBadge[];
    },
  });
}

// Fetch badges for a specific product
export function useProductBadgeLinks(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-badge-links", productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from("product_badge_links")
        .select(`
          id,
          badge_id,
          product_badges (*)
        `)
        .eq("product_id", productId);
      
      if (error) throw error;
      return data.map((link: any) => link.product_badges as ProductBadge);
    },
    enabled: !!productId,
  });
}

// Admin: Create a new badge
export function useCreateBadge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (badge: { name: string; icon: string; name_vi?: string; icon_color?: string; bg_color?: string; display_order?: number }) => {
      const { data, error } = await supabase
        .from("product_badges")
        .insert([badge])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-badges"] });
    },
  });
}

// Admin: Update a badge
export function useUpdateBadge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProductBadge> & { id: string }) => {
      const { data, error } = await supabase
        .from("product_badges")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-badges"] });
    },
  });
}

// Admin: Delete a badge
export function useDeleteBadge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_badges")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-badges"] });
    },
  });
}

// Admin: Link badges to a product
export function useLinkBadgesToProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, badgeIds }: { productId: string; badgeIds: string[] }) => {
      // First, remove all existing links for this product
      await supabase
        .from("product_badge_links")
        .delete()
        .eq("product_id", productId);
      
      // Then, insert new links
      if (badgeIds.length > 0) {
        const links = badgeIds.map(badgeId => ({
          product_id: productId,
          badge_id: badgeId,
        }));
        
        const { error } = await supabase
          .from("product_badge_links")
          .insert(links);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["product-badge-links", productId] });
    },
  });
}
