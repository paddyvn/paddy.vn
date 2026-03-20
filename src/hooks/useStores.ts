import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Store {
  id: string;
  name: string;
  address: string;
  image_url: string | null;
  map_url: string | null;
  phone: string | null;
  opening_hours: string | null;
  is_active: boolean;
  display_order: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export const useStores = () => {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Store[];
    },
  });
};

export const useActiveStores = () => {
  return useQuery({
    queryKey: ["stores", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Store[];
    },
  });
};

export const useCreateStore = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (store: Omit<Store, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("stores")
        .insert(store)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast({ title: "Store created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating store", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateStore = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...store }: Partial<Store> & { id: string }) => {
      const { data, error } = await supabase
        .from("stores")
        .update(store)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast({ title: "Store updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating store", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteStore = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast({ title: "Store deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting store", description: error.message, variant: "destructive" });
    },
  });
};
