import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CustomerAddress {
  id: string;
  customer_id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  province: string | null;
  postal_code: string | null;
  country: string;
  country_code: string | null;
  phone: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useCustomerAddresses = (customerId: string) => {
  return useQuery({
    queryKey: ["customer-addresses", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", customerId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CustomerAddress[];
    },
    enabled: !!customerId,
  });
};

export const useAddCustomerAddress = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: Omit<CustomerAddress, "id" | "created_at" | "updated_at">) => {
      // If this is set as default, unset other defaults first
      if (address.is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("customer_id", address.customer_id);
      }

      const { data, error } = await supabase
        .from("customer_addresses")
        .insert(address)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses", data.customer_id] });
      toast({
        title: "Success",
        description: "Address added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add address",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCustomerAddress = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      customerId,
      updates 
    }: { 
      id: string; 
      customerId: string;
      updates: Partial<CustomerAddress>;
    }) => {
      // If setting as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("customer_id", customerId);
      }

      const { data, error } = await supabase
        .from("customer_addresses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses", data.customer_id] });
      toast({
        title: "Success",
        description: "Address updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update address",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteCustomerAddress = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, customerId }: { id: string; customerId: string }) => {
      const { error } = await supabase
        .from("customer_addresses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, customerId };
    },
    onSuccess: ({ customerId }) => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses", customerId] });
      toast({
        title: "Success",
        description: "Address deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete address",
        variant: "destructive",
      });
    },
  });
};
