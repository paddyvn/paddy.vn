import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Customer {
  id: string;
  shopify_customer_id: string | null;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  orders_count: number;
  total_spent: number;
  accepts_marketing: boolean;
  marketing_opt_in_level: string | null;
  tags: string | null;
  note: string | null;
  verified_email: boolean;
  created_at: string;
  updated_at: string;
  shopify_created_at: string | null;
  shopify_updated_at: string | null;
}

export const useCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("shopify_created_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Customer[];
    },
  });
};

export const useUpdateCustomer = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Customer> }) => {
      const { data, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update customer",
        variant: "destructive",
      });
    },
  });
};
