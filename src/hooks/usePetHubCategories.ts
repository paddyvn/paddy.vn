import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PetHubCategory {
  id: string;
  name: string;
  slug: string;
  hub_icon_url: string | null;
  hub_image_url: string | null;
  hub_display_order: number | null;
  image_url: string | null;
}

export const usePetHubCategories = (petType: "dog" | "cat") => {
  return useQuery({
    queryKey: ["pet-hub-categories", petType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, hub_icon_url, hub_image_url, hub_display_order, image_url")
        .eq("is_hub", true)
        .eq("is_active", true)
        .or(`pet_type.eq.${petType},pet_type.eq.both`)
        .order("hub_display_order", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data || []) as PetHubCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });
};
