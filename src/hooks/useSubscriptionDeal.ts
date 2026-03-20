import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionDealConfig {
  promotionId: string;
  title: string;
  frequency: string;
  discountPercentage: number;
  firstOrderDiscount: number;
  availableFrequencies: string[];
}

export function useSubscriptionDeal() {
  return useQuery({
    queryKey: ["active-subscription-deal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("id, title, rules, is_active, start_date, end_date")
        .eq("program_kind", "subscription_deal")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      // Date check
      if (data.start_date && new Date(data.start_date) > new Date()) return null;
      if (data.end_date && new Date(data.end_date) < new Date()) return null;

      const rules = (data as any).rules || {};

      return {
        promotionId: data.id,
        title: data.title,
        frequency: rules.frequency || "monthly",
        discountPercentage: rules.discount_percentage || 10,
        firstOrderDiscount: rules.first_order_discount || 0,
        availableFrequencies: ["weekly", "biweekly", "monthly", "bimonthly", "quarterly"],
      } as SubscriptionDealConfig;
    },
    staleTime: 300000,
  });
}
