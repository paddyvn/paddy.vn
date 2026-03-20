import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AbandonedCheckout {
  id: string;
  shopify_checkout_id: string | null;
  email: string | null;
  phone: string | null;
  customer_id: string | null;
  cart_token: string | null;
  abandoned_checkout_url: string | null;
  line_items: any[];
  subtotal_price: number;
  total_price: number;
  currency: string;
  billing_address: any;
  shipping_address: any;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  shopify_created_at: string | null;
  shopify_updated_at: string | null;
}

export const useAbandonedCheckouts = () => {
  return useQuery({
    queryKey: ["abandoned-checkouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abandoned_checkouts")
        .select("*")
        .is("completed_at", null)
        .order("shopify_created_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AbandonedCheckout[];
    },
  });
};

export const useDeleteAbandonedCheckout = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("abandoned_checkouts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned-checkouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-abandoned-checkouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-abandoned-checkouts-count"] });
      toast({
        title: "Success",
        description: "Abandoned checkout deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete checkout",
        variant: "destructive",
      });
    },
  });
};

export const useSendRecoveryEmail = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (checkout: AbandonedCheckout) => {
      // This would integrate with your email service
      // For now, just open the abandoned checkout URL
      if (checkout.abandoned_checkout_url) {
        window.open(checkout.abandoned_checkout_url, "_blank");
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Recovery email functionality - opening checkout URL",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send recovery email",
        variant: "destructive",
      });
    },
  });
};
