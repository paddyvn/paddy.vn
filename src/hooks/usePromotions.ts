import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Promotion {
  id: string;
  title: string;
  subtitle: string | null;
  gradient_from: string;
  gradient_to: string;
  link_type: string;
  link_destination: string;
  display_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  promo_type: string;
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
      return data as Promotion[];
    },
  });
};
