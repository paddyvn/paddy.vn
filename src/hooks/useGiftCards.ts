import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GiftCardDesign {
  id: string;
  name: string;
  slug: string;
  category: string;
  image_url: string;
  thumbnail_url: string | null;
  is_active: boolean;
  display_order: number;
}

export interface GiftCardDenomination {
  id: string;
  amount: number;
  label: string;
  is_active: boolean;
  display_order: number;
}

export function useGiftCardDesigns() {
  return useQuery({
    queryKey: ["gift-card-designs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_card_designs")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as GiftCardDesign[];
    },
  });
}

export function useGiftCardDenominations() {
  return useQuery({
    queryKey: ["gift-card-denominations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_card_denominations")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as GiftCardDenomination[];
    },
  });
}
