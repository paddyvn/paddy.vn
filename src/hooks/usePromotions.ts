import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CustomIcon {
  position: "top_left" | "top_right" | "bottom_left" | "bottom_right";
  url: string;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string | null;
  eyebrow: string | null;
  cta_text: string | null;
  image_url: string | null;
  bg_color: string | null;
  layout_slot: string | null;
  gradient_from: string | null;
  gradient_to: string | null;
  link_type: string;
  link_destination: string;
  display_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  promo_type: string;
  icon_type: string | null;
  custom_icons: CustomIcon[] | null;
}

export const usePromotions = () => {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      // Transform custom_icons from Json to typed array
      return (data || []).map(promo => ({
        ...promo,
        custom_icons: Array.isArray(promo.custom_icons) ? (promo.custom_icons as unknown as CustomIcon[]) : null,
      })) as Promotion[];
    },
  });
};
